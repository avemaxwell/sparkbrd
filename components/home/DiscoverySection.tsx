"use client";

import { useState, useEffect } from "react";
import { tackThumb } from "@/lib/image-transform";
import { useUser } from "@/hooks/useUser";
import { PLACEHOLDER_TACKS } from "@/lib/placeholder-images";
import RetackButton from "@/components/tacks/RetackButton";
import Link from "next/link";
import FollowingFeed from "@/components/home/FollowingFeed";

interface DiscoverTack {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  board_id: string;
}

export default function DiscoverySection() {
  const { profile } = useUser();
  const [tab, setTab] = useState<"discover" | "following">("discover");
  const [tacks, setTacks] = useState<DiscoverTack[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [reportTackId, setReportTackId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/discover?limit=40");
        const data = await res.json();
        setTacks(data.tacks?.length ? data.tacks : PLACEHOLDER_TACKS);
        setPersonalized(data.personalized ?? false);
      } catch {
        setTacks(PLACEHOLDER_TACKS);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [profile?.id]);

  return (
    <section className="py-10">
      {/* Tab bar */}
      <div className={`px-4 md:px-6 mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-ink/5 rounded-full p-1">
            <button
              onClick={() => setTab("discover")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "discover" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
            >
              Discover
            </button>
            {profile && (
              <button
                onClick={() => setTab("following")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "following" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
              >
                Following
              </button>
            )}
          </div>
          {tab === "discover" && personalized && (
            <span className="text-xs font-medium text-papaya/80 bg-papaya/8 px-2 py-0.5 rounded-full">
              Curated for you
            </span>
          )}
        </div>
      </div>

      {tab === "following" && <FollowingFeed />}

      {tab === "discover" && loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      )}

      {tab === "discover" && !loading && tacks.length === 0 && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/30 text-sm">No public tacks yet.</p>
          <p className="text-ink/20 text-xs mt-1">Make a board public in Edit board to appear here.</p>
        </div>
      )}

      {tab === "discover" && !loading && tacks.length > 0 && (
        <>
          {/*
            Pure-CSS masonry: Tailwind `columns-*` sets column-count directly,
            no JavaScript, no state, no ResizeObserver — renders correctly on
            first paint. break-inside-avoid keeps each card in one column.
            Images use w-full h-auto so aspect ratios are always preserved.
          */}
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-x-2 px-2 md:px-3">
            {tacks.map((tack, i) => (
              <div
                key={tack.id}
                className={`group relative break-inside-avoid mb-2 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${Math.min(i * 30, 600)}ms` }}
              >
                <Link href={`/tack/${tack.id}`} className="block relative">
                  <img
                    src={tackThumb(tack.content_url)}
                    alt={tack.title || ""}
                    className="w-full h-auto block rounded-lg max-h-[400px] object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget.parentElement?.parentElement as HTMLElement | null;
                      if (el) el.style.display = "none";
                    }}
                  />
                  {tack.source && (
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[10px] text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        {tack.source}
                      </span>
                    </div>
                  )}
                </Link>
                {profile && (
                  <button
                    className="absolute top-1 right-1 w-6 h-6 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-red-50 z-10"
                    title="Report as AI-generated"
                    onClick={(e) => { e.preventDefault(); setReportTackId(tack.id); setReportMsg(null); }}
                  >
                    <svg className="w-3 h-3 stroke-red-400 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                  </button>
                )}
                <RetackButton tackId={tack.id} />
              </div>
            ))}
          </div>

          <div className={`text-center mt-10 px-4 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            {profile ? (
              <button
                onClick={async () => {
                  const res = await fetch("/api/discover?limit=80");
                  const data = await res.json();
                  setTacks(data.tacks || []);
                }}
                className="px-6 py-2.5 border border-ink/10 text-ink/50 text-sm font-medium rounded-full hover:border-ink/20 hover:text-ink/70 transition-colors"
              >
                Load more
              </button>
            ) : (
              <div>
                <p className="text-ink/40 text-sm mb-3">Sign in to get a personalized feed</p>
                <a href="/login" className="inline-block px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/90 transition-colors">
                  Get started
                </a>
              </div>
            )}
          </div>
        </>
      )}
      {reportTackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setReportTackId(null); setReportMsg(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-serif text-xl mb-2">Report this image?</h3>
            <p className="text-sm text-ink/60 mb-5">Flag this image if you believe it was generated by an AI tool. It will be reviewed by our team.</p>
            {reportMsg && <p className="text-sm text-ink/70 mb-4 p-3 bg-ink/5 rounded-xl">{reportMsg}</p>}
            {!reportMsg && (
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setReporting(true);
                    const res = await fetch(`/api/tacks/${reportTackId}/report-ai`, { method: 'POST' });
                    const d = await res.json();
                    setReporting(false);
                    if (res.status === 429) setReportMsg("You've reached the daily flag limit.");
                    else if (d.alreadyReported) setReportMsg("You've already flagged this image.");
                    else if (d.hidden) setReportMsg("This image has been removed after review. Thanks!");
                    else if (d.flagged) setReportMsg("Reported — our team will take a look. Thanks!");
                    else setReportMsg(d.error ?? "Something went wrong. Please try again.");
                  }}
                  disabled={reporting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {reporting ? 'Reporting…' : 'Yes, report it'}
                </button>
                <button onClick={() => { setReportTackId(null); setReportMsg(null); }} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Cancel</button>
              </div>
            )}
            {reportMsg && (
              <button onClick={() => { setReportTackId(null); setReportMsg(null); }} className="w-full px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Close</button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
