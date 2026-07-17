"use client";

import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ResourceCard from "@/components/ResourceCard";
import { getAllResources } from "@/lib/subjects";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ALL_RESOURCES = getAllResources();
const ShapeCorner = getShapeCorner("explore-shapes");

export default function ExplorePage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_RESOURCES;
    return ALL_RESOURCES.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    );
  }, [query]);

  const clearSearch = () => setQuery("");

  return (
    <main className="min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />

      <div className="relative pt-24 md:pt-28 px-4 md:px-6 mb-6">
        <ShapeCorner className="absolute top-16 right-4 hidden xl:block" />
        <h1 className="font-serif text-3xl md:text-4xl text-ink/90 leading-none mb-4">Discover</h1>

        {/* Search bar */}
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-ink/30 stroke-[1.5] fill-none pointer-events-none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search resources, subjects, types…"
            className="w-full bg-ink/5 rounded-full pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-papaya/30 placeholder:text-ink/30"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {results.length === 0 && (
        <div className="text-center py-32 px-6">
          <p className="text-ink/30 text-sm">No results for &ldquo;{query}&rdquo;</p>
          <button onClick={clearSearch} className="mt-3 text-xs text-papaya hover:underline">Clear search</button>
        </div>
      )}

      {results.length > 0 && (
        <>
          {query && (
            <p className="px-4 md:px-6 mb-4 text-xs text-ink/40">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-4 md:px-6">
            {results.map((r, i) => (
              <ResourceCard key={`${r.title}-${i}`} resource={r} />
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
