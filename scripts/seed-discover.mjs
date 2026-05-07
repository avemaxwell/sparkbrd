/**
 * Seed the discover feed with ~1,000 curated Unsplash photos.
 *
 * Prerequisites:
 *   1. Free Unsplash developer account → https://unsplash.com/developers
 *      Create an app and copy the "Access Key" (not Secret Key).
 *   2. Your Supabase user ID (the account that will own the seed board).
 *      Find it in Supabase Dashboard → Authentication → Users.
 *
 * Add to .env.local:
 *   UNSPLASH_ACCESS_KEY=your_unsplash_access_key
 *   SEED_USER_ID=your_supabase_user_id
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-discover.mjs
 *
 * Re-running is safe — it skips images already in the seed board.
 * To top up later, just run it again; new images will be added.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSPLASH_KEY        = process.env.UNSPLASH_ACCESS_KEY;
const SEED_USER_ID        = process.env.SEED_USER_ID;
const SEED_BOARD_NAME     = 'Sparkurio Curated';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !UNSPLASH_KEY || !SEED_USER_ID) {
  console.error(`
Missing required environment variables. Make sure .env.local contains:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  UNSPLASH_ACCESS_KEY
  SEED_USER_ID
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Curated categories ───────────────────────────────────────────────────────
// Each entry: what to search, relevant tags, preferred orientation, target count.
// orientations: 'portrait' | 'squarish' | 'landscape' | 'any'

const CATEGORIES = [
  // Interior design & home
  { query: 'interior design living room',           tags: ['interior', 'home', 'living room', 'design'],      orientation: 'landscape', count: 50 },
  { query: 'bedroom aesthetic cozy home',           tags: ['bedroom', 'cozy', 'home', 'interior'],            orientation: 'portrait',  count: 40 },
  { query: 'home decor styling shelves',            tags: ['home', 'decor', 'styling', 'shelf'],              orientation: 'portrait',  count: 40 },
  { query: 'kitchen interior minimal',              tags: ['kitchen', 'interior', 'minimal', 'home'],         orientation: 'landscape', count: 30 },
  { query: 'bathroom interior design spa',          tags: ['bathroom', 'interior', 'spa', 'home'],            orientation: 'portrait',  count: 30 },

  // Fashion & style
  { query: 'fashion editorial portrait',            tags: ['fashion', 'editorial', 'portrait', 'style'],      orientation: 'portrait',  count: 60 },
  { query: 'street style outfit aesthetic',         tags: ['fashion', 'street style', 'outfit'],              orientation: 'portrait',  count: 50 },
  { query: 'clothing flat lay aesthetic',           tags: ['fashion', 'flat lay', 'clothing', 'style'],       orientation: 'squarish',  count: 40 },
  { query: 'shoes accessories editorial',           tags: ['fashion', 'accessories', 'shoes', 'editorial'],   orientation: 'squarish',  count: 30 },

  // Vintage & retro
  { query: 'vintage objects retro nostalgia',       tags: ['vintage', 'retro', 'nostalgia', 'objects'],       orientation: 'squarish',  count: 50 },
  { query: 'antique market flea market finds',      tags: ['vintage', 'antique', 'retro'],                    orientation: 'squarish',  count: 40 },
  { query: 'film camera analog retro',              tags: ['vintage', 'analog', 'film', 'camera'],            orientation: 'squarish',  count: 30 },
  { query: '70s aesthetic retro color',             tags: ['retro', '70s', 'vintage', 'color'],               orientation: 'squarish',  count: 30 },

  // Floral & botanical
  { query: 'flower close up macro',                 tags: ['floral', 'flower', 'botanical', 'macro'],         orientation: 'squarish',  count: 50 },
  { query: 'botanical plant aesthetic',             tags: ['botanical', 'plant', 'green', 'nature'],          orientation: 'portrait',  count: 40 },
  { query: 'dried flowers arrangement',             tags: ['floral', 'dried flowers', 'arrangement'],         orientation: 'squarish',  count: 30 },
  { query: 'garden flowers blooming',               tags: ['garden', 'flowers', 'blooming', 'floral'],        orientation: 'squarish',  count: 30 },

  // Still life & objects
  { query: 'still life objects aesthetic',          tags: ['still life', 'objects', 'aesthetic'],             orientation: 'squarish',  count: 50 },
  { query: 'flat lay aesthetic minimal',            tags: ['flat lay', 'minimal', 'aesthetic', 'styling'],    orientation: 'squarish',  count: 40 },
  { query: 'candle minimal aesthetic',              tags: ['candle', 'minimal', 'cozy', 'aesthetic'],         orientation: 'squarish',  count: 30 },
  { query: 'perfume beauty product editorial',      tags: ['beauty', 'perfume', 'product', 'editorial'],      orientation: 'squarish',  count: 30 },

  // Art & creative
  { query: 'art print gallery wall',                tags: ['art', 'gallery', 'print', 'wall'],                orientation: 'portrait',  count: 40 },
  { query: 'painting artwork studio',               tags: ['art', 'painting', 'studio', 'creative'],          orientation: 'squarish',  count: 40 },
  { query: 'illustration drawing sketchbook',       tags: ['illustration', 'drawing', 'art', 'sketch'],       orientation: 'squarish',  count: 30 },
  { query: 'moodboard creative editorial',          tags: ['editorial', 'creative', 'moodboard'],             orientation: 'portrait',  count: 30 },

  // Film & analog photography
  { query: 'film photography grain 35mm',           tags: ['film', 'analog', '35mm', 'grain'],                orientation: 'squarish',  count: 40 },
  { query: 'polaroid instant film photo',           tags: ['polaroid', 'film', 'instant', 'analog'],          orientation: 'squarish',  count: 30 },

  // Food & café lifestyle
  { query: 'food styling aesthetic editorial',      tags: ['food', 'styling', 'aesthetic', 'editorial'],      orientation: 'squarish',  count: 40 },
  { query: 'cafe aesthetic coffee morning',         tags: ['cafe', 'coffee', 'morning', 'cozy'],              orientation: 'squarish',  count: 40 },
  { query: 'baking pastry aesthetic',               tags: ['baking', 'pastry', 'food', 'sweet'],              orientation: 'squarish',  count: 30 },

  // Ceramics & craft
  { query: 'ceramics pottery handmade craft',       tags: ['ceramics', 'pottery', 'handmade', 'craft'],       orientation: 'squarish',  count: 40 },
  { query: 'textile fabric weaving craft',          tags: ['textile', 'fabric', 'craft', 'handmade'],         orientation: 'squarish',  count: 30 },

  // Typography & graphic
  { query: 'neon sign typography street',           tags: ['neon', 'sign', 'typography', 'street'],           orientation: 'squarish',  count: 30 },
  { query: 'book pages typography reading',         tags: ['book', 'typography', 'reading', 'aesthetic'],     orientation: 'squarish',  count: 30 },

  // Color & mood
  { query: 'pastel color aesthetic soft',           tags: ['pastel', 'color', 'soft', 'aesthetic'],           orientation: 'squarish',  count: 30 },
  { query: 'moody dark aesthetic dramatic',         tags: ['moody', 'dark', 'dramatic', 'aesthetic'],         orientation: 'portrait',  count: 30 },
  { query: 'earth tones warm color palette',        tags: ['earth tones', 'warm', 'color', 'palette'],        orientation: 'squarish',  count: 30 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function unsplashSearch(query, orientation, page, perPage = 30) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(perPage),
    order_by: 'relevant',
    ...(orientation !== 'any' && { orientation }),
  });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_KEY}`,
      'Accept-Version': 'v1',
    },
  });
  if (res.status === 429) throw new Error('Rate limited by Unsplash — wait an hour and retry.');
  if (!res.ok) throw new Error(`Unsplash error ${res.status}: ${await res.text()}`);
  return res.json();
}

function extractUrl(photo) {
  // Use the "regular" size (1080px) — good quality, reasonable file size
  return photo.urls.regular;
}

function extractSource(photo) {
  const user = photo.user?.name ?? photo.user?.username ?? null;
  return user ? `unsplash.com/@${photo.user.username}` : 'unsplash.com';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Sparkurio discover seed script\n');

  // 1. Find or create the seed board
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
    if (error) { console.error('Failed to create board:', error); process.exit(1); }
    boardId = created.id;
    console.log(`✓  Created new board: ${boardId}`);
  }

  // 2. Load URLs already in this board so we can skip duplicates
  const { data: existing_tacks } = await supabase
    .from('tacks')
    .select('content_url')
    .eq('board_id', boardId);
  const existingUrls = new Set((existing_tacks ?? []).map(t => t.content_url));
  console.log(`ℹ  ${existingUrls.size} images already in board — will skip these.\n`);

  // 3. Fetch and insert
  let totalInserted = 0;
  let totalSkipped = 0;
  let requestCount = 0;

  for (const cat of CATEGORIES) {
    console.log(`\n📂  ${cat.query} (target: ${cat.count})`);
    const toFetch = cat.count;
    const pages = Math.ceil(toFetch / 30);
    const photos = [];

    for (let page = 1; page <= pages; page++) {
      const perPage = page === pages ? (toFetch % 30 || 30) : 30;

      // Unsplash free tier: 50 req/hour → ~1.2s between requests
      if (requestCount > 0) await sleep(1300);
      requestCount++;

      try {
        const result = await unsplashSearch(cat.query, cat.orientation, page, perPage);
        photos.push(...(result.results ?? []));
        process.stdout.write(`  page ${page}/${pages} → ${result.results?.length ?? 0} photos`);
      } catch (err) {
        console.error(`\n  ✗ ${err.message}`);
        if (err.message.includes('Rate limited')) process.exit(1);
        break;
      }
    }

    // Build tack rows, deduplicating against existing and within this batch
    const seenThisBatch = new Set();
    const rows = [];
    let zBase = totalInserted + 1;

    for (const photo of photos) {
      const url = extractUrl(photo);
      if (existingUrls.has(url) || seenThisBatch.has(url)) { totalSkipped++; continue; }
      seenThisBatch.add(url);
      existingUrls.add(url); // prevent cross-category dupes

      rows.push({
        board_id:     boardId,
        user_id:      SEED_USER_ID,
        added_by:     SEED_USER_ID,
        content_url:  url,
        title:        photo.description || photo.alt_description || null,
        source:       extractSource(photo),
        tags:         cat.tags,
        pin_color:    'papaya',
        position_x:   Math.round(100 + Math.random() * 2400),
        position_y:   Math.round(100 + Math.random() * 1600),
        width:        300,
        height:       Math.round(300 * (photo.height / photo.width)),
        rotation:     0,
        z_index:      zBase++,
        hidden_as_ai: false,
      });
    }

    if (rows.length === 0) { console.log('  — nothing new to insert'); continue; }

    // Insert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase.from('tacks').insert(batch);
      if (error) {
        console.error(`\n  ✗ Insert error:`, error.message);
      } else {
        totalInserted += batch.length;
        process.stdout.write(`  ✓ inserted ${batch.length}`);
      }
    }
  }

  console.log(`\n\n✅  Done!`);
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Skipped (already existed): ${totalSkipped}`);
  console.log(`   Total in board: ${existingUrls.size}`);
  console.log(`\n   Board is public — images will appear in the discover feed immediately.`);
}

main().catch(err => { console.error(err); process.exit(1); });
