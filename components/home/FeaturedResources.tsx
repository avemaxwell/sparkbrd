"use client";

import { useEffect, useState } from "react";
import ResourceCard, { type ResourceCardData } from "@/components/ResourceCard";
import { resourceToCardData, type RealResource } from "@/lib/resources-adapter";
import Reveal from "./Reveal";
import { SparkBurst } from "./decor";

export default function FeaturedResources() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);

  useEffect(() => {
    fetch("/api/resources?limit=20")
      .then((r) => r.json())
      .then((data) => {
        const raw = (data.resources ?? []) as (RealResource & { save_count?: number })[];
        const top = [...raw].sort((a, b) => (b.save_count ?? 0) - (a.save_count ?? 0)).slice(0, 8);
        setResources(top.map((r) => resourceToCardData(r)));
      })
      .catch(() => {});
  }, []);

  if (resources.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 md:py-20 px-6 bg-cork-warm">
      <SparkBurst className="absolute top-10 right-[8%] w-8 h-8 hidden lg:block pointer-events-none opacity-70" rotate={12} />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">Featured resources</h2>
            <p className="text-ink/50 mt-2">Shared by educators, ready for your classroom.</p>
          </div>
          <a href="/explore" className="hidden md:inline text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
            See all →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {resources.map((r, i) => (
            <Reveal key={`${r.title}-${i}`} delay={i * 60}>
              <ResourceCard resource={r} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <a href="/explore" className="inline-block text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
            See all resources →
          </a>
        </div>
      </div>
    </section>
  );
}
