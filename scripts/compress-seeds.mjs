/**
 * compress-seeds.mjs
 *
 * One-time script: compresses every image in the tacks/seeds/ storage folder
 * by pulling it through Supabase Image Transform (max 1600px, q=82) then
 * overwriting the original file in-place.
 *
 * No extra npm packages required — uses the Supabase JS client already in
 * the project and the Node built-in fetch.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/compress-seeds.mjs
 *
 * The service role key is in .env.local as SUPABASE_SERVICE_ROLE_KEY.
 * Never commit that file.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqaaxqvyepouqcrxduiw.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BUCKET  = 'tacks';
const FOLDER  = 'seeds';
const MAX_PX  = 1600;
const QUALITY = 82;

// File types Supabase can transform — skip the rest
const TRANSFORMABLE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

async function listAll(folder) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;
  return (data ?? []).filter(f => !f.name.startsWith('.'));
}

async function compress(path) {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  // Fetch original size first (HEAD request)
  const head = await fetch(publicUrl, { method: 'HEAD' });
  const originalBytes = parseInt(head.headers.get('content-length') ?? '0', 10);

  // Download original directly — no Supabase Image Transform
  const res = await fetch(publicUrl);
  if (!res.ok) {
    console.warn(`  ✗ fetch failed (${res.status}) — skipping ${path}`);
    return { skipped: true };
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = await res.arrayBuffer();
  const compressedBytes = buffer.byteLength;

  // Only overwrite if we actually saved space (>10% smaller)
  if (compressedBytes >= originalBytes * 0.9) {
    console.log(`  — ${path}: already small (${kb(originalBytes)} → ${kb(compressedBytes)}) — skipping`);
    return { skipped: true };
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.warn(`  ✗ upload failed: ${error.message}`);
    return { skipped: true };
  }

  const saved = originalBytes - compressedBytes;
  console.log(`  ✓ ${path}: ${kb(originalBytes)} → ${kb(compressedBytes)}  (saved ${kb(saved)})`);
  return { originalBytes, compressedBytes, saved };
}

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

async function main() {
  console.log(`\nCompressing images in tacks/${FOLDER}/ …\n`);

  const files = await listAll(FOLDER);
  const images = files.filter(f => TRANSFORMABLE.test(f.name));

  console.log(`Found ${images.length} compressible image(s) (${files.length - images.length} skipped as non-image).\n`);

  let totalSaved = 0;
  let processed  = 0;

  for (const file of images) {
    const path = `${FOLDER}/${file.name}`;
    const result = await compress(path);
    if (!result.skipped) {
      totalSaved += result.saved;
      processed++;
    }
  }

  console.log(`\nDone. ${processed} file(s) compressed. Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
