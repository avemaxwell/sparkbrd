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
        confidence: 0.95,
        blocked: true,       // hard block — known AI platform
        softWarned: false,
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

    // Fetch the image server-side and send as base64 so Claude always gets
    // the actual bytes regardless of whether it can reach the source URL.
    let imageSource: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string };
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) throw new Error(`fetch ${imgRes.status}`);
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      // Normalise to a supported media type
      const mediaType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const)
        .find(t => contentType.startsWith(t)) ?? 'image/jpeg';
      imageSource = { type: 'base64', media_type: mediaType, data: Buffer.from(buffer).toString('base64') };
    } catch {
      // Fall back to URL source; if that also fails the outer catch will handle it
      imageSource = { type: 'url', url: imageUrl };
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: imageSource as any,
            },
            {
              type: 'text',
              text: `Analyze this image for two things and respond with ONLY a JSON object.

1. AI-GENERATED CONTENT: Is this image AI-generated (Midjourney, DALL-E, Stable Diffusion, Firefly, etc.) rather than a real photograph, human illustration, or traditional artwork? Signs include unnaturally perfect lighting, distorted hands/text/fingers, hyper-smooth skin, dreamlike backgrounds, or the diffusion model aesthetic.

2. EXPLICIT CONTENT: Does this image contain nudity, exposed genitalia, graphic sexual acts, or sexual content involving minors?
IMPORTANT EXCEPTIONS — these are NOT explicit content: nude-colored or skin-toned clothing (dresses, bodysuits, etc.), swimwear, lingerie shown non-sexually, athletic wear, breastfeeding, classical paintings or sculptures with non-sexual nudity, medical illustrations. Only flag actual exposed genitalia, graphic sexual acts, or anything that sexualizes a minor in any way.

3. MINOR SAFETY: Does this image sexualize, exploit, or depict a minor (person under 18) in any sexual or inappropriate context? Be extremely conservative — if there is any doubt, set this to true.

Respond with ONLY this JSON:
{"isAI": true/false, "aiConfidence": 0.0-1.0, "aiReason": "brief reason", "isExplicit": true/false, "explicitConfidence": 0.0-1.0, "explicitReason": "brief reason", "involveMinors": true/false}`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed: {
      isAI: boolean; aiConfidence: number; aiReason: string;
      isExplicit: boolean; explicitConfidence: number; explicitReason: string;
      involveMinors: boolean;
    } | null = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // parse failed — block to be safe
    }

    if (!parsed) {
      // Detection produced no result — fail closed to prevent bypass
      return NextResponse.json({
        isLikelyAI: true,
        confidence: 0,
        blocked: true,
        softWarned: false,
        reason: 'Could not verify this image. Please try a different image or contact support.',
      });
    }

    // Explicit / CSAM — always hard block, no override
    if (parsed.involveMinors || (parsed.isExplicit && parsed.explicitConfidence >= 0.70)) {
      // Server-side log for NCMEC reporting review
      console.error('[CONTENT_VIOLATION]', JSON.stringify({
        imageUrl,
        involveMinors: parsed.involveMinors,
        explicitConfidence: parsed.explicitConfidence,
        reason: parsed.explicitReason,
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json({
        isLikelyAI: false,
        confidence: 0,
        blocked: false,
        softWarned: false,
        explicitBlocked: true,
        involveMinors: parsed.involveMinors,
        reason: parsed.explicitReason,
      });
    }

    // Hard block: high-confidence AI detection (≥ 0.75) — no override allowed
    // Soft warn: moderate confidence (0.45–0.75) — user can override
    const hardBlocked = parsed.isAI && parsed.aiConfidence >= 0.75;
    const softWarned  = parsed.isAI && parsed.aiConfidence >= 0.45 && !hardBlocked;

    return NextResponse.json({
      isLikelyAI: parsed.isAI,
      confidence: parsed.aiConfidence,
      blocked: hardBlocked,
      softWarned,
      explicitBlocked: false,
      reason: parsed.aiReason,
    });

  } catch (error) {
    console.error('AI check error:', error);
    // Fail closed — a detection error should not be exploitable as a bypass
    return NextResponse.json({
      isLikelyAI: true,
      confidence: 0,
      blocked: true,
      softWarned: false,
      reason: 'Image could not be verified. Please try a different image or contact support if this keeps happening.',
    });
  }
}
