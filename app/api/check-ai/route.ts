import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Heuristic pre-filter ────────────────────────────────────────────────────
// Fast, free checks before spending a vision API call.

const HEURISTIC_AI_DOMAINS = [
  'cdn.midjourney.com', 'midjourney.com',
  'openai.com', 'oaiusercontent.com',
  'stability.ai', 'dreamstudio',
  'runwayml.com', 'runwayml',
  'nightcafe.studio',
  'artbreeder.com',
  'civitai.com',
  'leonardo.ai', 'cdn.leonardo.ai',
  'ideogram.ai',
  'bfl.ml',           // Black Forest Labs / Flux
  'playground.com',   // Playground AI
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
  /\b\d{5,}_\d+_\d+\b/,       // common SD naming: 00012_1234_20
  /\bupscaled?\b/i,
  /\bv\d+\.\d+[_-]\d{4,}\b/i, // version-stamp naming
  /[_-]\d{10,}[_-]\d{4,}\b/,  // long-number Midjourney IDs
];

function heuristicCheck(imageUrl: string): { flagged: boolean; reason: string | null } {
  try {
    const u = new URL(imageUrl);
    for (const domain of HEURISTIC_AI_DOMAINS) {
      if (u.hostname.includes(domain)) {
        return { flagged: true, reason: `Image is from a known AI generation platform (${u.hostname}).` };
      }
    }
    const path = u.pathname + u.search;
    for (const pattern of HEURISTIC_AI_FILENAME_PATTERNS) {
      if (pattern.test(path)) {
        return { flagged: true, reason: 'Image filename pattern matches known AI-generator output.' };
      }
    }
  } catch {
    // invalid URL — let through to vision check
  }
  return { flagged: false, reason: null };
}

// ─── Claude vision prompt ────────────────────────────────────────────────────

const AI_DETECTION_PROMPT = `You are an expert visual analyst specializing in detecting AI-generated imagery. Examine this image carefully and determine whether it was produced by an AI image generator or is authentic human-created media.

STRONG SIGNALS OF AI GENERATION — look for any of these:
• Hands/fingers: wrong count, fused digits, elongated or anatomically impossible fingers
• Faces: hyper-symmetric, "too perfect", glassy eyes, uncanny valley effect, pupil irregularities
• Skin: unnaturally smooth, no real pore variation, airbrushed beyond human retouching
• Hair: painted-looking, unnaturally detailed or uniform strands, merges with background
• Text in the image: garbled, misspelled, morphed letters, nonsensical words, distorted logos
• Lighting: impossibly perfect rim lighting, multiple contradictory light sources, shadows that defy physics
• Background: dreamlike blur (bokeh that looks "painted"), elements that dissolve or warp, impossible architecture
• Textures: fabric/wood/metal that looks "rendered" rather than photographed — too uniform, too perfect
• Accessories & objects: jewelry with distorted engravings, glasses with no reflections, props that warp near edges
• Specific generator aesthetics:
  - Midjourney: cinematic drama, hyper-detailed fantasy realism, strong vignette, ultra-sharp subject + soft BG
  - DALL-E 3: clean conceptual illustrations, flat-ish lighting, editorial illustration style
  - Stable Diffusion: sometimes noisy or over-saturated, specific skin rendering artifacts
  - Adobe Firefly: clean commercial look, very smooth, stock-photo-like but subtly off
  - Flux/SDXL: photorealistic but with telltale smooth skin and slight uncanny faces
  - Midjourney v6+: almost photographic but backgrounds have a "diffused" painted quality

REAL / HUMAN-CREATED CONTENT — do NOT flag:
• Natural human imperfections in skin, hair, uneven lighting
• Real photographic noise, grain, lens distortion, chromatic aberration
• Genuine film or photography (even if heavily edited or color-graded)
• Hand-drawn or painted artwork by human artists (even if digitally painted)
• Stock photography that happens to look very polished
• Classical paintings, historical artwork, sculptures
• Graphic design, typography, logos made by humans

CALIBRATION:
• Only output high confidence (>0.80) if you see multiple strong AI indicators
• Medium confidence (0.45–0.79) if you see 1–2 ambiguous signals
• If it could plausibly be real photography or human art, lean toward NOT AI
• A heavily retouched real photo is NOT AI-generated

Also assess:
• Explicit content: nudity, graphic sexual acts, sexualized content. Do NOT flag: swimwear, lingerie shown non-sexually, artistic non-sexual nudity, athletic wear, classical art.
• Minor safety: any sexualization or exploitation of someone who appears under 18. Be extremely conservative — flag if any doubt.

Respond with ONLY this JSON object, nothing else:
{"isAI": true/false, "aiConfidence": 0.0-1.0, "aiReason": "specific visual evidence you observed", "isExplicit": true/false, "explicitConfidence": 0.0-1.0, "explicitReason": "brief reason or null", "involveMinors": true/false}`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Fast heuristic check first — no API cost
    const heuristic = heuristicCheck(imageUrl);
    if (heuristic.flagged) {
      return NextResponse.json({
        isLikelyAI: true,
        confidence: 0.97,
        blocked: true,
        softWarned: false,
        reason: heuristic.reason,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ isLikelyAI: false, confidence: 0, blocked: false, reason: null });
    }

    const client = new Anthropic({ apiKey });

    // Fetch the image as base64 so Claude always gets the actual pixels
    let imageSource: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string };
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(12000) });
      if (!imgRes.ok) throw new Error(`fetch ${imgRes.status}`);
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const mediaType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const)
        .find(t => contentType.startsWith(t)) ?? 'image/jpeg';
      imageSource = { type: 'base64', media_type: mediaType, data: Buffer.from(buffer).toString('base64') };
    } catch {
      imageSource = { type: 'url', url: imageUrl };
    }

    // Use Sonnet for substantially better visual reasoning than Haiku
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: imageSource as any },
            { type: 'text', text: AI_DETECTION_PROMPT },
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
      // parse failed — fail closed
    }

    if (!parsed) {
      return NextResponse.json({
        isLikelyAI: true,
        confidence: 0,
        blocked: true,
        softWarned: false,
        reason: 'Could not verify this image. Please try a different one.',
      });
    }

    // CSAM / minors — always hard block, log for review
    if (parsed.involveMinors || (parsed.isExplicit && parsed.explicitConfidence >= 0.65)) {
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

    // AI detection thresholds:
    //   ≥ 0.70 → hard block (no override)
    //   0.40–0.69 → soft warn (user can override)
    const hardBlocked = parsed.isAI && parsed.aiConfidence >= 0.70;
    const softWarned  = parsed.isAI && parsed.aiConfidence >= 0.40 && !hardBlocked;

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
    return NextResponse.json({
      isLikelyAI: true,
      confidence: 0,
      blocked: true,
      softWarned: false,
      reason: 'Image could not be verified. Please try a different image.',
    });
  }
}
