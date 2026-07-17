"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmSchoolModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const res = await fetch("/api/school-verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school_email: email }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send verification email");
      return;
    }
    setSent(true);
  };

  const handleGoogle = async () => {
    setLinkingGoogle(true);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/settings?tab=educator&linked=google` },
    });
    if (error) {
      setError(error.message);
      setLinkingGoogle(false);
    }
    // On success the browser navigates away to Google, so no further state update needed here.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 stroke-green-500 stroke-2 fill-none" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="font-serif text-lg text-ink mb-2">Check your inbox</h3>
            <p className="text-sm text-ink-soft mb-6">
              We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Click it to confirm your school.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-ink/10 text-ink rounded-full text-sm font-medium hover:bg-ink/20 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-papaya/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 stroke-papaya stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink mb-1">Confirm your school</h3>
                <p className="text-sm text-ink-soft">Unlocks classroom-educator perks. We never display your school email publicly.</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">{error}</div>
            )}

            <button
              onClick={handleGoogle}
              disabled={linkingGoogle}
              className="w-full mb-2.5 px-4 py-3 border-2 border-ink/10 rounded-full text-sm font-medium text-ink hover:border-ink/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {linkingGoogle ? "Redirecting…" : "Verify with school Google account"}
            </button>
            <button
              disabled
              title="Coming soon — requires Microsoft account setup"
              className="w-full mb-5 px-4 py-3 border-2 border-ink/10 rounded-full text-sm font-medium text-ink/40 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Verify with school Microsoft account — coming soon
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-xs text-ink-soft">or use your school email</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            <form onSubmit={handleSendLink}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourschool.edu"
                required
                className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all mb-3"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full px-4 py-3 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send verification link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
