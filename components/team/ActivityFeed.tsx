"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { tackMini } from "@/lib/image-transform";

interface ActivityItem {
  id: string;
  type: string;
  actor_name: string | null;
  actor_avatar: string | null;
  board_id: string | null;
  board_name: string | null;
  tack_id: string | null;
  tack_thumbnail: string | null;
  comment_body: string | null;
  created_at: string;
}

interface DiscussionPost {
  id: string;
  team_id: string;
  activity_id: string | null;
  parent_id: string | null;
  user_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  body: string;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function activityText(item: ActivityItem): string {
  const name = item.actor_name ?? 'Someone';
  switch (item.type) {
    case 'tack_added':     return item.board_name ? `${name} added a resource to ${item.board_name}` : `${name} added a resource`;
    case 'board_created':  return item.board_name ? `${name} created "${item.board_name}"` : `${name} created a collection`;
    case 'comment_posted': return `${name} commented`;
    case 'reaction_added': return `${name} reacted`;
    case 'member_joined':  return `${name} joined the team`;
    default:               return `${name} did something`;
  }
}

function ActivityIcon({ type }: { type: string }) {
  const base = "w-3.5 h-3.5 stroke-current stroke-[1.5] fill-none flex-shrink-0";
  switch (type) {
    case 'tack_added':
      return <svg className={base} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
    case 'board_created':
      return <svg className={base} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    case 'comment_posted':
      return <svg className={base} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'reaction_added':
      return <svg className={base} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'member_joined':
      return <svg className={base} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
    default:
      return <svg className={base} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
  }
}

function Avatar({ name, avatar_url, size = 7 }: { name: string | null; avatar_url: string | null; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  if (avatar_url) {
    return <img src={avatar_url} alt={name ?? ''} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-papaya to-blush flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function DiscussionPostRow({ post }: { post: DiscussionPost }) {
  return (
    <div className="flex gap-2 px-1 py-1.5">
      <Avatar name={post.actor_name} avatar_url={post.actor_avatar} size={6} />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-ink/70">{post.actor_name ?? 'Member'} </span>
        <span className="text-[11px] text-ink/60 leading-snug">{post.body}</span>
        <p className="text-[10px] text-ink/30 mt-0.5">{relativeTime(post.created_at)}</p>
      </div>
    </div>
  );
}

interface ReplyBoxProps {
  onSubmit: (text: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
}

function ReplyBox({ onSubmit, placeholder = 'Write a reply…', autoFocus }: ReplyBoxProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(text.trim());
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="flex gap-2 items-end mt-1">
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none text-[11px] bg-ink/5 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-papaya/40 placeholder:text-ink/30 leading-snug"
        style={{ minHeight: '2rem', maxHeight: '6rem' }}
        disabled={submitting}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || submitting}
        className="w-7 h-7 rounded-lg bg-papaya flex items-center justify-center disabled:opacity-40 flex-shrink-0 hover:bg-papaya/90 transition-colors"
      >
        <svg className="w-3.5 h-3.5 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  );
}

export default function ActivityFeed({ teamId }: { teamId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [chatText, setChatText] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLTextAreaElement>(null);

  const fetchAll = useCallback(async () => {
    const [actRes, discRes] = await Promise.all([
      fetch(`/api/teams/${teamId}/activity`),
      fetch(`/api/teams/${teamId}/discussion`),
    ]);
    if (actRes.ok) {
      const { activity } = await actRes.json();
      setItems(activity ?? []);
    }
    if (discRes.ok) {
      const { posts: fetchedPosts } = await discRes.json();
      setPosts(fetchedPosts ?? []);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient();

    const activityChannel = supabase
      .channel(`team-activity:${teamId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_activity', filter: `team_id=eq.${teamId}` }, () => fetchAll())
      .subscribe();

    const discussionChannel = supabase
      .channel(`team-discussion:${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_discussion', filter: `team_id=eq.${teamId}` }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(discussionChannel);
    };
  }, [teamId, fetchAll]);

  // Scroll to bottom on new content
  useEffect(() => {
    if (!loading) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [items.length, posts.length, loading]);

  const postReply = async (activityId: string | null, parentId: string | null, text: string) => {
    await fetch(`/api/teams/${teamId}/discussion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, activity_id: activityId, parent_id: parentId }),
    });
    await fetchAll();
  };

  const postChat = async () => {
    if (!chatText.trim() || chatSubmitting) return;
    setChatSubmitting(true);
    await fetch(`/api/teams/${teamId}/discussion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatText.trim() }),
    });
    setChatText('');
    setChatSubmitting(false);
    await fetchAll();
  };

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build a chronological merged list: reversed activity (oldest→newest) + standalone posts
  const chronoItems = [...items].reverse();
  const topLevelPosts = posts.filter(p => !p.activity_id && !p.parent_id);
  const repliesFor = (actId: string) => posts.filter(p => p.activity_id === actId && !p.parent_id);
  const repliesToPost = (postId: string) => posts.filter(p => p.parent_id === postId);

  // Merge chronologically: both lists sorted by created_at ascending
  type FeedItem =
    | { kind: 'activity'; data: ActivityItem }
    | { kind: 'post'; data: DiscussionPost };

  const merged: FeedItem[] = [
    ...chronoItems.map(d => ({ kind: 'activity' as const, data: d })),
    ...topLevelPosts.map(d => ({ kind: 'post' as const, data: d })),
  ].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());

  const hasAnything = items.length > 0 || posts.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink/5 flex-shrink-0">
        <h3 className="font-medium text-sm text-ink">Activity &amp; Discussion</h3>
        <p className="text-[11px] text-ink/40 mt-0.5">Live updates · team chat</p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
          </div>
        )}

        {!loading && !hasAnything && (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-ink/40">No activity yet.</p>
            <p className="text-[11px] text-ink/30 mt-1">Activity will appear here as your team works. Start the conversation below!</p>
          </div>
        )}

        {!loading && merged.map(entry => {
          if (entry.kind === 'activity') {
            const item = entry.data;
            const replies = repliesFor(item.id);
            const isExpanded = expandedThreads.has(item.id);

            return (
              <div key={`act-${item.id}`} className="rounded-xl hover:bg-ink/3 transition-colors">
                {/* Activity row */}
                <div className="flex gap-2.5 px-2 pt-2 pb-1">
                  <Avatar name={item.actor_name} avatar_url={item.actor_avatar} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-ink/35 flex-shrink-0"><ActivityIcon type={item.type} /></span>
                      <p className="text-[11px] text-ink/75 leading-snug">{activityText(item)}</p>
                    </div>
                    {item.board_name && item.board_id && (
                      <a href={`/board/${item.board_id}${item.tack_id ? `?tack=${item.tack_id}` : ''}`}
                        className="text-[10px] text-papaya hover:underline truncate block mt-0.5">
                        {item.board_name}
                      </a>
                    )}
                    {item.comment_body && (
                      <p className="text-[10px] text-ink/50 mt-0.5 line-clamp-2 italic">"{item.comment_body}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-ink/30">{relativeTime(item.created_at)}</p>
                      <button
                        onClick={() => toggleThread(item.id)}
                        className="text-[10px] text-ink/40 hover:text-papaya transition-colors"
                      >
                        {replies.length > 0
                          ? `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`
                          : 'Reply'}
                      </button>
                    </div>
                  </div>
                  {item.tack_thumbnail && (
                    <img
                      src={tackMini(item.tack_thumbnail)}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg bg-ink/5 flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Inline thread */}
                {(isExpanded || replies.length > 0) && (
                  <div className="ml-9 mr-2 pb-2 border-l-2 border-ink/8 pl-3">
                    {replies.map(r => (
                      <div key={r.id}>
                        <DiscussionPostRow post={r} />
                        {/* Nested replies to reply */}
                        {repliesToPost(r.id).map(nested => (
                          <div key={nested.id} className="ml-6 border-l border-ink/8 pl-2">
                            <DiscussionPostRow post={nested} />
                          </div>
                        ))}
                      </div>
                    ))}
                    <ReplyBox
                      onSubmit={text => postReply(item.id, null, text)}
                      placeholder="Reply to this…"
                      autoFocus={isExpanded && replies.length === 0}
                    />
                  </div>
                )}
              </div>
            );
          }

          // Standalone discussion post
          const post = entry.data;
          const nested = repliesToPost(post.id);
          const isExpanded = expandedThreads.has(`post-${post.id}`);

          return (
            <div key={`post-${post.id}`} className="rounded-xl hover:bg-ink/3 transition-colors">
              <div className="flex gap-2.5 px-2 pt-2 pb-1">
                <Avatar name={post.actor_name} avatar_url={post.actor_avatar} size={7} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-ink/75 leading-snug">
                    <span className="font-medium">{post.actor_name ?? 'Member'} </span>
                    {post.body}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-ink/30">{relativeTime(post.created_at)}</p>
                    <button
                      onClick={() => toggleThread(`post-${post.id}`)}
                      className="text-[10px] text-ink/40 hover:text-papaya transition-colors"
                    >
                      {nested.length > 0 ? `${nested.length} repl${nested.length === 1 ? 'y' : 'ies'}` : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>

              {(isExpanded || nested.length > 0) && (
                <div className="ml-9 mr-2 pb-2 border-l-2 border-ink/8 pl-3">
                  {nested.map(r => <DiscussionPostRow key={r.id} post={r} />)}
                  <ReplyBox
                    onSubmit={text => postReply(null, post.id, text)}
                    placeholder="Reply…"
                    autoFocus={isExpanded && nested.length === 0}
                  />
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-ink/5">
        <div className="flex gap-2 items-end">
          <textarea
            ref={chatRef}
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postChat(); }
            }}
            placeholder="Post a message…"
            rows={1}
            className="flex-1 resize-none text-xs bg-ink/5 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-papaya/30 placeholder:text-ink/30 leading-snug"
            style={{ minHeight: '2.25rem', maxHeight: '7rem' }}
            disabled={chatSubmitting}
          />
          <button
            onClick={postChat}
            disabled={!chatText.trim() || chatSubmitting}
            className="w-8 h-8 rounded-xl bg-papaya flex items-center justify-center disabled:opacity-40 flex-shrink-0 hover:bg-papaya/90 transition-colors"
          >
            <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-ink/25 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
