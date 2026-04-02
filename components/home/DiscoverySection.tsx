"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";

interface DiscoverTack {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  board_id: string;
}

export default function DiscoverySection() {
  const { profile } = useUser();
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
        setTacks(data.tacks || []);
        setPersonalized(data.personalized ?? false);
      } catch {
        setTacks([]);
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
        <div className="flex items-end gap-3">
          <h2 className="font-serif text-2xl md:text-3xl text-ink/90 mb-1">Discover</h2>
          {personalized && (
            <span className="mb-1.5 text-xs font-medium text-papaya/80 bg-papaya/8 px-2 py-0.5 rounded-full">
              Curated for you
            </span>
          )}
        </div>
        <p className="text-ink/40">From public boards</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/30 text-sm">No public tacks yet.</p>
          <p className="text-ink/20 text-xs mt-1">Make a board public in Edit board to appear here.</p>
        </div>
      )}

      {!loading && tacks.length > 0 && (
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
                    className={`group relative overflow-hidden rounded-lg transition-all duration-500 ease-out cursor-pointer ${
                      visibleIds.has(tack.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{ transitionDelay: `${(colIdx * 30) + (imgIdx * 60)}ms` }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={tack.content_url}
                        alt={tack.title || ''}
                        className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget.parentElement!.parentElement! as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Source label on hover */}
                      {tack.source && (
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-[10px] text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                            {tack.source}
                          </span>
                        </div>
                      )}
                    </div>
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
