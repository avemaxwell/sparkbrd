"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface TackShape {
  id: string;
  content_url: string;
  title: string | null;
  origin_item_id: string | null;
}

interface CommentAuthor {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  board_id: string;
  tack_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  reply_count: number;
}

interface ReactionState {
  counts: Record<string, number>;
  user_reactions: string[];
}

interface CommentDrawerProps {
  tack: TackShape;
  boardId: string;
  currentUserId: string | null;
  onClose: () => void;
}

const REACTION_TYPES = ['❤️', '🔥', '✨', '👀', '😍'];

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ name, avatarUrl, size = 8 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name ?? ''} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── CommentRow ────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string | null;
  isReply?: boolean;
  onReply: (id: string, authorName: string | null) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const isOwn = currentUserId === comment.author.id;

  const handleSave = async () => {
    if (!editBody.trim() || editBody.trim() === comment.body) { setEditing(false); return; }
    setSaving(true);
    await onEdit(comment.id, editBody.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className={`flex gap-2.5 ${isReply ? 'pl-8 border-l border-ink/10 ml-2' : ''}`}>
      <Avatar name={comment.author.name} avatarUrl={comment.author.avatar_url} size={7} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink">{comment.author.name ?? 'Anonymous'}</span>
          <span className="text-[10px] text-ink/40">{relativeTime(comment.created_at)}</span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-[10px] text-ink/30 italic">edited</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={2}
              className="w-full bg-ink/5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none"
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleSave} disabled={saving} className="text-xs text-papaya font-medium hover:underline disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setEditBody(comment.body); }} className="text-xs text-ink/40 hover:text-ink">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink/80 mt-0.5 break-words">{comment.body}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          {!isReply && currentUserId && (
            <button
              onClick={() => onReply(comment.id, comment.author.name)}
              className="text-[11px] text-ink/40 hover:text-papaya transition-colors font-medium"
            >
              Reply
            </button>
          )}
          {isOwn && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="text-[11px] text-ink/40 hover:text-ink transition-colors">Edit</button>
              <button onClick={() => onDelete(comment.id)} className="text-[11px] text-ink/40 hover:text-red-500 transition-colors">Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CommentDrawer ─────────────────────────────────────────────────────

export default function CommentDrawer({ tack, boardId, currentUserId, onClose }: CommentDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<ReactionState>({ counts: {}, user_reactions: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string | null } | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention autocomplete
  const [collaborators, setCollaborators] = useState<{ id: string; name: string | null; avatar_url: string | null }[]>([]);
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const canonicalId = tack.origin_item_id ?? tack.id;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [commentsResp, reactionsResp] = await Promise.all([
          fetch(`/api/comments?board_id=${boardId}&tack_id=${tack.id}`),
          fetch(`/api/reactions/${canonicalId}`),
        ]);
        const [commentsRes, reactionsRes] = await Promise.all([
          commentsResp.json(),
          reactionsResp.json(),
        ]);
        if (!cancelled) {
          if (commentsRes.error) setLoadError(commentsRes.error);
          setComments(commentsRes.comments ?? []);
          setReactions({ counts: reactionsRes.counts ?? {}, user_reactions: reactionsRes.user_reactions ?? [] });
        }
      } catch (e) {
        if (!cancelled) setLoadError('Failed to load — check that migrations have been run in Supabase.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tack.id, boardId, canonicalId]);

  const handleReaction = async (type: string) => {
    if (!currentUserId) return;
    const resp = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tack_id: tack.id, reaction_type: type }),
    });
    const res = await resp.json();
    if (res.error) {
      console.error('Reaction error:', res.error);
      return;
    }
    setReactions({ counts: res.counts ?? {}, user_reactions: res.user_reactions ?? [] });
  };

  const handleSubmit = async () => {
    if (!draft.trim() || !currentUserId) return;
    setSubmitting(true);
    setSubmitError(null);
    const resp = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: boardId,
        tack_id: tack.id,
        parent_id: replyingTo?.id ?? null,
        body: draft.trim(),
      }),
    });
    const res = await resp.json();
    if (res.comment) {
      setComments(prev => [...prev, res.comment]);
      setDraft('');
      setReplyingTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      setSubmitError(res.error ?? 'Failed to post comment');
    }
    setSubmitting(false);
  };

  const handleEdit = async (commentId: string, body: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }).then(r => r.json());
    if (res.comment) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, ...res.comment } : c));
    }
  };

  const handleDelete = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
  };

  const fetchCollaborators = async () => {
    if (collaborators.length > 0) return;
    const res = await fetch(`/api/boards/${boardId}/collaborators`).then(r => r.json());
    setCollaborators(res.collaborators ?? []);
  };

  const mentionMatches = mentionAnchor !== null
    ? collaborators.filter(c => c.name && c.name.toLowerCase().startsWith(mentionQuery))
    : [];

  const selectMention = (name: string) => {
    if (mentionAnchor === null) return;
    const before = draft.slice(0, mentionAnchor);
    const after = draft.slice(mentionAnchor + 1 + mentionQuery.length);
    const newDraft = `${before}@${name}${after.startsWith(' ') ? '' : ' '}${after}`;
    setDraft(newDraft);
    setMentionAnchor(null);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleDraftChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraft(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([\w ]*)$/);
    if (match && match.index !== undefined) {
      setMentionAnchor(match.index);
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(0);
      fetchCollaborators();
    } else {
      setMentionAnchor(null);
      setMentionQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionMatches.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); selectMention(mentionMatches[mentionIndex].name!); return; }
      if (e.key === 'Escape') { setMentionAnchor(null); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (id: string) => comments.filter(c => c.parent_id === id);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">

        {/* Header: tack preview */}
        <div className="flex items-start gap-3 p-4 border-b border-ink/5 flex-shrink-0">
          <img
            src={tack.content_url}
            alt={tack.title ?? ''}
            className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-ink/5"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base text-ink leading-tight truncate">
              {tack.title ?? 'Untitled'}
            </h3>
            {tack.origin_item_id && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-ink/50 bg-ink/5 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Tacked from another board
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-ink/5 flex-shrink-0 flex-wrap">
          {REACTION_TYPES.map(type => {
            const count = reactions.counts[type] ?? 0;
            const active = reactions.user_reactions.includes(type);
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={!currentUserId}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all border ${
                  active
                    ? 'bg-papaya/10 border-papaya/30 scale-105'
                    : 'bg-ink/5 border-transparent hover:bg-ink/10'
                } disabled:cursor-default disabled:opacity-60`}
                title={currentUserId ? undefined : 'Sign in to react'}
              >
                <span>{type}</span>
                {count > 0 && <span className="text-xs text-ink/60 font-medium tabular-nums">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
            </div>
          )}

          {!loading && loadError && (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-red-500 font-medium">Error loading comments</p>
              <p className="text-[11px] text-ink/40 mt-1">{loadError}</p>
            </div>
          )}

          {!loading && !loadError && topLevel.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-ink/40">No comments yet.</p>
              {currentUserId && <p className="text-xs text-ink/30 mt-1">Be the first to say something.</p>}
            </div>
          )}

          {!loading && topLevel.map(comment => (
            <div key={comment.id} className="space-y-3">
              <CommentRow
                comment={comment}
                currentUserId={currentUserId}
                onReply={(id, name) => setReplyingTo({ id, authorName: name })}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {getReplies(comment.id).map(reply => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  isReply
                  onReply={() => {}}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-ink/5 p-3 flex-shrink-0">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-2 py-1 bg-papaya/8 rounded-lg">
              <span className="text-xs text-papaya font-medium">
                Replying to {replyingTo.authorName ?? 'comment'}
              </span>
              <button onClick={() => setReplyingTo(null)} className="text-papaya/60 hover:text-papaya">
                <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}

          {submitError && (
            <p className="text-[11px] text-red-500 mb-2 px-1">{submitError}</p>
          )}

          {currentUserId ? (
            <div className="flex gap-2 items-end relative">
              {mentionMatches.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-56 bg-white rounded-xl shadow-xl border border-ink/10 overflow-hidden z-10">
                  {mentionMatches.slice(0, 6).map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); selectMention(c.name!); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${i === mentionIndex ? 'bg-papaya/10 text-papaya' : 'hover:bg-ink/5 text-ink'}`}
                    >
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name ?? ''} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                          {c.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment…"
                rows={2}
                className="flex-1 bg-ink/5 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!draft.trim() || submitting}
                className="w-9 h-9 rounded-full bg-papaya text-white flex items-center justify-center hover:bg-papaya/90 transition-colors disabled:opacity-40 flex-shrink-0 mb-0.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                )}
              </button>
            </div>
          ) : (
            <a href="/login" className="block text-center text-sm text-papaya hover:underline py-2">
              Sign in to comment
            </a>
          )}
        </div>
      </div>
    </>
  );
}
