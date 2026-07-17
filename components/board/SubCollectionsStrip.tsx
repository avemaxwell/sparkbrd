"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/types/board";

// Shared by BoardCanvas and MosaicBoard — shows the sub-collections nested
// directly inside the current board, plus a "New sub-collection" CTA. Kept
// as one component so both renderers stay in sync instead of duplicating
// this fetch/render logic (the codebase already duplicates STATUS_OPTIONS
// between these two files with no shared source — not extending that).
export default function SubCollectionsStrip({ boardId, canEdit }: { boardId: string; canEdit: boolean }) {
  const [children, setChildren] = useState<Board[]>([]);
  const [grandchildCounts, setGrandchildCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("boards")
        .select("*")
        .eq("parent_id", boardId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      const kids: Board[] = data ?? [];
      setChildren(kids);

      if (kids.length > 0) {
        const { data: grandchildren } = await supabase
          .from("boards")
          .select("parent_id")
          .in("parent_id", kids.map((k) => k.id));
        if (!cancelled) {
          const counts: Record<string, number> = {};
          for (const row of grandchildren ?? []) {
            counts[row.parent_id as string] = (counts[row.parent_id as string] ?? 0) + 1;
          }
          setGrandchildCounts(counts);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [boardId]);

  if (loading) return null;
  if (children.length === 0 && !canEdit) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-semibold text-ink/40 uppercase tracking-wide">Sub-collections</h2>
        {canEdit && (
          <Link
            href={`/board/new?parent=${boardId}`}
            className="flex items-center gap-1 text-xs font-medium text-papaya hover:text-papaya/70 transition-colors"
          >
            <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New sub-collection
          </Link>
        )}
      </div>

      {children.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/board/${child.id}`}
              className="flex-shrink-0 w-40 rounded-2xl bg-white border border-ink/8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-3.5"
            >
              <div className="w-8 h-8 rounded-lg bg-papaya/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 stroke-papaya stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
                </svg>
              </div>
              {child.kind && (
                <span className="inline-block text-[10px] font-semibold text-ink/40 uppercase tracking-wide mb-1">{child.kind}</span>
              )}
              <h3 className="font-serif text-sm text-ink line-clamp-2 leading-snug mb-1">{child.name}</h3>
              {grandchildCounts[child.id] > 0 && (
                <p className="text-[11px] text-ink/40">{grandchildCounts[child.id]} collection{grandchildCounts[child.id] === 1 ? "" : "s"}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
