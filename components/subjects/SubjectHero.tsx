"use client";

import Link from "next/link";
import type { SubjectDef } from "@/lib/subjects";
import { Blob, IconBlob } from "@/components/home/decor";
import { IconChevronRight } from "@/components/icons";

export default function SubjectHero({ subject }: { subject: SubjectDef }) {
  const accentLabels = subject.subcategories.slice(1, 3);
  const isLight = subject.textOn === "ink";

  const textPrimary = isLight ? "text-ink" : "text-white";
  const textSecondary = isLight ? "text-ink/60" : "text-white/75";
  const textMuted = isLight ? "text-ink/50" : "text-white/60";
  const textCrumbActive = isLight ? "text-ink/70" : "text-white/90";
  const crumbHover = isLight ? "hover:text-ink" : "hover:text-white";

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: subject.color }}>
      <Blob className="absolute -top-16 -right-20 w-64 h-64 bg-white/15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-14 md:pt-36 md:pb-16">
        <div className={`flex items-center gap-1.5 text-sm ${textMuted} mb-6`}>
          <Link href="/" className={`transition-colors ${crumbHover}`}>Home</Link>
          <IconChevronRight className="w-3.5 h-3.5" />
          <span>Subjects</span>
          <IconChevronRight className="w-3.5 h-3.5" />
          <span className={`font-medium ${textCrumbActive}`}>{subject.name}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-center">
          <div>
            <h1 className={`font-serif font-bold text-4xl md:text-6xl leading-[1.05] ${textPrimary}`}>{subject.name}</h1>
            <p className={`mt-4 text-lg max-w-lg leading-relaxed ${textSecondary}`}>{subject.description}</p>

            <div className="mt-7 flex items-center gap-3">
              <a
                href="#resources"
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full transition-colors ${
                  isLight ? "bg-ink text-white hover:bg-ink/85" : "bg-white text-ink hover:bg-white/90"
                }`}
              >
                Browse Resources
              </a>
            </div>
          </div>

          <div className="relative hidden lg:flex items-center justify-center h-64">
            <IconBlob
              icon={<subject.icon className="w-full h-full" />}
              blobClassName="bg-white"
              size={148}
              iconStyle={{ color: subject.color }}
            />
            {accentLabels.map((cat, i) => (
              <div
                key={cat.slug}
                className={`absolute bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-black/5 ${i === 0 ? "-top-2 -left-4 -rotate-6" : "-bottom-2 -right-2 rotate-6"}`}
              >
                <p className="font-serif font-semibold text-xs text-ink whitespace-nowrap">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
