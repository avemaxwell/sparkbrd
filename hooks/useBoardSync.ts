"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Board, Tack, TextBlock } from "@/types/board";

// Shape of the payload object Supabase passes to postgres_changes callbacks.
// The SDK doesn't always infer this from the overload, so we annotate explicitly.
type PgPayload = { new: Record<string, unknown>; old: Record<string, unknown> };

/**
 * Subscribes to Supabase Realtime postgres_changes for the current board and
 * applies remote changes directly to the caller's state setters.
 *
 * Watches three tables:
 *  - boards      → board name / background / settings changes
 *  - tacks       → image adds, moves, resizes, deletes
 *  - text_blocks → text adds, edits, deletes
 *
 * Self-update handling:
 *  - INSERT: deduplicated by ID — if we optimistically added the row ourselves
 *    (addTack / addTextBlock already called the state setter), the incoming
 *    event is a no-op.
 *  - UPDATE: spread new values over existing row — idempotent whether the
 *    change originated locally or remotely.
 *  - DELETE: filter by ID — safe to run on an already-removed row.
 *
 * No schema changes are required. Supabase Realtime postgres_changes respects
 * existing Row Level Security policies — users only receive events for rows
 * their session can SELECT.
 *
 * ⚠️  If your Supabase project has Realtime disabled for these tables, run:
 *     ALTER PUBLICATION supabase_realtime ADD TABLE boards, tacks, text_blocks;
 */
export function useBoardSync(
  boardId: string,
  setBoard: Dispatch<SetStateAction<Board | null>>,
  setTacks: Dispatch<SetStateAction<Tack[]>>,
  setTextBlocks: Dispatch<SetStateAction<TextBlock[]>>,
  /** Ref to the ID currently being dragged/resized — Realtime won't overwrite
   *  position/size for that element while it's being manipulated locally. */
  activeManipulationRef?: MutableRefObject<string | null>,
) {
  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`board-sync:${boardId}`)

      // ── boards ─────────────────────────────────────────────────────────────
      // Only UPDATE is relevant — we never remotely insert or delete the board
      // we're currently viewing.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "boards",
          filter: `id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          setBoard((prev) =>
            prev ? { ...prev, ...(payload.new as Partial<Board>) } : prev
          );
        }
      )

      // ── tacks INSERT ───────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tacks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const incoming = payload.new as unknown as Tack;
          setTacks((prev) => {
            // Already present (we added it optimistically ourselves).
            if (prev.some((t) => t.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )

      // ── tacks UPDATE ───────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tacks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const incoming = payload.new as unknown as Tack;
          setTacks((prev) =>
            prev.map((t) => {
              if (t.id !== incoming.id) return t;
              // If this tack is actively being dragged/resized locally, don't let
              // a Realtime echo (e.g. z_index update from bringToFront) overwrite
              // the in-flight position/size — it would cause a visible jump.
              const isActive = activeManipulationRef?.current === t.id;
              if (isActive) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { position_x, position_y, width, ...nonPositionFields } = incoming;
                return { ...t, ...nonPositionFields };
              }
              return { ...t, ...incoming };
            })
          );
        }
      )

      // ── tacks DELETE ───────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tacks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const deletedId = (payload.old as { id: string }).id;
          setTacks((prev) => prev.filter((t) => t.id !== deletedId));
        }
      )

      // ── text_blocks INSERT ─────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "text_blocks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const incoming = payload.new as unknown as TextBlock;
          setTextBlocks((prev) => {
            if (prev.some((t) => t.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )

      // ── text_blocks UPDATE ─────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "text_blocks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const incoming = payload.new as unknown as TextBlock;
          setTextBlocks((prev) =>
            prev.map((t) =>
              t.id === incoming.id ? { ...t, ...incoming } : t
            )
          );
        }
      )

      // ── text_blocks DELETE ─────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "text_blocks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: PgPayload) => {
          const deletedId = (payload.old as { id: string }).id;
          setTextBlocks((prev) => prev.filter((t) => t.id !== deletedId));
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);
}
