import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sparkbrd/1.0; +https://sparkbrd.com)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await response.text();

    // Extract image URLs using regex patterns
    const images: string[] = [];
    
    // Match <img src="...">
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgSrcRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    // Match <img srcset="...">
    const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      // srcset contains multiple URLs, grab the largest one
      const srcset = match[1];
      const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
      images.push(...urls);
    }

    // Match og:image meta tags
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = ogImageRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    // Match twitter:image meta tags
    const twitterImageRegex = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = twitterImageRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    // Match background-image in style attributes
    const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgImageRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    // Clean up and dedupe URLs
    const baseUrl = new URL(url);
    const cleanedImages = [...new Set(images)]
      .map(imgUrl => {
        // Handle relative URLs
        if (imgUrl.startsWith('//')) {
          return `https:${imgUrl}`;
        }
        if (imgUrl.startsWith('/')) {
          return `${baseUrl.origin}${imgUrl}`;
        }
        if (!imgUrl.startsWith('http')) {
          return `${baseUrl.origin}/${imgUrl}`;
        }
        return imgUrl;
      })
      .filter(imgUrl => {
        // Filter out tiny images, icons, tracking pixels
        const lower = imgUrl.toLowerCase();
        if (lower.includes('pixel') || lower.includes('tracking')) return false;
        if (lower.includes('icon') && !lower.includes('favicon')) return false;
        if (lower.includes('.svg') && lower.includes('logo')) return false;
        if (lower.includes('1x1') || lower.includes('spacer')) return false;
        // Filter out data URIs that are too small
        if (lower.startsWith('data:') && lower.length < 1000) return false;
        return true;
      })
      .slice(0, 20); // Limit to 20 images

    // Get page title for source attribution
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : baseUrl.hostname;

    return NextResponse.json({
      images: cleanedImages,
      source: pageTitle,
      sourceUrl: url,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  }
}