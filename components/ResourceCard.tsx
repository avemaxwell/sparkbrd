"use client";

import type { ComponentType } from "react";
import { IconBlob } from "@/components/home/decor";
import {
  IconMedal, IconUsers, IconPersonCheck, IconRefresh, IconTestTube, IconShieldCheck,
  IconClock, IconDownload, IconHeart, IconBookmark, IconMoreHorizontal, IconFlag,
} from "@/components/icons";
import RetackButton from "@/components/tacks/RetackButton";

export type BadgeKey = "proven" | "peer" | "verified" | "updated" | "starter" | "official";

export const BADGE_META: Record<BadgeKey, { label: string; icon: ComponentType<{ className?: string }>; className: string }> = {
  proven:   { label: "Classroom Proven",  icon: IconMedal,       className: "bg-papaya text-white" },
  peer:     { label: "Peer Reviewed",     icon: IconUsers,       className: "bg-blush text-white" },
  verified: { label: "Verified Educator", icon: IconPersonCheck, className: "bg-lime text-ink" },
  updated:  { label: "Updated Recently",  icon: IconRefresh,     className: "bg-mustard text-white" },
  // Not an achievement — a status flag meaning "not yet classroom-tested,"
  // so it's deliberately muted/neutral rather than styled like the others.
  starter:  { label: "Sparkurio Labs — untested", icon: IconTestTube, className: "bg-ink/70 text-white" },
  // First-party, finished content from the Sparkurio team — dark/premium
  // treatment, distinct from both "Classroom Proven" (community-earned) and
  // "Verified Educator" (a real teacher's credential).
  official: { label: "Sparkurio Official", icon: IconShieldCheck, className: "bg-ink text-white" },
};

export interface ResourceCardData {
  id?: string;
  resourceId?: string;
  title: string;
  description: string;
  image?: string;
  icon?: ComponentType<{ className?: string }>;
  iconColor?: string;
  creatorName: string;
  creatorSchool: string;
  duration: string;
  priceCents?: number | null;
  downloads: string;
  likes: string;
  grade: string;
  type: string;
  subcategorySlug?: string;
  standards?: string[];
  badges: BadgeKey[];
  href: string;
}

export default function ResourceCard({ resource, onReport }: { resource: ResourceCardData; onReport?: () => void }) {
  const r = resource;
  const primaryBadge = r.badges[0];

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5">
      <div className="relative aspect-[4/3] bg-lavender/20 overflow-hidden">
        {/* Link covers the image only — buttons below are siblings, not nested inside it, since <a> can't contain another <a> (RetackButton renders one when logged out) */}
        <a href={r.href} className="absolute inset-0 block z-0">
          {r.image ? (
            <img src={r.image} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : r.icon ? (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: r.iconColor ?? "#B9AEFF" }}>
              <IconBlob icon={<r.icon className="w-full h-full" />} size={72} blobClassName="bg-white/90" />
            </div>
          ) : null}
        </a>

        {primaryBadge && (
          <span
            title={BADGE_META[primaryBadge].label}
            className={`absolute top-3 left-3 max-w-[58%] inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full pointer-events-none truncate ${BADGE_META[primaryBadge].className}`}
          >
            {BADGE_META[primaryBadge].label}
          </span>
        )}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 max-w-[42%]">
          {typeof r.priceCents === "number" && r.priceCents > 0 && (
            <span className="inline-flex items-center text-[10px] font-semibold text-ink bg-lime px-2 py-1 rounded-full pointer-events-none">
              ${(r.priceCents / 100).toFixed(2)}
            </span>
          )}
          {r.duration && (
            <span title={r.duration} className="inline-flex items-center gap-1 text-[10px] font-medium text-ink bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none max-w-full">
              <IconClock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{r.duration}</span>
            </span>
          )}
        </div>

        {onReport && (
          <button
            aria-label="Report as AI-generated"
            onClick={onReport}
            className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 z-10"
          >
            <IconFlag className="w-3.5 h-3.5 text-red-400" />
          </button>
        )}

        {r.id ? (
          <RetackButton tackId={r.id} />
        ) : r.resourceId ? (
          <RetackButton resourceId={r.resourceId} />
        ) : (
          <button
            aria-label="Save"
            disabled
            title="Not saveable — sample content"
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-not-allowed z-10"
          >
            <IconBookmark className="w-4 h-4 text-ink/40" />
          </button>
        )}
      </div>

      <div className="p-4">
        <a href={r.href}>
          <h3 className="font-serif font-semibold text-sm text-ink leading-snug line-clamp-2 mb-1">{r.title}</h3>
        </a>
        <p className="text-xs text-ink/50 leading-relaxed line-clamp-2 mb-3">{r.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-papaya to-lavender flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {r.creatorName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">{r.creatorName}</p>
            <p className="text-[10px] text-ink/40 truncate">{r.creatorSchool}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ink/5 pt-3 text-ink/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <IconDownload className="w-3.5 h-3.5" />
              {r.downloads}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <IconHeart className="w-3.5 h-3.5" />
              {r.likes}
            </span>
          </div>
          <button aria-label="More options" onClick={(e) => e.preventDefault()} className="hover:text-ink transition-colors">
            <IconMoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
