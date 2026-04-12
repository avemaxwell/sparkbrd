const SUPABASE_STORAGE_PREFIX = 'https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/';
const SUPABASE_TRANSFORM_PREFIX = 'https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/render/image/public/';

/**
 * Returns an optimized image URL using Supabase Storage image transforms.
 * Only applies to images stored in our Supabase Storage — external URLs
 * (scraped, pasted image URLs) are returned unchanged.
 *
 * @param url      The original content_url stored in the database
 * @param width    Target display width in pixels
 * @param quality  JPEG quality 1–100 (default 80)
 */
export function tackImageUrl(url: string, width: number, quality = 80): string {
  if (!url) return url;
  if (!url.startsWith(SUPABASE_STORAGE_PREFIX)) return url; // external URL — pass through

  const path = url.slice(SUPABASE_STORAGE_PREFIX.length);
  return `${SUPABASE_TRANSFORM_PREFIX}${path}?width=${width}&quality=${quality}`;
}

// Preset sizes used across the app:

/** Canvas board view — tack thumbnail at its displayed width (max 400px) */
export const tackCanvas = (url: string) => tackImageUrl(url, 800, 80);

/** Detail/edit modal — full-quality view */
export const tackDetail = (url: string) => tackImageUrl(url, 1200, 90);

/** Board card collage — tiny stacked preview images */
export const tackCollage = (url: string) => tackImageUrl(url, 400, 70);

/** Discovery feed / notifications — small thumbnail */
export const tackThumb = (url: string) => tackImageUrl(url, 300, 70);

/** Activity feed thumbnail — very small */
export const tackMini = (url: string) => tackImageUrl(url, 120, 65);
