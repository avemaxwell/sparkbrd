"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "status_banner_dismissed";
const DELAY_MS = 1500;

export default function StatusBanner() {
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

      // Not logged in — show after a short delay
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
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">

          {/* Text */}
          <div className="flex-1">
            <p className="font-serif text-xl text-ink leading-snug">
              We&apos;re taking a moment to rethink Sparkurio.
            </p>
            <p className="text-sm text-ink/50 mt-1">
              We&apos;re stepping back to reconsider what Sparkurio is and where it&apos;s headed. Thanks for being here.
            </p>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-0 right-0 sm:static w-7 h-7 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors flex-shrink-0"
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
