import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)(\?.*)?$/i;

// Patterns that indicate non-content images to skip
const SKIP_PATTERNS = [
  /\b1x1\b|\b2x2\b|\b0x0\b/,   // tracking pixel dimensions
  /pixel/i,
  /tracker/i,
  /analytics/i,
  /beacon/i,
  /\.gif(\?.*)?$/i,
  /^data:/,
  /spacer/i,
  /placeholder/i,
  /blank\.(?:png|jpg|gif)/i,
  /loading\.(?:png|jpg|gif|svg)/i,
  /spinner/i,
  /logo\.(?:png|jpg|svg)/i,      // skip logos
  /favicon/i,
  /icon\.(?:png|jpg|svg)/i,
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
  // Dotdash Meredith (Martha Stewart, AllRecipes, Real Simple, etc.)
  'meredithcorp.io',
  'dotdash-meredith',
  'dotdashmeredith',
  // Hearst (House Beautiful, Elle Decor, etc.)
  'hearstapps.com',
  'hips.hearstapps.com',
  // Condé Nast
  'condenastdigital.com',
  'assets.vogue.com',
  'media.gq.com',
  // News / media CDNs
  's-nbcnews.com',
  'media.cnn.com',
  'static01.nyt.com',
  'images.wsj.net',
  'wp.com',
  // General purpose CDNs
  'akamaized.net',
  'fastly.net',
  'imgix.net',
  'media.istockphoto.com',
  'images.getty',
  'gettyimages.com',
  'shutterstatic.com',
  'assets.epicurious.com',
  'cdn.britannica.com',
];

function isLikelyImage(imageUrl: string): boolean {
  try {
    const u = new URL(imageUrl);
    if (u.protocol === 'data:') return false;

    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(imageUrl)) return false;
    }

    // Accept known CDN hosts
    for (const cdn of IMAGE_CDN_HOSTS) {
      if (u.hostname.includes(cdn) || u.pathname.includes(cdn)) return true;
    }

    // Accept URLs with image extensions
    if (IMAGE_EXTENSIONS.test(u.pathname)) return true;

    // Accept URLs where query params contain image extension hints
    if (/format=(jpe?g|png|webp|avif)/i.test(u.search)) return true;

    // Accept URLs that look like image resizers (w=, h=, width=, quality=)
    if (/[?&](w|h|width|height|quality|q)=\d/.test(u.search) && /image/i.test(u.pathname)) return true;

    return false;
  } catch {
    return false;
  }
}

function resolveUrl(src: string, pageUrl: string): string | null {
  try {
    if (!src || src.startsWith('data:')) return null;
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('http')) return src;
    const base = new URL(pageUrl);
    if (src.startsWith('/')) return base.origin + src;
    return base.origin + '/' + src;
  } catch {
    return null;
  }
}

/**
 * Returns a canonical key used for deduplication: uses origin + pathname so
 * that /img.jpg?w=300&q=80 and /img.jpg?w=900&q=60 collapse to the same key.
 */
function canonicalKey(imageUrl: string): string {
  try {
    const u = new URL(imageUrl);
    // For CDN URLs where the path itself encodes dimensions (e.g. /300x200/photo.jpg),
    // just use origin+pathname as the key — good enough for dedup.
    return u.origin + u.pathname.toLowerCase();
  } catch {
    return imageUrl;
  }
}

/**
 * Given a srcset string, return the URL with the largest width descriptor,
 * falling back to the last entry or the first if no descriptors are present.
 */
function bestSrcsetUrl(srcset: string): string | null {
  const parts = srcset
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(part => {
      const [url, descriptor = ''] = part.split(/\s+/);
      const w = descriptor.match(/^(\d+)w$/i);
      return { url, w: w ? parseInt(w[1]) : 0 };
    });
  if (!parts.length) return null;
  // Pick the largest width, or last if no descriptors
  parts.sort((a, b) => b.w - a.w);
  return parts[0].url || null;
}

// Recursively walk any JSON value and collect image-looking strings
function extractImagesFromJson(obj: unknown, addImage: (src: string) => void): void {
  if (typeof obj === 'string') {
    if (obj.startsWith('http') && obj.length < 2000 && isLikelyImage(obj)) addImage(obj);
    return;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) extractImagesFromJson(v, addImage);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      extractImagesFromJson(v, addImage);
    }
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const hint =
        response.status === 402 || response.status === 403
          ? 'This site blocks automated access. Try copying the image URL directly instead.'
          : response.status === 429
          ? 'This site is rate-limiting requests. Try again in a moment.'
          : response.status >= 500
          ? 'The site is having issues right now. Try again later.'
          : `This page couldn't be reached (${response.status}).`;
      return NextResponse.json({ error: hint }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      return NextResponse.json({ images: [url], source: parsedUrl.hostname.replace('www.', '') });
    }
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'URL did not return an HTML page' }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seenKeys = new Set<string>();
    const images: string[] = [];

    const addImage = (src: string | undefined) => {
      if (!src) return;
      const resolved = resolveUrl(src.trim(), url);
      if (!resolved) return;
      if (!isLikelyImage(resolved)) return;
      const key = canonicalKey(resolved);
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      images.push(resolved);
    };

    // ── 1. Meta tags (og:image, twitter:image) ─────────────────────────────
    $('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:image:secure_url"]').each((_, el) => {
      addImage($(el).attr('content'));
    });

    // ── 2. JSON-LD structured data ─────────────────────────────────────────
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        extractImagesFromJson(data, addImage);
      } catch { /* malformed JSON, skip */ }
    });

    // ── 3. __NEXT_DATA__ (Next.js SSR pages) ──────────────────────────────
    const nextDataEl = $('#__NEXT_DATA__');
    if (nextDataEl.length) {
      try {
        const nextData = JSON.parse(nextDataEl.html() || '');
        extractImagesFromJson(nextData, addImage);
      } catch { /* malformed, skip */ }
    }

    // ── 4. Other inline JSON in script tags (Nuxt, SvelteKit, etc.) ───────
    $('script[type="application/json"], script#__NUXT_DATA__, script#__SVELTE__').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        extractImagesFromJson(data, addImage);
      } catch { /* skip */ }
    });

    // ── 5. srcset attributes — pick largest variant only ──────────────────
    $('img[srcset], source[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset') || '';
      addImage(bestSrcsetUrl(srcset) ?? undefined);
    });

    // ── 6. Standard img src + common lazy-load attributes ─────────────────
    $('img').each((_, el) => {
      const $el = $(el);
      for (const attr of ['src', 'data-src', 'data-lazy-src', 'data-original',
                          'data-img-src', 'data-lazy', 'data-delayed-url',
                          'data-srcset', 'data-hi-res-src']) {
        addImage($el.attr(attr));
      }
    });

    // ── 7. picture source tags ─────────────────────────────────────────────
    $('source[src]').each((_, el) => addImage($(el).attr('src')));

    // ── 8. CSS background images in style attributes ───────────────────────
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      for (const m of style.matchAll(/url\(['"]?([^'")\s]+)['"]?\)/gi)) {
        addImage(m[1]);
      }
    });

    // ── 9. Scan all script content for image URLs via regex ────────────────
    //      Catches client-side rendered pages that embed image URLs in JS bundles.
    if (images.length < 5) {
      $('script:not([src])').each((_, el) => {
        const scriptContent = $(el).html() || '';
        // Only scan reasonably-sized inline scripts
        if (scriptContent.length > 500000) return;
        const matches = scriptContent.matchAll(/https?:\/\/[^\s"'`\\,\]>]{10,500}/g);
        for (const m of matches) {
          addImage(m[0].replace(/[);,\]}>'"\\]+$/, ''));
        }
      });
    }

    const source = parsedUrl.hostname.replace('www.', '');

    return NextResponse.json({
      images: images.slice(0, 60),
      source,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Failed to fetch images from that page' }, { status: 500 });
  }
}
