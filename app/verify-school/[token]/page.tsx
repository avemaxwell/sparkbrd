"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resetUserCache } from "@/hooks/useUser";

interface VerificationDetails {
  school_email: string;
  institution_name: string | null;
  already_verified: boolean;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; details: VerificationDetails; isLoggedIn: boolean }
  | { status: 'confirming' }
  | { status: 'confirmed' }
  | { status: 'error'; message: string };

export default function VerifySchoolPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!token) return;

    (async () => {
      const [detailsRes, session] = await Promise.all([
        fetch(`/api/school-verifications/${token}`),
        createClient().auth.getSession(),
      ]);

      if (!detailsRes.ok) {
        const { error } = await detailsRes.json();
        setState({ status: 'error', message: error ?? 'This verification link is invalid or has expired.' });
        return;
      }

      const details: VerificationDetails = await detailsRes.json();
      setState({
        status: 'ready',
        details,
        isLoggedIn: !!session.data.session?.user,
      });
    })();
  }, [token]);

  const handleConfirm = async () => {
    setState({ status: 'confirming' });

    const res = await fetch(`/api/school-verifications/${token}`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      setState({ status: 'error', message: data.error ?? 'Failed to confirm this email.' });
      return;
    }

    resetUserCache();
    setState({ status: 'confirmed' });
    setTimeout(() => router.push('/settings?tab=educator'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime/40 to-lavender/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Sparkurio" className="h-8 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
              <p className="text-sm text-ink-soft">Loading…</p>
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
              <h2 className="font-serif text-xl text-ink mb-2">Link unavailable</h2>
              <p className="text-sm text-ink-soft mb-6">{state.message}</p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Go to Sparkurio
              </Link>
            </div>
          )}

          {(state.status === 'ready' || state.status === 'confirming') && (
            <>
              <div className="bg-ink/5 rounded-xl p-4 mb-6">
                <p className="text-xs text-ink-soft uppercase tracking-widest mb-1">Confirming</p>
                <p className="font-serif text-lg text-ink break-all">
                  {state.status === 'ready' && state.details.school_email}
                </p>
              </div>

              {state.status === 'ready' && !state.isLoggedIn ? (
                <div className="space-y-3">
                  <p className="text-sm text-ink-soft text-center mb-4">
                    Log in to the Sparkurio account you requested this from to confirm.
                  </p>
                  <Link
                    href={`/login?next=/verify-school/${token}`}
                    className="block w-full py-3 bg-papaya text-white text-center font-medium rounded-full hover:bg-papaya/90 transition-colors"
                  >
                    Log in to confirm
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={state.status === 'confirming'}
                  className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.status === 'confirming' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    'Confirm your school'
                  )}
                </button>
              )}
            </>
          )}

          {state.status === 'confirmed' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 stroke-green-500 stroke-2 fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl text-ink mb-2">You&apos;re confirmed!</h2>
              <p className="text-sm text-ink-soft">Taking you to your teaching profile…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
