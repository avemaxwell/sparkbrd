// Small reusable decorative shapes — organic blobs, dot grids, sparkles, wave
// dividers — used to give sections the "paper-inspired / playful geometry"
// texture from the brand guidelines without pulling in external image assets.

export function CheckerDots({
  className = "",
  color = "#4C4DFF",
  cols = 6,
  rows = 4,
  dotSize = 10,
  gap = 8,
}: {
  className?: string;
  color?: string;
  cols?: number;
  rows?: number;
  dotSize?: number;
  gap?: number;
}) {
  return (
    <div className={`grid ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const on = (row + col) % 2 === 0;
        return (
          <span
            key={i}
            className="block rounded-[3px]"
            style={{ width: dotSize, height: dotSize, backgroundColor: on ? color : "transparent" }}
          />
        );
      })}
    </div>
  );
}

// Organic blob — the same silhouette style as the logo's background shape.
// Pass color via className (e.g. "bg-blush").
export function Blob({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{ borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%", ...style }}
    />
  );
}

// An icon "popped" on top of a logo-style blob — the shared visual unit for
// subjects/resources so the icon system reads as one consistent language.
export function IconBlob({
  icon,
  blobClassName = "bg-white",
  blobStyle,
  size = 64,
  iconClassName = "text-ink",
  iconStyle,
}: {
  icon: React.ReactNode;
  blobClassName?: string;
  blobStyle?: React.CSSProperties;
  size?: number;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
}) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <Blob className={`absolute inset-0 ${blobClassName}`} style={blobStyle} />
      <div className={`relative ${iconClassName}`} style={{ width: size * 0.5, height: size * 0.5, ...iconStyle }}>
        {icon}
      </div>
    </div>
  );
}

// The brand spark mark (the same burst used in the logo) — use in place of the
// old generic sparkle icon so every accent ties back to the actual mark.
export function SparkBurst({ className = "", rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <img
      src="/spark-burst.png"
      alt=""
      className={className}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    />
  );
}

// Four-lobed clover/quatrefoil built from overlapping circles — one of the
// pattern motifs from the brand moodboard. Pass color via className.
export function Clover({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="28" r="26" className="fill-current" />
      <circle cx="72" cy="50" r="26" className="fill-current" />
      <circle cx="50" cy="72" r="26" className="fill-current" />
      <circle cx="28" cy="50" r="26" className="fill-current" />
    </svg>
  );
}

// A rounded pill with a bar centered inside — another moodboard motif.
export function Capsule({ className = "", barClassName = "bg-papaya" }: { className?: string; barClassName?: string }) {
  return (
    <div className={`relative rounded-full flex items-center justify-center ${className}`}>
      <div className={`w-1/2 h-1/3 rounded-md ${barClassName}`} />
    </div>
  );
}

// A small cluster of pattern-swatch tiles, like stickers — the "moodboard in
// a corner" treatment. Sized to sit in a page corner without crowding content.
export function PatternCorner({ className = "" }: { className?: string }) {
  // Outer element carries the caller's positioning classes (e.g. "absolute
  // top-4 right-2"); the inner element owns "relative" for its own children
  // so the two position utilities never collide in the same class list.
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 220, height: 200 }}>
      <div className="relative w-full h-full">
        <div className="absolute top-0 right-0 w-28 h-28 bg-lime rounded-3xl rotate-6 shadow-sm flex items-center justify-center overflow-hidden">
          <Clover className="w-16 h-16 text-mustard" />
        </div>
        <div className="absolute bottom-2 right-16 w-20 h-20 bg-lavender rounded-2xl -rotate-6 shadow-sm flex items-center justify-center">
          <CheckerDots color="#4C4DFF" cols={4} rows={4} dotSize={8} gap={4} />
        </div>
        <Capsule className="absolute top-20 left-0 w-16 h-9 bg-blush rotate-12 shadow-sm" barClassName="bg-papaya" />
      </div>
    </div>
  );
}

// A second sticker cluster with the same motifs as PatternCorner but a
// different arrangement, color pairing, and rotation — for use alongside it
// on the same page so the two don't read as literal copies of each other.
export function PatternCornerAlt({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 200, height: 190 }}>
      <div className="relative w-full h-full">
        <div className="absolute bottom-0 left-2 w-24 h-24 bg-blush rounded-3xl -rotate-8 shadow-sm flex items-center justify-center overflow-hidden">
          <Clover className="w-14 h-14 text-lime" />
        </div>
        <div className="absolute top-2 left-12 w-16 h-16 bg-white/95 rounded-2xl rotate-8 shadow-sm flex items-center justify-center">
          <CheckerDots color="#FF7A32" cols={3} rows={3} dotSize={7} gap={4} />
        </div>
        <Capsule className="absolute top-16 right-0 w-20 h-11 bg-lime -rotate-6 shadow-sm" barClassName="bg-blush" />
      </div>
    </div>
  );
}

// ── Extended shape vocabulary — for the sitewide corner-collage system below ──
// The asterisk, flower, and quatrefoil motifs are real cropped/recolored
// assets extracted from the brand moodboard PNGs (see public/shapes/) rather
// than hand-coded approximations — those organic silhouettes don't reproduce
// faithfully as CSS/SVG primitives. CircleGrid, Scallop, and Ring below are
// exact geometric shapes (circles, half-circles), so they stay code-drawn.

// A grid of solid filled circles (as opposed to CheckerDots' alternating
// squares) — the "polka dot square" motif.
export function CircleGrid({
  className = "",
  dotClassName = "bg-current",
  cols = 2,
  rows = 2,
  gap = 6,
}: {
  className?: string;
  dotClassName?: string;
  cols?: number;
  rows?: number;
  gap?: number;
}) {
  return (
    <div className={`grid ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className={`rounded-full ${dotClassName}`} style={{ aspectRatio: "1 / 1" }} />
      ))}
    </div>
  );
}

// A tiled row of dome/half-circle shapes — the scalloped-border motif.
export function Scallop({
  className = "",
  domeClassName = "bg-current",
  count = 4,
}: {
  className?: string;
  domeClassName?: string;
  count?: number;
}) {
  return (
    <div className={`flex ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex-1 ${domeClassName}`} style={{ aspectRatio: "1 / 0.6", borderRadius: "999px 999px 0 0" }} />
      ))}
    </div>
  );
}

// A thick circular outline — the "donut ring" motif.
export function Ring({ className = "border-ink", size = 64, thickness = 16 }: { className?: string; size?: number; thickness?: number }) {
  return (
    <div className={`rounded-full flex-shrink-0 ${className}`} style={{ width: size, height: size, borderWidth: thickness, borderStyle: "solid" }} />
  );
}

export function WaveDivider({ fill = "#F6F6F6", className = "" }: { fill?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={`w-full h-16 md:h-20 block ${className}`}
    >
      <path
        d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,32 L1440,80 L0,80 Z"
        fill={fill}
      />
    </svg>
  );
}
