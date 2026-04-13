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
  const [tab, setTab] = useState<'discover' | 'following'>('discover');
  const [tacks, setTacks] = useState<DiscoverTack[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [columnCount, setColumnCount] = useState(5);

  useEffect(() => {
    setMounted(true);

    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 500) setColumnCount(2);
      else if (w < 768) setColumnCount(3);
      else if (w < 1024) setColumnCount(4);
      else if (w < 1400) setColumnCount(5);
      else setColumnCount(6);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/discover?limit=40');
        const data = await res.json();
        const tacks = data.tacks?.length ? data.tacks : PLACEHOLDER_TACKS;
        setTacks(tacks);
        setPersonalized(data.personalized ?? false);
      } catch {
        setTacks(PLACEHOLDER_TACKS);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [profile?.id]); // refetch when user logs in/out

  // Intersection observer for scroll-in animations
  useEffect(() => {
    if (!mounted || tacks.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) setVisibleIds(prev => new Set([...prev, id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    document.querySelectorAll('[data-discover-item]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted, tacks]);

  // Split into masonry columns
  const columns: DiscoverTack[][] = Array.from({ length: columnCount }, () => []);
  tacks.forEach((t, i) => columns[i % columnCount].push(t));

  const isEmpty = !loading && tacks.length === 0;

  return (
    <section className="py-10">
      <div
        className={`px-4 md:px-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-ink/5 rounded-full p-1">
            <button
              onClick={() => setTab('discover')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'discover' ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'}`}
            >
              Discover
            </button>
            {profile && (
              <button
                onClick={() => setTab('following')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'following' ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'}`}
              >
                Following
              </button>
            )}
          </div>
          {tab === 'discover' && personalized && (
            <span className="text-xs font-medium text-papaya/80 bg-papaya/8 px-2 py-0.5 rounded-full">
              Curated for you
            </span>
          )}
        </div>
      </div>

      {tab === 'following' && <FollowingFeed />}

      {tab === 'discover' && loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      )}

      {tab === 'discover' && isEmpty && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/30 text-sm">No public tacks yet.</p>
          <p className="text-ink/20 text-xs mt-1">Make a board public in Edit board to appear here.</p>
        </div>
      )}

      {tab === 'discover' && !loading && tacks.length > 0 && (
        <>
          <div
            className="grid gap-2 md:gap-3 px-2 md:px-3"
            style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
          >
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2 md:gap-3">
                {col.map((tack, imgIdx) => (
                  <div
                    key={tack.id}
                    data-discover-item
                    data-id={tack.id}
                    className={`group relative overflow-hidden rounded-lg transition-all duration-500 ease-out ${
                      visibleIds.has(tack.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{ transitionDelay: `${(colIdx * 30) + (imgIdx * 60)}ms` }}
                  >
                    <Link href={`/board/${tack.board_id}`} className="block relative overflow-hidden">
                      <img
                        src={tackThumb(tack.content_url)}
                        alt={tack.title || ''}
                        className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget.parentElement!.parentElement! as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
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
            ))}
          </div>

          <div className={`text-center mt-12 px-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {profile ? (
              <button
                onClick={async () => {
                  const res = await fetch('/api/discover?limit=80');
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
