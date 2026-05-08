import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Heuristic pre-filter ────────────────────────────────────────────────────

const HEURISTIC_AI_DOMAINS = [
  'cdn.midjourney.com', 'midjourney.com',
  'openai.com', 'oaiusercontent.com',
  'stability.ai', 'dreamstudio',
  'runwayml.com',
  'nightcafe.studio',
  'artbreeder.com',
  'civitai.com',
  'leonardo.ai', 'cdn.leonardo.ai',
  'ideogram.ai',
  'bfl.ml',
  'playground.com',
  'krea.ai',
  'genmo.ai',
  'firefly.adobe.com',
];

const HEURISTIC_AI_FILENAME_PATTERNS = [
  /\b(ai[_-]?gen|ai[_-]?art|aiart|aigenerated)\b/i,
  /\bmidjourney\b/i,
  /\bstable[_-]?diffusion\b/i,
  /\bdall[_-]?e\b/i,
  /\bideogram\b/i,
  /\bleonardo\b/i,
  /\bflux[_-]?(dev|schnell|pro)\b/i,
  /\bfirefly\b/i,
  /\bplayground[_-]?v\d/i,
  /\b\d{5,}_\d+_\d+\b/,
  /\bupscaled?\b/i,
  /[_-]\d{10,}[_-]\d{4,}\b/,
];

function heuristicCheck(imageUrl: string): { flagged: boolean } {
  try {
    const u = new URL(imageUrl);
    for (const domain of HEURISTIC_AI_DOMAINS) {
      if (u.hostname.includes(domain)) return { flagged: true };
    }
    const path = u.pathname + u.search;
    for (const pattern of HEURISTIC_AI_FILENAME_PATTERNS) {
      if (pattern.test(path)) return { flagged: true };
    }
  } catch { /* invalid URL */ }
  return { flagged: false };
}

// ─── Claude vision prompt ────────────────────────────────────────────────────
// Kept intentionally short — fewer input tokens = faster response.

const AI_DETECTION_PROMPT = `You detect AI-generated images. Look for specific AI generator artifacts — do NOT flag clean professional photography just because it looks polished.

FLAG AS AI — only if you actually see these:
- Hands/fingers: wrong count, fused digits, anatomically impossible
- Faces: uncanny valley — glassy/painted eyes, hyper-symmetrical, plastic skin with no pores
- AI cinematic aesthetic: extreme subject sharpness + painted/dreamy soft background, orange+teal color grading, "Midjourney glow", volumetric light rays
- Concept/fantasy art: mechs, robots, sci-fi scenes with impossible lighting
- Garbled or morphed text in the image
- Backgrounds that look painted or dissolving rather than photographed

DO NOT FLAG:
- Product photography and fashion shots on clean white/grey studio backgrounds — these are deliberately noise-free and perfectly lit. Clean = professional, not AI.
- Editorial and portrait photography, even when heavily retouched
- Any image where hands, face, fabric, and proportions look anatomically correct

Also flag: explicit sexual content (not swimwear/art nudity), or sexualization of minors.

Reply ONLY with this JSON, nothing else:
{"isAI":true/false,"aiConfidence":0.0-1.0,"isExplicit":false,"explicitConfidence":0.0,"involveMinors":false}`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Fast heuristic check — no API cost
    if (heuristicCheck(imageUrl).flagged) {
      return NextResponse.json({ isLikelyAI: true, confidence: 0.97, blocked: true, softWarned: false });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ isLikelyAI: true, confidence: 0, blocked: true, softWarned: false,
        reason: 'Image verification is temporarily unavailable.' });
    }

    const client = new Anthropic({ apiKey });

    // Pass the URL directly — no server-side pre-fetch.
    // Anthropic fetches the image from their infrastructure, which is fast.
    // If they can't access it, parsed will be null → fail closed below.
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } as any },
          { type: 'text', text: AI_DETECTION_PROMPT },
        ],
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed: {
      isAI: boolean; aiConfidence: number;
      isExplicit: boolean; explicitConfidence: number; involveMinors: boolean;
    } | null = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { /* parse failed — fail closed below */ }

    if (!parsed) {
      return NextResponse.json({ isLikelyAI: true, confidence: 0, blocked: true, softWarned: false });
    }

    // CSAM / explicit — always hard block, log for review
    if (parsed.involveMinors || (parsed.isExplicit && parsed.explicitConfidence >= 0.65)) {
      console.error('[CONTENT_VIOLATION]', JSON.stringify({
        imageUrl, involveMinors: parsed.involveMinors,
        explicitConfidence: parsed.explicitConfidence, timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({ isLikelyAI: false, confidence: 0, blocked: false, softWarned: false,
        explicitBlocked: true, involveMinors: parsed.involveMinors });
    }

    // Block at ≥ 0.45 — no soft-warn override path
    const blocked = parsed.isAI && parsed.aiConfidence >= 0.45;

    return NextResponse.json({
      isLikelyAI: parsed.isAI,
      confidence: parsed.aiConfidence,
      blocked,
      softWarned: false,
      explicitBlocked: false,
    });

  } catch (error) {
    console.error('AI check error:', error);
    return NextResponse.json({ isLikelyAI: true, confidence: 0, blocked: true, softWarned: false });
  }
}
