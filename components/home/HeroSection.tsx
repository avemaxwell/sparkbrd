"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Blob, IconBlob, SparkBurst, PatternCorner, WaveDivider } from "./decor";
import { IconPalette, IconLaptop, IconVase, IconAtom, IconGlobe, IconPencil } from "@/components/icons";
import FoundingEducatorModal from "./FoundingEducatorModal";

const FOUNDING_MODAL_KEY = "founding_educator_modal_seen";

const POPULAR_SEARCHES = [
  "Middle School Art",
  "AI Literacy",
  "Canva",
  "Graphic Design",
  "Ceramics",
  "Digital Citizenship",
  "STEM",
  "Higher Education",
];

// Floating illustrated resource cards — stand-ins for real preview images.
// Positioned as percentages *within the illustration stage only* (not the
// whole hero) so they can never collide with the header or the text column.
const FLOATING_CARDS = [
  { title: "Watercolor Basics",     subject: "Visual Art", icon: IconPalette, color: "bg-blush",    top: 2,  left: 6,  rotate: -6, width: 168, float: "9s"  },
  { title: "AI Literacy Unit",      subject: "Technology", icon: IconLaptop,  color: "bg-papaya",   top: 6,  left: 54, rotate: 5,  width: 172, float: "11s" },
  { title: "Ceramics 101",          subject: "Visual Art", icon: IconVase,    color: "bg-mustard",  top: 38, left: 0,  rotate: 5,  width: 158, float: "8s"  },
  { title: "STEM Challenge",        subject: "Science",    icon: IconAtom,    color: "bg-aqua",     top: 42, left: 50, rotate: -4, width: 168, float: "12s" },
  { title: "Digital Citizenship",   subject: "Tech",       icon: IconGlobe,   color: "bg-lime",     top: 74, left: 10, rotate: -3, width: 162, float: "10s" },
  { title: "Graphic Design Basics", subject: "Design",     icon: IconPencil,  color: "bg-blush",    top: 76, left: 56, rotate: 6,  width: 168, float: "13s" },
];

export default function HeroSection() {
  const router = useRouter();
  const { profile } = useUser();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [showFoundingModal, setShowFoundingModal] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (profile || sessionStorage.getItem(FOUNDING_MODAL_KEY)) return;
    const timer = setTimeout(() => setShowFoundingModal(true), 1200);
    return () => clearTimeout(timer);
  }, [profile]);

  const dismissFoundingModal = () => {
    sessionStorage.setItem(FOUNDING_MODAL_KEY, "1");
    setShowFoundingModal(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <>
    {showFoundingModal && <FoundingEducatorModal onClose={dismissFoundingModal} />}
    <section className="relative overflow-hidden bg-lime">
      {/* Decorative background shapes */}
      <Blob className="absolute bottom-10 -left-16 w-64 h-64 bg-lavender/40 pointer-events-none" />
      <PatternCorner className="absolute top-24 right-4 hidden lg:block" />
      <SparkBurst className="absolute top-40 left-[46%] w-8 h-8 hidden lg:block pointer-events-none" rotate={-15} />
      <SparkBurst className="absolute bottom-24 right-[8%] w-10 h-10 hidden lg:block pointer-events-none" rotate={20} />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-16 md:pt-40 md:pb-20 grid lg:grid-cols-2 lg:gap-12 items-center">
        {/* Text column — normal document flow, never overlapped */}
        <div className={`relative z-10 text-center lg:text-left transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {!profile && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-lime bg-ink px-3 py-1.5 rounded-full mb-5">
              Founding Educator Access
            </span>
          )}
          <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-ink">
            Confidence for tomorrow&rsquo;s classroom,{" "}
            <span className="text-papaya">built by today&rsquo;s educators.</span>
          </h1>
          <p className="mt-6 text-lg text-ink/60 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Discover classroom-tested lessons, projects, templates, and teaching ideas shared by real educators and improved by the community.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto lg:mx-0">
            <div className="flex items-center gap-2 bg-white rounded-full shadow-xl px-3 py-2 border border-black/5">
              <svg className="w-5 h-5 stroke-ink/40 stroke-[1.5] fill-none ml-2 flex-shrink-0" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons, projects, templates, activities…"
                className="flex-1 bg-transparent outline-none text-sm md:text-base text-ink placeholder:text-ink/35 py-2 min-w-0"
              />
              <button type="submit" className="px-5 md:px-6 py-2.5 bg-papaya text-white text-sm font-semibold rounded-full hover:bg-papaya/90 transition-colors flex-shrink-0">
                Search
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="mt-5 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
            <span className="text-xs font-medium text-ink/40 mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs font-medium text-ink/60 bg-white/70 hover:bg-white hover:text-ink px-3 py-1.5 rounded-full border border-black/5 transition-colors"
              >
                {term}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex items-center gap-4 justify-center lg:justify-start">
            <a
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white text-sm font-semibold rounded-full hover:bg-ink/85 transition-colors"
            >
              Discover Resources
            </a>
            <a
              href={profile ? "/resources/new" : "/signup?intent=share&redirect=/resources/new"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-ink text-sm font-semibold rounded-full border border-black/10 hover:border-black/20 transition-colors"
            >
              Share a Resource
            </a>
          </div>

          {/* Mobile floating cards — condensed row, own contained scroller */}
          <div className="lg:hidden mt-10 overflow-x-auto scrollbar-none -mx-6 px-6">
            <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
              {FLOATING_CARDS.map((card, i) => (
                <div key={i} className={`${card.color} rounded-2xl shadow-md p-4 border border-black/5 flex-shrink-0 w-36`}>
                  <IconBlob icon={<card.icon className="w-full h-full" />} size={36} blobClassName="bg-white/90" />
                  <p className="font-serif font-semibold text-xs text-ink leading-snug mt-2">{card.title}</p>
                  <p className="text-[10px] text-ink/50 mt-0.5">{card.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Illustration stage — its own contained box, desktop only.
            Percentages below are relative to THIS box, so cards can never
            escape into the header or the text column. */}
        <div className="relative hidden lg:block h-[440px]">
          {FLOATING_CARDS.map((card, i) => (
            <div
              key={i}
              className={`absolute transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ top: `${card.top}%`, left: `${card.left}%`, width: card.width, transitionDelay: `${i * 80}ms` }}
            >
              <div style={{ transform: `rotate(${card.rotate}deg)` }}>
                <div style={{ animation: mounted ? `hero-float ${card.float} ease-in-out infinite` : "none" }}>
                  <div className={`${card.color} rounded-2xl shadow-lg p-4 border border-black/5`}>
                    <IconBlob icon={<card.icon className="w-full h-full" />} size={44} blobClassName="bg-white/90" />
                    <p className="font-serif font-semibold text-sm text-ink leading-snug mt-2">{card.title}</p>
                    <p className="text-[11px] text-ink/50 mt-0.5">{card.subject}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WaveDivider fill="#F6F6F6" className="relative z-10" />

      <style jsx>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </section>
    </>
  );
}
