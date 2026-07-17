"use client";

import type { PresenceUser } from "@/hooks/useBoardPresence";

// Maximum number of full avatars to render before collapsing into "+N" overflow.
const MAX_VISIBLE = 5;

interface Props {
  collaborators: PresenceUser[];
}

/**
 * Renders a stacked row of collaborator avatars for the board header.
 *
 * - Shows up to MAX_VISIBLE full avatars.
 * - Shows a "+N" pill for any additional users beyond the cap.
 * - Each avatar has a colored ring matching the collaborator's session color.
 * - Returns null when no one else is on the board (no empty space reserved).
 */
export default function PresenceAvatars({ collaborators }: Props) {
  if (collaborators.length === 0) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;

  return (
    <div className="flex items-center" aria-label="Active collaborators">
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <div
            key={user.userId}
            title={user.name ?? "Someone"}
            className="w-8 h-8 rounded-full ring-2 ring-white/80 flex-shrink-0 overflow-hidden"
            style={{ boxShadow: `0 0 0 2px ${user.color}` }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: user.color }}
              >
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        ))}

        {overflow > 0 && (
          <div
            className="w-8 h-8 rounded-full ring-2 ring-white/80 bg-white/80 backdrop-blur-md flex items-center justify-center text-[10px] font-semibold text-ink flex-shrink-0 shadow-lg"
            title={`${overflow} more ${overflow === 1 ? "person" : "people"} on this collection`}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
