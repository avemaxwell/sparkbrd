"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "signup_nudge_dismissed";
const DELAY_MS = 20000; // 20 seconds

export default function SignupNudge() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false); // controls slide-in animation

  useEffect(() => {
    // Don't show on auth pages or if already dismissed
    if (
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/signup") ||
      pathname?.startsWith("/board/") ||
      sessionStorage.getItem(STORAGE_KEY)
    ) return;

    // Check if user is logged in
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) return; // logged in — do nothing
      } catch {
        // can't determine — don't show
        return;
      }

      // Not logged in — show after delay
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setShow(true));
      }, DELAY_MS);

      return () => clearTimeout(timer);
    })();
  }, [pathname]);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-ink/8 shadow-2xl px-4 py-5 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Text */}
          <div className="flex-1">
            <p className="font-serif text-xl text-ink leading-snug">
              Real people. Real inspiration.
            </p>
            <p className="text-sm text-ink/50 mt-1">
              Collect images, ideas, and everything that ignites your spark--free.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/signup"
              onClick={dismiss}
              className="px-5 py-2.5 bg-papaya text-white text-sm font-semibold rounded-full hover:bg-papaya/90 transition-colors shadow-md shadow-papaya/20 whitespace-nowrap"
            >
              Start for free →
            </Link>
            <button
              onClick={dismiss}
              className="text-sm text-ink/40 hover:text-ink/60 transition-colors whitespace-nowrap"
            >
              Maybe later
            </button>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4 stroke-ink/30 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
