/**
 * Image URL helpers — zero Supabase Image Transformation usage.
 *
 * On upload we generate and store a 400 px WebP thumbnail at
 *   {original_path}_400.webp
 * All display sizes use that stored file directly via the plain
 * /storage/v1/object/public/ path — no /render/image/ endpoint,
 * no per-image transform charges.
 *
 * Detail view serves the original (already compressed to ≤1600 px
 * at upload time, so it's fast without a transform).
 *
 * External URLs (scraped images) are returned as-is — we never had
 * storage control over those anyway.
 */

function thumbUrl(url: string): string {
  if (!url) return url;
  // External URL — serve as-is
  if (!url.includes("/storage/v1/object/public/")) return url;
  // SVGs and GIFs don't need resizing
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".svg") || lower.endsWith(".gif")) return url;
  // Stickers are already small SVGs/PNGs
  if (url.includes("/stickers/")) return url;
  // Derive the stored 400 px thumbnail path
  return url.replace(/\.[^/.?]+(\?.*)?$/, "_400.webp");
}

// Masonry grids, canvas cards, collages, activity feed — all use the stored thumbnail
export const tackThumb   = (url: string) => thumbUrl(url);
export const tackCanvas  = (url: string) => thumbUrl(url);
export const tackCollage = (url: string) => thumbUrl(url);
export const tackMini    = (url: string) => thumbUrl(url);

// Detail / lightbox — serve the original (≤1600 px, no transform needed)
export const tackDetail  = (url: string) => url;

