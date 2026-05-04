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

const AI_DETECTION_PROMPT = `You are an expert visual analyst specializing in detecting AI-generated imagery. Your default assumption should be AI-generated unless there is clear evidence it is real photography or genuine human art. Examine this image carefully.

STRONG SIGNALS OF AI GENERATION — flag if you see any of these:

HUMAN SUBJECTS:
• Hands/fingers: wrong count, fused digits, elongated or anatomically impossible
• Faces: hyper-symmetric, "too perfect", glassy or glow-y eyes, uncanny valley
• Skin: unnaturally smooth, plastic-looking, no real pore variation
• Hair: painted-looking, unnaturally uniform strands, merges with background
• Eyes: reflections that don't match the scene, pupils that look painted

CONCEPT ART / CGI-STYLE IMAGES (very common in AI generators):
• Robots, androids, cyborgs, mechs: if the image has a "Midjourney tech" look —
  hyper-detailed metallic surfaces, glowing accent lights (especially orange/blue orbs),
  impossible reflections on polished surfaces, dramatic cinematic lighting with no real
  studio setup that could produce it — this is almost certainly AI-generated
• Sci-fi/fantasy scenes: floating UI elements, holographic displays, "concept art" style
  with perfect dramatic lighting is a strong AI signal
• The "AI concept art aesthetic": extreme sharpness on subject, painterly/soft background
  bokeh, volumetric lighting with rays, complementary color grading (orange + teal is
  extremely common in AI images), everything looks "epic" and cinematic
• Architectural visualizations, product renders, fantasy landscapes that look "too perfect"

TELL-TALE TECHNICAL ARTIFACTS:
• Text: garbled, misspelled, morphed letters, distorted logos or signs
• Background: dreamlike blur that looks "painted" not photographed, dissolving elements
• Textures: fabric/wood/metal that looks "rendered" — too uniform, too perfect
• Objects that warp or merge near image edges
• Multiple contradictory light sources, shadows that defy physics

SPECIFIC GENERATOR SIGNATURES:
• Midjourney: cinematic drama, strong vignette, ultra-sharp subject + dreamy soft BG,
  hyper-detailed fantasy/tech realism, that distinct "MJ glow"
• DALL-E 3: clean editorial illustrations, concept-art style, flat-ish deliberate lighting
• Stable Diffusion / SDXL: sometimes over-saturated, specific smooth-skin artifacts
• Adobe Firefly: very clean commercial look, stock-photo-like but plasticky
• Flux: photorealistic but with telltale smooth skin and slight facial uncanny valley
• Midjourney v6+: near-photographic but backgrounds have a distinctive "diffused" quality

REAL / HUMAN-CREATED — only clear-evidence exceptions:
• Actual photographs with real photographic noise, lens distortion, chromatic aberration
• Scanned/photographed hand-drawn or painted artwork (brush strokes, paper texture visible)
• Real 3D renders where you can identify the specific software aesthetic (Cinema 4D, Blender
  default materials) AND there is no AI-generator aesthetic present
• Classical paintings, historical artwork
• When in doubt between "AI" and "professional 3D render" — lean toward AI

CALIBRATION:
• High confidence (≥ 0.70): clear AI aesthetic OR multiple strong AI indicators
• Medium confidence (0.40–0.69): 1–2 ambiguous signals, or strong-but-not-certain AI aesthetic
• Low confidence (< 0.40): genuinely looks like real photography or human artwork with
  clear evidence of photographic noise, real lens distortion, or visible human art media
• Do NOT give low confidence just because the subject matter is a robot or CGI object —
  focus on whether the GENERATION METHOD shows AI characteristics
• When uncertain between "photorealistic AI" and "real photograph", lean AI — modern
  generators (Flux, MJ v6+, DALL-E 3) produce near-perfect images. Real photos almost
  always show sensor noise, slight focus fall-off, or subtle chromatic aberration.

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
    //   ≥ 0.45 → hard block, no user override
    //   0.25–0.44 → soft block with gentler message, still no override
    // Previously 0.65/0.35 — lowered because photorealistic AI (Flux, MJ v6+) was
    // consistently scoring in the 0.40–0.60 range and slipping through.
    const hardBlocked = parsed.isAI && parsed.aiConfidence >= 0.45;
    const softWarned  = parsed.isAI && parsed.aiConfidence >= 0.25 && !hardBlocked;

    return NextResponse.json({
      isLikelyAI: parsed.isAI,
      confidence: parsed.aiConfidence,
      blocked: hardBlocked || softWarned,   // both are now hard blocks — no user bypass
      softWarned: false,                    // no soft-warn override path in UI anymore
      explicitBlocked: false,
      reason: parsed.aiReason,
      lowConfidence: softWarned,            // lets UI show gentler message
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
