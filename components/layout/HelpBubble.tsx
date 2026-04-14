"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HelpBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Try to pre-fill email from Supabase session (best effort, no hard dependency)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) setEmail(data.user.email);
      } catch {
        // not logged in or error — leave blank
      }
    })();
  }, [open]);

  // Hide on board pages — the canvas has its own fixed controls in the same spot
  if (pathname?.startsWith("/board/")) return null;

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      setSendError("Couldn't send your message. Please try again or email admin@sparkurio.com directly.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setSendError(null);
      setMessage("");
    }, 300);
  };

  return (
    <>
      {/* Bubble button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 lg:left-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-full shadow-lg hover:bg-ink/90 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        aria-label="Help"
      >
        <svg className="w-4 h-4 stroke-white stroke-[1.5] fill-none flex-shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Help
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-start p-4 sm:p-6 pointer-events-none"
          style={{ bottom: 'env(safe-area-inset-bottom)' }}
        >
          <div
            className="pointer-events-auto w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-ink/5">
              <div>
                <p className="font-semibold text-ink text-base">Need help?</p>
                <p className="text-xs text-ink/40 mt-0.5">We&apos;re here for you</p>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
              >
                <svg className="w-4 h-4 stroke-ink/40 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-5">
              {/* Launch notice */}
              <div className="bg-papaya/8 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-ink/70 leading-relaxed">
                  <span className="font-semibold text-ink/90">We&apos;re in our early launch phase.</span>{" "}
                  A few rough edges are expected as we grow — we&apos;re working around the clock to make sure your experience is smooth. Thank you for being here.
                </p>
              </div>

              {sent ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 stroke-green-600 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p className="font-semibold text-ink mb-1">Message sent!</p>
                  <p className="text-xs text-ink/50 mb-4">We&apos;ll get back to you as soon as we can.</p>
                  <button
                    onClick={handleClose}
                    className="px-5 py-2 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-ink/50 mb-1.5">What&apos;s going on?</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what happened or what you need help with..."
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all placeholder:text-ink/30"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-ink/50 mb-1.5">Your email <span className="font-normal text-ink/30">(so we can follow up)</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 text-sm bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/30"
                    />
                  </div>
                  {sendError && (
                    <p className="text-xs text-red-500 mb-3">{sendError}</p>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    className="w-full py-2.5 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors disabled:opacity-40"
                  >
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}
