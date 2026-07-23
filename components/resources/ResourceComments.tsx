"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { relativeTime } from "@/lib/relativeTime";

interface CommentAuthor {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_founding_educator?: boolean;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author: CommentAuthor;
}

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  if (avatarUrl) return <img src={avatarUrl} alt={name ?? ''} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

// Feedback on a shared resource — kept intentionally simpler than board/tack
// comments (no threading, no @mentions): a flat list + a post box.
export default function ResourceComments({ resourceId }: { resourceId: string }) {
  const { profile } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?resource_id=${resourceId}`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resourceId]);

  const handlePost = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, body: body.trim() }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setBody("");
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <section>
      <h2 className="font-serif font-bold text-xl text-ink mb-4">
        Feedback {comments.length > 0 && <span className="text-ink/40 font-normal">({comments.length})</span>}
      </h2>

      {profile ? (
        <div className="flex items-start gap-3 mb-6">
          <Avatar name={profile.name} avatarUrl={profile.avatar_url} />
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave feedback or ask a question about this resource…"
              rows={2}
              maxLength={2000}
              className="w-full px-3.5 py-2.5 bg-white border border-black/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all placeholder:text-ink/30"
            />
            <button
              onClick={handlePost}
              disabled={!body.trim() || posting}
              className="mt-2 px-5 py-2 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink/40 mb-6">
          <a href="/login" className="text-papaya font-medium hover:underline">Log in</a> to leave feedback.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink/30">No feedback yet — be the first.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar name={c.author.name} avatarUrl={c.author.avatar_url} />
              <div className="flex-1 bg-white rounded-2xl p-3.5 border border-black/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-ink flex items-center gap-1">
                    <span>{c.author.name ?? "A Sparkurio educator"}</span>
                    {c.author.is_founding_educator && (
                      <img src="/icon.png" alt="" title="Founding Educator" className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="text-xs text-ink/30">{relativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-ink/70 whitespace-pre-line">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
