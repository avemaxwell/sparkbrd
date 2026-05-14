/**
 * generate-thumbs.mjs — pre-generate 400px WebP thumbnails
 *
 * Lists every image in the tacks/ bucket, generates _400.webp thumbnails
 * for any that don't have one yet, and stores them permanently.
 * After this runs, image-transform.ts serves thumbnails directly with
 * zero Supabase Image Transform charges.
 *
 * Usage (run from /Users/averymaxwell/corkbrd):
 *   SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2-) node scripts/generate-thumbs.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqaaxqvyepouqcrxduiw.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = 'tacks';
const BATCH  = 20;

// List all files under a prefix (non-recursive, returns files only)
async function listFiles(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) { console.error('list error:', error.message); return []; }
  return (data ?? []).filter(f => f.id !== null); // id===null means it's a folder
}

// List all sub-folders under a prefix
async function listFolders(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) { console.error('list error:', error.message); return []; }
  return (data ?? []).filter(f => f.id === null).map(f => f.name);
}

async function main() {
  console.log('\nScanning tacks bucket…\n');

  // Get all board-id-level folders
  const topFolders = await listFolders('');
  console.log(`Top-level folders: ${topFolders.length}`);

  // Collect originals and existing thumbs per folder
  const originals = [];   // paths that need thumbnails
  let thumbCount = 0;

  for (const folder of topFolders) {
    const files = await listFiles(folder);
    const thumbSet = new Set(files.filter(f => f.name.endsWith('_400.webp')).map(f => f.name));
    thumbCount += thumbSet.size;

    for (const f of files) {
      if (f.name.endsWith('_400.webp')) continue;
      if (/\.(svg|gif)$/i.test(f.name)) continue;
      if (f.name.startsWith('.')) continue;

      const thumbName = f.name.replace(/\.[^/.]+$/, '_400.webp');
      if (!thumbSet.has(thumbName)) {
        originals.push(`${folder}/${f.name}`);
      }
    }
  }

  console.log(`Already have thumbnails: ${thumbCount}`);
  console.log(`Need thumbnails: ${originals.length}\n`);

  if (originals.length === 0) {
    console.log('All done — nothing to generate.\n');
    return;
  }

  const batch = originals.slice(0, BATCH);
  let processed = 0, failed = 0;

  for (const path of batch) {
    const thumbPath = path.replace(/\.[^/.]+$/, '_400.webp');
    try {
      // Fetch the original directly — no Supabase Image Transform endpoint
      const originalUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      const res = await fetch(originalUrl, { signal: AbortSignal.timeout(12000) });

      if (!res.ok) {
        console.warn(`  ✗ render failed (${res.status}): ${path}`);
        failed++;
        continue;
      }

      const contentType = res.headers.get('content-type') || 'image/webp';
      const buf = await res.arrayBuffer();

      const { error } = await supabase.storage.from(BUCKET)
        .upload(thumbPath, buf, { contentType, upsert: true });

      if (error) {
        console.warn(`  ✗ upload failed: ${thumbPath} — ${error.message}`);
        failed++;
        continue;
      }

      console.log(`  ✓ ${path} (${(buf.byteLength / 1024).toFixed(0)} KB)`);
      processed++;
    } catch (e) {
      console.warn(`  ✗ error: ${path} — ${e.message}`);
      failed++;
    }
  }

  const remaining = originals.length - processed;
  console.log(`\nProcessed: ${processed} | Failed: ${failed} | Remaining: ${remaining}`);
  if (remaining > 0) console.log('Run again to continue.\n');
  else console.log('All done!\n');
}

main().catch(err => { console.error(err); process.exit(1); });
