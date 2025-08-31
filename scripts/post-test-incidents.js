#!/usr/bin/env node
/**
 * Post sample incident messages to Firestore for test chats.
 *
 * Usage:
 *   node scripts/post-test-incidents.js
 *   node scripts/post-test-incidents.js --baseUrl http://localhost:3000 \
 *     --types motochorro,robo --desc "Robo a mano armada" --minutes 90
 *
 * Env overrides:
 *   POST_INCIDENT_BASE_URL, POST_INCIDENT_CREATED_BY
 */

// Node 18+ required for global fetch
const argv = process.argv.slice(2);

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const p = parseArgs(argv);
  const baseUrl = p.baseUrl || process.env.POST_INCIDENT_BASE_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/incidents/firestore/create`;

  const createdBy = p.createdBy || process.env.POST_INCIDENT_CREATED_BY || 'script-tester';
  const activeForMinutes = Number(p.minutes || 60);

  // Test chats (default)
  const chats = (
    p.chats ? String(p.chats).split(',') : ['chat_zacagnini_jose_manuel', 'chat_bosque_peralta_ramos']
  ).map((s) => s.trim()).filter(Boolean);

  // Types to iterate (all must be valid as per isValidIncidentTypeId)
  const types = (p.types ? String(p.types).split(',') : ['motochorro']).map((s) => s.trim()).filter(Boolean);

  // Optional single description or default per type
  const defaultDescriptions = {
    motochorro: 'Motochorro sustrae bolso y huye a toda velocidad',
    robo: 'Robo a mano armada reportado por vecinos',
    hurto: 'Hurto sin violencia reportado',
    sospechoso: 'Persona sospechosa merodeando la cuadra'
  };

  // Coordinates around Mar del Plata for demo
  const mdpBase = { lat: -38.0055, lng: -57.5426 };
  const jitter = () => (Math.random() - 0.5) * 0.01; // ~1km

  const neighborhoodByChat = {
    chat_zacagnini_jose_manuel: 'Zacagnini Jose Manuel',
    chat_bosque_peralta_ramos: 'Bosque Peralta Ramos'
  };

  console.log('➡️  POST target:', endpoint);
  console.log('🧪 Chats:', chats.join(', '));
  console.log('🧪 Types:', types.join(', '));

  for (const chatId of chats) {
    for (const type of types) {
      const description = p.desc || p.description || defaultDescriptions[type] || 'Incidente reportado';
      const lat = p.lat ? Number(p.lat) : (mdpBase.lat + jitter());
      const lng = p.lng ? Number(p.lng) : (mdpBase.lng + jitter());
      const neighborhood = p.neighborhood || neighborhoodByChat[chatId] || 'Mar del Plata';

      const body = {
        type,
        description,
        neighborhood,
        chatId,
        location: { type: 'Point', coordinates: [lng, lat] },
        tags: (p.tags ? String(p.tags).split(',') : ['test','incident','script']).map(t => t.trim()).filter(Boolean),
        createdBy,
        activeForMinutes
      };

      console.log(`\n📦 Posting incident → chat=${chatId} type=${type}`);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }
        console.log('✅ Status:', res.status);
        console.log('🧾 Response:', JSON.stringify(json, null, 2));
        if (!res.ok) process.exitCode = 1;
      } catch (err) {
        console.error('❌ Request error:', err);
        process.exitCode = 1;
      }

      // Small delay to avoid rate limiting and for clearer logs
      await sleep(400);
    }
  }
})();
