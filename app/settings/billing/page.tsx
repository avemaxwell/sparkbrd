"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Check({ locked }: { locked?: boolean }) {
  return locked ? (
    <svg className="w-5 h-5 stroke-ink/20 stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"/>
      <path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ) : (
    <svg className="w-5 h-5 stroke-green-600 stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-papaya/10 text-papaya/80 whitespace-nowrap">
      {label}
    </span>
  );
}

export default function BillingPage() {
  const { profile, loading } = useUser();
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout. Please try again.');
    }
    setUpgrading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <p className="text-ink-soft">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    router.push('/login');
    return null;
  }

  const currentPlan = profile.plan || 'free';

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <header className="border-b border-ink/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/settings" className="text-ink/60 hover:text-ink transition-colors flex items-center gap-2">
            <svg className="w-5 h-5 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Settings
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl mb-3">Compare Plans</h1>
          <p className="text-ink/60">Choose the plan that works for you</p>
        </div>

        {currentPlan !== 'free' && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-sm text-green-800">
              You&apos;re on the <strong className="capitalize">{currentPlan}</strong> plan
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">

          {/* ── Free ── */}
          <div className={`relative border-2 rounded-2xl p-8 ${currentPlan === 'free' ? 'border-papaya bg-papaya/5' : 'border-ink/10 bg-white'}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Free</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">$0</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check /><span className="text-ink/70">5 boards</span>
              </li>
              <li className="flex items-start gap-3">
                <Check /><span className="text-ink/70">25 tacks per board</span>
              </li>
              <li className="flex items-start gap-3">
                <Check /><span className="text-ink/70">Basic backgrounds</span>
              </li>

              {/* Locked Pro features */}
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">50 boards</span><Badge label="Pro" />
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">200 tacks per board</span><Badge label="Pro" />
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">Custom colors</span><Badge label="Pro" />
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">No branding</span><Badge label="Pro" />
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">Export boards</span><Badge label="Pro" />
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">Real-time collaboration</span><Badge label="Team" />
              </li>
            </ul>

            {currentPlan === 'free' ? (
              <div className="px-4 py-3 bg-ink/5 rounded-full text-center text-sm text-ink/60 font-medium">
                Current plan
              </div>
            ) : (
              <div className="px-4 py-3 bg-ink/5 rounded-full text-center text-sm text-ink/40 font-medium">
                Free
              </div>
            )}
          </div>

          {/* ── Pro ── */}
          <div className={`relative border-2 rounded-2xl p-8 ${currentPlan === 'pro' ? 'border-papaya bg-papaya/5' : 'border-ink/10 bg-white'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-papaya text-white text-xs font-semibold rounded-full">Popular</span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">$10</span>
                <span className="text-ink/60">/mo</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">50 boards</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">200 tacks per board</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Custom colors</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">No branding</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Export boards</span></li>
              {/* Locked Team feature */}
              <li className="flex items-center gap-3 opacity-50">
                <Check locked /><span className="text-ink/50 line-through text-sm">Real-time collaboration</span><Badge label="Team" />
              </li>
            </ul>

            {currentPlan === 'pro' ? (
              <div className="px-4 py-3 bg-ink/5 rounded-full text-center text-sm text-ink/60 font-medium">
                Current plan
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade('price_1T6yOFFGrjyNBgsd4j26d5Ve')}
                disabled={upgrading}
                className="w-full px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Processing...' : currentPlan === 'team' ? 'Downgrade to Pro' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

          {/* ── Team ── */}
          <div className={`relative border-2 rounded-2xl p-8 ${currentPlan === 'team' ? 'border-papaya bg-papaya/5' : 'border-ink/10 bg-white'}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Team</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">$15</span>
                <span className="text-ink/60">/mo</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Everything in Pro</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Unlimited boards</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Unlimited tacks</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Real-time collaboration</span></li>
              <li className="flex items-start gap-3"><Check /><span className="text-ink/70">Team workspace</span></li>
            </ul>

            {currentPlan === 'team' ? (
              <div className="px-4 py-3 bg-ink/5 rounded-full text-center text-sm text-ink/60 font-medium">
                Current plan
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade('price_1T6yOoFGrjyNBgsdRbarGcc3')}
                disabled={upgrading}
                className="w-full px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Processing...' : 'Upgrade to Team'}
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="font-serif text-2xl mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-4 border border-ink/5">
              <summary className="font-medium cursor-pointer">Can I cancel anytime?</summary>
              <p className="text-sm text-ink/60 mt-2">Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.</p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-ink/5">
              <summary className="font-medium cursor-pointer">What happens to my boards if I downgrade?</summary>
              <p className="text-sm text-ink/60 mt-2">Your boards and content remain safe. Boards beyond the free limit will be deleted oldest-first automatically.</p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-ink/5">
              <summary className="font-medium cursor-pointer">Do you offer refunds?</summary>
              <p className="text-sm text-ink/60 mt-2">All purchases are final and non-refundable.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
