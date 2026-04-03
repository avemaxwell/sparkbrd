import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ tags: null });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
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
              text: 'Generate 12-15 descriptive search tags for this image. Focus on: objects, colors, mood, style, setting, materials, activities. Return only comma-separated lowercase keywords, nothing else.',
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const tags = text.trim().replace(/\.$/, '');

    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ tags: null });
  }
}
