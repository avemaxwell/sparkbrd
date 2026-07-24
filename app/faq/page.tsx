"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { IconChevronDown } from "@/components/icons";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("faq");

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How is this different from that other teachers-selling-resources site?",
    a: (
      <>
        Fair question, and yes — we know what you&rsquo;re picturing. That site is huge, and plenty of what&rsquo;s
        on it is genuinely good. Here&rsquo;s the actual difference: Sparkurio isn&rsquo;t built around selling
        first. Free is the default, sharing comes before selling, and the whole trust system runs on real
        classroom results — <strong>Classroom Proven</strong>, <strong>Peer Reviewed</strong>,{" "}
        <strong>Verified Educator</strong> — not download counts or star ratings. If you want to sell, you can
        (Creator Pro keeps a 7% fee, not a cut that makes you wonder if listing is even worth it), but nobody
        has to. And when something hasn&rsquo;t actually been used in a classroom yet, we say so — see the next
        question — instead of dressing it up like it has.
      </>
    ),
  },
  {
    q: "Is Sparkurio actually free?",
    a: (
      <>
        Yes. The Free plan gets you real browsing, sharing, saving, and collections — no credit card, no trial
        clock running out. Sparkurio Plus adds things like unlimited private collections and downloads for
        power users; Creator Pro is only for people who want to sell their own resources. You can do a lot here
        without ever paying anything.
      </>
    ),
  },
  {
    q: "What's Sparkurio Labs, and why does it say \"untested\"?",
    a: (
      <>
        Labs is where new, AI-drafted lesson content lives before a real teacher has tried it in a real
        classroom. We&rsquo;d rather label it honestly than let it blend in next to resources that have actually
        been used. Try one, leave feedback, and it earns its way to Classroom Proven — the badge means something
        because it isn&rsquo;t handed out by default.
      </>
    ),
  },
  {
    q: "Can I sell my resources here?",
    a: (
      <>
        Yes, once you&rsquo;re on Creator Pro — that plan exists specifically for selling, and keeps our fee at
        7%. Sparkurio Plus and the Free plan let you upload and share resources freely, just not attach a price
        to them. It&rsquo;s a deliberate split: browsing and sharing shouldn&rsquo;t require a sales plan, but
        selling should be an intentional choice, not the default for everyone who signs up.
      </>
    ),
  },
  {
    q: "What's a Founding Educator?",
    a: (
      <>
        Someone who joined while we&rsquo;re still building this, and gets Sparkurio Plus free for a year for
        doing it — the only ask is publishing at least 5 resources a month, so the library actually grows with
        real content instead of staying empty while we wait for it to fill itself. You&rsquo;ll see a small badge
        next to their name wherever they show up.
      </>
    ),
  },
  {
    q: "Do you use AI to make resources?",
    a: (
      <>
        For the Starter Library and Labs content, yes — clearly labeled as such, and never presented as
        classroom-tested until it actually has been by a real teacher. Everything else is written and shared by
        educators. Read the full <Link href="/ai-policy" className="text-papaya underline">AI Policy</Link> for
        the details on how we handle AI-generated content and images across the site.
      </>
    ),
  },
  {
    q: "What do all the badges mean?",
    a: (
      <>
        <strong>Classroom Proven</strong> means real teachers have used it and vouched for it. <strong>Peer
        Reviewed</strong> means other educators have looked it over. <strong>Verified Educator</strong> means the
        creator confirmed a real school email. <strong>Sparkurio Official</strong> is finished, first-party
        content from our team. None of them are automatic — each one has to be earned.
      </>
    ),
  },
  {
    q: "There isn't that much here yet — is that normal?",
    a: (
      <>
        Yes, on purpose. We spent real effort ripping out placeholder content and fake numbers rather than
        padding the site to look bigger than it is — a thin, honest library beats a big, fake-looking one. It
        grows as real educators (including Founding Educators) share what actually works. Early is a phase, not
        a flaw.
      </>
    ),
  },
  {
    q: "How does Sparkurio make money?",
    a: (
      <>
        Mainly Plus and Creator Pro subscriptions, plus a 7% fee on Creator Pro sales. We&rsquo;re not ad-funded
        and we&rsquo;re not selling data — the incentive is to make the free tier and the paid tiers both
        genuinely worth using, not to squeeze the free one until people feel forced to upgrade.
      </>
    ),
  },
  {
    q: "Can my whole school or district use this?",
    a: (
      <>
        That&rsquo;s the District plan — SSO, private district and department libraries, and shared workspaces
        for teams and PLCs. It&rsquo;s custom pricing, so reach out from the{" "}
        <Link href="/settings/billing" className="text-papaya underline">pricing page</Link> and we&rsquo;ll talk
        specifics.
      </>
    ),
  },
];

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
      >
        <span className="font-serif font-semibold text-ink text-lg">{q}</span>
        <IconChevronDown
          className={`w-4 h-4 stroke-ink/40 stroke-[1.5] fill-none flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 -mt-1">
          <p className="text-ink/60 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="relative min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />
      <ShapeCorner className="absolute top-24 right-4 hidden lg:block" />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 md:pt-36">
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-ink leading-tight mb-4">
          Questions people are definitely going to ask.
        </h1>
        <p className="text-lg text-ink/60 leading-relaxed mb-12">
          So let&rsquo;s just answer them now, from the jump — including the one everyone&rsquo;s thinking.
        </p>

        <div className="space-y-3">
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        <div className="mt-14 bg-ink rounded-3xl p-8 text-center">
          <p className="text-white text-lg font-serif font-semibold mb-2">Still have a question?</p>
          <p className="text-white/60 text-sm mb-5">We&rsquo;re small enough right now that a real person reads every message.</p>
          <a
            href="mailto:hello@sparkurio.com"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-lime text-ink text-sm font-semibold rounded-full hover:bg-lime/90 transition-colors"
          >
            Email us
          </a>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
