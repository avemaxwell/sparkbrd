"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

const LOGO = "https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/assets/logo.png";

const BASE = "https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/tacks/2711858a-2413-47ca-98aa-d2fe964a2b4e/";

// Cards kept in the left ~36% so they never bleed into the text column
const CARDS = [
  // Top cluster
  { src: BASE + "1775145510453-compagnons-SEGkN8Gu-_M-unsplash.jpg",            rotate: -7, top: 5,  left: 1,  width: 188, z: 2, aspect: "3/4", float: "8s"  },
  { src: BASE + "1775225653404-roberto-nickson-q5Q_T0y7qrk-unsplash.jpg",        rotate:  4, top: 8,  left: 13, width: 175, z: 4, aspect: "4/3", float: "11s" },
  { src: BASE + "1775145642313-buddy-an-VptjauiOVQE-unsplash.jpg",               rotate: -4, top: 4,  left: 25, width: 182, z: 3, aspect: "2/3", float: "9s"  },
  // Middle cluster
  { src: BASE + "1775225864912-fiona-murray-degraaff-0oaonllhaRA-unsplash.jpg",  rotate:  6, top: 36, left: 0,  width: 180, z: 5, aspect: "1/1", float: "13s" },
  { src: BASE + "1775145672331-petra-nevezi-YcoIBuCRGWY-unsplash.jpg",           rotate: -5, top: 33, left: 12, width: 196, z: 4, aspect: "3/4", float: "10s" },
  { src: BASE + "1775145718678-kevin-charit-w33xcR8DltA-unsplash.jpg",           rotate:  3, top: 36, left: 26, width: 178, z: 3, aspect: "2/3", float: "7s"  },
  { src: BASE + "1775225090555-budka-damdinsuren-jRXxNpA6d_k-unsplash.jpg",      rotate: -6, top: 16, left: 33, width: 170, z: 2, aspect: "3/4", float: "12s" },
  // Bottom cluster
  { src: BASE + "1775145496197-katsiaryna-endruszkiewicz-BteCp6aq4GI-unsplash.jpg", rotate: -2, top: 60, left: 2,  width: 184, z: 3, aspect: "4/3", float: "9s"  },
  { src: BASE + "1775225487965-steph-wilson-9kK34JrqJgs-unsplash.jpg",           rotate:  5, top: 57, left: 14, width: 180, z: 5, aspect: "2/3", float: "14s" },
  { src: BASE + "1775928652334-meg-wagener-vuXTB1lR3AY-unsplash.jpg",            rotate: -3, top: 61, left: 28, width: 186, z: 4, aspect: "3/4", float: "10s" },
];

// Decorative activity toasts — tell the collaborative story
const ACTIVITY = [
  { name: "Kate B.",   initials: "KB", msg: "added you to the Design Studio team",             color: "from-aqua to-blush"    },
  { name: "Maya R.",   initials: "MR", msg: "⭐ reacted to your board Summer Moodboard",       color: "from-blush to-papaya"  },
  { name: "Jordan K.", initials: "JK", msg: "started following you",                            color: "from-mustard to-aqua"  },
  { name: "Alex C.",   initials: "AC", msg: "💬 commented on your board Rome Trip",            color: "from-papaya to-mustard"},
  { name: "Harper M.", initials: "HM", msg: "re-tacked your image to Weekend Edit",            color: "from-mustard to-blush" },
];

export default function HeroSection() {
  const { profile, loading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activityIdx, setActivityIdx] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [newCard, setNewCard] = useState<number | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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

  const firstName = profile?.name?.split(" ")[0];

  // ── Logged-in: compact personal greeting ──────────────────
  if (!loading && profile) {
    return (
      <section className="relative pt-24 md:pt-32 pb-4 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="font-serif text-4xl md:text-5xl text-ink/90 leading-tight">
              {getGreeting()}
              {firstName && (
                <>, <span className="italic text-papaya/80">{firstName}</span></>
              )}
            </h1>
            <p className="text-ink/40 mt-2 text-base">Spark what inspires you.</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Logged-out: full editorial hero ───────────────────────
  return (
    <section className="relative min-h-screen overflow-hidden">

      {/* Subtle warm gradient wash */}
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

      {/* Card collage — left half only, hidden on mobile */}
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
              <div style={{ animation: mounted ? `hero-float ${card.float} ease-in-out infinite` : "none" }}>
                {/* Card — thin white border matching board tack style */}
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

                {/* Papaya tack pin — matches the "spark." color */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full shadow-md ring-[1.5px] ring-white"
                  style={{ backgroundColor: "#E24E42" }}
                />
                {newCard === i && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full animate-ping"
                    style={{ backgroundColor: "rgba(226,78,66,0.4)" }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: headline + CTA */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-end">
        <div
          className={`w-full md:w-[52%] lg:w-[48%] pt-28 pb-16 md:pt-32 transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Logo */}
          <div className="mb-10">
            <img src={LOGO} alt="Sparkurio" className="h-14 w-auto" />
          </div>

          {/* Headline */}
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl leading-[1.08] text-ink">
            Every<br />
            great<br />
            idea<br />
            begins<br />
            with a<br />
            <em className="italic" style={{ color: "#E24E42" }}>spark.</em>
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
          {!loading && (
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
          )}
        </div>
      </div>

      {/* Activity toasts — top right, decorative collaborative story */}
      {mounted && (
        <div
          className={`fixed top-20 right-5 z-40 transition-all duration-500 ${
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-ink/5 max-w-[300px]">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ACTIVITY[activityIdx].color} flex-shrink-0 flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{ACTIVITY[activityIdx].initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-ink/60 leading-snug">
                <span className="font-semibold text-ink/90">{ACTIVITY[activityIdx].name}</span>{" "}
                {ACTIVITY[activityIdx].msg}
              </p>
              <p className="text-[10px] text-ink/30 mt-0.5">just now</p>
            </div>
            <div className="flex-shrink-0 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#E24E42" }} />
          </div>
        </div>
      )}

      {/* Bottom fade into boards/discovery sections */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FDFCFB] to-transparent z-20" />

      <style jsx>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}
