#!/usr/bin/env node
/**
 * Seed incidents with media hosted in Firebase Storage and update chat messages.
 *
 * Features
 * - Uploads provided files to bucket under incidents/{incidentId}/media/
 * - Makes files public and collects public URLs
 * - Updates Firestore incident doc with media[] and timestamps
 * - Updates chat messages that reference metadata.incidentId == incidentId
 *   to include metadata.incident.media and metadata.mediaList for UI rendering
 * - Optionally updates chats.{chatId}.activeIncidents[] entries that match the incident
 *
 * Usage example:
 *   node scripts/seed-incidents-with-media.js \
 *     --incidentIds HvQQdFTZf9MqAMzS3aYX,JYioCqvlWWWnMOfdDgRs \
 *     --files ./assets/robbery1.jpg,./assets/robbery2.jpg \
 *     --createdAt "2025-08-31T07:13:58-03:00" \
 *     --expiresAt "2025-08-31T08:13:58-03:00"
 *
 * Env required:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 or path to service-account JSON via SERVICE_ACCOUNT_PATH
 * Optional:
 *   FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET
 */

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env from .env.local then .env (if present)
try {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
    }
  }
} catch {}

async function ensureSupabaseBucketExists(supabase, bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      throw new Error(`Error checking bucket '${bucketName}': ${error.message || error.error}`);
    }
    if (!data) {
      throw new Error(`Supabase bucket '${bucketName}' does not exist. Create it in Supabase Storage UI or pass --bucket <existing-bucket>.`);
    }
  } catch (e) {
    throw e;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; } else { out[key] = true; }
    }
  }
  return out;
}

function toTimestamp(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try { return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); } catch {}
  }
  const p = process.env.SERVICE_ACCOUNT_PATH || path.resolve(process.cwd(), 'service-account-key.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  throw new Error('Missing service account. Provide FIREBASE_SERVICE_ACCOUNT_BASE64 or SERVICE_ACCOUNT_PATH');
}

async function ensureAdmin() {
  if (admin.apps.length) return;
  const sa = getServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: process.env.FIREBASE_PROJECT_ID || sa.project_id,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // may be undefined -> default bucket
  });
}

async function uploadFiles(bucket, incidentId, filePaths) {
  const uploaded = [];
  for (const file of filePaths) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
    const contentType = mime.getType(abs) || 'application/octet-stream';
    const filename = path.basename(abs);
    const dest = `incidents/${incidentId}/media/${Date.now()}_${filename}`;
    await bucket.upload(abs, {
      destination: dest,
      contentType,
      metadata: { contentType, cacheControl: 'public, max-age=31536000' },
      public: true,
    });
    const fileRef = bucket.file(dest);
    try { await fileRef.makePublic(); } catch {}
    const [meta] = await fileRef.getMetadata();
    const size = Number(meta.size || 0);
    const url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(dest)}`;
    uploaded.push({
      type: contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : 'file',
      url,
      filename,
      size,
      bucketPath: dest,
      contentType,
    });
  }
  return uploaded;
}

function ensureSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Supabase upload');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function uploadFilesSupabase(supabase, bucketName, incidentId, filePaths) {
  const uploaded = [];
  for (const file of filePaths) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
    const contentType = mime.getType(abs) || 'application/octet-stream';
    const filename = path.basename(abs);
    const dest = `incidents/${incidentId}/media/${Date.now()}_${filename}`;
    const buffer = fs.readFileSync(abs);
    console.log(`[upload] -> ${bucketName}/${dest} (${contentType})`);
    const { error: upErr } = await supabase.storage.from(bucketName).upload(dest, buffer, {
      contentType,
      upsert: false,
      cacheControl: '31536000',
    });
    if (upErr) {
      const err = new Error(`Supabase upload failed: ${upErr.message || upErr.error || 'unknown error'}`);
      err.cause = upErr;
      throw err;
    }
    const { data } = supabase.storage.from(bucketName).getPublicUrl(dest);
    // size isn't directly returned; read from fs
    const size = fs.statSync(abs).size;
    uploaded.push({
      type: contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : 'file',
      url: data.publicUrl,
      filename,
      size,
      bucketPath: dest,
      contentType,
      provider: 'supabase',
    });
  }
  return uploaded;
}

async function updateIncidentAndMessages(db, incidentId, media, createdAt, expiresAt) {
  const incidentRef = db.collection('incidents').doc(incidentId);
  const incSnap = await incidentRef.get();
  if (!incSnap.exists) {
    console.warn(`Incident not found: ${incidentId}`);
    return;
  }

  // Persist media in both structured form and as simple URL list for existing UIs
  const updates = { media, evidenceUrls: Array.isArray(media) ? media.map((m) => m.url) : [] };
  if (createdAt) updates.createdAt = admin.firestore.Timestamp.fromDate(createdAt);
  if (expiresAt) updates.expiresAt = admin.firestore.Timestamp.fromDate(expiresAt);

  await incidentRef.set(updates, { merge: true });

  // Update messages that reference this incident without requiring a collectionGroup index
  // We assume messages live in chats/{chatId}/messages and store metadata.incidentId
  const chatsSnap = await db.collection('chats').get();
  const batch = db.batch();
  for (const chatDoc of chatsSnap.docs) {
    const msgsRef = chatDoc.ref.collection('messages');
    const msgsSnap = await msgsRef.where('metadata.incidentId', '==', incidentId).get();
    msgsSnap.forEach((msgDoc) => {
      batch.set(
        msgDoc.ref,
        {
          'metadata.mediaList': media,
          'metadata.incident.media': media,
          ...(createdAt ? { 'metadata.incident.createdAt': admin.firestore.Timestamp.fromDate(createdAt) } : {}),
          ...(expiresAt ? { 'metadata.incident.expiresAt': admin.firestore.Timestamp.fromDate(expiresAt) } : {}),
        },
        { merge: true }
      );
    });
  }
  await batch.commit();

  // Update any activeIncidents array entries in chats
  if (createdAt || expiresAt) {
    const chats = await db.collection('chats').get();
    const batch2 = db.batch();
    chats.forEach((chat) => {
      const data = chat.data();
      const list = Array.isArray(data.activeIncidents) ? data.activeIncidents : [];
      const updated = list.map((x) => (
        x && x.incidentId === incidentId ? {
          ...x,
          ...(createdAt ? { createdAt: admin.firestore.Timestamp.fromDate(createdAt) } : {}),
          ...(expiresAt ? { expiresAt: admin.firestore.Timestamp.fromDate(expiresAt) } : {}),
        } : x
      ));
      if (JSON.stringify(updated) !== JSON.stringify(list)) {
        batch2.update(chat.ref, { activeIncidents: updated });
      }
    });
    await batch2.commit();
  }
}

(async () => {
  const args = parseArgs(process.argv);
  const incidentIds = (args.incidentIds || args.incidents || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!incidentIds.length) {
    console.error('Provide --incidentIds <id1,id2,...>');
    process.exit(1);
  }
  const files = (args.files || args.media || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!files.length) {
    console.error('Provide --files <path1,path2,...>');
    process.exit(1);
  }
  const createdAt = toTimestamp(args.createdAt);
  const expiresAt = toTimestamp(args.expiresAt);
  const storage = (args.storage || 'supabase').toString();
  const supabaseBucket = (args.bucket || args.supabaseBucket || 'evidence').toString();

  await ensureAdmin();
  const db = admin.firestore();
  let bucket = null;
  let supabase = null;
  if (storage === 'firebase') {
    bucket = admin.storage().bucket();
    console.log('Using Firebase Storage bucket:', bucket.name);
  } else {
    supabase = ensureSupabaseServer();
    console.log('Using Supabase Storage bucket:', supabaseBucket);
    await ensureSupabaseBucketExists(supabase, supabaseBucket);
  }

  console.log('Incidents:', incidentIds.join(', '));
  console.log('Files:', files.join(', '));

  for (const incidentId of incidentIds) {
    try {
      const media = storage === 'firebase'
        ? await uploadFiles(bucket, incidentId, files)
        : await uploadFilesSupabase(supabase, supabaseBucket, incidentId, files);
      console.log(`Uploaded ${media.length} files for ${incidentId}`);
      await updateIncidentAndMessages(db, incidentId, media, createdAt, expiresAt);
      console.log(`Updated incident ${incidentId} and related messages.`);
    } catch (e) {
      console.error(`Error processing incident ${incidentId}:`, e && e.message ? e.message : e);
      if (e && e.cause) console.error('Cause:', e.cause);
      process.exitCode = 1;
    }
  }
  console.log('Done.');
})().catch((e) => {
  console.error('Fatal error:', e && e.message ? e.message : e);
  if (e && e.cause) console.error('Cause:', e.cause);
  process.exit(1);
});
