"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Ancestor {
  id: string;
  name: string;
  kind: string | null;
}

// Shared by BoardCanvas and MosaicBoard headers. Both headers are tight,
// fixed-width pill widgets (title alone is capped ~150px on mobile) — a
// literal horizontal "Class › Unit › Lesson" trail won't fit at any real
// depth, so this collapses to: back-chevron → immediate parent (or home),
// and tapping the title pill opens a dropdown with the full ancestor chain.
export default function Breadcrumb({
  boardId,
  boardName,
  variant,
}: {
  boardId: string;
  boardName: string;
  variant: "canvas" | "mosaic" | "collection";
}) {
  const router = useRouter();
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/boards/${boardId}/ancestors`)
      .then((r) => (r.ok ? r.json() : { ancestors: [] }))
      .then((data) => { if (!cancelled) setAncestors(data.ancestors ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [boardId]);

  const parent = ancestors[ancestors.length - 1];
  const backHref = parent ? `/board/${parent.id}` : "/";

  const backButtonClass =
    variant === "canvas"
      ? "w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors flex-shrink-0"
      : "w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center flex-shrink-0 transition-colors";

  const pillClass =
    variant === "canvas"
      ? "bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg max-w-[150px] sm:max-w-xs"
      : "";

  return (
    <div className="flex items-center gap-3 min-w-0 relative">
      <button
        onClick={() => router.push(backHref)}
        className={backButtonClass}
        title={parent ? `Back to ${parent.name}` : "Back home"}
      >
        <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <button onClick={() => ancestors.length > 0 && setOpen((o) => !o)} className={`${pillClass} flex items-center gap-1.5 min-w-0 text-left`}>
        <h1 className="font-serif text-lg leading-tight truncate">{boardName}</h1>
        {ancestors.length > 0 && (
          <svg className={`w-3.5 h-3.5 stroke-ink/40 stroke-2 fill-none flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && ancestors.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white rounded-2xl shadow-2xl border border-ink/8 z-50 overflow-hidden py-1.5">
            {ancestors.map((a) => (
              <button
                key={a.id}
                onClick={() => { setOpen(false); router.push(`/board/${a.id}`); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-ink/5 transition-colors text-left"
              >
                {a.kind && <span className="text-[10px] text-ink/30 uppercase tracking-wide flex-shrink-0">{a.kind}</span>}
                <span className="truncate">{a.name}</span>
              </button>
            ))}
            <div className="px-3 py-2 text-sm text-ink/40 truncate">{boardName}</div>
          </div>
        </>
      )}
    </div>
  );
}
