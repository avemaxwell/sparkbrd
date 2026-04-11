"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import RetackButton from "@/components/tacks/RetackButton";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

interface DiscoverTack {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  board_id: string;
}

const PAGE_SIZE = 60;

export default function ExplorePage() {
  const { profile } = useUser();
  const [tacks, setTacks] = useState<DiscoverTack[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [columnCount, setColumnCount] = useState(4);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const limitRef = useRef(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 500) setColumnCount(2);
      else if (w < 768) setColumnCount(3);
      else if (w < 1024) setColumnCount(4);
      else if (w < 1400) setColumnCount(5);
      else setColumnCount(6);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const fetchTacks = useCallback(async (limit: number, q: string, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (q) params.set('q', q);
      const res = await fetch(`/api/discover?${params}`);
      const data = await res.json();
      const incoming: DiscoverTack[] = data.tacks ?? [];
      setPersonalized(data.personalized ?? false);
      if (append) {
        setTacks(prev => {
          const ids = new Set(prev.map(t => t.id));
          return [...prev, ...incoming.filter(t => !ids.has(t.id))];
        });
      } else {
        setTacks(incoming);
      }
      setHasMore(incoming.length >= limit);
    } catch {
      // silently keep existing items
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load / re-fetch on profile or query change
  useEffect(() => {
    limitRef.current = PAGE_SIZE;
    fetchTacks(PAGE_SIZE, query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, query]);

  // Infinite scroll — only when not searching
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || query) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          limitRef.current += PAGE_SIZE;
          fetchTacks(limitRef.current, query, false);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, tacks.length, query]);

  const handleInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val.trim()), 400);
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
  };

  const columns: DiscoverTack[][] = Array.from({ length: columnCount }, () => []);
  tacks.forEach((t, i) => columns[i % columnCount].push(t));

  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />

      <div className="pt-24 md:pt-28 px-4 md:px-6 mb-6">
        <div className="flex items-end gap-3 mb-4">
          <h1 className="font-serif text-3xl md:text-4xl text-ink/90 leading-none">Explore</h1>
          {personalized && !loading && !query && (
            <span className="mb-1 text-xs font-medium text-papaya/80 bg-papaya/8 px-2.5 py-1 rounded-full">
              Curated for you
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-ink/30 stroke-[1.5] fill-none pointer-events-none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search images, sources, tags…"
            className="w-full bg-ink/5 rounded-full pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-papaya/30 placeholder:text-ink/30"
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      )}

      {!loading && tacks.length === 0 && (
        <div className="text-center py-32 px-6">
          {query ? (
            <>
              <p className="text-ink/30 text-sm">No results for &ldquo;{query}&rdquo;</p>
              <button onClick={clearSearch} className="mt-3 text-xs text-papaya hover:underline">Clear search</button>
            </>
          ) : (
            <>
              <p className="text-ink/30 text-sm">Nothing to explore yet.</p>
              <p className="text-ink/20 text-xs mt-1">Make a board public in Edit board settings to appear here.</p>
            </>
          )}
        </div>
      )}

      {!loading && tacks.length > 0 && (
        <>
          {query && (
            <p className="px-4 md:px-6 mb-4 text-xs text-ink/40">
              {tacks.length} result{tacks.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
          )}

          <div
            className="grid gap-2 md:gap-3 px-2 md:px-3"
            style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
          >
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2 md:gap-3">
                {col.map(tack => (
                  <div key={tack.id} className="group relative overflow-hidden rounded-lg">
                    <Link href={`/board/${tack.board_id}`} className="block">
                      <img
                        src={tack.content_url}
                        alt={tack.title || ''}
                        className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={e => {
                          (e.currentTarget.parentElement?.parentElement as HTMLElement | null)
                            ?.style.setProperty('display', 'none');
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

          {/* Infinite scroll sentinel (hidden during search) */}
          {!query && <div ref={sentinelRef} className="h-4 mt-4" />}

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
            </div>
          )}

          {!query && !hasMore && tacks.length > 0 && (
            <p className="text-center text-xs text-ink/25 py-8">
              You&apos;ve seen everything — check back later.
            </p>
          )}
        </>
      )}

      <BottomNav />
    </main>
  );
}
