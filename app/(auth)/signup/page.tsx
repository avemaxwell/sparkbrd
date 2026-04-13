"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resetUserCache } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LOGO = "https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/assets/logo.png";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    priceId: null,
    features: ["5 boards", "25 tacks per board", "Basic backgrounds"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$10",
    period: "/mo",
    priceId: "price_1THWhJ2WmfLDfFrx11odjF0b",
    highlight: true,
    features: ["50 boards", "200 tacks per board", "Custom colors", "No branding", "Export boards"],
  },
  {
    id: "team",
    name: "Team",
    price: "$18",
    period: "/mo",
    priceId: "price_1THWhM2WmfLDfFrxIaNUyoV3",
    features: ["Everything in Pro", "Unlimited boards & tacks", "Real-time collaboration", "Team workspace"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    priceId: null,
    features: ["Everything in Team", "Custom pricing", "Dedicated support"],
  },
];

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
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
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan?.priceId) {
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
      } else if (selectedPlan === "enterprise") {
        // Open mailto so they can reach out, then go home
        window.location.href = "mailto:admin@sparkurio.com?subject=Enterprise inquiry&body=Hi, I just signed up and I'm interested in an Enterprise plan.";
      }
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation required
      setSubmitted(true);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const isPaid = !!plan.priceId;

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
      <div className="w-full max-w-2xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src={LOGO} alt="Sparkurio" className="h-12 w-auto mx-auto" />
          </Link>
          <p className="text-ink/40 mt-2 text-sm">Spark what inspires you.</p>
        </div>

        {/* Plan selector */}
        <div className="mb-6">
          <p className="text-center text-xs text-ink/40 uppercase tracking-widest mb-4">Choose your plan</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={`relative rounded-2xl p-4 border-2 text-left transition-all ${
                  selectedPlan === p.id
                    ? "border-papaya bg-white shadow-md shadow-papaya/10"
                    : "border-ink/8 bg-white/60 hover:border-ink/20"
                }`}
              >
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

        {/* Signup form */}
        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl text-ink mb-6">Create your account</h1>

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
            disabled={loading}
            className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Creating account..."
              : selectedPlan === "enterprise"
              ? "Create account — we'll be in touch"
              : isPaid
              ? `Continue to ${plan.name} — ${plan.price}${plan.period}`
              : "Start for free"}
          </button>

          {isPaid && (
            <p className="text-center text-xs text-ink/30 mt-3">
              You&apos;ll be taken to a secure checkout page. Cancel anytime.
            </p>
          )}

          <p className="text-center text-sm text-ink/50 mt-5 pt-5 border-t border-ink/5">
            Already have an account?{" "}
            <Link href="/login" className="text-papaya font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-ink/30 mt-4">
          All accounts start with the selected plan. Upgrade or downgrade anytime from settings.
        </p>
      </div>
    </div>
  );
}
