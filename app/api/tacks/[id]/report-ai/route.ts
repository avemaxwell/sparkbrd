import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

type Params = { params: Promise<{ id: string }> };

const REPORTS_TO_AUTO_HIDE = 3;   // hide tack after this many unique reports
const MAX_REPORTS_PER_DAY = 5;    // rate limit: flags per user per day

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: tackId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: count how many flags this user submitted today
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await admin
      .from('ai_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', dayStart.toISOString());

    if ((todayCount ?? 0) >= MAX_REPORTS_PER_DAY) {
      return NextResponse.json({ error: 'You have reached the daily flag limit.' }, { status: 429 });
    }

    // Check tack exists and get board_id
    const { data: tack } = await admin
      .from('tacks')
      .select('id, board_id, content_url, user_id, hidden_as_ai, ai_report_count')
      .eq('id', tackId)
      .single();

    if (!tack) return NextResponse.json({ error: 'Tack not found' }, { status: 404 });
    if (tack.hidden_as_ai) return NextResponse.json({ alreadyHidden: true });

    // Don't let someone flag their own tack (pointless)
    if (tack.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot flag your own tack.' }, { status: 400 });
    }

    // Insert report (UNIQUE constraint handles duplicate silently via upsert behavior)
    const { error: insertErr } = await admin.from('ai_reports').insert({
      tack_id: tackId,
      reporter_id: user.id,
      board_id: tack.board_id,
    });

    // If already reported by this user, unique constraint fires
    if (insertErr?.code === '23505') {
      return NextResponse.json({ alreadyReported: true });
    }
    if (insertErr) throw insertErr;

    // Increment report count atomically
    const newCount = (tack.ai_report_count ?? 0) + 1;
    await admin.from('tacks').update({ ai_report_count: newCount }).eq('id', tackId);

    // If threshold reached, re-verify with Claude and hide if confirmed
    if (newCount >= REPORTS_TO_AUTO_HIDE) {
      let shouldHide = true; // default: trust the crowd

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey && tack.content_url) {
        try {
          const client = new Anthropic({ apiKey });
          const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 128,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'url', url: tack.content_url } },
                {
                  type: 'text',
                  text: `Is this image AI-generated? Respond with ONLY JSON: {"isAI": true/false, "confidence": 0.0-1.0}`,
                },
              ],
            }],
          });
          const text = message.content[0].type === 'text' ? message.content[0].text : '';
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            // Only hide if Claude agrees (confidence ≥ 0.6)
            shouldHide = parsed.isAI && parsed.confidence >= 0.6;
            // Mark all open reports as reviewed
            await admin
              .from('ai_reports')
              .update({ reviewed: true, confirmed: shouldHide })
              .eq('tack_id', tackId)
              .eq('reviewed', false);
          }
        } catch {
          // Claude failed — trust the crowd
        }
      }

      if (shouldHide) {
        await admin.from('tacks').update({ hidden_as_ai: true }).eq('id', tackId);

        // Notify the tack owner
        if (tack.user_id) {
          await admin.from('notifications').insert({
            recipient_id: tack.user_id,
            actor_id: null,
            type: 'tack_hidden_ai',
            board_id: tack.board_id,
            tack_id: tackId,
          }).then(null, () => {});
        }

        return NextResponse.json({ flagged: true, hidden: true });
      }
    }

    return NextResponse.json({ flagged: true, hidden: false });
  } catch (err) {
    console.error('POST /api/tacks/[id]/report-ai error:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
