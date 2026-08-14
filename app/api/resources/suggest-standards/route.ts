import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { searchStandards } from '@/lib/standards';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'will', 'are', 'able',
  'their', 'them', 'into', 'have', 'has', 'students', 'student', 'using',
  'use', 'can', 'able', 'about', 'each', 'own', 'they', 'when', 'while',
]);

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const keywords = words.filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return [...new Set(keywords)].slice(0, 6);
}

// POST /api/resources/suggest-standards — AI assist for the Lesson Plan
// Builder's Objective block. Common Core/NGSS suggestions are constrained to
// codes actually present in the embedded dataset (lib/standards.ts) so the
// model can rank/select but never invent a code; state-level suggestions
// have no local dataset to check against, so they're returned separately
// and the client must label them as unverified — the teacher confirms or
// discards every suggestion, nothing attaches automatically.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { objective, subject, gradeBand, state } = await request.json();
    if (!objective?.trim()) {
      return NextResponse.json({ error: 'Write an objective first' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ matched: [], stateSuggestions: [] });
    }

    const keywords = extractKeywords(objective);
    const candidateMap = new Map<string, { code: string; text: string }>();
    for (const kw of keywords.length ? keywords : [objective.trim().slice(0, 20)]) {
      for (const s of searchStandards({ subject, gradeBand, query: kw, limit: 10 })) {
        candidateMap.set(s.code, { code: s.code, text: s.text });
      }
    }
    const candidates = [...candidateMap.values()].slice(0, 40);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `A teacher is planning a ${gradeBand || ''} ${subject || ''} lesson${state ? ` in ${state}` : ''}. Their learning objective:\n"${objective.trim()}"\n\n` +
          `Here is a list of real Common Core / NGSS standards codes with their text:\n${candidates.map((c) => `${c.code}: ${c.text}`).join('\n') || '(none found)'}\n\n` +
          `Return strict JSON only, no other text, in this exact shape:\n` +
          `{"matched": [{"code": "...", "text": "..."}], "stateSuggestions": [{"code": "...", "description": "..."}]}\n\n` +
          `"matched": pick at most 3 codes FROM THE LIST ABOVE that best fit the objective, copying their code and text exactly. If none genuinely fit, return an empty array — do not force a match.\n` +
          `"stateSuggestions": at most 2 plausible ${state || 'state-level'} standard codes likely relevant to this objective, from your own knowledge (these aren't checked against a database — keep descriptions general and don't overstate confidence). Return an empty array if you're not reasonably confident.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { matched: [], stateSuggestions: [] };

    return NextResponse.json({
      matched: Array.isArray(parsed.matched) ? parsed.matched.slice(0, 3) : [],
      stateSuggestions: Array.isArray(parsed.stateSuggestions) ? parsed.stateSuggestions.slice(0, 2) : [],
    });
  } catch (err) {
    console.error('POST /api/resources/suggest-standards error:', err);
    return NextResponse.json({ error: 'Failed to suggest standards' }, { status: 500 });
  }
}
