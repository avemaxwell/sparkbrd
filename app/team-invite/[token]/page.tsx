"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TeamInviteDetails {
  invitation: {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    team: { id: string; name: string; slug: string; avatar_color: string } | null;
    inviter: { name: string | null; avatar_url: string | null } | null;
  };
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; details: TeamInviteDetails; isLoggedIn: boolean }
  | { status: 'accepting' }
  | { status: 'accepted'; teamSlug: string; teamName: string }
  | { status: 'error'; message: string };

export default function TeamInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!token) return;

    (async () => {
      const [detailsRes, session] = await Promise.all([
        fetch(`/api/team-invitations/${token}`),
        createClient().auth.getSession(),
      ]);

      if (!detailsRes.ok) {
        const { error } = await detailsRes.json();
        setState({ status: 'error', message: error ?? 'This invitation is invalid or has expired.' });
        return;
      }

      const details: TeamInviteDetails = await detailsRes.json();
      setState({
        status: 'ready',
        details,
        isLoggedIn: !!session.data.session?.user,
      });
    })();
  }, [token]);

  const handleAccept = async () => {
    setState({ status: 'accepting' });

    const res = await fetch(`/api/team-invitations/${token}`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      setState({ status: 'error', message: data.error ?? 'Failed to accept invitation.' });
      return;
    }

    const teamSlug = data.team?.slug ?? '';
    const teamName = data.team?.name ?? 'your team';
    setState({ status: 'accepted', teamSlug, teamName });
    setTimeout(() => router.push(`/team/${teamSlug}`), 1200);
  };

  const invitation = state.status === 'ready' ? state.details.invitation : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime/40 to-lavender/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.png" alt="Sparkurio" className="h-10 mx-auto" />
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

          {(state.status === 'ready' || state.status === 'accepting') && invitation && (
            <>
              {/* Team avatar + inviter */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                  style={{ backgroundColor: invitation.team?.avatar_color ?? '#4C4DFF' }}
                >
                  {invitation.team?.name?.[0]?.toUpperCase() ?? 'T'}
                </div>
                <div>
                  <p className="font-medium text-ink">{invitation.team?.name ?? 'A team'}</p>
                  <p className="text-xs text-ink-soft">
                    Invited by{' '}
                    <span className="font-medium">{invitation.inviter?.name ?? 'Someone'}</span>
                  </p>
                </div>
              </div>

              {/* Role card */}
              <div className="bg-ink/5 rounded-xl p-4 mb-6">
                <p className="text-xs text-ink-soft uppercase tracking-widest mb-1">Your role</p>
                <p className="font-medium text-ink capitalize">{invitation.role}</p>
                <p className="text-xs text-ink-soft mt-1.5">
                  {invitation.role === 'admin'
                    ? 'You can manage members, invite others, and access all team collections.'
                    : 'You can view and collaborate on all team collections.'}
                </p>
              </div>

              {/* Invited email notice */}
              <p className="text-xs text-ink-soft text-center mb-5">
                This invitation was sent to{' '}
                <span className="font-medium text-ink">{invitation.email}</span>
              </p>

              {state.status === 'ready' && !state.isLoggedIn ? (
                <div className="space-y-3">
                  <p className="text-sm text-ink-soft text-center mb-4">
                    Log in or create an account to join the team.
                  </p>
                  <Link
                    href={`/login?next=/team-invite/${token}`}
                    className="block w-full py-3 bg-papaya text-white text-center font-medium rounded-full hover:bg-papaya/90 transition-colors"
                  >
                    Log in to accept
                  </Link>
                  <Link
                    href={`/signup?next=/team-invite/${token}`}
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
                    `Join ${invitation.team?.name ?? 'the team'}`
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
              <h2 className="font-serif text-xl text-ink mb-2">Welcome to the team!</h2>
              <p className="text-sm text-ink-soft">Taking you to {state.teamName}…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
