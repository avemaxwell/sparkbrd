function transform(url: string, width: number, quality: number): string {
  if (!url) return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  // Skip SVGs (stickers) and GIFs (would lose animation)
  const path = url.toLowerCase().split("?")[0];
  if (path.endsWith(".svg") || path.endsWith(".gif")) return url;

  const renderUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const sep = renderUrl.includes("?") ? "&" : "?";
  return `${renderUrl}${sep}width=${width}&quality=${quality}&resize=contain`;
}

// Board canvas — full-width card, max 400 px tall
export const tackCanvas = (url: string) => transform(url, 800, 80);

// Detail modal — up to full viewport width
export const tackDetail = (url: string) => transform(url, 1200, 90);

// Board collage previews (BoardsSection, team page)
export const tackCollage = (url: string) => transform(url, 400, 75);

// Discovery & comment drawer thumbnails
export const tackThumb = (url: string) => transform(url, 400, 75);

// Activity feed micro-thumbnails
export const tackMini = (url: string) => transform(url, 128, 70);
