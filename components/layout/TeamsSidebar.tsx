"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlan } from "@/hooks/usePlan";

interface Team {
  id: string;
  name: string;
  slug: string;
  avatar_color: string;
  avatar_url: string | null;
  _member_role: string;
}

export default function TeamsSidebar() {
  const { isTeamPlan } = usePlan();
  const pathname = usePathname();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!isTeamPlan) return;
    fetch("/api/teams")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.teams) setTeams(data.teams); })
      .catch(() => {});
  }, [isTeamPlan]);

  if (!isTeamPlan) return null;

  return (
    <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-ink/5 px-3 py-5">
      <p className="text-[10px] font-semibold text-ink/30 uppercase tracking-wider px-2 mb-2">
        Teams
      </p>

      {teams.length === 0 ? (
        <Link
          href="/team/new"
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm text-ink/40 hover:bg-ink/5 hover:text-ink/70 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg border-2 border-dashed border-ink/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 stroke-ink/30 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-xs">Create workspace</span>
        </Link>
      ) : (
        <nav className="flex flex-col gap-0.5">
          {teams.map((team) => {
            const isActive = pathname?.startsWith(`/team/${team.slug}`);
            return (
              <Link
                key={team.id}
                href={`/team/${team.slug}`}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors group ${
                  isActive
                    ? "bg-ink/8 text-ink"
                    : "hover:bg-ink/5 text-ink/70 hover:text-ink"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: team.avatar_url ? "transparent" : team.avatar_color,
                  }}
                >
                  {team.avatar_url ? (
                    <img src={team.avatar_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    team.name[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate leading-none">{team.name}</p>
                  <p className="text-[10px] text-ink/30 mt-0.5 capitalize">{team._member_role}</p>
                </div>
              </Link>
            );
          })}

          <Link
            href="/team/new"
            className="flex items-center gap-2.5 px-2 py-2 mt-1 rounded-xl text-ink/30 hover:bg-ink/5 hover:text-ink/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg border border-dashed border-ink/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-xs">New workspace</span>
          </Link>
        </nav>
      )}
    </aside>
  );
}
