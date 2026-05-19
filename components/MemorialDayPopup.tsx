"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";

const BOARD_ID = "31476b55-1229-4984-aaf1-2600df7ded8f";

// Shows during this annual date window (MMDD, inclusive)
const POPUP_START = 519; // May 19
const POPUP_END   = 527; // May 27

const BOARD_URL = BOARD_ID ? `/board/${BOARD_ID}` : "/explore";

export default function MemorialDayPopup() {
  const { profile, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"hero" | "signup">("hero");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (sessionStorage.getItem("memorial_day_dismissed")) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) return;

    const now = new Date();
    const mmdd = (now.getMonth() + 1) * 100 + now.getDate();
    if (mmdd < POPUP_START || mmdd > POPUP_END) return;

    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [loading, pathname]);

  const dismiss = () => {
    sessionStorage.setItem("memorial_day_dismissed", "1");
    setOpen(false);
  };

  const transitionTo = (next: "hero" | "signup") => {
    setTransitioning(true);
    setTimeout(() => {
      setView(next);
      setTransitioning(false);
    }, 160);
  };

  const handleCTA = () => {
    if (profile) {
      router.push(BOARD_URL);
      dismiss();
    } else {
      transitionTo("signup");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-200 ${
          transitioning ? "opacity-0 scale-[0.99]" : "opacity-100 scale-100"
        }`}
      >
        {/* ── HERO ── */}
        {view === "hero" && (
          <>
            <div
              className="relative px-7 pt-10 pb-9 text-center"
              style={{ background: "linear-gradient(160deg, #0F1F3D 0%, #1B3160 55%, #2C1A3A 100%)" }}
            >
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Stars row */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.2)" }} />
                <span className="text-white/40 text-xs tracking-[0.3em]">★ ★ ★</span>
                <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.2)" }} />
              </div>

              <p
                className="text-xs font-semibold tracking-[0.18em] uppercase mb-3"
                style={{ color: "#E8B4B8" }}
              >
                Memorial Day Weekend
              </p>
              <h2 className="font-serif text-white text-[1.6rem] leading-snug mb-3">
                Here&apos;s What We&apos;re<br />Loving Right Now
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Our curated edit for the long weekend — sun-soaked style, All-American classics, and everything that makes summer feel like summer.
              </p>

              {/* Red-white-blue stripe */}
              <div className="flex mt-7 rounded-full overflow-hidden h-1">
                <div className="flex-1" style={{ background: "#BF0A30" }} />
                <div className="flex-1" style={{ background: "#FFFFFF" }} />
                <div className="flex-1" style={{ background: "#002868" }} />
              </div>
            </div>

            <div className="px-7 py-6">
              <button
                onClick={handleCTA}
                className="w-full py-3.5 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #0F1F3D 0%, #BF0A30 100%)" }}
              >
                See the board →
              </button>
              <button
                onClick={dismiss}
                className="w-full mt-3 text-sm text-ink/40 hover:text-ink/60 transition-colors py-1"
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* ── SIGN UP PROMPT ── */}
        {view === "signup" && (
          <>
            <div
              className="relative px-7 pt-10 pb-8 text-center"
              style={{ background: "linear-gradient(160deg, #0F1F3D 0%, #1B3160 55%, #2C1A3A 100%)" }}
            >
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="text-3xl mb-3">★</div>
              <h2 className="font-serif text-white text-xl leading-snug">
                Join to see the full board
              </h2>
            </div>

            <div className="px-7 py-6">
              <p className="text-sm text-ink/60 leading-relaxed text-center mb-6">
                Sparkurio is free. Create an account to unlock the Memorial Day board and start building your own.
              </p>
              <button
                onClick={() => {
                  router.push(`/signup?redirect=${encodeURIComponent(BOARD_URL)}`);
                  dismiss();
                }}
                className="w-full py-3.5 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #0F1F3D 0%, #BF0A30 100%)" }}
              >
                Create free account →
              </button>
              <button
                onClick={() => {
                  router.push(`/login?redirect=${encodeURIComponent(BOARD_URL)}`);
                  dismiss();
                }}
                className="w-full mt-3 py-2.5 text-sm font-medium text-ink/70 hover:text-ink transition-colors border border-ink/10 rounded-2xl"
              >
                Log in
              </button>
              <button
                onClick={() => transitionTo("hero")}
                className="w-full mt-3 text-sm text-ink/30 hover:text-ink/50 transition-colors py-1"
              >
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
