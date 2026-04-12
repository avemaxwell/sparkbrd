/**
 * Image optimization via Next.js built-in image optimizer (/_next/image).
 * Free on Vercel — resizes and serves WebP/AVIF automatically.
 *
 * Only applies to images from known/configured domains (see next.config.ts).
 * Unknown external origins are returned as-is; the browser handles them.
 *
 * Next.js width values must match the `imageSizes` or `deviceSizes` in config.
 * We use: 256, 384, 640, 750, 828, 1080, 1200
 */

function nextImageUrl(url: string, width: number, quality = 80): string {
  if (!url) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

/** Canvas board view — tack at displayed size (max ~800px wide on screen) */
export const tackCanvas = (url: string) => nextImageUrl(url, 828, 80);

/** Detail/edit modal — full-quality enlarged view */
export const tackDetail = (url: string) => nextImageUrl(url, 1200, 90);

/** Board card collage — stacked preview thumbnails */
export const tackCollage = (url: string) => nextImageUrl(url, 384, 75);

/** Discovery feed / comment drawer — medium thumbnail */
export const tackThumb = (url: string) => nextImageUrl(url, 256, 75);

/** Activity feed — tiny inline thumbnail */
export const tackMini = (url: string) => nextImageUrl(url, 128, 70);
