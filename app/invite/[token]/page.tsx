"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface InviteDetails {
  invitation: { id: string; email: string; role: string; expires_at: string };
  board: { id: string; name: string } | null;
  inviter: { name: string | null; avatar_url: string | null } | null;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; details: InviteDetails; isLoggedIn: boolean }
  | { status: 'accepting' }
  | { status: 'accepted'; boardId: string }
  | { status: 'error'; message: string };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  // Load invitation details and check auth in parallel.
  useEffect(() => {
    if (!token) return;

    (async () => {
      const [detailsRes, session] = await Promise.all([
        fetch(`/api/invitations/${token}`),
        createClient().auth.getSession(),
      ]);

      if (!detailsRes.ok) {
        const { error } = await detailsRes.json();
        setState({ status: 'error', message: error ?? 'This invitation is invalid or has expired.' });
        return;
      }

      const details: InviteDetails = await detailsRes.json();
      setState({
        status: 'ready',
        details,
        isLoggedIn: !!session.data.session?.user,
      });
    })();
  }, [token]);

  const handleAccept = async () => {
    setState({ status: 'accepting' });

    const res = await fetch(`/api/invitations/${token}`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      setState({ status: 'error', message: data.error ?? 'Failed to accept invitation.' });
      return;
    }

    setState({ status: 'accepted', boardId: data.board_id });
    // Navigate to the board after a short beat so the user sees the success state.
    setTimeout(() => router.push(`/board/${data.board_id}`), 1200);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef3e2] to-[#fce7f3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl text-ink">
            Sparkurio
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
              <p className="text-sm text-ink-soft">Loading invitation…</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 stroke-red-400 stroke-2 fill-none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl text-ink mb-2">Invitation unavailable</h2>
              <p className="text-sm text-ink-soft mb-6">{state.message}</p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Go to Sparkurio
              </Link>
            </div>
          )}

          {(state.status === 'ready' || state.status === 'accepting') && (
            <>
              {/* Inviter info */}
              <div className="flex items-center gap-3 mb-6">
                {state.status === 'ready' && state.details.inviter?.avatar_url ? (
                  <img
                    src={state.details.inviter.avatar_url}
                    alt={state.details.inviter.name ?? ''}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EB6E80] to-[#E9B000] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {(state.status === 'ready' && state.details.inviter?.name?.[0]?.toUpperCase()) ?? '?'}
                  </div>
                )}
                <p className="text-sm text-ink">
                  <span className="font-medium">
                    {state.status === 'ready' && (state.details.inviter?.name ?? 'Someone')}
                  </span>{' '}
                  invited you to collaborate
                </p>
              </div>

              {/* Board name */}
              <div className="bg-ink/5 rounded-xl p-4 mb-6">
                <p className="text-xs text-ink-soft uppercase tracking-widest mb-1">Board</p>
                <p className="font-serif text-xl text-ink">
                  {state.status === 'ready' && (state.details.board?.name ?? 'Untitled board')}
                </p>
                <p className="text-xs text-ink-soft mt-1.5 capitalize">
                  Access level:{' '}
                  <span className="font-medium text-ink">
                    {state.status === 'ready' && state.details.invitation.role}
                  </span>
                </p>
              </div>

              {/* CTA */}
              {state.status === 'ready' && !state.isLoggedIn ? (
                <div className="space-y-3">
                  <p className="text-sm text-ink-soft text-center mb-4">
                    Log in or create an account to accept this invitation.
                  </p>
                  <Link
                    href={`/login?next=/invite/${token}`}
                    className="block w-full py-3 bg-papaya text-white text-center font-medium rounded-full hover:bg-papaya/90 transition-colors"
                  >
                    Log in to accept
                  </Link>
                  <Link
                    href={`/signup?next=/invite/${token}`}
                    className="block w-full py-3 bg-ink/5 text-ink text-center font-medium rounded-full hover:bg-ink/10 transition-colors"
                  >
                    Create a free account
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAccept}
                  disabled={state.status === 'accepting'}
                  className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.status === 'accepting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Joining…
                    </>
                  ) : (
                    'Accept invitation'
                  )}
                </button>
              )}
            </>
          )}

          {state.status === 'accepted' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 stroke-green-500 stroke-2 fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl text-ink mb-2">You&apos;re in!</h2>
              <p className="text-sm text-ink-soft">Taking you to the board…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
