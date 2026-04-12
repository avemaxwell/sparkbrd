"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ActivityFeed from "@/components/team/ActivityFeed";
import { useUser } from "@/hooks/useUser";

const BOARD_GRADIENTS = [
  "from-papaya/30 to-mustard/20",
  "from-aqua/25 to-blush/20",
  "from-blush/30 to-papaya/15",
  "from-mustard/25 to-aqua/20",
];
const COLLAGE_ANGLES = [-5, 3, -2];

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
}

interface TeamBoard {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamData {
  team: {
    id: string;
    name: string;
    slug: string;
    avatar_color: string;
    owner_id: string;
    created_at: string;
    owner_profile: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
  };
  members: TeamMember[];
  invitations: { id: string; email: string; role: string; expires_at: string }[];
  boards: TeamBoard[];
  current_user_role: string;
}

function AvatarCircle({ name, avatar_url, size = 8 }: { name: string | null | undefined; avatar_url: string | null | undefined; size?: number }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name ?? ''}
        className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-papaya to-blush flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { profile } = useUser();
  const [data, setData] = useState<TeamData | null>(null);
  const [boardImages, setBoardImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // Find team by slug
      const teamsRes = await fetch('/api/teams');
      if (!teamsRes.ok) { setError('Could not load teams'); setLoading(false); return; }
      const { teams } = await teamsRes.json();
      const team = teams.find((t: any) => t.slug === slug);
      if (!team) { setError('Team not found'); setLoading(false); return; }

      // Fetch full team detail
      const detailRes = await fetch(`/api/teams/${team.id}`);
      if (!detailRes.ok) { setError('Could not load team'); setLoading(false); return; }
      const teamData: TeamData = await detailRes.json();
      setData(teamData);

      // Fetch board preview images
      if (teamData.boards.length > 0) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const boardIds = teamData.boards.map(b => b.id);
        const { data: tacksData } = await supabase
          .from('tacks')
          .select('board_id, content_url')
          .in('board_id', boardIds);

        if (tacksData) {
          const imageMap: Record<string, string[]> = {};
          for (const tack of tacksData) {
            if (!imageMap[tack.board_id]) imageMap[tack.board_id] = [];
            if (imageMap[tack.board_id].length < 3) imageMap[tack.board_id].push(tack.content_url);
          }
          setBoardImages(imageMap);
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  const canManage = data?.current_user_role === 'owner' || data?.current_user_role === 'admin';

  const allMembers = data ? [
    // Owner first
    {
      user_id: data.team.owner_id,
      role: 'owner',
      profile: data.team.owner_profile,
    },
    ...data.members.filter(m => m.user_id !== data.team.owner_id),
  ] : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
        <Header />
        <div className="pt-24 px-6 text-center">
          <p className="text-ink-soft">{error ?? 'Something went wrong'}</p>
          <Link href="/" className="mt-4 inline-block text-papaya text-sm">Go home</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />
      <div className="pt-24 md:pt-28 pb-16">
        <div className="max-w-screen-2xl mx-auto flex gap-0 lg:gap-6 px-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">

          {/* Team header */}
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-4">
              {(data.team as any).avatar_url ? (
                <img
                  src={(data.team as any).avatar_url}
                  alt={data.team.name}
                  className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
                  style={{ backgroundColor: data.team.avatar_color }}
                >
                  {data.team.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-ink/90 leading-none">{data.team.name}</h1>
                <p className="text-ink/40 text-sm mt-1.5">
                  {allMembers.length} member{allMembers.length !== 1 ? 's' : ''} · {data.boards.length} board{data.boards.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {canManage && (
              <Link
                href={`/team/${slug}/settings`}
                className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
              >
                <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </Link>
            )}
          </div>

          {/* Members strip */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-ink/80">Members</h2>
              {canManage && (
                <Link href={`/team/${slug}/settings`} className="text-xs text-papaya hover:text-papaya/70 transition-colors">
                  Manage →
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {allMembers.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-ink/5">
                  <AvatarCircle name={m.profile?.name} avatar_url={m.profile?.avatar_url} size={6} />
                  <div>
                    <p className="text-xs font-medium text-ink leading-none">{m.profile?.name ?? m.profile?.email ?? 'Unknown'}</p>
                    <p className="text-[10px] text-ink/40 capitalize leading-none mt-0.5">{m.role}</p>
                  </div>
                </div>
              ))}
              {canManage && (
                <Link
                  href={`/team/${slug}/settings`}
                  className="flex items-center gap-2 bg-ink/4 hover:bg-papaya/10 rounded-full px-3 py-1.5 border border-dashed border-ink/15 hover:border-papaya/40 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-ink/10 flex items-center justify-center">
                    <svg className="w-3 h-3 stroke-ink/40 stroke-[2] fill-none" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <span className="text-xs text-ink/40">Invite</span>
                </Link>
              )}
            </div>
          </div>

          {/* Boards */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-ink/90 leading-none">Team Boards</h2>
                <p className="text-ink/40 text-sm mt-1.5">Shared with everyone on the team</p>
              </div>
              {canManage && (
                <button
                  onClick={() => router.push(`/board/new?team=${data.team.id}`)}
                  className="flex items-center gap-2 text-sm font-medium text-papaya hover:text-papaya/70 transition-colors"
                >
                  <span>New board</span>
                  <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              )}
            </div>

            {data.boards.length === 0 ? (
              <div className="py-16 border-2 border-dashed border-ink/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-ink/5 flex items-center justify-center">
                  <svg className="w-6 h-6 stroke-ink/25 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <p className="text-ink/40 text-sm">No team boards yet</p>
                {canManage && (
                  <button
                    onClick={() => router.push(`/board/new?team=${data.team.id}`)}
                    className="mt-1 px-4 py-2 bg-papaya text-white text-sm rounded-full hover:bg-papaya/90 transition-colors"
                  >
                    Create first board
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.boards.map((board, index) => {
                  const images = boardImages[board.id] ?? [];
                  const hasImages = images.length > 0;
                  const gradient = BOARD_GRADIENTS[index % BOARD_GRADIENTS.length];
                  return (
                    <Link
                      key={board.id}
                      href={`/board/${board.id}`}
                      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                        hasImages ? 'bg-ink/10' : `bg-gradient-to-br ${gradient}`
                      }`}
                    >
                      {hasImages ? (
                        <>
                          <div className="absolute inset-0">
                            {images.slice(0, 3).map((imgUrl, i) => (
                              <img
                                key={i}
                                src={imgUrl}
                                alt=""
                                className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-cover rounded-sm shadow-lg pointer-events-none"
                                style={{ transform: `rotate(${COLLAGE_ANGLES[i] ?? 0}deg)`, zIndex: i }}
                                draggable={false}
                              />
                            ))}
                          </div>
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/70 z-20" />
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-20">
                            <h3 className="font-serif text-base text-white line-clamp-2 leading-snug">{board.name}</h3>
                          </div>
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 z-30" />
                        </>
                      ) : (
                        <>
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/50" />
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <h3 className="font-serif text-base text-ink/80 line-clamp-2 leading-snug">{board.name}</h3>
                          </div>
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          </div>{/* end main content */}

          {/* Activity feed — right panel */}
          <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 sticky top-24 self-start" style={{ height: 'calc(100vh - 7rem)' }}>
            <div className="flex-1 bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden flex flex-col">
              <ActivityFeed teamId={data.team.id} />
            </div>
          </aside>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
