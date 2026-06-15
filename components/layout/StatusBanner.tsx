"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "status_banner_dismissed";

export default function StatusBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="bg-ink text-white px-4 py-2.5 text-center text-sm relative mb-3">
      <span>
        We&apos;re taking some time to rethink what Sparkurio is and where it&apos;s headed — new sign-ups are paused for now. Thanks for being here.
      </span>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5 stroke-white/70 stroke-[1.5] fill-none" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
