"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { getSubject } from "@/lib/subjects";
import { resourceToCardData, type RealResource } from "@/lib/resources-adapter";
import ResourceCard, { type ResourceCardData } from "@/components/ResourceCard";
import { IconBlob } from "@/components/home/decor";
import { IconLightbulb } from "@/components/icons";
import SubjectHero from "./SubjectHero";
import SubjectTabs from "./SubjectTabs";
import FilterBar, { DEFAULT_FILTERS, type SubjectFilters } from "./FilterBar";
import SubjectSidebar from "./SubjectSidebar";

const PAGE_SIZE = 9;

function parseMinutes(duration: string): number {
  const num = parseFloat(duration);
  if (duration.includes("wk")) return Infinity;
  if (duration.includes("hr")) return num * 60;
  return num;
}

function matchesTime(duration: string, bucket: string): boolean {
  if (bucket === "All") return true;
  const mins = parseMinutes(duration);
  if (bucket === "Under 30 min") return mins < 30;
  if (bucket === "30-60 min") return mins >= 30 && mins <= 60;
  if (bucket === "1-2 hrs") return mins > 60 && mins <= 120;
  return mins > 120;
}

function parseCount(s: string): number {
  return s.toLowerCase().endsWith("k") ? parseFloat(s) * 1000 : parseFloat(s);
}

export default function SubjectPageClient({ slug }: { slug: string }) {
  const { profile } = useUser();
  const subject = useMemo(() => getSubject(slug), [slug]);
  const [realResources, setRealResources] = useState<ResourceCardData[]>([]);
  const [realStandards, setRealStandards] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/resources?subject=${encodeURIComponent(subject.name)}&limit=60`)
      .then((r) => r.json())
      .then((data) => {
        const raw = (data.resources ?? []) as (RealResource & { standards?: string[] })[];
        setRealResources(raw.map((r) => resourceToCardData(r)));
        setRealStandards([...new Set(raw.flatMap((r) => r.standards ?? []))]);
      })
      .catch(() => {});
  }, [subject.name]);

  const resources = realResources;
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of resources) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [resources]);
  const allTabSlug = subject.subcategories[0]?.slug;
  const [activeTab, setActiveTab] = useState(allTabSlug ?? "");
  const [filters, setFilters] = useState<SubjectFilters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = resources;
    if (activeTab !== allTabSlug) list = list.filter((r) => r.subcategorySlug === activeTab);
    if (filters.grade !== "All") list = list.filter((r) => r.grade === filters.grade);
    if (filters.type !== "All") list = list.filter((r) => r.type === filters.type);
    if (filters.time !== "All") list = list.filter((r) => matchesTime(r.duration, filters.time));
    if (filters.provenOnly) list = list.filter((r) => r.badges.includes("proven"));
    if (filters.standard.trim()) {
      const needle = filters.standard.trim().toLowerCase();
      list = list.filter((r) => r.standards?.some((s) => s.toLowerCase().includes(needle)));
    }

    if (filters.sort === "downloads") return [...list].sort((a, b) => parseCount(b.downloads) - parseCount(a.downloads));
    if (filters.sort === "likes") return [...list].sort((a, b) => parseCount(b.likes) - parseCount(a.likes));
    return list;
  }, [resources, activeTab, allTabSlug, filters]);

  const visible = filtered.slice(0, visibleCount);

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  return (
    <>
      <SubjectHero subject={subject} />
      <SubjectTabs
        subcategories={subject.subcategories}
        active={activeTab}
        onChange={(slug) => { setActiveTab(slug); resetPaging(); }}
      />
      <FilterBar filters={filters} onChange={(patch) => { setFilters((f) => ({ ...f, ...patch })); resetPaging(); }} standardOptions={realStandards} />

      <div id="resources" className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
          {visible.length === 0 ? (
            <div className="text-center py-20 text-ink/40 text-sm">
              {resources.length === 0
                ? `No resources in ${subject.name} yet — be the first to share one.`
                : "No resources match these filters."}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {visible.map((r, i) => <ResourceCard key={`${r.title}-${i}`} resource={r} />)}
            </div>
          )}
          {visibleCount < filtered.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-2.5 border border-black/10 text-ink/60 text-sm font-medium rounded-full hover:border-black/20 hover:text-ink transition-colors"
              >
                Load More Resources
              </button>
            </div>
          )}
        </div>
        <SubjectSidebar subject={subject} typeCounts={typeCounts} />
      </div>

      <section className="px-6 pb-16">
        <div className="relative max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-lavender/20 border border-black/5 px-8 py-14 md:py-16">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <IconBlob icon={<IconLightbulb className="w-full h-full" />} blobClassName="bg-mustard" size={72} />
              <div>
                <h2 className="font-serif font-bold text-2xl md:text-3xl text-ink">Share what works in your classroom</h2>
                <p className="text-ink/60 mt-1">Your resources help others teach with confidence.</p>
              </div>
            </div>
            <a
              href={profile ? "/resources/new" : "/signup?intent=share&redirect=/resources/new"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors flex-shrink-0"
            >
              Share a Resource
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
