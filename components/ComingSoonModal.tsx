"use client";

export default function ComingSoonModal({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 bg-lime/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-ink mb-2">{planName} isn&apos;t open yet</h3>
        <p className="text-sm text-ink-soft mb-6">We&apos;re still working on this, but it&apos;s coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
