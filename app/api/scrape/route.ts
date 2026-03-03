import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract images
    const images: string[] = [];
    const seenUrls = new Set<string>();

    // Find all img tags
    $('img').each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src');
      if (src) {
        let imageUrl = src;
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = urlObj.origin + imageUrl;
        } else if (!imageUrl.startsWith('http')) {
          const urlObj = new URL(url);
          imageUrl = urlObj.origin + '/' + imageUrl;
        }

        // Filter out small images, icons, and duplicates
        if (
          !seenUrls.has(imageUrl) &&
          !imageUrl.includes('icon') &&
          !imageUrl.includes('logo') &&
          !imageUrl.includes('avatar') &&
          !imageUrl.includes('pixel') &&
          !imageUrl.endsWith('.svg')
        ) {
          seenUrls.add(imageUrl);
          images.push(imageUrl);
        }
      }
    });

    // Also check for og:image meta tags
    $('meta[property="og:image"]').each((_, element) => {
      const content = $(element).attr('content');
      if (content && !seenUrls.has(content)) {
        seenUrls.add(content);
        images.push(content);
      }
    });

    // Get source domain for attribution
    const urlObj = new URL(url);
    const source = urlObj.hostname.replace('www.', '');

    return NextResponse.json({
      images: images.slice(0, 30), // Limit to 30 images
      source: source,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Failed to scrape images' }, { status: 500 });
  }
}