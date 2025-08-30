#!/usr/bin/env node
/**
 * Simple script to POST a new incident to the local API
 * Usage examples:
 *   node scripts/post-incident.js
 *   node scripts/post-incident.js --chatId chat_barrio_norte_123 --type robo --desc "Robo en esquina" --lng -58.3816 --lat -34.6037
 *   node scripts/post-incident.js --baseUrl http://localhost:3000
 */

// Requires Node 18+ for global fetch

const args = require('node:process').argv.slice(2);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

(async () => {
  const p = parseArgs(args);

  const baseUrl = p.baseUrl || process.env.POST_INCIDENT_BASE_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/incidents/firestore/create`;

  const chatId = p.chatId || process.env.POST_INCIDENT_CHAT_ID || 'chat_barrio_norte_123';
  const type = p.type || 'motochorro';
  const description = p.desc || p.description || 'Robo de cartera en moto en la esquina.';
  const lng = p.lng ? Number(p.lng) : -58.3816;
  const lat = p.lat ? Number(p.lat) : -34.6037;
  const neighborhood = p.neighborhood || 'Barrio Norte';
  const createdBy = p.createdBy || 'script-user-123';

  const body = {
    type,
    description,
    neighborhood,
    chatId,
    location: { type: 'Point', coordinates: [lng, lat] },
    tags: p.tags ? String(p.tags).split(',').map((t) => t.trim()).filter(Boolean) : ['test','script'],
    createdBy,
  };

  console.log('➡️  POST', endpoint);
  console.log('📦 Body:', JSON.stringify(body, null, 2));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = { raw: text };
    }

    console.log('✅ Status:', res.status);
    console.log('🧾 Response:', JSON.stringify(json, null, 2));

    if (!res.ok) process.exit(1);
  } catch (err) {
    console.error('❌ Request error:', err);
    process.exit(1);
  }
})();
