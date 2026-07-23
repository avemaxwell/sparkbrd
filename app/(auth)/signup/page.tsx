"use client";

import { useMemo, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { resetUserCache } from "@/hooks/useUser";
import { STRIPE_PRICES } from "@/lib/stripe-plans";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ComingSoonModal from "@/components/ComingSoonModal";

const LOGO = "/logo.png";

const INTENT_COPY: Record<string, { tagline: string; heading: string; benefits: string[] }> = {
  share: {
    tagline: "Create a free account to share what works.",
    heading: "Create your free account",
    benefits: [
      "Share your own classroom-tested resources",
      "Save resources and build collections",
      "Follow educators whose work you trust",
      "Join a community of real teachers",
    ],
  },
  community: {
    tagline: "Create a free account to join the conversation.",
    heading: "Create your free account",
    benefits: [
      "Start threads and reply to other educators",
      "Save resources and build collections",
      "Follow educators whose work you trust",
      "Get notified when someone replies to you",
    ],
  },
};

type BillingPeriod = "monthly" | "annual";

function getPlans(billingPeriod: BillingPeriod) {
  return [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "",
      priceId: null as string | null,
      contactOnly: false,
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
      highlight: true,
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
      features: [
        "SSO & district administration",
        "Private district & department libraries",
        "PLC workspaces & curriculum alignment",
        "Analytics & implementation support",
      ],
    },
  ];
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null);
  const [foundingEducatorConsent, setFoundingEducatorConsent] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = INTENT_COPY[searchParams.get("intent") ?? ""];

  const PLANS = useMemo(() => getPlans(billingPeriod), [billingPeriod]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, founding_educator_consent: foundingEducatorConsent },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If a session came back, email confirmation is disabled — user is logged in
    if (data.session) {
      resetUserCache();
      if (foundingEducatorConsent) {
        fetch("/api/founding-educator/enroll", { method: "POST" }).catch(() => {});
      }
      // Founding Educators already get Plus for free via the enroll call
      // above — never send them to Stripe checkout, regardless of what's
      // selected in the plan grid below.
      const plan = foundingEducatorConsent ? null : PLANS.find(p => p.id === selectedPlan);
      if (plan?.contactOnly) {
        window.location.href = "mailto:admin@sparkurio.com?subject=District inquiry&body=Hi, I just signed up and I'm interested in Sparkurio for my district.";
      } else if (plan?.priceId) {
        // Redirect to Stripe checkout for paid plans
        try {
          const res = await fetch("/api/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priceId: plan.priceId }),
          });
          const { url } = await res.json();
          if (url) { window.location.href = url; return; }
        } catch {
          // Fall through to home if checkout fails
        }
      }
      const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
      router.push(redirectTo);
      router.refresh();
    } else {
      // Email confirmation required
      setSubmitted(true);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const isPaid = !plan.contactOnly && !!plan.priceId;
  const missingPriceId = !plan.contactOnly && plan.id !== "free" && !plan.priceId;

  if (submitted) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-8">
            <img src={LOGO} alt="Sparkurio" className="h-12 w-auto mx-auto" />
          </Link>
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="w-14 h-14 bg-papaya/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 stroke-papaya stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-ink mb-2">Check your email</h2>
            <p className="text-sm text-ink/50 mb-1">We sent a confirmation link to</p>
            <p className="text-sm font-medium text-ink mb-5">{email}</p>
            <p className="text-xs text-ink/40">
              Click the link to activate your account. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cork-warm py-12 px-4">
      <div className="w-full max-w-3xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src={LOGO} alt="Sparkurio" className="h-12 w-auto mx-auto" />
          </Link>
          <p className="text-ink/40 mt-2 text-sm">
            {intent ? intent.tagline : "Spark what inspires you."}
          </p>
        </div>

        {/* Founding Educator callout */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-lime bg-ink px-3 py-1.5 rounded-full mb-3">
            Founding Educator Access
          </span>
          <p className="text-ink/60 text-sm max-w-md mx-auto leading-relaxed mb-4">
            You&rsquo;re getting Sparkurio before anyone else. Help us build the resource library real classrooms actually want — your fingerprints will be on it.
          </p>
          <label className="flex items-start gap-2.5 max-w-md mx-auto text-left bg-white rounded-xl p-4 border border-black/5 shadow-sm cursor-pointer">
            <input
              type="checkbox"
              checked={foundingEducatorConsent}
              onChange={(e) => setFoundingEducatorConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-papaya flex-shrink-0"
            />
            <span className="text-xs text-ink/60 leading-relaxed">
              <strong className="text-ink">Get Sparkurio Plus free for 1 year</strong> as a Founding Educator — I understand I need to publish at least 5 resources every month to keep it. If I don&rsquo;t, my account moves to the Free plan.
            </span>
          </label>
        </div>

        {/* Intent-driven benefits callout */}
        {intent && (
          <div className="mb-8 bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
            <p className="font-serif font-semibold text-ink mb-3">Why create an account?</p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {intent.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink/60">
                  <svg className="w-4 h-4 stroke-papaya stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink/40 mt-4">
              It&rsquo;s free — no credit card required. You can always upgrade later for unlimited downloads and more.
            </p>
          </div>
        )}

        {/* Plan selector — hidden for Founding Educators, who already get
            Plus free; showing a paid-plan picker next to that would be
            confusing (and risk sending them to Stripe checkout for a plan
            they're not paying for). */}
        {foundingEducatorConsent ? (
          <div className="mb-6 text-center bg-lime/15 rounded-2xl p-4 max-w-md mx-auto">
            <p className="text-sm text-ink/70">
              You&rsquo;re all set with <strong>Sparkurio Plus, free</strong> for your first year — no card required.
            </p>
          </div>
        ) : (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <p className="text-center text-xs text-ink/40 uppercase tracking-widest">Choose your plan</p>
          </div>

          {/* Monthly / annual toggle — only meaningfully affects Plus */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${billingPeriod === "monthly" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${billingPeriod === "annual" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
            >
              Annual <span className="text-lime">· save ~26%</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => p.comingSoon ? setComingSoonPlan(p.name) : setSelectedPlan(p.id)}
                className={`relative rounded-2xl p-4 border-2 text-left transition-all ${
                  p.comingSoon
                    ? "border-ink/8 bg-white/40 opacity-70 hover:border-ink/20"
                    : selectedPlan === p.id
                    ? "border-papaya bg-white shadow-md shadow-papaya/10"
                    : "border-ink/8 bg-white/60 hover:border-ink/20"
                }`}
              >
                {p.comingSoon && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-ink/70 text-white text-[10px] font-semibold rounded-full">
                    Coming soon
                  </span>
                )}
                {p.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-papaya text-white text-[10px] font-semibold rounded-full">
                    Popular
                  </span>
                )}
                {selectedPlan === p.id && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-papaya flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-white stroke-[2.5] fill-none" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
                <p className="font-serif text-base text-ink">{p.name}</p>
                <div className="flex items-baseline gap-0.5 mt-0.5 mb-3">
                  <span className="text-xl font-bold text-ink">{p.price}</span>
                  {p.period && <span className="text-xs text-ink/40">{p.period}</span>}
                </div>
                <ul className="space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-ink/50 leading-snug">
                      <svg className="w-3 h-3 stroke-papaya stroke-2 fill-none flex-shrink-0 mt-px" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Signup form */}
        <form onSubmit={handleSignup} className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl text-ink mb-6">
            {intent ? intent.heading : "Create your account"}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-ink/50 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              placeholder="Your name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-ink/50 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-ink/50 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || missingPriceId}
            className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Creating account..."
              : plan.contactOnly
              ? "Create account — we'll be in touch"
              : isPaid
              ? `Continue to ${plan.name} — ${plan.price}${plan.period}`
              : "Start for free"}
          </button>

          {missingPriceId && (
            <p className="text-center text-xs text-red-500 mt-3">
              Checkout for {plan.name} isn&apos;t configured yet.
            </p>
          )}

          {isPaid && !missingPriceId && (
            <p className="text-center text-xs text-ink/30 mt-3">
              You&apos;ll be taken to a secure checkout page. Cancel anytime.
            </p>
          )}

          <p className="text-center text-xs text-ink/40 mt-4 leading-relaxed">
            Sparkurio is a space for human creativity.{" "}
            <Link href="/ai-policy" target="_blank" className="underline hover:text-ink/60 transition-colors">
              Learn how we handle AI-generated images.
            </Link>
          </p>

          <p className="text-center text-sm text-ink/50 mt-5 pt-5 border-t border-ink/5">
            Already have an account?{" "}
            <Link href="/login" className="text-papaya font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-ink/30 mt-4">
          {foundingEducatorConsent
            ? "You can upgrade, downgrade, or leave the Founding Educator program anytime from settings."
            : "All accounts start with the selected plan. Upgrade or downgrade anytime from settings."}
        </p>
      </div>

      {comingSoonPlan && <ComingSoonModal planName={comingSoonPlan} onClose={() => setComingSoonPlan(null)} />}
    </div>
  );
}
