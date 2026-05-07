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
 *      node scripts/seed-discover.mjs
 *
 * Safe to re-run — already-uploaded images are skipped.
 * Add more URLs to seed-urls.txt any time and run again.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Parse .env.local manually — node --env-file can't handle values with < > & characters
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

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

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateTags(imageUrl) {
  if (!ANTHROPIC_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text', text: 'Generate 12-15 descriptive search tags for this image. Focus on: objects, colors, mood, style, setting, materials, activities. Return only comma-separated lowercase keywords, nothing else.' },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? '';
    if (!text) return null;
    return text.replace(/\.$/, '').split(',').map(t => t.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

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

    // Generate tags via Claude Haiku
    const tags = await generateTags(publicUrl);

    // Insert tack
    const { error: tackError } = await supabase.from('tacks').insert({
      board_id:     boardId,
      user_id:      SEED_USER_ID,
      added_by:     SEED_USER_ID,
      content_url:  publicUrl,
      source:       guessSourceDomain(url),
      tags:         tags ?? [],
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

  // ── Backfill tags for any seed tacks that have no tags yet ──────────────────
  if (!ANTHROPIC_KEY) {
    console.log(`\nℹ  No ANTHROPIC_API_KEY found — skipping tag backfill.`);
    return;
  }

  const { data: untagged } = await supabase
    .from('tacks')
    .select('id, content_url')
    .eq('board_id', boardId)
    .or('tags.is.null,tags.eq.{}');

  if (!untagged || untagged.length === 0) {
    console.log(`\n✓  All images already have tags.`);
    return;
  }

  console.log(`\n🏷   Tagging ${untagged.length} images without tags…`);
  let tagged = 0;

  for (let i = 0; i < untagged.length; i++) {
    const tack = untagged[i];
    const progress = `[${i + 1}/${untagged.length}]`;

    const tags = await generateTags(tack.content_url);
    if (!tags) {
      process.stdout.write(`${progress} ✗ tagging failed\n`);
      continue;
    }

    const { error } = await supabase
      .from('tacks')
      .update({ tags })
      .eq('id', tack.id);

    if (error) {
      process.stdout.write(`${progress} ✗ update failed: ${error.message}\n`);
    } else {
      process.stdout.write(`${progress} ✓ ${tags.slice(0, 3).join(', ')}…\n`);
      tagged++;
    }

    // Stay well under Anthropic rate limits
    if (i < untagged.length - 1) await sleep(500);
  }

  console.log(`\n✅  Tagged ${tagged}/${untagged.length} images.`);
}

main().catch(err => { console.error(err); process.exit(1); });
