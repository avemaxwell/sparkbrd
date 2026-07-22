"use client";

import { useEffect, useState } from "react";

interface StandardResult {
  code: string;
  text: string;
}

// Search-and-tag picker against the real Common Core / NGSS dataset
// (app/api/standards/route.ts), with a fallback to add any free-text tag
// for standards outside that dataset (state-specific ones, mainly).
export default function StandardsPicker({
  items,
  onChange,
  subject,
  gradeBand,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  subject?: string;
  gradeBand?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StandardResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ q: query.trim() });
      if (subject) params.set('subject', subject);
      if (gradeBand) params.set('grade_band', gradeBand);
      fetch(`/api/standards?${params}`)
        .then((r) => r.json())
        .then((data) => setResults(data.standards ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, subject, gradeBand]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="relative mb-1">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(query); } }}
          placeholder="Search Common Core / NGSS, or type your own…"
          className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
        />
        {open && query.trim() && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-ink/8 max-h-64 overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <>
                {results.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => addTag(`${r.code} — ${r.text}`)}
                    className="w-full text-left px-4 py-2.5 hover:bg-ink/5 transition-colors border-b border-ink/5 last:border-0"
                  >
                    <p className="text-xs font-semibold text-papaya">{r.code}</p>
                    <p className="text-xs text-ink/60 line-clamp-1">{r.text}</p>
                  </button>
                ))}
              </>
            ) : (
              <button
                type="button"
                onClick={() => addTag(query)}
                className="w-full text-left px-4 py-3 hover:bg-ink/5 transition-colors text-sm text-ink/70"
              >
                No matches in Common Core/NGSS — add <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span> as a custom standard
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-ink/35 mb-4">
        Common Core (Math/ELA) and NGSS (Science) are searchable directly — a starter set, not exhaustive. For state-specific standards, just type and press Enter to add your own tag.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-ink/30">Nothing added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-papaya/10 text-papaya text-sm rounded-full max-w-full">
              <span className="truncate">{item}</span>
              <button type="button" onClick={() => removeAt(i)} className="w-4 h-4 rounded-full hover:bg-papaya/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
