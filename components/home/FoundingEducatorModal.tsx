"use client";

import Link from "next/link";

export default function FoundingEducatorModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FBF6EE] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-4 h-4 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <img src="/founding-educator.png" alt="We're building this together! Become a Founding Educator today." className="w-full h-auto block" />

        <div className="px-8 pb-8 pt-2">
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              onClick={onClose}
              className="flex-1 text-center px-6 py-3.5 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors"
            >
              Join as a Founding Educator
            </Link>
            <button
              onClick={onClose}
              className="text-sm text-ink/40 hover:text-ink/70 transition-colors flex-shrink-0"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
