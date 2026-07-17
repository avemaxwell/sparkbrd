"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Color palette ────────────────────────────────────────────────────────────
// A fixed set of visually distinct, accessible colors for collaborator cursors
// and avatars. Colors are assigned deterministically from the user's ID so the
// same person always gets the same color in every session.
const PRESENCE_COLORS = [
  "#4C4DFF", // electric blue
  "#FF00C8", // spark pink
  "#7C3AED", // violet
  "#D97706", // amber
  "#059669", // emerald
  "#DB2777", // pink
  "#2563EB", // blue
  "#EA580C", // orange
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresenceUser {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
}

interface PresencePayload {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
}

interface CurrentUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Throttle cursor broadcasts to stay well within Supabase Realtime rate limits
// while still feeling smooth to observers.
const CURSOR_THROTTLE_MS = 120;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param enabled - Pass false to skip subscribing entirely (e.g. free/pro plan
 *   users on a board that doesn't have collaboration unlocked). The hook still
 *   runs unconditionally so React's hook ordering rules are never violated.
 */
export function useBoardPresence(
  boardId: string,
  currentUser: CurrentUser | null,
  enabled = true
) {
  const [collaborators, setCollaborators] = useState<PresenceUser[]>([]);

  // Stable refs so callbacks never go stale without re-subscribing the channel.
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isJoinedRef = useRef(false);
  const lastBroadcastRef = useRef(0);
  const currentUserRef = useRef(currentUser);

  // Keep the ref in sync with the latest value on every render.
  useEffect(() => {
    currentUserRef.current = currentUser;
  });

  // Detect mobile once on mount — cursor tracking is disabled on touch devices.
  const isMobileRef = useRef(
    typeof window !== "undefined" && "ontouchstart" in window
  );

  // ── Channel lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    // Don't subscribe if presence is disabled (plan gate) or user is unknown.
    if (!enabled || !boardId || !currentUser) return;

    const supabase = createClient();
    const myColor = colorForUser(currentUser.id);
    const channelName = `board-presence:${boardId}`;

    const channel = supabase.channel(channelName, {
      config: {
        // Using the userId as the presence key means all tabs from the same
        // user share one slot. The latest track() call wins — which is correct
        // behaviour for cursor positions.
        presence: { key: currentUser.id },
      },
    });

    channelRef.current = channel;

    // ── Presence event handlers ──────────────────────────────────────────────

    // "sync" fires on initial load and after reconnects, giving us the full
    // current state of the channel. Rebuild collaborators from scratch here.
    channel.on("presence", { event: "sync" }, () => {
      // presenceState() returns Record<string, unknown[]> in this SDK version —
      // cast to our known payload shape.
      const state = channel.presenceState() as Record<string, PresencePayload[]>;
      const others: PresenceUser[] = [];

      for (const [key, presences] of Object.entries(state)) {
        if (key === currentUser.id) continue;
        // Each key may have multiple presences (one per open tab from that user).
        // Take the most recent (last element) as the canonical state.
        const latest = presences[presences.length - 1];
        if (latest) {
          others.push({
            userId: latest.userId,
            name: latest.name,
            avatarUrl: latest.avatarUrl,
            color: latest.color,
            cursor: latest.cursor,
          });
        }
      }

      setCollaborators(others);
    });

    // "join" fires when a new user (or a new tab from an existing user) appears.
    channel.on(
      "presence",
      { event: "join" },
      ({ key, newPresences }: { key: string; newPresences: PresencePayload[] }) => {
        if (key === currentUser.id) return;
        const newest = newPresences[newPresences.length - 1];
        if (!newest) return;

        setCollaborators((prev) => {
          const filtered = prev.filter((c) => c.userId !== key);
          return [
            ...filtered,
            {
              userId: newest.userId,
              name: newest.name,
              avatarUrl: newest.avatarUrl,
              color: newest.color,
              cursor: newest.cursor,
            },
          ];
        });
      }
    );

    // "leave" fires when a user disconnects or navigates away. Supabase tracks
    // presence server-side so this fires even on hard tab closes.
    channel.on(
      "presence",
      { event: "leave" },
      ({ key }: { key: string }) => {
        if (key === currentUser.id) return;
        setCollaborators((prev) => prev.filter((c) => c.userId !== key));
      }
    );

    // ── Subscribe and announce ourselves ────────────────────────────────────

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED" && !isJoinedRef.current) {
        isJoinedRef.current = true;
        await channel.track({
          userId: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          color: myColor,
          cursor: null,
        } satisfies PresencePayload);
      }
    });

    // ── Cleanup ──────────────────────────────────────────────────────────────

    return () => {
      isJoinedRef.current = false;
      // Explicitly untrack before removing the channel so our avatar disappears
      // from other users' screens immediately rather than waiting for timeout.
      channel.untrack().finally(() => {
        supabase.removeChannel(channel);
      });
      channelRef.current = null;
      setCollaborators([]);
    };
  }, [boardId, currentUser?.id, enabled]); // Re-subscribe only when board, user, or gate changes.

  // ── Cursor broadcast ───────────────────────────────────────────────────────

  // Called by BoardCanvas on every mouse-move event. Throttled internally so we
  // don't spam the Realtime channel. Disabled entirely on touch devices.
  // When the channel isn't joined (plan gate off, or not yet subscribed) this
  // is a safe no-op via the isJoinedRef guard.
  const broadcastCursor = useCallback((canvasX: number, canvasY: number) => {
    if (isMobileRef.current) return;

    const channel = channelRef.current;
    const user = currentUserRef.current;
    if (!channel || !user || !isJoinedRef.current) return;

    const now = Date.now();
    if (now - lastBroadcastRef.current < CURSOR_THROTTLE_MS) return;
    lastBroadcastRef.current = now;

    channel.track({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      color: colorForUser(user.id),
      cursor: { x: canvasX, y: canvasY },
    } satisfies PresencePayload);
  }, []); // Stable — reads from refs, no external deps.

  // Called when the mouse leaves the canvas so we don't show a stale cursor
  // frozen at the edge for remote users.
  const clearCursor = useCallback(() => {
    const channel = channelRef.current;
    const user = currentUserRef.current;
    if (!channel || !user || !isJoinedRef.current) return;

    channel.track({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      color: colorForUser(user.id),
      cursor: null,
    } satisfies PresencePayload);
  }, []); // Stable — reads from refs, no external deps.

  return { collaborators, broadcastCursor, clearCursor };
}
