#!/usr/bin/env node

/**
 * Linear - Bulk Issue Uploader
 *
 * Minimal CLI to create issues in Linear from a JSON file.
 *
 * Usage:
 *   node scripts/linear-upload.js --team TKEY --file path/to/tickets.json [--token YOUR_LINEAR_API_KEY]
 *
 * Environment:
 *   LINEAR_API_KEY=your-api-key
 *   (The script will try to load .env.local from project root if present)
 *
 * Input file format (JSON):
 *   [
 *     { "title": "Issue title", "description": "Longer description" },
 *     { "title": "Another ticket" }
 *   ]
 */

const fs = require("fs");
const path = require("path");

// Load env from project root .env.local if available
try {
  const dotenv = require("dotenv");
  const rootEnvPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else {
    dotenv.config();
  }
} catch {}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const part = argv[i];
    const next = argv[i + 1];
    if (part.startsWith("--")) {
      const key = part.replace(/^--/, "");
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(part);
    }
  }
  return args;
}

function usage() {
  console.log(`\nLinear - Bulk Issue Uploader\n\nUsage:\n  node scripts/linear-upload.js --team TKEY --file tickets.json [--token API_KEY]\n\nOptions:\n  --team   Linear team key (e.g. ENG, APP) [required]\n  --file   Path to JSON file with issues [default: tickets.json]\n  --token  Linear API key (overrides LINEAR_API_KEY env)\n`);
}

async function linearRequest(apiKey, query, variables = {}) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Linear expects the API key directly in the Authorization header (no Bearer prefix)
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Linear request failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();
  if (data.errors) {
    const message = data.errors.map(e => e.message).join("; ");
    throw new Error(`Linear GraphQL error(s): ${message}`);
  }
  return data.data;
}

async function resolveTeamId(apiKey, teamKey) {
  const query = `
    query TeamsByKey($key: String!) {
      teams(first: 1, filter: { key: { eq: $key } }) {
        nodes { id name key }
      }
    }
  `;
  const data = await linearRequest(apiKey, query, { key: teamKey });
  const nodes = data?.teams?.nodes || [];
  return nodes.length ? nodes[0].id : null;
}

async function createIssue(apiKey, input) {
  const mutation = `mutation IssueCreate($input: IssueCreateInput!) {\n    issueCreate(input: $input) {\n      success\n      issue { id identifier url }\n    }\n  }`;
  const data = await linearRequest(apiKey, mutation, { input });
  return data.issueCreate;
}

async function main() {
  const args = parseArgs(process.argv);
  const positionalTeam = args._ && args._[0] && !String(args._[0]).startsWith("-") ? args._[0] : undefined;
  const positionalFile = args._ && args._[1] && !String(args._[1]).startsWith("-") ? args._[1] : undefined;
  const teamKey = args.team || process.env.LINEAR_TEAM_KEY || positionalTeam;
  const apiKey =
    args.token ||
    process.env.LINEAR_API_KEY ||
    process.env.LINEAR_TOKEN ||
    process.env.LINEAR_UPLOADER_LOCAL;
  const filePath = args.file || positionalFile || "tickets.json";

  if (!teamKey) {
    console.error("❌ Missing --team TKEY (or env LINEAR_TEAM_KEY)");
    usage();
    process.exit(1);
  }
  if (!apiKey) {
    console.error("❌ Missing Linear API key. Pass --token or set LINEAR_API_KEY in .env.local");
    usage();
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Input file not found: ${absolutePath}`);
    process.exit(1);
  }

  let issues;
  try {
    const raw = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      issues = parsed;
    } else if (Array.isArray(parsed.issues)) {
      issues = parsed.issues;
    } else {
      throw new Error("JSON must be an array or an object with an 'issues' array");
    }
  } catch (error) {
    console.error("❌ Failed to parse JSON:", error.message);
    process.exit(1);
  }

  if (!issues.length) {
    console.error("❌ No issues to create. Provide at least one item with { title, description? }");
    process.exit(1);
  }

  console.log(`🔎 Resolving team '${teamKey}'...`);
  const teamId = await resolveTeamId(apiKey, teamKey);
  if (!teamId) {
    console.error(`❌ Team not found for key: ${teamKey}`);
    process.exit(1);
  }
  console.log(`✅ Team resolved: ${teamId}`);

  let successCount = 0;
  let failCount = 0;
  const created = [];

  for (const [index, item] of issues.entries()) {
    const title = String(item.title || "").trim();
    const description = item.description ? String(item.description) : undefined;
    if (!title) {
      console.warn(`⚠️  Skipping item #${index + 1} without title`);
      failCount++;
      continue;
    }

    const input = { teamId, title };
    if (description) input.description = description;

    process.stdout.write(`➕ Creating issue #${index + 1}: ${title.substring(0, 60)}... `);
    try {
      const result = await createIssue(apiKey, input);
      if (result?.success && result.issue) {
        successCount++;
        created.push(result.issue);
        console.log(`done (${result.issue.identifier})`);
      } else {
        failCount++;
        console.log("failed");
      }
    } catch (err) {
      failCount++;
      console.log("error");
      console.error("   →", err.message);
    }
  }

  console.log("\n📊 Summary");
  console.log(`   Created: ${successCount}`);
  console.log(`   Failed:  ${failCount}`);
  if (created.length) {
    console.log("\n🔗 Created issues:");
    for (const issue of created) {
      console.log(`   ${issue.identifier}: ${issue.url}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});


