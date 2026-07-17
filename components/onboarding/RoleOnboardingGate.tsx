"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { EDUCATOR_ROLES, type EducatorRole } from "@/lib/educator";

// Global, one-time "who are you" prompt — personalization, not a gate. Shown
// once per account (until profile.role is set) as a floating overlay, same
// pattern as <HelpBubble /> in app/layout.tsx, so it never blocks navigation
// or requires a dedicated onboarding route.
export default function RoleOnboardingGate() {
  const { profile, loading, refreshProfile } = useUser();
  const [saving, setSaving] = useState<EducatorRole | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Hide site-wide while the "coming soon" teaser is gating the app (see
  // proxy.ts) — a role-personalization prompt makes no sense on a page
  // nobody can act on. (A pathname check wouldn't work: the gate is a
  // rewrite, so the browser's visible URL never actually becomes /coming-soon.)
  if (process.env.NEXT_PUBLIC_COMING_SOON === "true") return null;
  if (loading || !profile || profile.role || dismissed) return null;

  const handleSelect = async (role: EducatorRole) => {
    setSaving(role);
    const supabase = createClient();
    await supabase.from("profiles").update({ role }).eq("id", profile.id);
    await refreshProfile();
    setSaving(null);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
        <h2 className="font-serif text-xl sm:text-2xl text-ink mb-1.5">Tell us about you</h2>
        <p className="text-sm text-ink-soft mb-6">
          So we can tailor Sparkurio to you — this doesn&rsquo;t limit what you can do.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EDUCATOR_ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              disabled={saving !== null}
              className="text-left px-4 py-3.5 rounded-xl border-2 border-ink/8 hover:border-papaya hover:bg-papaya/5 transition-colors disabled:opacity-50 flex items-center justify-between gap-2"
            >
              <span className="text-sm font-medium text-ink">{r.label}</span>
              {saving === r.id && (
                <div className="w-4 h-4 border-2 border-papaya/30 border-t-papaya rounded-full animate-spin flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink-soft text-center mt-6">
          You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
