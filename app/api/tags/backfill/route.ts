/**
 * POST /api/tags/backfill
 *
 * Admin-only route that tags all public tacks that have no tags yet.
 * Call once from the browser or curl. Processes in batches of 20 to
 * stay within Vercel's response time limits — call it multiple times
 * until it reports { remaining: 0 }.
 *
 * Authorization: requires BACKFILL_SECRET env var to match the
 * "secret" body param (or SUPABASE_SERVICE_ROLE_KEY as fallback).
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const BATCH = 20;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const secret = process.env.BACKFILL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16);
  if (!secret || body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'No ANTHROPIC_API_KEY' }, { status: 500 });
  }

  const supabase = createAdminClient();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Fetch untagged public tacks (excluding SVGs/stickers)
  const { data: untagged, error } = await supabase
    .from('tacks')
    .select('id, content_url, boards!inner(is_public)')
    .eq('boards.is_public', true)
    .is('tags', null)
    .not('content_url', 'ilike', '%.svg%')
    .not('content_url', 'ilike', '%/stickers/%')
    .limit(BATCH);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!untagged?.length) return NextResponse.json({ processed: 0, remaining: 0 });

  // Count total remaining BEFORE this batch
  const { count: totalRemaining } = await supabase
    .from('tacks')
    .select('id', { count: 'exact', head: true })
    .is('tags', null)
    .not('content_url', 'ilike', '%.svg%')
    .not('content_url', 'ilike', '%/stickers/%');

  let processed = 0;
  let failed = 0;

  for (const tack of untagged) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: tack.content_url } },
            { type: 'text', text: 'Generate 12-15 descriptive search tags for this image. Cover objects, colors, mood, style, setting, materials, activities, and visual aesthetic. Return only comma-separated lowercase keywords, nothing else.' },
          ],
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      if (text) {
        const tags = text.replace(/\.$/, '');
        await supabase.from('tacks').update({ tags }).eq('id', tack.id);
        processed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    processed,
    failed,
    remaining: Math.max(0, (totalRemaining ?? 0) - processed),
  });
}
