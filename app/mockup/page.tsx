"use client";

// ============================================================
// MOCKUP PREVIEW ONLY — view at /mockup
// No production changes — delete this folder when done
// ============================================================

import { useState, useEffect } from "react";

const BASE = "https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/tacks/2711858a-2413-47ca-98aa-d2fe964a2b4e/";

// Cards: all kept in left ~0–36% so they never bleed into the text column.
// Tightly clustered — significant overlap, varied rotations.
const CARDS = [
  // Top cluster
  { src: BASE + "1775145510453-compagnons-SEGkN8Gu-_M-unsplash.jpg",            rotate: -7, top: 5,  left: 1,  width: 188, z: 2, aspect: "3/4", float: "8s"  },
  { src: BASE + "1775225653404-roberto-nickson-q5Q_T0y7qrk-unsplash.jpg",        rotate:  4, top: 8,  left: 13, width: 175, z: 4, aspect: "4/3", float: "11s" },
  { src: BASE + "1775145642313-buddy-an-VptjauiOVQE-unsplash.jpg",              rotate: -4, top: 4,  left: 25, width: 182, z: 3, aspect: "2/3", float: "9s"  },
  // Middle cluster
  { src: BASE + "1775225864912-fiona-murray-degraaff-0oaonllhaRA-unsplash.jpg", rotate:  6, top: 36, left: 0,  width: 180, z: 5, aspect: "1/1", float: "13s" },
  { src: BASE + "1775145672331-petra-nevezi-YcoIBuCRGWY-unsplash.jpg",          rotate: -5, top: 33, left: 12, width: 196, z: 4, aspect: "3/4", float: "10s" },
  { src: BASE + "1775145718678-kevin-charit-w33xcR8DltA-unsplash.jpg",          rotate:  3, top: 36, left: 26, width: 178, z: 3, aspect: "2/3", float: "7s"  },
  { src: BASE + "1775225090555-budka-damdinsuren-jRXxNpA6d_k-unsplash.jpg",     rotate: -6, top: 16, left: 33, width: 170, z: 2, aspect: "3/4", float: "12s" },
  // Bottom cluster
  { src: BASE + "1775145496197-katsiaryna-endruszkiewicz-BteCp6aq4GI-unsplash.jpg", rotate: -2, top: 60, left: 2,  width: 184, z: 3, aspect: "4/3", float: "9s"  },
  { src: BASE + "1775225487965-steph-wilson-9kK34JrqJgs-unsplash.jpg",          rotate:  5, top: 57, left: 14, width: 180, z: 5, aspect: "2/3", float: "14s" },
  { src: BASE + "1775928652334-meg-wagener-vuXTB1lR3AY-unsplash.jpg",           rotate: -3, top: 61, left: 28, width: 186, z: 4, aspect: "3/4", float: "10s" },
];

// Activity notifications
const ACTIVITY = [
  { name: "Kate B.",   initials: "KB", msg: <>added you to the <span className="font-semibold text-ink/80">Design Studio</span> team</>,            color: "from-aqua to-blush"    },
  { name: "Maya R.",   initials: "MR", msg: <>⭐ reacted to your board <span className="font-semibold text-ink/80">Summer Moodboard</span></>,      color: "from-blush to-papaya"  },
  { name: "Jordan K.", initials: "JK", msg: <>started following you</>,                                                                               color: "from-mustard to-aqua"  },
  { name: "Alex C.",   initials: "AC", msg: <>💬 commented on your board <span className="font-semibold text-ink/80">Rome Trip</span></>,            color: "from-papaya to-mustard"},
  { name: "Harper M.", initials: "HM", msg: <>re-tacked your image to <span className="font-semibold text-ink/80">Weekend Edit</span></>,            color: "from-mustard to-blush" },
];

// Feed preview — totally separate set of colorful/creative Unsplash images
const FEED_IMGS = [
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80", // colorful mural
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&q=80", // flamingo
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80", // watercolor paints
  "https://images.unsplash.com/photo-1527176930608-09cb256ab504?w=400&q=80", // yellow umbrella
  "https://images.unsplash.com/photo-1490750967868-88df5691cc03?w=400&q=80", // bright gerbera daisies
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80", // abstract art
  "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80", // colorful market stalls
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&q=80",    // woven textiles
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80", // eclectic gallery wall
  "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=400&q=80", // colorful ice cream
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80", // vibrant food spread
  "https://images.unsplash.com/photo-1471286174890-9c112ac6f0b0?w=400&q=80", // festival lights
  "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&q=80",    // colorful print art
  "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=80", // bright umbrellas
  "https://images.unsplash.com/photo-1604076913837-52ab5629fbe9?w=400&q=80", // vibrant still life
];

export default function MockupPage() {
  const [mounted, setMounted] = useState(false);
  const [activityIdx, setActivityIdx] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [newCard, setNewCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);

    const firstShow = setTimeout(() => {
      setToastVisible(true);
      setNewCard(2);
    }, 2500);

    const cycle = setInterval(() => {
      setToastVisible(false);
      setTimeout(() => {
        setActivityIdx(i => (i + 1) % ACTIVITY.length);
        setNewCard(n => n === null ? 0 : (n + 3) % CARDS.length);
        setToastVisible(true);
      }, 500);
    }, 6000);

    return () => { clearTimeout(firstShow); clearInterval(cycle); };
  }, []);

  const cols: string[][] = [[], [], [], [], []];
  [...FEED_IMGS, ...FEED_IMGS].slice(0, 15).forEach((src, i) => cols[i % 5].push(src));

  const activity = ACTIVITY[activityIdx];

  return (
    <main className="min-h-screen bg-[#FDFCFB] overflow-x-hidden">

      {/* Mockup banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-ink/90 text-white text-center text-xs py-2 font-medium tracking-wide backdrop-blur-sm">
        MOCKUP PREVIEW — not live &nbsp;·&nbsp;{" "}
        <a href="/" className="underline opacity-60 hover:opacity-100">← back to site</a>
      </div>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden pt-8">

        {/* Subtle warm gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 25% 20%, rgba(235,110,128,0.09) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(226,78,66,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 10% 85%, rgba(233,176,0,0.06) 0%, transparent 42%)
            `,
          }}
        />

        {/* ── LEFT: card collage (strictly left half) ── */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className={`absolute transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                top: `${card.top}%`,
                left: `${card.left}%`,
                width: `${card.width}px`,
                zIndex: card.z,
                transitionDelay: `${i * 75}ms`,
              }}
            >
              {/* Static rotation */}
              <div style={{ transform: `rotate(${card.rotate}deg)` }}>
                {/* Float animation */}
                <div style={{ animation: mounted ? `float-card ${card.float} ease-in-out infinite` : "none" }}>
                  {/* Card — thin white border, same as actual board tacks */}
                  <div
                    className={`bg-white shadow-xl overflow-hidden rounded-sm transition-all duration-500 ${
                      newCard === i ? "ring-2 ring-papaya ring-offset-2 shadow-2xl scale-[1.03]" : ""
                    }`}
                    style={{ padding: "5px" }}
                  >
                    <img
                      src={card.src}
                      alt=""
                      className="w-full object-cover block rounded-[1px]"
                      style={{ aspectRatio: card.aspect }}
                      loading="eager"
                    />
                  </div>

                  {/* Papaya tack pin */}
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full shadow-md ring-[1.5px] ring-white"
                    style={{ backgroundColor: "#F97316" }}
                  />
                  {/* "Just added" pulse */}
                  {newCard === i && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full animate-ping"
                      style={{ backgroundColor: "#F9731640" }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: headline + CTA — clear of the card cluster ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-end">
          <div
            className={`w-full md:w-[52%] lg:w-[48%] pt-28 pb-16 md:pt-32 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {/* Logo */}
            <div className="mb-10">
              <img src="/logo.png" alt="Sparkurio" className="h-14 w-auto" />
            </div>

            {/* Headline — one or two words per line so it stacks tall */}
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl leading-[1.08] text-ink">
              Every<br />
              great<br />
              idea<br />
              begins<br />
              with a<br />
              <em className="italic text-papaya">spark.</em>
            </h1>

            {/* Body */}
            <p
              className={`mt-8 text-lg text-ink/50 max-w-sm leading-relaxed font-light transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Save, organize, and share the images and ideas that light you up.
            </p>

            {/* CTA */}
            <div
              className={`mt-10 flex items-center gap-4 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-white text-sm font-medium tracking-wide rounded-full hover:bg-papaya transition-colors duration-300"
              >
                Begin collecting
                <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="/login" className="text-sm text-ink/40 hover:text-ink/70 transition-colors">
                Sign in
              </a>
            </div>
          </div>
        </div>

        {/* ── Activity toast — top right, below mockup banner ── */}
        <div
          className={`fixed top-10 right-5 z-40 transition-all duration-500 ${
            toastVisible && mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-ink/5 max-w-[300px]">
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${activity.color} flex-shrink-0 flex items-center justify-center`}
            >
              <span className="text-white text-[10px] font-bold">{activity.initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-ink/60 leading-snug">
                <span className="font-semibold text-ink/90">{activity.name}</span>{" "}
                {activity.msg}
              </p>
              <p className="text-[10px] text-ink/30 mt-0.5">just now</p>
            </div>
            {/* Live pulse dot */}
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-papaya animate-pulse" />
          </div>
        </div>

        {/* Bottom fade into feed */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FDFCFB] to-transparent z-20" />
      </section>

      {/* ══════════════════════════════════════════
          FEED PEEK
      ══════════════════════════════════════════ */}
      <section className="relative px-3 pt-2 pb-0">
        <p
          className={`text-center text-[10px] text-ink/25 tracking-[0.22em] uppercase mb-5 transition-all duration-500 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          Discover what others are collecting
        </p>

        <div className="relative">
          <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-2 md:gap-3">
                {col.map((src, ii) => (
                  <div key={ii} className="rounded-lg overflow-hidden">
                    <img src={src} alt="" className="w-full h-auto object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB]/90 to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 z-10">
            <p className="text-ink/40 text-sm">Sign in to get a personalized feed</p>
            <a
              href="/login"
              className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/85 transition-colors"
            >
              Get started
            </a>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}
