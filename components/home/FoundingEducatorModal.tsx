"use client";

import Link from "next/link";
import { Blob, IconBlob, SparkBurst, Clover, CheckerDots } from "./decor";
import { IconGraduationCap, IconBook, IconPencil } from "@/components/icons";

export default function FoundingEducatorModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FBF6EE] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-4 h-4 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Decorative back-to-school band — white/blush accents rather than
            lavender-on-lime, which reads as a muddy olive smear rather than
            an intentional shape once blended */}
        <div className="relative overflow-hidden bg-lime h-44">
          <div className="absolute -top-10 -left-10 animate-float-slow">
            <Blob className="w-32 h-32 bg-white/50 pointer-events-none" />
          </div>
          <div className="absolute -bottom-14 -right-10 animate-float-slow [animation-delay:1.5s]">
            <Blob className="w-36 h-36 bg-blush/25 pointer-events-none" />
          </div>
          <div className="absolute top-6 left-8" style={{ transform: "rotate(-12deg)" }}>
            <SparkBurst className="w-7 h-7 animate-pulse-soft" />
          </div>
          <div className="absolute bottom-8 right-10" style={{ transform: "rotate(18deg)" }}>
            <SparkBurst className="w-6 h-6 animate-pulse-soft [animation-delay:2s]" />
          </div>
          <Clover className="absolute top-4 right-6 w-10 h-10 text-mustard/70 pointer-events-none animate-pulse-soft [animation-delay:1s]" />
          <div className="absolute bottom-4 left-6 w-14 h-8 pointer-events-none">
            <CheckerDots color="#4C4DFF" cols={4} rows={2} dotSize={5} gap={3} />
          </div>

          <div className="relative h-full flex items-center justify-center gap-4">
            <div style={{ transform: "rotate(-8deg)" }}>
              <IconBlob icon={<IconPencil className="w-full h-full" />} size={44} blobClassName="bg-blush" iconClassName="text-white" />
            </div>
            <div style={{ transform: "translateY(-6px)" }}>
              <IconBlob icon={<IconGraduationCap className="w-full h-full" />} size={68} blobClassName="bg-white" iconClassName="text-ink" />
            </div>
            <div style={{ transform: "rotate(9deg)" }}>
              <IconBlob icon={<IconBook className="w-full h-full" />} size={44} blobClassName="bg-papaya" iconClassName="text-white" />
            </div>
          </div>
        </div>

        <div className="px-8 pt-7 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-white bg-mustard px-3 py-1.5 rounded-full mb-4">
            Back to School
          </span>
          <h2 className="font-serif font-bold text-2xl md:text-[28px] text-ink leading-tight">
            A fresh year deserves a fresh start.
          </h2>
          <p className="mt-3 text-sm text-ink/60 leading-relaxed max-w-sm mx-auto">
            We&rsquo;re building Sparkurio together with the educators who join first. Sign up free as a Founding Educator this season and help shape what comes next.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/signup"
              onClick={onClose}
              className="flex-1 text-center px-6 py-3.5 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors"
            >
              Join Free as a Founding Educator
            </Link>
          </div>
          <button
            onClick={onClose}
            className="mt-3 text-sm text-ink/40 hover:text-ink/70 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
