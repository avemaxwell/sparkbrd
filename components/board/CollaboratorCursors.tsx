"use client";

import type { PresenceUser } from "@/hooks/useBoardPresence";

interface Props {
  collaborators: PresenceUser[];
}

/**
 * Renders live cursor indicators for remote collaborators.
 *
 * These elements are placed as direct children of `board-canvas-inner`, which
 * means they live in canvas coordinate space and inherit the parent's
 * `transform: scale(zoom) translate(pan)` automatically — no coordinate
 * conversion needed here.
 *
 * Only users who have a non-null cursor position are rendered. Collaborators
 * whose cursor is null (they left the canvas or are on mobile) are skipped.
 */
export default function CollaboratorCursors({ collaborators }: Props) {
  const withCursors = collaborators.filter((c) => c.cursor !== null);
  if (withCursors.length === 0) return null;

  return (
    <>
      {withCursors.map((user) => {
        if (!user.cursor) return null;
        return (
          <div
            key={user.userId}
            className="absolute pointer-events-none"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              zIndex: 9999,
              // Translate so the tip of the cursor SVG sits exactly at the
              // broadcasted canvas coordinate.
              transform: "translate(0, 0)",
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="18"
              height="22"
              viewBox="0 0 18 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm"
            >
              <path
                d="M2 2L14 9L9 10.8L6.5 18L2 2Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name label — positioned to the right of the cursor tip */}
            <div
              className="absolute top-3 left-4 px-2 py-0.5 rounded-full text-white text-[11px] font-medium whitespace-nowrap leading-5"
              style={{
                backgroundColor: user.color,
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {user.name ?? "Someone"}
            </div>
          </div>
        );
      })}
    </>
  );
}
