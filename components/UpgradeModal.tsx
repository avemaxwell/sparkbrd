"use client";

import { useRouter } from "next/navigation";

export default function UpgradeModal({
  message,
  feature,
  onClose,
}: {
  message: string;
  feature: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/settings/billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-papaya/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 stroke-papaya stroke-2 fill-none" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink mb-1">Upgrade Required</h3>
            <p className="text-sm text-ink-soft">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center"
          >
            <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="bg-ink/5 rounded-xl p-4 mb-4">
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">Unlock more with Pro.</strong> Get unlimited boards, custom colors, export features, and more.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-ink/10 text-ink rounded-full text-sm font-medium hover:bg-ink/20 transition-colors"
          >
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-3 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}