"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

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
    case 'tack_added':    return `${name} tacked an image`;
    case 'board_created': return `${name} created a board`;
    case 'comment_posted':return `${name} commented`;
    case 'reaction_added':return `${name} reacted`;
    case 'member_joined': return `${name} joined the team`;
    default:              return `${name} did something`;
  }
}

function ActivityIcon({ type }: { type: string }) {
  const base = "w-4 h-4 stroke-current stroke-[1.5] fill-none";
  switch (type) {
    case 'tack_added':
      return <svg className={base} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="9" y1="11" x2="15" y2="11"/></svg>;
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

export default function ActivityFeed({ teamId }: { teamId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchActivity = async () => {
    const res = await fetch(`/api/teams/${teamId}/activity`);
    if (res.ok) {
      const { activity } = await res.json();
      setItems(activity ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivity();
  }, [teamId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`team-activity:${teamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_activity', filter: `team_id=eq.${teamId}` },
        () => { fetchActivity(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId]);

  // Scroll to bottom on new item
  useEffect(() => {
    if (items.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [items.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-ink/5 flex-shrink-0">
        <h3 className="font-medium text-sm text-ink">Activity</h3>
        <p className="text-[11px] text-ink/40 mt-0.5">Live team updates</p>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-ink/40">No activity yet.</p>
            <p className="text-[11px] text-ink/30 mt-1">Activity will appear here as your team works.</p>
          </div>
        )}

        {[...items].reverse().map(item => (
          <div key={item.id} className="flex gap-2.5 px-1 py-2 rounded-xl hover:bg-ink/3 transition-colors group">
            {/* Avatar */}
            {item.actor_avatar ? (
              <img src={item.actor_avatar} alt={item.actor_name ?? ''} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-papaya to-blush flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 mt-0.5">
                {item.actor_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <span className="text-ink/40 mt-0.5 flex-shrink-0"><ActivityIcon type={item.type} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink/80 leading-snug">{activityText(item)}</p>
                  {item.board_name && (
                    item.board_id ? (
                      <a href={`/board/${item.board_id}${item.tack_id ? `?tack=${item.tack_id}` : ''}`}
                        className="text-[11px] text-papaya hover:underline truncate block mt-0.5">
                        {item.board_name}
                      </a>
                    ) : (
                      <p className="text-[11px] text-ink/40 truncate mt-0.5">{item.board_name}</p>
                    )
                  )}
                  {item.comment_body && (
                    <p className="text-[11px] text-ink/50 mt-0.5 line-clamp-2 italic">"{item.comment_body}"</p>
                  )}
                  <p className="text-[10px] text-ink/30 mt-0.5">{relativeTime(item.created_at)}</p>
                </div>
              </div>

              {item.tack_thumbnail && (
                <img
                  src={item.tack_thumbnail}
                  alt=""
                  className="mt-1.5 w-full max-h-24 object-cover rounded-lg bg-ink/5"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
