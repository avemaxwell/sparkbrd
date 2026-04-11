"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

interface NotificationItem {
  id: string;
  type: 'comment_on_my_tack' | 'reply_to_my_comment' | 'reaction_on_my_tack' | 'tack_added_to_board' | 'mention_in_comment';
  is_read: boolean;
  created_at: string;
  board_id: string | null;
  tack_id: string | null;
  comment_id: string | null;
  actor: { id: string; name: string | null; avatar_url: string | null };
  board_name: string | null;
  tack_thumbnail: string | null;
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

function notifText(n: NotificationItem): string {
  const name = n.actor.name ?? 'Someone';
  switch (n.type) {
    case 'comment_on_my_tack': return `${name} commented on your tack`;
    case 'reply_to_my_comment': return `${name} replied to your comment`;
    case 'reaction_on_my_tack': return `${name} reacted to your tack`;
    case 'tack_added_to_board': return `${name} added a tack to your board`;
    case 'mention_in_comment': return `${name} mentioned you in a comment`;
  }
}

function notifUrl(n: NotificationItem): string | null {
  if (!n.board_id) return null;
  if (n.tack_id) return `/board/${n.board_id}?tack=${n.tack_id}`;
  return `/board/${n.board_id}`;
}

export default function NotificationBell() {
  const { profile } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20').then(r => r.json());
      setNotifications(res.notifications ?? []);
      setUnreadCount(res.unread_count ?? 0);
    } catch {}
  };

  // Initial load
  useEffect(() => {
    if (!profile) return;
    fetchNotifs();
  }, [profile?.id]);

  // Realtime subscription — replaces the previous 30-second polling interval.
  // Fires fetchNotifs() when a new notification row is inserted for this user,
  // so the bell updates within ~1 second of the event rather than up to 30s.
  //
  // The raw INSERT payload doesn't include joined actor/board data, so we do a
  // full refetch instead of trying to construct the item from the raw row.
  //
  // ⚠️  Requires the notifications table to be in the Supabase Realtime
  //     publication. If not already enabled, run:
  //     ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  useEffect(() => {
    if (!profile) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          // Refetch so we get the full joined shape (actor name, board name, etc.)
          fetchNotifs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleOpen = async () => {
    setOpen(true);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  if (!profile) return null;

  return (
    <div className="relative">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors relative"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-papaya text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-ink/5 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/5">
              <h3 className="font-medium text-sm text-ink">Notifications</h3>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-ink/5">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink/40 text-center">No notifications yet</p>
              ) : (
                notifications.map(n => {
                  const url = notifUrl(n);
                  return (
                  <div
                    key={n.id}
                    onClick={() => { if (url) { setOpen(false); router.push(url); } }}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${url ? 'cursor-pointer' : ''} ${!n.is_read ? 'bg-papaya/5' : 'hover:bg-ink/3'}`}
                  >
                    {n.actor.avatar_url ? (
                      <img src={n.actor.avatar_url} alt={n.actor.name ?? ''} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {n.actor.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink/80 leading-snug">{notifText(n)}</p>
                      {n.board_name && (
                        <p className="text-[10px] text-ink/40 mt-0.5 truncate">in {n.board_name}</p>
                      )}
                      <p className="text-[10px] text-ink/30 mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>

                    {n.tack_thumbnail && (
                      <img
                        src={n.tack_thumbnail}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-ink/5"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}

                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-papaya flex-shrink-0 mt-1" />
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
