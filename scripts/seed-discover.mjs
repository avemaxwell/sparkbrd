/**
 * Seed the discover feed from a hand-picked list of image URLs.
 *
 * HOW TO USE
 * ──────────
 * 1. Create scripts/seed-urls.txt — one image URL per line.
 *    To get an Unsplash URL: open a photo → right-click the image → "Copy image address".
 *    Works with any public image URL (Unsplash, Pexels, editorial sites, etc.).
 *
 * 2. Add to .env.local (if not already there):
 *      SEED_USER_ID=your_supabase_user_uuid
 *    (Supabase Dashboard → Authentication → Users → copy your UUID)
 *
 * 3. Run:
 *      node --env-file=.env.local scripts/seed-discover.mjs
 *
 * Safe to re-run — already-uploaded images are skipped.
 * Add more URLs to seed-urls.txt any time and run again.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { createHash } from 'crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_USER_ID         = process.env.SEED_USER_ID;
const SEED_BOARD_NAME      = 'Sparkurio Curated';
const URLS_FILE            = resolve(process.cwd(), 'scripts/seed-urls.txt');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SEED_USER_ID) {
  console.error(`
Missing env vars. Ensure .env.local contains:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SEED_USER_ID
`);
  process.exit(1);
}

if (!existsSync(URLS_FILE)) {
  console.error(`
No scripts/seed-urls.txt found.
Create the file and add one image URL per line, e.g.:

  https://images.unsplash.com/photo-1506905925346-21bda4d32df4?...
  https://images.unsplash.com/photo-1441986300917-64674bd600d8?...
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function urlToStorageKey(url) {
  // Stable filename based on a hash of the source URL so re-runs skip it.
  const hash = createHash('md5').update(url).digest('hex').slice(0, 16);
  // Try to detect extension from the URL; fall back to .jpg
  const rawPath = new URL(url).pathname;
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].find(e => rawPath.toLowerCase().includes(e)) ?? '.jpg';
  return `seeds/${hash}${ext}`;
}

function guessSourceDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Sparkurio discover seed\n');

  // Parse URL list — ignore blank lines and comments
  const lines = readFileSync(URLS_FILE, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  if (lines.length === 0) {
    console.error('seed-urls.txt is empty. Add some image URLs and try again.');
    process.exit(1);
  }
  console.log(`📋  ${lines.length} URLs loaded from seed-urls.txt`);

  // Find or create the seed board
  let boardId;
  const { data: existing } = await supabase
    .from('boards')
    .select('id')
    .eq('owner_id', SEED_USER_ID)
    .eq('name', SEED_BOARD_NAME)
    .maybeSingle();

  if (existing) {
    boardId = existing.id;
    console.log(`✓  Using existing board: ${boardId}`);
  } else {
    const { data: created, error } = await supabase
      .from('boards')
      .insert({
        owner_id: SEED_USER_ID,
        name: SEED_BOARD_NAME,
        description: 'Curated images for the Sparkurio discover feed.',
        is_public: true,
        vibe: 'gradient',
        background_color: '#fef3e2,#fce7f3',
        status: 'approved',
      })
      .select('id')
      .single();
    if (error) { console.error('Failed to create board:', error.message); process.exit(1); }
    boardId = created.id;
    console.log(`✓  Created new board: ${boardId}`);
  }

  // Check which storage keys already exist so we can skip them
  const { data: existingFiles } = await supabase.storage.from('tacks').list('seeds', { limit: 10000 });
  const existingKeys = new Set((existingFiles ?? []).map(f => `seeds/${f.name}`));
  console.log(`ℹ  ${existingKeys.size} images already uploaded — will skip these.\n`);

  let inserted = 0;
  let skipped  = 0;
  let failed   = 0;

  // Get current max z_index for the board
  const { data: zRow } = await supabase
    .from('tacks')
    .select('z_index')
    .eq('board_id', boardId)
    .order('z_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  let zIndex = (zRow?.z_index ?? 0) + 1;

  for (let i = 0; i < lines.length; i++) {
    const url = lines[i];
    const storageKey = urlToStorageKey(url);
    const progress = `[${i + 1}/${lines.length}]`;

    if (existingKeys.has(storageKey)) {
      process.stdout.write(`${progress} skip (already uploaded)\n`);
      skipped++;
      continue;
    }

    // Download the image
    let imageBuffer, contentType;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sparkurio/1.0)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      contentType = res.headers.get('content-type') ?? 'image/jpeg';
      // Reject non-images (HTML error pages, etc.)
      if (!contentType.startsWith('image/')) throw new Error(`not an image (${contentType})`);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } catch (err) {
      process.stdout.write(`${progress} ✗ download failed: ${err.message}\n`);
      failed++;
      continue;
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('tacks')
      .upload(storageKey, imageBuffer, { contentType, upsert: false });

    if (uploadError) {
      process.stdout.write(`${progress} ✗ upload failed: ${uploadError.message}\n`);
      failed++;
      continue;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('tacks').getPublicUrl(storageKey);

    // Insert tack
    const { error: tackError } = await supabase.from('tacks').insert({
      board_id:     boardId,
      user_id:      SEED_USER_ID,
      added_by:     SEED_USER_ID,
      content_url:  publicUrl,
      source:       guessSourceDomain(url),
      pin_color:    'papaya',
      position_x:   Math.round(100 + Math.random() * 2400),
      position_y:   Math.round(100 + Math.random() * 1600),
      width:        300,
      height:       300,
      rotation:     0,
      z_index:      zIndex++,
      hidden_as_ai: false,
    });

    if (tackError) {
      process.stdout.write(`${progress} ✗ tack insert failed: ${tackError.message}\n`);
      failed++;
      continue;
    }

    existingKeys.add(storageKey);
    inserted++;
    process.stdout.write(`${progress} ✓ ${guessSourceDomain(url)}\n`);

    // Small delay to avoid hammering the source server
    if (i < lines.length - 1) await sleep(300);
  }

  console.log(`\n✅  Done`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(`   Failed   : ${failed}`);
  if (inserted > 0) {
    console.log(`\n   Images are live in the discover feed immediately.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
