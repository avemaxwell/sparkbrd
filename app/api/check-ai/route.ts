import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Placeholder AI detection - currently allows all images
    // You can integrate with AI detection services later:
    // - Hive AI Detection API
    // - Optic AI Detection
    // - Custom ML model
    
    // For now, return false for all checks (allow all images)
    return NextResponse.json({
      isLikelyAI: false,
      confidence: 0,
      blocked: false,
      reason: null,
    });

  } catch (error) {
    console.error('AI check error:', error);
    // On error, allow the upload (fail open)
    return NextResponse.json({
      isLikelyAI: false,
      blocked: false,
    });
  }
}