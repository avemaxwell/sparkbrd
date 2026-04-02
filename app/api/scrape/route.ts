import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)(\?.*)?$/i;

// Patterns that indicate non-content images to skip
const SKIP_PATTERNS = [
  /\d+x\d+/,           // dimension strings like 1x1, 2x2 (tracking pixels)
  /pixel/i,
  /tracker/i,
  /analytics/i,
  /beacon/i,
  /\.gif(\?.*)?$/i,    // skip GIFs (usually animations or trackers)
  /^data:/,            // skip inline base64
  /spacer/i,
  /placeholder/i,
  /blank/i,
  /loading/i,
  /spinner/i,
];

// Known image CDN / hosting hostnames — accept even without extension
const IMAGE_CDN_HOSTS = [
  'images.unsplash.com',
  'cdn.shopify.com',
  'images.squarespace-cdn.com',
  'static.wixstatic.com',
  'i.imgur.com',
  'pbs.twimg.com',
  'media.licdn.com',
  'scontent',
  'fbcdn.net',
  'pinimg.com',
  'googleusercontent.com',
  'cloudfront.net',
  'supabase.co/storage',
  'supabase.in/storage',
  'imagekit.io',
  'res.cloudinary.com',
];

function isLikelyImage(imageUrl: string): boolean {
  try {
    const u = new URL(imageUrl);

    // Skip data URIs
    if (u.protocol === 'data:') return false;

    // Skip obvious non-images
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(imageUrl)) return false;
    }

    // Accept known CDN hosts
    for (const cdn of IMAGE_CDN_HOSTS) {
      if (u.hostname.includes(cdn) || u.pathname.includes(cdn)) return true;
    }

    // Accept URLs with image extensions
    if (IMAGE_EXTENSIONS.test(u.pathname)) return true;

    // Accept URLs where query params contain image extension hints (e.g. ?format=jpg)
    if (/format=(jpe?g|png|webp|avif)/i.test(u.search)) return true;

    return false;
  } catch {
    return false;
  }
}

function resolveUrl(src: string, pageUrl: string): string | null {
  try {
    if (src.startsWith('data:')) return null;
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('http')) return src;
    const base = new URL(pageUrl);
    if (src.startsWith('/')) return base.origin + src;
    return base.origin + '/' + src;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate the input URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // The URL itself is an image — return it directly
      if (contentType.startsWith('image/')) {
        return NextResponse.json({ images: [url], source: parsedUrl.hostname.replace('www.', '') });
      }
      return NextResponse.json({ error: 'URL did not return an HTML page' }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seenUrls = new Set<string>();
    const images: string[] = [];

    const addImage = (src: string | undefined) => {
      if (!src) return;
      const resolved = resolveUrl(src.trim(), url);
      if (!resolved) return;
      if (seenUrls.has(resolved)) return;
      if (!isLikelyImage(resolved)) return;
      seenUrls.add(resolved);
      images.push(resolved);
    };

    // og:image first — highest quality, intentional
    $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => {
      addImage($(el).attr('content'));
    });

    // srcset — extract all URLs
    $('img[srcset], source[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset') || '';
      for (const part of srcset.split(',')) {
        const trimmed = part.trim().split(/\s+/)[0];
        addImage(trimmed);
      }
    });

    // Standard img src + data-src (lazy loading)
    $('img').each((_, el) => {
      addImage($(el).attr('src'));
      addImage($(el).attr('data-src'));
      addImage($(el).attr('data-lazy-src'));
      addImage($(el).attr('data-original'));
    });

    // CSS background images in style attributes
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
      if (match) addImage(match[1]);
    });

    const source = parsedUrl.hostname.replace('www.', '');

    return NextResponse.json({
      images: images.slice(0, 40),
      source,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Failed to scrape images' }, { status: 500 });
  }
}
