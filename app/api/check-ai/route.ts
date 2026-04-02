import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const HEURISTIC_AI_DOMAINS = [
  'midjourney.com', 'cdn.midjourney.com',
  'openai.com', 'dalle',
  'stability.ai', 'dreamstudio',
  'runwayml.com',
  'nightcafe.studio',
  'artbreeder.com',
  'civitai.com',
];

const HEURISTIC_AI_FILENAME_PATTERNS = [
  /\b(ai[_-]?gen|ai[_-]?art|aiart)\b/i,
  /\bmidjourney\b/i,
  /\bstable[_-]?diffusion\b/i,
  /\bdall[_-]?e\b/i,
  /\b\d{5,}_\d+_\d+\b/, // common SD output naming: 00012_1234_20
  /\bupscaled?\b/i,
  /\bv\d+\.\d+[_-]\d{4,}\b/i,
];

function heuristicCheck(imageUrl: string): { flagged: boolean; reason: string | null } {
  try {
    const u = new URL(imageUrl);
    for (const domain of HEURISTIC_AI_DOMAINS) {
      if (u.hostname.includes(domain)) {
        return { flagged: true, reason: `Image appears to be from an AI generation platform (${u.hostname}).` };
      }
    }
    const path = u.pathname + u.search;
    for (const pattern of HEURISTIC_AI_FILENAME_PATTERNS) {
      if (pattern.test(path)) {
        return { flagged: true, reason: 'Image filename suggests it may be AI-generated.' };
      }
    }
  } catch {
    // invalid URL — let it through
  }
  return { flagged: false, reason: null };
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Always run heuristic check first — fast and free
    const heuristic = heuristicCheck(imageUrl);
    if (heuristic.flagged) {
      return NextResponse.json({
        isLikelyAI: true,
        confidence: 0.9,
        blocked: true,
        reason: heuristic.reason,
      });
    }

    // Use Claude vision if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No key — heuristic passed, allow upload
      return NextResponse.json({ isLikelyAI: false, confidence: 0, blocked: false, reason: null });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: `Analyze this image and determine if it is AI-generated (created by tools like Midjourney, DALL-E, Stable Diffusion, Firefly, etc.) or a real human-made photograph, illustration, or artwork.

Respond with ONLY a JSON object in this exact format:
{"isAI": true/false, "confidence": 0.0-1.0, "reason": "brief reason"}

Be strict. If there are telltale signs of AI generation — unnaturally perfect lighting, distorted hands/text, hyper-smooth skin, dreamlike backgrounds, or the aesthetic signature of diffusion models — flag it.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed: { isAI: boolean; confidence: number; reason: string } | null = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // parse failed — fail open
    }

    if (!parsed) {
      return NextResponse.json({ isLikelyAI: false, confidence: 0, blocked: false, reason: null });
    }

    const blocked = parsed.isAI && parsed.confidence >= 0.7;

    return NextResponse.json({
      isLikelyAI: parsed.isAI,
      confidence: parsed.confidence,
      blocked,
      reason: parsed.reason,
    });

  } catch (error) {
    console.error('AI check error:', error);
    // Fail open — don't block uploads if detection fails
    return NextResponse.json({ isLikelyAI: false, blocked: false, reason: null });
  }
}
