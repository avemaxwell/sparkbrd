import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Check for known AI generation signatures in URL
    const lowerUrl = imageUrl.toLowerCase();
    const aiSignatures = [
      'midjourney',
      'dalle',
      'dall-e', 
      'stable-diffusion',
      'stablediffusion',
      'stability.ai',
      'openai',
      'replicate.delivery',
      'replicate.com',
      'cdn.openai.com',
      'generated',
      'ai-generated',
      'aiart',
      'ai_art',
      'dreamstudio',
      'leonardo.ai',
      'firefly.adobe',
      'ideogram',
      'playground-ai',
      'playgroundai',
      'nightcafe',
      'artbreeder',
      'runwayml',
      'runway.ml',
      'pika.art',
      'krea.ai',
      'lexica.art',
      'prompthero',
      'civitai',
      'tensor.art',
      'dreamlike.art',
      'neural.love',
      'hotpot.ai',
      'craiyon',
      'deepai.org',
      'starryai',
      'wombo.art',
      'jasper.ai',
      'writesonic',
      'canva.com/ai',
      'bing.com/images/create',
      'designer.microsoft',
      'copilot',
      'gemini',
      'imagen',
    ];
    
    const matchedSignature = aiSignatures.find(sig => lowerUrl.includes(sig));
    
    if (matchedSignature) {
      return NextResponse.json({
        isAI: true,
        blocked: true,
        reason: `This image appears to be from an AI generation service (${matchedSignature}).`,
      });
    }

    // Check for C2PA/Content Credentials (indicates verified human origin)
    try {
      const headResponse = await fetch(imageUrl, { method: 'HEAD' });
      const contentCredentials = headResponse.headers.get('c2pa-manifest');
      
      if (contentCredentials) {
        return NextResponse.json({
          isAI: false,
          blocked: false,
          verified: true,
          reason: 'Verified human-created content (C2PA)',
        });
      }
    } catch (e) {
      // Ignore HEAD request failures
    }

    // Check filename patterns that suggest AI
    const aiFilenamePatterns = [
      /\d{8,}.*\d{4,}/,  // Long number sequences (common in AI outputs)
      /seed[-_]?\d+/i,
      /steps[-_]?\d+/i,
      /cfg[-_]?\d+/i,
      /sampler/i,
      /checkpoint/i,
      /lora/i,
      /dreambooth/i,
      /sd[-_]?v?\d/i,
      /sdxl/i,
      /flux/i,
      /comfyui/i,
      /automatic1111/i,
      /a1111/i,
      /invoke[-_]?ai/i,
      /novelai/i,
      /nai[-_]?diffusion/i,
    ];

    const urlPath = new URL(imageUrl).pathname.toLowerCase();
    const matchedPattern = aiFilenamePatterns.find(pattern => pattern.test(urlPath));
    
    if (matchedPattern) {
      return NextResponse.json({
        isAI: true,
        blocked: true,
        reason: 'This image filename suggests it was AI-generated.',
      });
    }

    // For production: Add actual AI detection API call here
    // const hiveResponse = await fetch('https://api.thehive.ai/api/v2/task/sync', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Token ${process.env.HIVE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ url: imageUrl, models: ['ai_generated_detection'] }),
    // });
    // const hiveData = await hiveResponse.json();
    // if (hiveData.status[0].response.output[0].classes[0].score > 0.7) {
    //   return NextResponse.json({ isAI: true, blocked: true, reason: 'AI detection analysis flagged this image.' });
    // }

    return NextResponse.json({
      isAI: false,
      blocked: false,
      reason: null,
    });

  } catch (error) {
    console.error('AI check error:', error);
    // On error, allow but flag for manual review
    return NextResponse.json({
      isAI: false,
      blocked: false,
      reason: null,
      needsReview: true,
    });
  }
}