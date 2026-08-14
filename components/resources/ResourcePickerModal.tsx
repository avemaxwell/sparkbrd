"use client";

import { useEffect, useState } from "react";

export interface PickedResource {
  id: string;
  title: string;
  resource_type: string;
  subject: string;
  photos: string[];
}

// "Attach a resource" — searches the existing library via the same
// /api/search endpoint Discover/Search already use (title/subject ilike).
// Scoping this to something smarter (semantic, block-type-aware) is a
// Phase 2 upgrade to this same component, not a new one.
export default function ResourcePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (resource: PickedResource) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedResource[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=15`)
        .then((r) => r.json())
        .then((data) => setResults(data.resources ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-lg text-ink">Attach a resource</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
              <svg className="w-4 h-4 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library by title or subject…"
            className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {searching ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
            </div>
          ) : !query.trim() ? (
            <p className="text-center text-sm text-ink/30 py-10">Start typing to search the library.</p>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-ink/30 py-10">No matching resources.</p>
          ) : (
            <ul className="space-y-1.5">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(r)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink/5 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-lavender/20 flex-shrink-0">
                      {r.photos?.[0] && <img src={r.photos[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{r.title}</p>
                      <p className="text-xs text-ink/40 truncate">{r.resource_type} · {r.subject}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
