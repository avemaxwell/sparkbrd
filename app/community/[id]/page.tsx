"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { relativeTime } from "@/lib/relativeTime";
import { IconChatBubble } from "@/components/icons";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("community-post");

interface Thread {
  id: string;
  title: string;
  body: string;
  actor_name: string | null;
  actor_avatar: string | null;
  user_id: string | null;
  created_at: string;
  category: { slug: string; name: string } | null;
}

interface Reply {
  id: string;
  body: string;
  actor_name: string | null;
  actor_avatar: string | null;
  created_at: string;
}

function Avatar({ name, avatar, size = 9 }: { name: string | null; avatar: string | null; size?: number }) {
  const px = `${size * 4}px`;
  return avatar ? (
    <img src={avatar} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: px, height: px }} />
  ) : (
    <div
      className="rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: px, height: px, fontSize: `${size * 1.1}px` }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useUser();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchThread = () => {
    fetch(`/api/community/threads/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setThread(data.thread); setReplies(data.replies ?? []); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchThread(); }, [id]);

  // Realtime — new replies appear without a manual refresh
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`community-thread:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_replies', filter: `thread_id=eq.${id}` }, fetchThread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/threads/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText }),
      });
      if (res.ok) { setReplyText(""); fetchThread(); }
    } catch {}
    setSubmitting(false);
  };

  if (notFound) {
    return (
      <main className="min-h-screen bg-cork-warm flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-serif text-2xl text-ink mb-2">Thread not found</h1>
          <Link href="/community" className="text-papaya font-medium hover:underline">Back to Community</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />
      <ShapeCorner className="absolute top-24 right-4 hidden lg:block" />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 md:pt-36">
        <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-6 transition-colors">
          <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Community
        </Link>

        {loading || !thread ? (
          <div className="space-y-4">
            <div className="h-32 bg-white/60 rounded-2xl animate-pulse" />
            <div className="h-20 bg-white/60 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-black/5 p-6 mb-6">
              {thread.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blush">{thread.category.name}</span>
              )}
              <h1 className="font-serif font-bold text-2xl md:text-3xl text-ink mt-1 mb-4">{thread.title}</h1>
              <p className="text-ink/70 leading-relaxed whitespace-pre-wrap mb-5">{thread.body}</p>
              <div className="flex items-center gap-2.5 pt-4 border-t border-ink/5">
                <Avatar name={thread.actor_name} avatar={thread.actor_avatar} />
                <div>
                  <p className="text-sm font-medium text-ink">{thread.actor_name ?? 'A Sparkurio educator'}</p>
                  <p className="text-xs text-ink/40">{relativeTime(thread.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-ink/50 text-sm font-medium mb-4">
              <IconChatBubble className="w-4 h-4" />
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>

            <div className="space-y-3 mb-6">
              {replies.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-black/5 p-5">
                  <p className="text-ink/70 leading-relaxed whitespace-pre-wrap mb-4">{r.body}</p>
                  <div className="flex items-center gap-2">
                    <Avatar name={r.actor_name} avatar={r.actor_avatar} size={7} />
                    <p className="text-xs font-medium text-ink">{r.actor_name ?? 'A Sparkurio educator'}</p>
                    <span className="text-xs text-ink/30">· {relativeTime(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {profile ? (
              <form onSubmit={handleReply} className="bg-white rounded-2xl border border-black/5 p-5">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add to the conversation…"
                  rows={3}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all text-sm mb-3"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-6 py-2.5 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting…' : 'Reply'}
                </button>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-black/5 p-6 text-center">
                <p className="text-sm text-ink/60 mb-3">Sign in to join the conversation.</p>
                <button
                  onClick={() => router.push(`/signup?intent=community&redirect=/community/${id}`)}
                  className="px-6 py-2.5 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors"
                >
                  Create a free account
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
