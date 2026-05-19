"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { registerQuizOpener } from "@/lib/quiz-trigger";

export type StyleKey = "boho" | "electric" | "coastal" | "timeless" | "enchanted";

export const STYLE_BOARD_IDS: Record<StyleKey, string | null> = {
  boho:      "9ba1298f-dba9-4ec5-8f46-6e3267316af8",
  electric:  "fdd98123-0b57-42e5-83d8-dd919dc3c716",
  coastal:   "6ee6a9f4-0da2-41d3-a208-78d91572e017",
  timeless:  "441d63d3-4fc2-438a-bb2a-fd522b49fefa",
  enchanted: "ca6f43bd-0a20-462a-b818-81d5736e7f5f",
};

const STYLES: Record<
  StyleKey,
  { name: string; tagline: string; emoji: string; gradient: string; swatch: string; accentHex: string }
> = {
  boho: {
    name: "Free Spirit",
    tagline: "You are untamed, warm, and wildly beautiful.",
    emoji: "🌻",
    gradient: "linear-gradient(135deg, #FCD34D 0%, #FB923C 50%, #FDA4AF 100%)",
    swatch: "linear-gradient(135deg, #FCD34D, #FDA4AF)",
    accentHex: "#FB923C",
  },
  electric: {
    name: "Electric",
    tagline: "You are bold, unapologetic, and completely magnetic.",
    emoji: "⚡",
    gradient: "linear-gradient(135deg, #D946EF 0%, #EC4899 50%, #8B5CF6 100%)",
    swatch: "linear-gradient(135deg, #D946EF, #8B5CF6)",
    accentHex: "#D946EF",
  },
  coastal: {
    name: "Saltwater",
    tagline: "You are breezy, easy, and effortlessly golden.",
    emoji: "🌊",
    gradient: "linear-gradient(135deg, #38BDF8 0%, #22D3EE 50%, #5EEAD4 100%)",
    swatch: "linear-gradient(135deg, #38BDF8, #5EEAD4)",
    accentHex: "#38BDF8",
  },
  timeless: {
    name: "Timeless",
    tagline: "You are polished, considered, and quietly stunning.",
    emoji: "🌹",
    gradient: "linear-gradient(135deg, #FDA4AF 0%, #D4B896 50%, #FDE68A 100%)",
    swatch: "linear-gradient(135deg, #FDA4AF, #D4B896)",
    accentHex: "#E9967A",
  },
  enchanted: {
    name: "Midnight Garden",
    tagline: "You bloom in the shadows — romantic, rare, and irresistibly deep.",
    emoji: "🥀",
    gradient: "linear-gradient(135deg, #2D1B4E 0%, #7B2D5E 50%, #E8658A 100%)",
    swatch: "linear-gradient(135deg, #2D1B4E, #E8658A)",
    accentHex: "#7B2D5E",
  },
};

const QUESTIONS = [
  {
    question: "Your summer vibe is... ☀️",
    answers: [
      { text: "Festival-ready, free-spirited, flower crowns", style: "boho" as StyleKey, emoji: "🌻" },
      { text: "Rooftop rager, neon lights, full glam", style: "electric" as StyleKey, emoji: "⚡" },
      { text: "Barefoot on the beach at sunrise", style: "coastal" as StyleKey, emoji: "🌊" },
      { text: "Farmers market, linen shirt, croissant in hand", style: "timeless" as StyleKey, emoji: "☕" },
      { text: "Overgrown estate, night-blooming roses, candlelight", style: "enchanted" as StyleKey, emoji: "🥀" },
    ],
  },
  {
    question: "What's in your summer bag? 👜",
    answers: [
      { text: "Crystal necklace, vintage journal, palo santo", style: "boho" as StyleKey, emoji: "🌸" },
      { text: "Glittery lip gloss, holographic shades, headphones", style: "electric" as StyleKey, emoji: "💫" },
      { text: "Sea glass, sunscreen, a trashy novel", style: "coastal" as StyleKey, emoji: "🐚" },
      { text: "Fine perfume, a silk scarf, a good book", style: "timeless" as StyleKey, emoji: "🌿" },
      { text: "Dark roses, a handwritten letter, vintage perfume", style: "enchanted" as StyleKey, emoji: "🕯️" },
    ],
  },
  {
    question: "Your summer playlist is mostly... 🎵",
    answers: [
      { text: "Stevie Nicks, Fleetwood Mac, Florence + the Machine", style: "boho" as StyleKey, emoji: "🎸" },
      { text: "Charli XCX, Rina Sawayama, hyperpop bangers", style: "electric" as StyleKey, emoji: "⚡" },
      { text: "Jack Johnson, The Lumineers, Khruangbin", style: "coastal" as StyleKey, emoji: "🎵" },
      { text: "Norah Jones, Chet Baker, classic bossa nova", style: "timeless" as StyleKey, emoji: "🥂" },
      { text: "Lana Del Rey, Mazzy Star, slow and achingly beautiful", style: "enchanted" as StyleKey, emoji: "🌌" },
    ],
  },
  {
    question: "Which color palette gives you life? 🎨",
    answers: [
      { text: "Terracotta · Dusty Rose · Burnt Sienna", style: "boho" as StyleKey, emoji: "🟠" },
      { text: "Chrome · Hot Pink · Neon Lime · Electric Blue", style: "electric" as StyleKey, emoji: "🩷" },
      { text: "Sandy Beige · Sky Blue · Seafoam · Warm Coral", style: "coastal" as StyleKey, emoji: "🔵" },
      { text: "Ivory · Camel · Burgundy · Forest Green", style: "timeless" as StyleKey, emoji: "🤍" },
      { text: "Burgundy · Midnight Plum · Dusty Rose · Black", style: "enchanted" as StyleKey, emoji: "🥀" },
    ],
  },
];

export default function SummerStyleQuiz() {
  const { profile, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | number | "result">("intro");
  const [scores, setScores] = useState<Record<StyleKey, number>>({
    boho: 0, electric: 0, coastal: 0, timeless: 0, enchanted: 0,
  });
  const [result, setResult] = useState<StyleKey | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [hoveredAnswer, setHoveredAnswer] = useState<StyleKey | null>(null);

  // Register on-demand opener so settings page can trigger it
  useEffect(() => {
    registerQuizOpener(() => {
      setStep("intro");
      setScores({ boho: 0, electric: 0, coastal: 0, timeless: 0, enchanted: 0 });
      setResult(null);
      setOpen(true);
    });
  }, []);

  // Auto-popup: show once after login if not yet taken
  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    if (profile.quiz_result != null) return;
    if (sessionStorage.getItem("quiz_dismissed")) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) return;

    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [loading, profile, pathname]);

  const dismiss = () => {
    sessionStorage.setItem("quiz_dismissed", "1");
    setOpen(false);
  };

  const transitionTo = (next: "intro" | number | "result") => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 160);
  };

  const handleAnswer = (style: StyleKey) => {
    if (transitioning) return;

    const newScores = { ...scores, [style]: scores[style] + 1 };
    setScores(newScores);

    const currentQ = step as number;

    if (currentQ >= QUESTIONS.length - 1) {
      const winner = (Object.entries(newScores) as [StyleKey, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      saveResult(winner);
      transitionTo("result");
    } else {
      transitionTo(currentQ + 1);
    }
  };

  const saveResult = async (style: StyleKey) => {
    if (!profile) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ quiz_result: style }).eq("id", profile.id);
  };

  const handleViewBoard = () => {
    if (!result) return;
    const boardId = STYLE_BOARD_IDS[result];
    router.push(boardId ? `/board/${boardId}` : "/explore");
    setOpen(false);
  };

  if (!open) return null;

  const currentQ = typeof step === "number" ? QUESTIONS[step] : null;
  const style = result ? STYLES[result] : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-200 ${
          transitioning ? "opacity-0 translate-y-1 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        {/* ── INTRO ── */}
        {step === "intro" && (
          <div>
            <div
              className="relative px-6 pt-10 pb-8"
              style={{ background: "linear-gradient(135deg, #D946EF 0%, #EC4899 30%, #FB923C 65%, #34D399 100%)" }}
            >
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="text-4xl mb-3">🌞</div>
              <h2 className="font-bold text-white text-2xl leading-tight mb-1">
                What&apos;s Your<br />Summer Style?
              </h2>
              <p className="text-white/80 text-sm">4 quick questions to find your aesthetic.</p>
              <div className="flex gap-1.5 mt-5">
                {(Object.keys(STYLES) as StyleKey[]).map((s) => (
                  <div
                    key={s}
                    className="flex-1 h-2.5 rounded-full"
                    style={{ background: STYLES[s].swatch }}
                  />
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-5">
                {(Object.keys(STYLES) as StyleKey[]).map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                    style={{ background: STYLES[s].accentHex }}
                  >
                    {STYLES[s].emoji} {STYLES[s].name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                className="w-full py-3.5 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #D946EF, #EC4899)" }}
              >
                Let&apos;s find out ✨
              </button>
              <button
                onClick={dismiss}
                className="w-full mt-3 text-sm text-ink/40 hover:text-ink/60 transition-colors py-1"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── QUESTION ── */}
        {typeof step === "number" && currentQ && (
          <div>
            {/* Progress bar */}
            <div className="flex gap-1.5 px-6 pt-5 pb-1">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i < (step as number)
                        ? "#D946EF"
                        : i === (step as number)
                        ? "#F9A8D4"
                        : "rgba(0,0,0,0.07)",
                  }}
                />
              ))}
            </div>

            <div className="px-6 pt-3 pb-2">
              <p className="text-xs text-ink/40 font-medium">
                Question {(step as number) + 1} of {QUESTIONS.length}
              </p>
              <h3 className="text-xl font-bold text-ink leading-snug mt-0.5">
                {currentQ.question}
              </h3>
            </div>

            <div className="px-6 pb-5 flex flex-col gap-2">
              {currentQ.answers.map((answer) => {
                const s = STYLES[answer.style];
                const isHovered = hoveredAnswer === answer.style;
                return (
                  <button
                    key={answer.style}
                    onClick={() => handleAnswer(answer.style)}
                    onMouseEnter={() => setHoveredAnswer(answer.style)}
                    onMouseLeave={() => setHoveredAnswer(null)}
                    style={{
                      borderColor: isHovered ? s.accentHex + "80" : "rgba(0,0,0,0.08)",
                      backgroundColor: isHovered ? s.accentHex + "10" : "transparent",
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-150"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
                      style={{ background: s.swatch }}
                    >
                      {answer.emoji}
                    </div>
                    <span className="text-sm font-medium text-ink">{answer.text}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={dismiss}
              className="w-full pb-4 text-xs text-ink/25 hover:text-ink/45 transition-colors text-center"
            >
              Skip quiz
            </button>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && result && style && (
          <div>
            <div
              className="px-6 pt-12 pb-10 text-center"
              style={{ background: style.gradient }}
            >
              <div className="text-5xl mb-4">{style.emoji}</div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Your summer style is
              </p>
              <h2 className="text-3xl font-bold text-white">{style.name}</h2>
            </div>
            <div className="p-6 text-center">
              <p className="font-semibold text-ink">{style.tagline}</p>
              <p className="text-sm text-ink/50 mt-1.5 mb-6">
                We put together an inspiration board just for your vibe.
              </p>
              <button
                onClick={handleViewBoard}
                className="w-full py-3.5 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: style.gradient }}
              >
                See my inspiration board →
              </button>
              <button
                onClick={dismiss}
                className="w-full mt-3 text-sm text-ink/40 hover:text-ink/60 transition-colors py-1"
              >
                Explore on my own
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
