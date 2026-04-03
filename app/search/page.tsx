"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Link from "next/link";

interface SearchTack {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  board_id: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchTack[]>([]);
  const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 500) setColumnCount(2);
      else if (w < 768) setColumnCount(3);
      else if (w < 1024) setColumnCount(4);
      else setColumnCount(5);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Run search if query is in URL on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      runSearch(q);
    } else {
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=60`);
      const data = await res.json();
      setResults(data.tacks || []);
      setExpandedTerms(data.terms || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query.trim());
  };

  // Masonry columns
  const columns: SearchTack[][] = Array.from({ length: columnCount }, () => []);
  results.forEach((t, i) => columns[i % columnCount].push(t));

  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />

      <div className="pt-24 md:pt-28 px-4 md:px-6 max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search images… nail polish, brutalist architecture, cozy coffee"
            className="w-full bg-white border border-ink/10 rounded-full px-5 py-3.5 pr-14 text-sm shadow-sm outline-none focus:ring-2 focus:ring-papaya/30 focus:border-papaya/30 transition-all"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-papaya rounded-full flex items-center justify-center hover:bg-papaya/90 transition-colors"
          >
            <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>

        {/* AI-expanded terms pill row */}
        {expandedTerms.length > 0 && !loading && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {expandedTerms.slice(0, 8).map(term => (
              <button
                key={term}
                onClick={() => { setQuery(term); router.replace(`/search?q=${encodeURIComponent(term)}`); runSearch(term); }}
                className="text-xs px-2.5 py-1 bg-ink/5 text-ink/50 rounded-full hover:bg-papaya/10 hover:text-papaya transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/40 text-sm">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-ink/25 text-xs mt-1">Try different keywords or make boards public to grow the index.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/30 text-sm">Type something to find images across public boards.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div
          className="grid gap-2 md:gap-3 px-2 md:px-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
        >
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-2 md:gap-3">
              {col.map(tack => (
                <Link
                  key={tack.id}
                  href={`/board/${tack.board_id}`}
                  className="group relative overflow-hidden rounded-lg cursor-pointer block"
                >
                  <img
                    src={tack.content_url}
                    alt={tack.title || ''}
                    className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
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
              ))}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
