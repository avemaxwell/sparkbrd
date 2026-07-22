"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { resourceToCardData, type RealResource } from "@/lib/resources-adapter";
import ResourceCard, { type ResourceCardData } from "@/components/ResourceCard";
import Breadcrumb from "@/components/board/Breadcrumb";
import SubCollectionsStrip from "@/components/board/SubCollectionsStrip";
import BoardActivityFeed from "@/components/board/BoardActivityFeed";
import SharePanel from "@/components/board/SharePanel";
import type { Board } from "@/types/board";

// The resource-first replacement for the old canvas/mosaic moodboard views —
// a clean grid of the same ResourceCard already used on Discover/Search/Labs,
// built from tacks.resource_id (added specifically so saved lesson plans
// have somewhere sensible to show up, which the old renderers never learned
// to read). Membership/nesting/activity pieces are reused as-is from the
// legacy board components since they're generic, not canvas-specific.
export default function ResourceCollectionView() {
  const params = useParams();
  const boardId = params.id as string;
  const supabase = createClient();
  const { profile } = useUser();

  const [board, setBoard] = useState<Board | null>(null);
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberRole, setMemberRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [shareOpen, setShareOpen] = useState(false);

  const canEdit = memberRole === "owner" || memberRole === "editor";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: boardData } = await supabase.from("boards").select("*").eq("id", boardId).single();
      if (cancelled) return;
      if (!boardData) { setLoading(false); return; }
      setBoard(boardData);

      if (profile) {
        if (boardData.owner_id === profile.id) {
          setMemberRole("owner");
        } else {
          const { data: mem } = await supabase
            .from("board_members").select("role")
            .eq("board_id", boardId).eq("user_id", profile.id).maybeSingle();
          setMemberRole((mem?.role as "editor" | "viewer") ?? "viewer");
        }
      }

      const { data: tacksData } = await supabase
        .from("tacks")
        .select("resource_id")
        .eq("board_id", boardId)
        .not("resource_id", "is", null)
        .order("created_at", { ascending: false });
      if (cancelled) return;

      const resourceIds = Array.from(new Set((tacksData ?? []).map((t: { resource_id: string }) => t.resource_id))) as string[];
      if (resourceIds.length === 0) { setLoading(false); return; }

      type ResourceRow = RealResource & { owner_id: string | null };
      type OwnerRow = { id: string; name: string | null; avatar_url: string | null; is_verified_educator: boolean; is_official: boolean };

      const [{ data: resourcesData }, { data: saveRows }] = await Promise.all([
        supabase
          .from("resources")
          .select("id, owner_id, title, subject, grade_band, resource_type, photos, duration, standards, price_cents, is_starter")
          .in("id", resourceIds),
        supabase.from("tacks").select("resource_id").in("resource_id", resourceIds),
      ]);
      if (cancelled || !resourcesData) { setLoading(false); return; }
      const typedResources = resourcesData as ResourceRow[];

      const ownerIds = [...new Set(typedResources.map((r) => r.owner_id).filter(Boolean))];
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_verified_educator, is_official")
        .in("id", ownerIds);
      const ownerMap = Object.fromEntries(((owners ?? []) as OwnerRow[]).map((o) => [o.id, o]));

      const saveCounts: Record<string, number> = {};
      for (const row of (saveRows ?? []) as { resource_id: string | null }[]) {
        if (row.resource_id) saveCounts[row.resource_id] = (saveCounts[row.resource_id] ?? 0) + 1;
      }

      // Preserve the tack order (newest saved first) rather than the
      // resources-table order returned by `.in(...)`.
      const byId: Record<string, ResourceRow> = Object.fromEntries(typedResources.map((r) => [r.id, r]));
      const ordered = resourceIds.map((id) => byId[id]).filter(Boolean);

      setResources(
        ordered.map((r) =>
          resourceToCardData({
            ...r,
            owner: r.owner_id ? ownerMap[r.owner_id] ?? null : null,
            save_count: saveCounts[r.id] ?? 0,
          })
        )
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [boardId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink/40">Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cork-warm">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink/5 px-4 py-3 flex items-center justify-between gap-3">
        <Breadcrumb boardId={boardId} boardName={board.name} variant="collection" />
        {canEdit && (
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink/5 hover:bg-ink/10 rounded-full text-sm font-medium transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/>
            </svg>
            Share
          </button>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <SubCollectionsStrip boardId={boardId} canEdit={canEdit} />

        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 stroke-ink/20 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <p className="text-ink/40 text-sm mb-1">No resources saved yet</p>
            <a href="/explore" className="mt-3 text-papaya text-sm font-medium hover:text-papaya/70 transition-colors">
              Browse Discover and save your first lesson plan
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resources.map((r) => <ResourceCard key={r.resourceId} resource={r} />)}
          </div>
        )}

        <div className="mt-10">
          <BoardActivityFeed boardId={boardId} />
        </div>
      </div>

      {shareOpen && <SharePanel boardId={boardId} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
