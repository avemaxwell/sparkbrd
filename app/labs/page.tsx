"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ResourceCard, { type ResourceCardData } from "@/components/ResourceCard";
import { resourceToCardData, type RealResource } from "@/lib/resources-adapter";
import { IconTestTube } from "@/components/icons";
import { useUser } from "@/hooks/useUser";

type LabsResource = ResourceCardData & { vote_score: number; my_vote: 1 | -1 | null };

export default function LabsPage() {
  const { profile } = useUser();
  const [resources, setResources] = useState<LabsResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources?starter=true&limit=60")
      .then((r) => r.json())
      .then((data) => {
        const raw = (data.resources ?? []) as (RealResource & { vote_score: number; my_vote: 1 | -1 | null })[];
        setResources(raw.map((r) => ({ ...resourceToCardData(r), vote_score: r.vote_score, my_vote: r.my_vote })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const castVote = async (resourceId: string, vote: 1 | -1) => {
    if (!profile) { window.location.href = "/login"; return; }
    try {
      const res = await fetch(`/api/resources/${resourceId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (!res.ok) return;

      // A resource that just crossed the removal threshold is no longer
      // published at all — drop it from view rather than show stale state.
      if (data.status === "draft") {
        setResources((prev) => prev.filter((r) => r.resourceId !== resourceId));
        return;
      }
      setResources((prev) =>
        prev.map((r) => (r.resourceId === resourceId ? { ...r, vote_score: data.netScore, my_vote: data.myVote } : r))
      );
    } catch {
      // Non-fatal — leave the vote UI as-is, user can retry.
    }
  };

  return (
    <main className="min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />

      {/* Intro */}
      <div className="bg-ink px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-lime bg-lime/10 px-3 py-1.5 rounded-full mb-6">
            <IconTestTube className="w-3.5 h-3.5" />
            Sparkurio Labs
          </span>
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight mb-4">
            Help shape tomorrow&rsquo;s best lessons.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            Everything in Sparkurio Labs is not yet taught, not yet reviewed by a real
            educator. Try one in your classroom, then vote it up to help it earn Classroom Proven status —
            or vote it down if it doesn&rsquo;t hold up.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <p className="text-center text-ink/40 text-sm py-20">Nothing in Labs right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resources.map((r) => (
              <ResourceCard
                key={r.resourceId}
                resource={r}
                voting={{ score: r.vote_score, myVote: r.my_vote, onVote: (v) => castVote(r.resourceId!, v) }}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
