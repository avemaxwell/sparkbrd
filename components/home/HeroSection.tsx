"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

const CARD_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300",
  "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=300",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300",
];

const CARD_CONFIGS = [
  { top: "8%",  left: "5%",  rotate: "-7deg",  width: "140px", delay: "0ms",   animate: "float 9s ease-in-out infinite" },
  { top: "5%",  left: "28%", rotate: "4deg",   width: "110px", delay: "300ms", animate: "float 11s ease-in-out infinite reverse" },
  { top: "45%", left: "2%",  rotate: "6deg",   width: "120px", delay: "600ms", animate: "float 8s ease-in-out infinite" },
  { top: "55%", left: "22%", rotate: "-4deg",  width: "100px", delay: "150ms", animate: "float 13s ease-in-out infinite reverse" },
  { top: "20%", left: "14%", rotate: "2deg",   width: "130px", delay: "450ms", animate: "float 10s ease-in-out infinite" },
];

export default function HeroSection() {
  const { profile, loading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.name?.split(" ")[0];

  // Logged-in: compact personal header
  if (!loading && profile) {
    return (
      <section className="relative pt-32 pb-4 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-sm font-medium text-ink/40 tracking-widest uppercase mb-2">Sparkbrd</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink/90 leading-tight">
              {getGreeting()}
              {firstName && (
                <>, <span className="italic text-papaya/80">{firstName}</span></>
              )}
            </h1>
            <p className="text-ink/40 mt-2 text-base">Spark what inspires you.</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
            50% { transform: translateY(-14px) rotate(var(--r, 0deg)); }
          }
        `}</style>
      </section>
    );
  }

  // Logged-out: editorial brand hero
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Warm gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 70% 20%, rgba(235,110,128,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(226,78,66,0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 90%, rgba(233,176,0,0.07) 0%, transparent 45%)
          `,
        }}
      />

      {/* Scattered floating cards — left side decorative collage */}
      <div className="absolute inset-0 pointer-events-none">
        {CARD_CONFIGS.map((cfg, i) => (
          <div
            key={i}
            className={`absolute rounded-xl overflow-hidden shadow-2xl transition-all duration-1000 ${
              mounted ? "opacity-100" : "opacity-0 translate-y-6"
            }`}
            style={{
              top: cfg.top,
              left: cfg.left,
              width: cfg.width,
              transform: `rotate(${cfg.rotate})`,
              transitionDelay: cfg.delay,
              animation: mounted ? cfg.animate : "none",
            }}
          >
            <img
              src={CARD_IMAGES[i]}
              alt=""
              className="w-full aspect-[3/4] object-cover"
              loading="eager"
            />
            {/* Pin dot */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-papaya shadow-md" />
          </div>
        ))}
      </div>

      {/* Main content — right-weighted on desktop */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-end">
        <div className="w-full md:w-[55%] lg:w-[50%] py-32 md:py-0">
          {/* Headline */}
          <h1
            className={`font-serif text-6xl md:text-7xl lg:text-8xl leading-[0.92] text-ink transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Spark
            <br />
            <span className="italic text-papaya">what</span>
            <br />
            inspires
            <br />
            you.
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
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a
                href="/login"
                className="text-sm text-ink/40 hover:text-ink/70 transition-colors"
              >
                Sign in
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAFAFA] to-transparent" />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-18px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </section>
  );
}
