/**
 * generate-thumbs.mjs
 *
 * One-time script: for every image in the tacks/ bucket that doesn't
 * already have a _400.webp thumbnail, fetch a 400 px version through
 * Supabase's render endpoint (one transform each, never again) and
 * store it permanently as {original_path}_400.webp.
 *
 * After this runs, image-transform.ts derives the thumbnail URL from
 * the original URL with no render endpoint — zero ongoing charges.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/generate-thumbs.mjs
 *
 * Run repeatedly until it reports { remaining: 0 }.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqaaxqvyepouqcrxduiw.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET   = 'tacks';
const BATCH    = 30;

async function listFolder(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  return data ?? [];
}

async function allOriginals() {
  // List board-id-level folders
  const folders = await listFolder('');
  const results = [];
  for (const folder of folders) {
    if (!folder.id) continue; // skip files at root
    const files = await listFolder(folder.name);
    for (const f of files) {
      const name = f.name;
      // Only originals: not thumb files, not SVGs/GIFs
      if (name.endsWith('_400.webp')) continue;
      if (/\.(svg|gif)$/i.test(name)) continue;
      if (name.startsWith('.')) continue;
      results.push(`${folder.name}/${name}`);
    }
  }
  return results;
}

async function thumbExists(originalPath) {
  const thumbPath = originalPath.replace(/\.[^/.]+$/, '_400.webp');
  const { data } = await supabase.storage.from(BUCKET).list(thumbPath.split('/').slice(0, -1).join('/'), { search: thumbPath.split('/').pop() });
  return (data ?? []).length > 0;
}

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

async function main() {
  console.log('\nGenerating thumbnails for tacks bucket…\n');

  const originals = await allOriginals();
  console.log(`Found ${originals.length} original images.\n`);

  let processed = 0, skipped = 0, failed = 0;

  for (const path of originals.slice(0, BATCH)) {
    const thumbPath = path.replace(/\.[^/.]+$/, '_400.webp');

    // Skip if thumb already exists
    const { data: existing } = await supabase.storage.from(BUCKET)
      .list(thumbPath.split('/').slice(0, -1).join('/'), { search: thumbPath.split('/').pop() });
    if ((existing ?? []).length > 0) { skipped++; continue; }

    try {
      // Fetch 400 px version via render endpoint — this is the LAST time we use it
      const renderUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET}/${path}?width=400&quality=82&resize=contain`;
      const res = await fetch(renderUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { failed++; console.warn(`  ✗ fetch failed (${res.status}) for ${path}`); continue; }

      const contentType = res.headers.get('content-type') || 'image/webp';
      const buf = await res.arrayBuffer();

      const { error } = await supabase.storage.from(BUCKET)
        .upload(thumbPath, buf, { contentType, upsert: true });

      if (error) { failed++; console.warn(`  ✗ upload failed for ${thumbPath}: ${error.message}`); continue; }

      console.log(`  ✓ ${path} → ${thumbPath} (${kb(buf.byteLength)})`);
      processed++;
    } catch (e) {
      failed++;
      console.warn(`  ✗ error on ${path}:`, e.message);
    }
  }

  const remaining = Math.max(0, originals.length - skipped - processed);
  console.log(`\nDone. Processed: ${processed}, Skipped (exists): ${skipped}, Failed: ${failed}`);
  console.log(`Remaining: ~${remaining} (run again until 0)\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
