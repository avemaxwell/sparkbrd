"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { tackThumb, tackDetail } from "@/lib/image-transform";
import { hasFeature } from "@/lib/plan-limits";
import type { Plan } from "@/lib/plan-limits";
import type { Board, Tack } from "@/types/board";
import Breadcrumb from "@/components/board/Breadcrumb";
import SubCollectionsStrip from "@/components/board/SubCollectionsStrip";

// ── Board-type icons (shared with cards / settings) ─────────────────────────
export function BoardTypeIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  if (type === 'collection') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="7" height="7" rx="1.5"/>
      <rect x="13" y="4" width="7" height="7" rx="1.5"/>
      <rect x="4" y="13" width="7" height="7" rx="1.5"/>
      <path d="M15.5 15.5v6M12.5 18.5h6"/>
    </svg>
  );
  if (type === 'mosaic') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="8" height="8" rx="1"/>
      <rect x="13" y="3" width="8" height="8" rx="1"/>
      <rect x="3" y="13" width="8" height="8" rx="1"/>
      <rect x="13" y="13" width="8" height="8" rx="1"/>
    </svg>
  );
  if (type === 'studio') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  );
  // canvas / moodboard (default)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="13" height="10" rx="1.5"/>
      <rect x="9" y="3" width="13" height="10" rx="1.5" strokeOpacity="0.4"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MosaicBoard() {
  const params = useParams();
  const boardId = params.id as string;
  const supabase = createClient();
  const { profile } = useUser();

  const [board, setBoard] = useState<Board | null>(null);
  const [tacks, setTacks] = useState<Tack[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberRole, setMemberRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [detail, setDetail] = useState<Tack | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const canEdit = memberRole === 'owner' || memberRole === 'editor';

  // ── Load board + tacks ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: boardData } = await supabase
        .from("boards").select("*").eq("id", boardId).single();
      if (!boardData) { setLoading(false); return; }
      setBoard(boardData);

      if (profile) {
        if (boardData.owner_id === profile.id) {
          setMemberRole('owner');
        } else {
          const { data: mem } = await supabase
            .from('board_members').select('role')
            .eq('board_id', boardId).eq('user_id', profile.id).maybeSingle();
          setMemberRole((mem?.role as 'editor' | 'viewer') ?? 'viewer');
        }
      }

      const { data: tacksData } = await supabase
        .from("tacks")
        .select("*")
        .eq("board_id", boardId)
        .eq("hidden_as_ai", false)
        .not("content_url", "ilike", "%.svg%")
        .order("created_at", { ascending: false }); // newest first

      setTacks(tacksData || []);
      setLoading(false);
    };
    load();
  }, [boardId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`mosaic:${boardId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tacks", filter: `board_id=eq.${boardId}` },
        (payload: { new: Record<string, unknown> }) => {
          const t = payload.new as unknown as Tack;
          if (t.hidden_as_ai || t.content_url?.includes('.svg')) return;
          setTacks(prev => prev.some(x => x.id === t.id) ? prev : [t, ...prev]);
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tacks", filter: `board_id=eq.${boardId}` },
        (payload: { old: Record<string, unknown> }) => {
          const id = (payload.old as { id: string }).id;
          setTacks(prev => prev.filter(t => t.id !== id));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setMounted(true); }, []);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (tackId: string) => {
    setDeleting(tackId);
    const { data: tackData } = await supabase.from("tacks").select("content_url").eq("id", tackId).single();
    await supabase.from("tacks").delete().eq("id", tackId);
    if (tackData?.content_url?.includes('/storage/v1/object/public/tacks/')) {
      const path = tackData.content_url.split('/storage/v1/object/public/tacks/')[1];
      if (path) await supabase.storage.from("tacks").remove([path]);
    }
    setTacks(prev => prev.filter(t => t.id !== tackId));
    if (detail?.id === tackId) setDetail(null);
    setDeleting(null);
  };


  // ── Add tack (re-use the same URL/upload flow as canvas) ─────────────
  // We render AddTackModal inline below.

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
    </div>
  );

  if (!board) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink/40">Collection not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Breadcrumb boardId={boardId} boardName={board.name} variant="mosaic" />
          <BoardTypeIcon type="mosaic" className="w-4 h-4 stroke-ink/40 flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {memberRole === 'owner' && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors"
              title="Collection settings"
            >
              <svg className="w-4 h-4 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 bg-papaya text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors"
            >
              <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add
            </button>
          )}
        </div>
      </header>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      <div className="p-3 md:p-4">
        <SubCollectionsStrip boardId={boardId} canEdit={canEdit} />
        {tacks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mb-4">
              <BoardTypeIcon type="mosaic" className="w-7 h-7 stroke-ink/20" />
            </div>
            <p className="text-ink/40 text-sm mb-1">No images yet</p>
            {canEdit && (
              <button onClick={() => setAddOpen(true)} className="mt-3 text-papaya text-sm font-medium hover:text-papaya/70 transition-colors">
                Add your first image
              </button>
            )}
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-x-2 px-1">
            {tacks.map((tack) => (
              <div
                key={tack.id}
                className={`group relative break-inside-avoid mb-2 cursor-pointer transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setDetail(tack)}
              >
                <img
                  src={tackThumb(tack.content_url)}
                  alt={tack.title || ""}
                  className="w-full h-auto block rounded-lg max-h-[500px] object-cover object-top"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                />
                {tack.title && (
                  <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/50 to-transparent rounded-b-lg">
                    <p className="text-white text-[11px] font-medium truncate">{tack.title}</p>
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tack.id); }}
                    disabled={deleting === tack.id}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                    title="Remove"
                  >
                    {deleting === tack.id ? (
                      <div className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tack detail panel ──────────────────────────────────────── */}
      {detail && (
        <TackDetailPanel
          tack={detail}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
          onUpdate={(updates) => {
            setTacks(prev => prev.map(t => t.id === detail.id ? { ...t, ...updates } : t));
            setDetail(prev => prev ? { ...prev, ...updates } : null);
          }}
          onDelete={() => { handleDelete(detail.id); }}
        />
      )}

      {/* ── Settings panel ─────────────────────────────────────────── */}
      {settingsOpen && (
        <MosaicSettings
          board={board}
          onClose={() => setSettingsOpen(false)}
          onUpdate={(updates) => setBoard(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}

      {/* ── Add tack modal ─────────────────────────────────────────── */}
      {addOpen && <MosaicAddModal boardId={boardId} board={board} onClose={() => setAddOpen(false)} onAdded={(t) => setTacks(prev => [t, ...prev])} />}
    </div>
  );
}

// ── Board settings panel ──────────────────────────────────────────────────────
function MosaicSettings({ board, onClose, onUpdate }: {
  board: Board;
  onClose: () => void;
  onUpdate: (updates: Partial<Board>) => void;
}) {
  const supabase = createClient();
  const { profile: settingsProfile } = useUser();
  const canUseStatus = hasFeature(settingsProfile?.plan as Plan | undefined, 'studio_boards');
  const [name, setName] = useState(board.name);
  const [isPublic, setIsPublic] = useState(board.is_public ?? false);
  const [status, setStatus] = useState<'draft' | 'in_review' | 'approved'>(board.status ?? 'draft');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const updates = { name: name.trim() || board.name, is_public: isPublic, status };
      const changed = updates.name !== board.name || updates.is_public !== board.is_public || updates.status !== board.status;
      if (!changed) return;
      setSaving(true);
      const { error } = await supabase.from("boards").update(updates).eq("id", board.id);
      if (!error) onUpdate(updates);
      setSaving(false);
    }, 500);
    return () => clearTimeout(t);
  }, [name, isPublic, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const STATUS_OPTIONS = [
    { value: 'draft',     label: 'Draft',     active: 'bg-ink text-white',          inactive: 'bg-ink/5 text-ink/50 hover:bg-ink/10' },
    { value: 'in_review', label: 'In Review', active: 'bg-amber-400 text-amber-900', inactive: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { value: 'approved',  label: 'Approved',  active: 'bg-emerald-500 text-white',   inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full sm:w-80 bg-white shadow-2xl flex flex-col overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="p-5 border-b border-ink/5 flex items-center justify-between">
          <h2 className="font-serif text-xl">Board settings</h2>
          <div className="flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Board type — read-only */}
          <div className="flex items-center gap-2 py-2 px-3 bg-ink/3 rounded-xl">
            <BoardTypeIcon type="mosaic" className="w-3.5 h-3.5 stroke-ink/40" />
            <span className="text-xs text-ink/40 font-medium">Mosaic board</span>
            <span className="text-[10px] text-ink/25 ml-auto">Can&apos;t be changed</span>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Collection name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-2">Visibility</label>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className="relative w-full h-10 rounded-full p-1 flex items-center transition-colors"
              style={{ backgroundColor: isPublic ? 'rgba(0,143,149,0.08)' : 'rgba(26,26,26,0.06)' }}
            >
              <span
                className={`absolute top-1 h-8 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-200 ${isPublic ? 'left-[calc(50%+2px)] bg-aqua' : 'left-1 bg-ink/70'}`}
              />
              <span className={`relative z-10 flex-1 text-center text-xs font-semibold transition-colors ${!isPublic ? 'text-white' : 'text-ink/40'}`}>Private</span>
              <span className={`relative z-10 flex-1 text-center text-xs font-semibold transition-colors ${isPublic ? 'text-white' : 'text-ink/40'}`}>Public</span>
            </button>
            <p className="text-[11px] text-ink/40 mt-1.5">
              {isPublic ? 'Anyone can find and view this collection.' : 'Only you can see this collection.'}
            </p>
          </div>

          {/* Status — Pro+ only */}
          {canUseStatus && (
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-2">Status</label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(({ value, label, active, inactive }) => (
                  <button
                    key={value}
                    onClick={() => setStatus(value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${status === value ? active : inactive}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tack detail / edit panel ──────────────────────────────────────────────────
function TackDetailPanel({ tack, canEdit, onClose, onUpdate, onDelete }: {
  tack: Tack;
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Tack>) => void;
  onDelete: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(tack.title || "");
  const [note, setNote] = useState(tack.note || "");
  const [source, setSource] = useState(tack.source || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-save on field change
  useEffect(() => {
    if (!canEdit) return;
    const t = setTimeout(async () => {
      const updates = {
        title: title.trim() || null,
        note: note.trim() || null,
        source: source.trim() || null,
      };
      const changed =
        (updates.title ?? '') !== (tack.title ?? '') ||
        (updates.note  ?? '') !== (tack.note  ?? '') ||
        (updates.source ?? '') !== (tack.source ?? '');
      if (!changed) return;
      setSaving(true);
      await supabase.from("tacks").update(updates).eq("id", tack.id);
      onUpdate(updates);
      setSaving(false);
    }, 600);
    return () => clearTimeout(t);
  }, [title, note, source]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative bg-ink/5 flex-shrink-0">
          <img
            src={tackDetail(tack.content_url)}
            alt={tack.title || ""}
            className="w-full object-contain"
            style={{ maxHeight: '45vh' }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 stroke-white stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          {saving && (
            <div className="absolute bottom-3 right-3 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Title</label>
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this image a title…"
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
              />
            ) : (
              <p className="text-sm text-ink">{tack.title || <span className="text-ink/30 italic">No title</span>}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Notes</label>
            {canEdit ? (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes, context, or description…"
                rows={3}
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all placeholder:text-ink/25"
              />
            ) : (
              <p className="text-sm text-ink whitespace-pre-line">{tack.note || <span className="text-ink/30 italic">No notes</span>}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/50 mb-1.5">Source</label>
            {canEdit ? (
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Where did this come from?"
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
              />
            ) : (
              <p className="text-sm text-ink">{tack.source || <span className="text-ink/30 italic">No source</span>}</p>
            )}
          </div>

          {canEdit && (
            <div className="pt-2 border-t border-ink/5">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-ink/50 flex-1">Remove this image?</p>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-ink/40 hover:text-ink transition-colors">Cancel</button>
                  <button onClick={onDelete} className="text-xs text-red-500 font-medium hover:text-red-600 transition-colors">Remove</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-ink/30 hover:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Remove image
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline add modal ──────────────────────────────────────────────────────────
function MosaicAddModal({ boardId, board, onClose, onAdded }: {
  boardId: string;
  board: Board;
  onClose: () => void;
  onAdded: (t: Tack) => void;
}) {
  const supabase = createClient();
  const [mode, setMode] = useState<'upload' | 'scrape'>('upload');
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [source, setSource] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [scrapedSource, setScrapedSource] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const resizeImage = (file: File, maxPx: number, type: string, quality: number): Promise<File> =>
    new Promise((resolve) => {
      const objUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const scale = Math.min(1, maxPx / img.naturalWidth, maxPx / img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.naturalWidth  * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const ext = type === 'image/webp' ? '.webp' : '.jpg';
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ext), { type }) : file),
          type, quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
      img.src = objUrl;
    });

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > 20 * 1024 * 1024) { setError("File too large (max 20 MB)."); return; }
    setUploading(true);
    const compressed = await resizeImage(file, 1600, 'image/jpeg', 0.85);
    const safeName = compressed.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') || 'image';
    const path = `${boardId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("tacks").upload(path, compressed);
    if (upErr) { setError("Upload failed. Try again."); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("tacks").getPublicUrl(path);
    setUrl(publicUrl);
    setUploading(false);
    // Store 400 px WebP thumbnail — served directly, no transform charges
    resizeImage(file, 400, 'image/webp', 0.82).then(thumb => {
      const thumbPath = path.replace(/\.[^/.]+$/, '_400.webp');
      supabase.storage.from("tacks").upload(thumbPath, thumb, { contentType: 'image/webp' }).catch(() => {});
    });
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapedImages([]);
    setSelected(new Set());
    try {
      const normalized = /^https?:\/\//i.test(scrapeUrl.trim()) ? scrapeUrl.trim() : `https://${scrapeUrl.trim()}`;
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalized }) });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setScrapedImages(data.images || []); setScrapedSource(data.source || ''); }
    } catch { setError('Failed to fetch images from that page.'); }
    setScraping(false);
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session?.user) { setAdding(false); return; }
    for (const imgUrl of selected) {
      const { data } = await supabase.from("tacks").insert({
        board_id: boardId, user_id: sess.session.user.id, added_by: sess.session.user.id,
        content_url: imgUrl, source: scrapedSource || null,
        pin_color: '#1A1A1A', position_x: 0, position_y: 0, width: 300, height: 300, rotation: 0, z_index: 1,
      }).select("*").single();
      if (data) onAdded(data as Tack);
    }
    setAdding(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setUploading(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session?.user) return;
    const maxZ = 1;
    const { data, error: insErr } = await supabase.from("tacks").insert({
      board_id: boardId,
      user_id: sess.session.user.id,
      added_by: sess.session.user.id,
      content_url: url.trim(),
      title: title.trim() || null,
      note: note.trim() || null,
      source: source.trim() || null,
      pin_color: '#1A1A1A',
      position_x: 0,
      position_y: 0,
      width: 300,
      height: 300,
      rotation: 0,
      z_index: maxZ,
    }).select("*").single();
    if (insErr || !data) { setError("Couldn't save. Try again."); setUploading(false); return; }
    onAdded(data as Tack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <h2 className="font-serif text-xl">Add to mosaic</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mb-4 bg-ink/5 rounded-xl p-1 flex-shrink-0">
          <button onClick={() => setMode('upload')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-ink' : 'text-ink/50 hover:text-ink'}`}>Upload</button>
          <button onClick={() => setMode('scrape')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'scrape' ? 'bg-white shadow-sm text-ink' : 'text-ink/50 hover:text-ink'}`}>From Page</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {mode === 'upload' && (<>
        {url ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={url} alt="" className="w-full h-48 object-cover" />
            <button onClick={() => setUrl("")} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
              <svg className="w-3 h-3 stroke-white stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-ink/15 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-papaya/50 hover:bg-papaya/3 transition-all"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8 stroke-ink/25 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-sm text-ink/40">Upload an image</p>
              </>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {/* Or paste URL */}
        <div>
          <p className="text-xs text-ink/40 mb-1.5">Or paste an image URL</p>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
          />
        </div>

        {/* Metadata fields — shown once image is ready */}
        {url && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Title <span className="font-normal text-ink/30">(optional)</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name…"
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Notes <span className="font-normal text-ink/30">(optional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any context or description…"
                rows={2}
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all placeholder:text-ink/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Source <span className="font-normal text-ink/30">(optional)</span></label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Where did this come from?"
                className="w-full px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
              />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!url.trim() || uploading}
          className="w-full py-3 bg-papaya text-white rounded-full font-medium text-sm hover:bg-papaya/90 transition-colors disabled:opacity-40"
        >
          {uploading ? "Saving…" : "Add to mosaic"}
        </button>
        </>)}

        {/* ── From Page tab ── */}
        {mode === 'scrape' && (<>
          <div className="flex gap-2">
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="Paste a page URL to find images"
              className="flex-1 px-3 py-2.5 bg-ink/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 transition-all placeholder:text-ink/25"
            />
            <button
              onClick={handleScrape}
              disabled={!scrapeUrl.trim() || scraping}
              className="px-4 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-50"
            >
              {scraping ? 'Finding…' : 'Find'}
            </button>
          </div>

          {scraping && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
            </div>
          )}

          {!scraping && scrapedImages.length === 0 && scrapeUrl && !error && (
            <p className="text-sm text-ink/40 text-center py-6">Enter a URL and tap Find to discover images.</p>
          )}

          {scrapedImages.length > 0 && (<>
            <p className="text-xs text-ink/50">Found {scrapedImages.length} images from <strong className="text-ink/70">{scrapedSource}</strong>. Tap to select.</p>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {scrapedImages.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(prev => { const s = new Set(prev); s.has(imgUrl) ? s.delete(imgUrl) : s.add(imgUrl); return s; })}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected.has(imgUrl) ? 'border-papaya ring-2 ring-papaya/30' : 'border-transparent hover:border-ink/20'}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
                  {selected.has(imgUrl) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-papaya rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 stroke-white stroke-2 fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddSelected}
              disabled={selected.size === 0 || adding}
              className="w-full py-3 bg-papaya text-white rounded-full font-medium text-sm hover:bg-papaya/90 transition-colors disabled:opacity-40"
            >
              {adding ? 'Adding…' : `Add ${selected.size > 0 ? selected.size : ''} image${selected.size !== 1 ? 's' : ''}`}
            </button>
          </>)}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </>)}

        </div>{/* end scroll area */}
      </div>
    </div>
  );
}
