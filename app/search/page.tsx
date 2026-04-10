"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Link from "next/link";
import RetackButton from "@/components/tacks/RetackButton";

interface SearchTack {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  board_id: string;
}

interface SearchBoard {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_name: string | null;
  preview_images: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tacks, setTacks] = useState<SearchTack[]>([]);
  const [boards, setBoards] = useState<SearchBoard[]>([]);
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
      setTacks(data.tacks || []);
      setBoards(data.boards || []);
      setExpandedTerms(data.terms || []);
    } catch {
      setTacks([]);
      setBoards([]);
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

  const columns: SearchTack[][] = Array.from({ length: columnCount }, () => []);
  tacks.forEach((t, i) => columns[i % columnCount].push(t));

  const hasResults = tacks.length > 0 || boards.length > 0;

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
            placeholder="Search images, boards… nail polish, brutalist architecture"
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

      {!loading && searched && !hasResults && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/40 text-sm">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-ink/25 text-xs mt-1">Try different keywords or make boards public to grow the index.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-20 px-6">
          <p className="text-ink/30 text-sm">Type something to find images and boards.</p>
        </div>
      )}

      {!loading && hasResults && (
        <div className="px-2 md:px-3">

          {/* Tacks section */}
          {tacks.length > 0 && (
            <>
              <h2 className="px-2 mb-3 text-xs font-semibold text-ink/40 uppercase tracking-widest">
                Tacks <span className="font-normal normal-case tracking-normal text-ink/30">({tacks.length})</span>
              </h2>
              <div
                className="grid gap-2 md:gap-3 mb-10"
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
                            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                          {tack.title && (
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <span className="text-[10px] text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full line-clamp-1">
                                {tack.title}
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
            </>
          )}

          {/* Boards section */}
          {boards.length > 0 && (
            <>
              <h2 className="px-2 mb-3 text-xs font-semibold text-ink/40 uppercase tracking-widest">
                Boards <span className="font-normal normal-case tracking-normal text-ink/30">({boards.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
                {boards.map((board, index) => {
                  const GRADIENTS = [
                    "from-papaya/30 to-mustard/20",
                    "from-aqua/25 to-blush/20",
                    "from-blush/30 to-papaya/15",
                    "from-mustard/25 to-aqua/20",
                    "from-papaya/20 to-blush/25",
                  ];
                  const ANGLES = [-5, 3, -2];
                  const hasImages = board.preview_images.length > 0;

                  return (
                    <Link
                      key={board.id}
                      href={`/board/${board.id}`}
                      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                        hasImages ? 'bg-ink/10' : `bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]}`
                      }`}
                    >
                      {hasImages ? (
                        <>
                          {board.preview_images.slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-sm shadow-md pointer-events-none"
                              style={{ transform: `rotate(${ANGLES[i] ?? 0}deg)`, zIndex: i }}
                              draggable={false}
                            />
                          ))}
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent z-10">
                            <p className="font-serif text-sm text-white line-clamp-2 leading-snug">{board.name}</p>
                            {board.owner_name && (
                              <p className="text-[10px] text-white/60 mt-0.5 truncate">{board.owner_name}</p>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 z-20" />
                        </>
                      ) : (
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                          <div className="w-4 h-4 rounded-full bg-white/50" />
                          <div>
                            <p className="font-serif text-sm text-ink/80 line-clamp-2 leading-snug">{board.name}</p>
                            {board.owner_name && (
                              <p className="text-[10px] text-ink/40 mt-0.5 truncate">{board.owner_name}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

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
