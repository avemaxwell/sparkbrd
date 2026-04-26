"use client";

import { useState, useEffect, useRef } from "react";
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
  const [columnCount, setColumnCount] = useState(3); // ResizeObserver corrects on mount
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep columns ~220px wide regardless of screen size.
  // ResizeObserver handles both initial measurement and sidebar open/close.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const toCols = (w: number) => {
      if (w < 480)  return 2;
      if (w < 700)  return 3;
      if (w < 900)  return 4;
      if (w < 1100) return 5;
      if (w < 1350) return 6;
      if (w < 1600) return 7;
      if (w < 1900) return 8;
      return 9;
    };
    const ro = new ResizeObserver((entries) =>
      setColumnCount(toCols(entries[0].contentRect.width))
    );
    ro.observe(el);
    // Also set immediately from contentRect once the first observation fires.
    // Fall back to offsetWidth only if the observer hasn't fired yet.
    return () => ro.disconnect();
  }, []);

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
      <div
        className={`px-4 md:px-6 mb-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-ink/5 rounded-full p-1">
            <button
              onClick={() => setTab("discover")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === "discover"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
            >
              Discover
            </button>
            {profile && (
              <button
                onClick={() => setTab("following")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tab === "following"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink/50 hover:text-ink"
                }`}
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
          <p className="text-ink/20 text-xs mt-1">
            Make a board public in Edit board to appear here.
          </p>
        </div>
      )}

      {tab === "discover" && !loading && tacks.length > 0 && (
        <>
          {/* CSS column-count masonry — preserves natural image aspect ratios */}
          <div
            ref={containerRef}
            className="px-2 md:px-3"
            style={{ columnCount, columnGap: "8px" }}
          >
            {tacks.map((tack, i) => (
              <div
                key={tack.id}
                className={`group relative mb-2 md:mb-3 break-inside-avoid transition-opacity duration-500 ${
                  mounted ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: `${Math.min(i * 35, 700)}ms` }}
              >
                <Link href={`/board/${tack.board_id}`} className="block relative">
                  <img
                    src={tackThumb(tack.content_url)}
                    alt={tack.title || ""}
                    className="w-full h-auto block rounded-xl"
                    loading="lazy"
                    onError={(e) => {
                      const wrapper = e.currentTarget.closest(
                        "[data-tack-item]"
                      ) as HTMLElement | null;
                      if (wrapper) wrapper.style.display = "none";
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
                <RetackButton tackId={tack.id} />
              </div>
            ))}
          </div>

          {/* Load more / sign-in prompt */}
          <div
            className={`text-center mt-12 px-4 transition-all duration-700 delay-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
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
                <p className="text-ink/40 text-sm mb-3">
                  Sign in to get a personalized feed
                </p>
                <a
                  href="/login"
                  className="inline-block px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/90 transition-colors"
                >
                  Get started
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
