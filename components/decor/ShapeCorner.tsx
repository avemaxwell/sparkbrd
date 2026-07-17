// Sitewide corner-collage system — a "sticker sheet" of brand shapes for the
// bottom-left/top-right corner treatment. The asterisk, flower, and
// quatrefoil are real assets cropped and recolored from the brand moodboard
// PNGs (public/shapes/) — not hand-coded approximations, since those organic
// silhouettes don't reproduce faithfully as CSS/SVG. CircleGrid and Ring are
// exact geometric shapes, so they stay code-drawn. Four hand-composed
// presets, chosen deterministically per page via `getShapeCorner(seed)`, so
// every page reads as part of the same family without being a literal copy.

import { hashStr } from "@/lib/subjects";
import { CircleGrid, Ring } from "@/components/home/decor";

type ShapeColor = "lime" | "papaya" | "blush" | "mustard" | "lavender" | "ink" | "white";

function Shape({ name, color, className = "" }: { name: "asterisk" | "flower" | "quatrefoil"; color: ShapeColor; className?: string }) {
  return <img src={`/shapes/${name}-${color}.png`} alt="" className={className} draggable={false} />;
}

function ShapeCornerA({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 230, height: 210 }}>
      <div className="relative w-full h-full">
        <div className="absolute top-0 right-2 w-28 h-28 bg-lime rounded-3xl rotate-[-4deg] shadow-sm flex items-center justify-center p-6">
          <Shape name="asterisk" color="mustard" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-4 right-24 w-20 h-20 bg-papaya rounded-2xl rotate-6 shadow-sm p-3.5">
          <CircleGrid className="w-full h-full" dotClassName="bg-lime" cols={2} rows={2} gap={6} />
        </div>
        <Shape name="flower" color="blush" className="absolute bottom-0 left-0 w-16 h-16" />
      </div>
    </div>
  );
}

function ShapeCornerB({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 220, height: 200 }}>
      <div className="relative w-full h-full">
        <div className="absolute top-0 left-4 w-24 h-24 bg-white rounded-3xl -rotate-6 shadow-sm flex items-center justify-center p-5 border border-black/5">
          <Shape name="quatrefoil" color="ink" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-2 left-20 w-20 h-20 bg-mustard rounded-2xl rotate-6 shadow-sm p-3.5">
          <CircleGrid className="w-full h-full" dotClassName="bg-papaya" cols={3} rows={3} gap={3} />
        </div>
        <Shape name="flower" color="blush" className="absolute top-24 right-0 w-14 h-14" />
      </div>
    </div>
  );
}

function ShapeCornerC({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 230, height: 210 }}>
      <div className="relative w-full h-full">
        <div className="absolute top-0 right-0 w-24 h-24 bg-mustard rounded-3xl rotate-6 shadow-sm flex items-center justify-center p-5 overflow-hidden">
          <Shape name="quatrefoil" color="lime" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-6 right-20 w-20 h-20 bg-lavender rounded-2xl -rotate-6 shadow-sm p-3.5">
          <CircleGrid className="w-full h-full" dotClassName="bg-papaya" cols={2} rows={2} gap={5} />
        </div>
        <Shape name="flower" color="papaya" className="absolute bottom-0 left-0 w-16 h-16" />
      </div>
    </div>
  );
}

function ShapeCornerD({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: 220, height: 200 }}>
      <div className="relative w-full h-full">
        <div className="absolute top-2 right-4">
          <Ring className="border-ink" size={72} thickness={14} />
        </div>
        <div className="absolute bottom-0 right-16 w-16 h-16 bg-lavender rounded-2xl rotate-6 shadow-sm flex items-center justify-center p-4">
          <Shape name="asterisk" color="white" className="w-full h-full object-contain" />
        </div>
        <Shape name="flower" color="mustard" className="absolute bottom-4 left-0 w-14 h-14" />
      </div>
    </div>
  );
}

const PRESETS = [ShapeCornerA, ShapeCornerB, ShapeCornerC, ShapeCornerD];

// Deterministic pick — same seed always returns the same preset, different
// seeds spread across the set so sibling pages don't visually collide.
export function getShapeCorner(seed: string) {
  return PRESETS[hashStr(seed) % PRESETS.length];
}

export { ShapeCornerA, ShapeCornerB, ShapeCornerC, ShapeCornerD };
