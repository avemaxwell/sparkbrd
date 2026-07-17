"use client";

import { useEffect, useRef } from "react";

// Standalone teaser — intentionally has zero dependency on the rest of the
// app's data/auth so it can never break or leak old-Sparkurio content while
// site-wide gating (see proxy.ts) is on. Motion is ambient-first (every tile
// drifts/breathes on its own, visible the instant the page loads, works with
// no mouse at all) with a very subtle cursor parallax layered on top as a
// bonus for desktop — not the other way around.

// Full brand palette in rotation (see app/globals.css @theme) so the collage
// reads as more than two repeated colors.
const PALETTE = {
  papaya: "#4C4DFF",
  lime: "#E7FF72",
  blush: "#FF00C8",
  mustard: "#FF7A32",
  lavender: "#B9AEFF",
};

const TILES: {
  className: string;
  bg: string;
  content: React.ReactNode;
  depth: number; // parallax strength
  float: number; // animation variant 1-4
}[] = [
  {
    className: "hidden sm:block top-[2%] right-[30%] w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36",
    bg: PALETTE.papaya,
    depth: 18,
    float: 1,
    content: (
      <svg viewBox="0 0 100 100" className="w-full h-full p-4" fill="none" stroke={PALETTE.blush} strokeWidth="9" strokeLinecap="round">
        <path d="M10 20 Q 25 5, 40 20 T 70 20 T 100 20" />
        <path d="M10 50 Q 25 35, 40 50 T 70 50 T 100 50" />
        <path d="M10 80 Q 25 65, 40 80 T 70 80 T 100 80" />
      </svg>
    ),
  },
  {
    className: "hidden sm:block top-[2%] right-[13%] w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36",
    bg: PALETTE.blush,
    depth: 12,
    float: 2,
    content: (
      <div className="w-full h-full grid grid-cols-3 gap-2 p-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="rounded-full bg-white" />
        ))}
      </div>
    ),
  },
  {
    className: "top-[2%] right-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40",
    bg: PALETTE.mustard,
    depth: 22,
    float: 3,
    content: <img src="/shapes/asterisk-white.png" alt="" className="w-full h-full object-contain p-3" draggable={false} />,
  },
  {
    className: "hidden sm:block top-[24%] right-[13%] w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36",
    bg: PALETTE.lavender,
    depth: 16,
    float: 4,
    content: <img src="/shapes/flower-blush.png" alt="" className="w-full h-full object-contain p-3" draggable={false} />,
  },
  {
    className: "top-[26%] right-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40",
    bg: PALETTE.lime,
    depth: 20,
    float: 1,
    content: <img src="/shapes/quatrefoil-papaya.png" alt="" className="w-full h-full object-contain p-3" draggable={false} />,
  },
  {
    className: "hidden sm:block bottom-[18%] right-[28%] w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36",
    bg: PALETTE.lime,
    depth: 14,
    float: 2,
    content: (
      <svg viewBox="0 0 100 100" className="w-full h-full p-5" fill="#217A46">
        <path d="M50 5 C55 35 65 45 95 50 C65 55 55 65 50 95 C45 65 35 55 5 50 C35 45 45 35 50 5 Z" />
      </svg>
    ),
  },
  {
    className: "bottom-[18%] right-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40",
    bg: PALETTE.lavender,
    depth: 24,
    float: 3,
    content: <img src="/shapes/quatrefoil-ink.png" alt="" className="w-full h-full object-contain p-3" draggable={false} />,
  },
  {
    className: "hidden sm:block bottom-0 right-[14%] w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36",
    bg: PALETTE.mustard,
    depth: 10,
    float: 4,
    content: (
      <svg viewBox="0 0 100 100" className="w-full h-full p-4" fill="#FFD6C2">
        <path d="M50 50 C50 20 30 10 10 10 C10 30 20 50 50 50 Z" />
        <path d="M50 50 C50 20 70 10 90 10 C90 30 80 50 50 50 Z" />
        <path d="M50 50 C50 80 30 90 10 90 C10 70 20 50 50 50 Z" />
        <path d="M50 50 C50 80 70 90 90 90 C90 70 80 50 50 50 Z" />
      </svg>
    ),
  },
  {
    className: "bottom-0 right-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40",
    bg: PALETTE.blush,
    depth: 18,
    float: 1,
    content: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M0 100 A 100 100 0 0 1 100 0 L 100 40 A 60 60 0 0 0 40 100 Z" fill={PALETTE.papaya} />
      </svg>
    ),
  },
  {
    className: "hidden md:block bottom-[3%] left-[4%] w-20 h-20 lg:w-24 lg:h-24",
    bg: "transparent",
    depth: 8,
    float: 2,
    content: <img src="/shapes/flower-papaya.png" alt="" className="w-full h-full object-contain" draggable={false} />,
  },
];

export default function ComingSoonPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        tileRefs.current.forEach((el, i) => {
          if (!el) return;
          const depth = TILES[i]?.depth ?? 12;
          el.style.setProperty("--parallax-x", `${-nx * depth}px`);
          el.style.setProperty("--parallax-y", `${-ny * depth}px`);
        });
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => { window.removeEventListener("mousemove", handleMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen w-full overflow-hidden relative bg-[#FBF6EE] flex flex-col">
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(0) rotate(0deg); } 50% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(-12px) rotate(-3deg); } }
        @keyframes float2 { 0%, 100% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(0) rotate(0deg); } 50% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(10px) rotate(2deg); } }
        @keyframes float3 { 0%, 100% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) scale(1); } 50% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) scale(1.07); } }
        @keyframes float4 { 0%, 100% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(0) rotate(0deg); } 50% { transform: translate(var(--parallax-x, 0), var(--parallax-y, 0)) translateY(-8px) rotate(4deg); } }
        .float-tile { transition: transform 0.15s ease-out; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .float-tile { animation: none !important; }
        }
      `}</style>

      {/* Shape collage */}
      <div className="absolute inset-0 pointer-events-none">
        {TILES.map((tile, i) => (
          <div
            key={i}
            ref={(el) => { tileRefs.current[i] = el; }}
            className={`float-tile absolute rounded-3xl overflow-hidden shadow-sm ${tile.className}`}
            style={{
              backgroundColor: tile.bg,
              animation: `float${tile.float} ${6 + i * 0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {tile.content}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 max-w-6xl">
        <h1 className="font-sans font-black text-[#4C4DFF] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-tight mb-10 sm:mb-14 lg:whitespace-nowrap">
          Education is alive.
        </h1>

        <div>
          <img src="/logo.png" alt="Sparkurio" className="h-16 sm:h-20 w-auto" />
          <p className="font-serif font-light text-lg sm:text-xl text-ink/60 mt-2 ml-3">&hellip;coming soon</p>
        </div>
      </div>
    </div>
  );
}
