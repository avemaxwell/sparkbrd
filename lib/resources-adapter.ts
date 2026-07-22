import type { ResourceCardData } from "@/components/ResourceCard";
import { getSubject, slugify } from "@/lib/subjects";

// Maps a real `resources` row (as returned by GET /api/resources,
// /api/search, or /api/users/[id]) into the ResourceCardData shape the
// existing (mock-data-authored) ResourceCard already renders. Real resources
// don't carry mock-only decorative fields (duration/downloads/likes/badges),
// so those are derived from what's actually true rather than fabricated.
export interface RealResource {
  id: string;
  title: string;
  subject: string;
  grade_band: string;
  resource_type: string;
  photos?: string[];
  duration?: string | null;
  standards?: string[];
  owner?: { name: string | null; avatar_url: string | null; is_verified_educator?: boolean; is_official?: boolean } | null;
  save_count?: number;
  is_starter?: boolean;
  price_cents?: number | null;
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function resourceToCardData(r: RealResource): ResourceCardData {
  const subjectDef = getSubject(slugify(r.subject));

  return {
    id: undefined, // not a legacy tack — RetackButton's tackId path doesn't apply
    resourceId: r.id,
    title: r.title,
    description: `A ${r.resource_type.toLowerCase()} for ${r.grade_band} ${r.subject}.`,
    image: r.photos?.[0],
    icon: r.photos?.[0] ? undefined : subjectDef.icon,
    iconColor: subjectDef.color,
    // Starter Library content has no real owner and never earns badges —
    // those signal real classroom validation, which this hasn't had yet.
    // Official Sparkurio-produced content (real, finished worksheets) gets
    // its own attribution rather than falling back to a generic name.
    creatorName: r.is_starter ? "Sparkurio Starter Library" : (r.owner?.name ?? "A Sparkurio educator"),
    creatorSchool: r.is_starter ? "Not yet classroom-tested" : "",
    grade: r.grade_band,
    type: r.resource_type,
    duration: r.duration ?? "",
    priceCents: r.price_cents,
    standards: r.standards ?? [],
    downloads: formatCount(r.save_count ?? 0),
    likes: "0",
    badges: r.owner?.is_official ? ["official"] : r.is_starter ? ["starter"] : r.owner?.is_verified_educator ? ["verified"] : [],
    href: `/resources/${r.id}`,
  };
}
