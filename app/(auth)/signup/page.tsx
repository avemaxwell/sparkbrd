"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resetUserCache } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: ["10 boards", "50 tacks per board", "4 background presets"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$8",
    period: "/ month",
    highlight: true,
    features: ["Unlimited boards", "200 tacks per board", "Custom colors", "Export boards", "No branding"],
  },
  {
    id: "team",
    name: "Team",
    price: "$15",
    period: "/ month",
    highlight: false,
    features: ["Everything in Pro", "Unlimited tacks", "Real-time collaboration", "Team workspace"],
  },
];

export default function SignupPage() {
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
    } else if (data.session) {
      // Email confirmation is disabled — user is already signed in
      resetUserCache();
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation required — show "check your email"
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-block">
            <img
              src="https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/assets/logo.png"
              alt="Sparkurio"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <div className="mt-8 bg-white rounded-2xl p-8 shadow-xl">
            <div className="w-14 h-14 bg-papaya/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 stroke-papaya stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-ink mb-2">Check your email</h2>
            <p className="text-sm text-ink/50 mb-1">
              We sent a confirmation link to
            </p>
            <p className="text-sm font-medium text-ink mb-5">{email}</p>
            <p className="text-xs text-ink/40">
              Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cork-warm py-12 px-4">
      <div className="w-full max-w-xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="https://vqaaxqvyepouqcrxduiw.supabase.co/storage/v1/object/public/assets/logo.png"
              alt="Sparkurio"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <p className="text-ink/40 mt-2 text-sm">Spark what inspires you.</p>
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
            {loading ? "Creating account..." : "Start for free"}
          </button>

          <p className="text-center text-xs text-ink/30 mt-4">
            Start free — upgrade at any time.
          </p>

          <p className="text-center text-sm text-ink/50 mt-5 pt-5 border-t border-ink/5">
            Already have an account?{" "}
            <Link href="/login" className="text-papaya font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        {/* Pricing tiers */}
        <div className="mt-10">
          <p className="text-center text-xs text-ink/30 uppercase tracking-widest mb-5">Plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-4 border-2 transition-all ${
                  plan.highlight
                    ? "border-papaya bg-white shadow-lg shadow-papaya/10"
                    : "border-ink/8 bg-white/60"
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-[10px] font-semibold text-papaya tracking-wide uppercase mb-2">
                    Popular
                  </span>
                )}
                <p className="font-serif text-lg text-ink leading-none">{plan.name}</p>
                <div className="flex items-baseline gap-0.5 mt-1 mb-3">
                  <span className="text-xl font-bold text-ink">{plan.price}</span>
                  <span className="text-xs text-ink/40">{plan.period}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-ink/50">
                      <svg className="w-3.5 h-3.5 stroke-papaya stroke-2 fill-none flex-shrink-0 mt-px" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-ink/30 mt-4">
            All accounts start on the Free plan. Upgrade anytime from settings.
          </p>
        </div>
      </div>
    </div>
  );
}
