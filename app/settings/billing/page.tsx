"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { STRIPE_PRICES } from "@/lib/stripe-plans";
import { planDisplayName } from "@/lib/plan-limits";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ComingSoonModal from "@/components/ComingSoonModal";

function Check() {
  return (
    <svg className="w-5 h-5 stroke-green-600 stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

type BillingPeriod = "monthly" | "annual";

// One brand shape per plan (public/shapes/*, the same asterisk/flower/
// quatrefoil set the resource hero uses in app/resources/[id]/page.tsx),
// but treated the way that hero treats it — one large, quiet watermark
// bleeding off the edge at low opacity, not a saturated full-card fill.
// Cards stay white/neutral. `logo` points at public/plans/*.png — each is a
// full icon+wordmark lockup, so it's shown at real size, not squeezed into
// a small icon chip.
function getPlans(billingPeriod: BillingPeriod) {
  return [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "",
      priceId: null as string | null,
      contactOnly: false,
      shape: "/shapes/flower-blush.png",
      logo: "/plans/free.png",
      features: [
        "Unlimited browsing & search",
        "Unlimited resource previews",
        "Save resources & unlimited public collections",
        "Follow educators",
        "Participate in Sparkurio Labs",
        "Limited monthly downloads",
      ],
    },
    {
      id: "plus",
      name: "Sparkurio Plus",
      price: billingPeriod === "annual" ? "$107" : "$11.99",
      period: billingPeriod === "annual" ? "/yr" : "/mo",
      priceId: billingPeriod === "annual" ? STRIPE_PRICES.plusAnnual : STRIPE_PRICES.plusMonthly,
      contactOnly: false,
      popular: true,
      shape: "/shapes/asterisk-lavender.png",
      logo: "/plans/plus.png",
      features: [
        "Unlimited downloads",
        "Unlimited private collections",
        "Smart organization — tags, favorites, archive",
        "Offline access",
        "Advanced & saved searches",
        "Early access to new features",
      ],
    },
    {
      id: "creator_pro",
      name: "Creator Pro",
      price: "$24.99",
      period: "/mo",
      priceId: STRIPE_PRICES.creatorProMonthly,
      contactOnly: false,
      shape: "/shapes/asterisk-mustard.png",
      logo: "/plans/creator-pro.png",
      features: [
        "Everything in Plus",
        "Sales dashboard & revenue tracking",
        "Bulk uploads & scheduled publishing",
        "Portfolio customization",
        "Lower marketplace commission (7%)",
      ],
    },
    {
      id: "homeschool_plus",
      name: "Homeschool+",
      price: billingPeriod === "annual" ? "$149" : "$14.99",
      period: billingPeriod === "annual" ? "/yr" : "/mo",
      priceId: billingPeriod === "annual" ? STRIPE_PRICES.homeschoolAnnual : STRIPE_PRICES.homeschoolMonthly,
      contactOnly: false,
      comingSoon: true,
      shape: "/shapes/flower-lime.png",
      logo: "/plans/homeschool.png",
      features: [
        "Everything in Plus",
        "Pacing & scheduling tools",
        "Family-friendly planning views",
        "Homeschool-specific recommendations",
      ],
    },
    {
      id: "district",
      name: "District",
      price: "Custom",
      period: "",
      priceId: null as string | null,
      contactOnly: true,
      shape: "/shapes/quatrefoil-ink.png",
      logo: "/plans/district.png",
      features: [
        "SSO & district administration",
        "Private district & department libraries",
        "PLC workspaces & curriculum alignment",
        "Analytics & implementation support",
      ],
    },
  ];
}

export default function BillingPage() {
  const { profile, loading } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [upgrading, setUpgrading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const PLANS = useMemo(() => getPlans(billingPeriod), [billingPeriod]);

  const proceedToCheckout = async (priceId: string) => {
    setUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
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

  const proceedToDowngrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/downgrade', { method: 'POST' });
      if (response.ok) { router.push('/settings?downgraded=true'); router.refresh(); }
      else alert('Failed to downgrade. Please try again.');
    } catch {
      alert('Failed to downgrade. Please try again.');
    }
    setUpgrading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lime/8 flex items-center justify-center">
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
    <div className="min-h-screen bg-lime/8">
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
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl mb-3">Compare Plans</h1>
          <p className="text-ink/60">Sparkurio charges for workflow and convenience — never for access to knowledge.</p>
        </div>

        {currentPlan !== 'free' && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-sm text-green-800">
              You&apos;re on the <strong>{planDisplayName(currentPlan as any)}</strong> plan
            </p>
          </div>
        )}

        {/* Monthly / annual toggle — affects Plus pricing */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingPeriod === "monthly" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingPeriod === "annual" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
          >
            Annual <span className="text-green-600">· save ~26%</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.id;
            const missingPriceId = !p.contactOnly && p.id !== 'free' && !p.priceId;

            return (
              <div key={p.id} className={`relative overflow-hidden rounded-3xl p-6 bg-white shadow-sm transition-shadow hover:shadow-md h-full flex flex-col ${isCurrent ? 'border-2 border-papaya' : p.popular ? 'border-2 border-ink/15' : 'border border-ink/10'}`}>
                <img
                  src={p.shape}
                  alt=""
                  className="absolute -top-6 -right-6 w-32 h-32 opacity-[0.07] pointer-events-none"
                  draggable={false}
                />

                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 bg-papaya text-white text-xs font-semibold rounded-full">Popular</span>
                  </div>
                )}

                <div className="relative mb-6">
                  <img
                    src={p.logo}
                    alt=""
                    className="w-20 h-20 object-contain mb-3 -ml-1"
                    draggable={false}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <h2 className="text-xl font-semibold mb-2 text-ink">{p.name}</h2>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className={p.price === 'Custom' ? 'text-3xl font-bold text-ink/70' : 'text-4xl font-bold text-ink'}>{p.price}</span>
                    {p.period && <span className="text-ink/50 text-sm">{p.period}</span>}
                  </div>
                </div>

                <ul className="relative flex-1 space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check /><span className="text-ink/70 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="h-20 flex items-center">
                  {p.comingSoon ? (
                    <button
                      onClick={() => setComingSoonPlan(p.name)}
                      className="w-full px-6 py-3 border-2 border-ink/20 text-ink/60 rounded-full font-medium hover:border-ink/40 transition-colors"
                    >
                      Coming soon
                    </button>
                  ) : isCurrent ? (
                    <div className="w-full px-4 py-3 bg-ink/5 rounded-full text-center text-sm text-ink/60 font-medium">
                      Current plan
                    </div>
                  ) : p.contactOnly ? (
                    <a
                      href="mailto:admin@sparkurio.com?subject=District inquiry"
                      className="block w-full px-6 py-3 border-2 border-ink/20 text-ink rounded-full font-medium hover:border-ink/40 transition-colors text-center"
                    >
                      Contact us
                    </a>
                  ) : p.id === 'free' ? (
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={upgrading}
                      className="w-full px-6 py-3 border-2 border-ink/20 text-ink rounded-full font-medium hover:border-ink/40 transition-colors disabled:opacity-50"
                    >
                      Downgrade to Free
                    </button>
                  ) : missingPriceId ? (
                    <div className="w-full px-4 py-3 bg-red-50 text-red-500 rounded-full text-center text-xs font-medium">
                      Checkout not configured
                    </div>
                  ) : (
                    <button
                      onClick={() => proceedToCheckout(p.priceId!)}
                      disabled={upgrading}
                      className="w-full px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
                    >
                      {upgrading ? 'Processing...' : `Upgrade to ${p.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
              <summary className="font-medium cursor-pointer">What happens to my private collections if I downgrade?</summary>
              <p className="text-sm text-ink/60 mt-2">Nothing is deleted. Your existing collections stay exactly as they are — you just won&apos;t be able to create new private ones until you upgrade again.</p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-ink/5">
              <summary className="font-medium cursor-pointer">Do you offer refunds?</summary>
              <p className="text-sm text-ink/60 mt-2">All purchases are final and non-refundable.</p>
            </details>
          </div>
        </div>
      </div>

      {/* Downgrade confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-serif text-xl mb-2">Downgrade to Free?</h3>
            <p className="text-sm text-ink/60 mb-4">
              You&apos;ll lose unlimited downloads and the ability to create new private collections. Nothing you&apos;ve already made is deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); proceedToDowngrade(); }}
                disabled={upgrading}
                className="flex-1 px-4 py-2.5 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Processing…' : 'Yes, downgrade'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {comingSoonPlan && <ComingSoonModal planName={comingSoonPlan} onClose={() => setComingSoonPlan(null)} />}
    </div>
  );
}
