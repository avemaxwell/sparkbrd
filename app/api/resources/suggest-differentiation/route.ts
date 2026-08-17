import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

// POST /api/resources/suggest-differentiation — AI assist for the Lesson
// Plan Builder: teacher marks a block, this suggests three short starting
// points (ELL, IEP/Special Education, Gifted/Enrichment) for adapting that
// specific content. Explicitly "starting points, not final text" — the
// client only ever offers to insert these into an editable Differentiation
// block, never applies them directly.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, blockLabel, subject, gradeBand } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Add some content to this block first' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ suggestions: [] });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `A teacher is planning a ${gradeBand || ''} ${subject || ''} lesson. Here is the "${blockLabel || 'lesson'}" part of the plan:\n"${content.trim()}"\n\n` +
          `Suggest a brief differentiation starting point for each of three groups, specific to this exact content — not generic advice a teacher has already heard a hundred times. 1-2 sentences each, concrete enough to act on, but phrased as a starting point the teacher will adapt, not a finished instruction.\n\n` +
          `Return strict JSON only, no other text, in this exact shape:\n` +
          `{"suggestions": [{"label": "ELL", "text": "..."}, {"label": "IEP / Special Education", "text": "..."}, {"label": "Gifted / Enrichment", "text": "..."}]}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };

    return NextResponse.json({
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    });
  } catch (err) {
    console.error('POST /api/resources/suggest-differentiation error:', err);
    return NextResponse.json({ error: 'Failed to suggest differentiation ideas' }, { status: 500 });
  }
}
