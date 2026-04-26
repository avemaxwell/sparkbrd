"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Board } from "@/types/board";
import { usePlan } from "@/hooks/usePlan";
import { canCreateBoard, getUpgradeMessage } from "@/lib/plan-limits";
import UpgradeModal from "@/components/UpgradeModal";
import { tackCollage } from "@/lib/image-transform";

type SharedBoard = Board & { _role: 'editor' | 'viewer'; _ownerName: string | null };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  in_review: { label: 'In Review', className: 'bg-amber-400/90 text-amber-950' },
  approved:  { label: 'Approved',  className: 'bg-emerald-400/90 text-emerald-950' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const BOARD_GRADIENTS = [
  "from-papaya/30 to-mustard/20",
  "from-aqua/25 to-blush/20",
  "from-blush/30 to-papaya/15",
  "from-mustard/25 to-aqua/20",
  "from-papaya/20 to-blush/25",
  "from-aqua/30 to-mustard/15",
];
const COLLAGE_ANGLES = [-5, 3, -2];

function BoardCard({
  board,
  index,
  boardImages,
  badge,
}: {
  board: Board;
  index: number;
  boardImages: Record<string, string[]>;
  badge?: React.ReactNode;
}) {
  const images = boardImages[board.id] || [];
  const hasImages = images.length > 0;
  const gradient = BOARD_GRADIENTS[index % BOARD_GRADIENTS.length];

  return (
    <Link
      href={`/board/${board.id}`}
      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
        hasImages ? 'bg-ink/10' : `bg-gradient-to-br ${gradient}`
      }`}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {hasImages ? (
        <>
          <div className="absolute inset-0">
            {images.slice(0, 3).map((imgUrl, i) => (
              <img
                key={i}
                src={tackCollage(imgUrl)}
                alt=""
                className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-cover rounded-sm shadow-lg pointer-events-none"
                style={{ transform: `rotate(${COLLAGE_ANGLES[i] ?? 0}deg)`, zIndex: i }}
                draggable={false}
              />
            ))}
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/70 group-hover:bg-white/90 transition-colors z-20" />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-20">
            <h3 className="font-serif text-base text-white line-clamp-2 leading-snug">{board.name}</h3>
            {badge}
          </div>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 z-30" />
        </>
      ) : (
        <>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/50 group-hover:bg-white/80 transition-colors" />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/10 to-transparent">
            <h3 className="font-serif text-base text-ink/80 line-clamp-2 leading-snug">{board.name}</h3>
            {badge}
          </div>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
        </>
      )}
    </Link>
  );
}

function BoardCardMobile({
  board,
  index,
  boardImages,
}: {
  board: Board;
  index: number;
  boardImages: Record<string, string[]>;
}) {
  const images = boardImages[board.id] || [];
  const hasImages = images.length > 0;
  const gradient = BOARD_GRADIENTS[index % BOARD_GRADIENTS.length];

  return (
    <Link
      href={`/board/${board.id}`}
      className={`relative flex-shrink-0 w-36 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
        hasImages ? 'bg-ink/10' : `bg-gradient-to-br ${gradient}`
      }`}
    >
      {hasImages ? (
        <div className="absolute inset-0">
          {images.slice(0, 3).map((imgUrl, i) => (
            <img
              key={i}
              src={tackCollage(imgUrl)}
              alt=""
              className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-sm shadow-md pointer-events-none"
              style={{ transform: `rotate(${COLLAGE_ANGLES[i] ?? 0}deg)`, zIndex: i }}
              draggable={false}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-10">
            <h3 className="font-serif text-sm text-white line-clamp-2 leading-snug">{board.name}</h3>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="w-5 h-5 rounded-full bg-white/60" />
          <h3 className="font-serif text-sm text-ink/80 line-clamp-2 leading-snug">{board.name}</h3>
        </div>
      )}
    </Link>
  );
}

const DESKTOP_BOARD_LIMIT = 4;

export default function BoardsSection() {
  const router = useRouter();
  const [ownedBoards, setOwnedBoards] = useState<Board[]>([]);
  const [sharedBoards, setSharedBoards] = useState<SharedBoard[]>([]);
  const [boardImages, setBoardImages] = useState<Record<string, string[]>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan, isFreePlan, isTeamPlan } = usePlan();

  useEffect(() => {
    const fetchBoards = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Owned boards
      const { data: owned } = await supabase
        .from("boards")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      const fetchedOwned: Board[] = owned || [];
      setOwnedBoards(fetchedOwned);

      // Boards shared with the user via board_members
      const { data: memberships } = await supabase
        .from("board_members")
        .select("role, boards(*)")
        .eq("user_id", session.user.id);

      const sharedRaw: SharedBoard[] = (memberships || []).map((m: any) => ({
        ...m.boards,
        _role: m.role as 'editor' | 'viewer',
        _ownerName: null as string | null,
      }));

      // Fetch owner profile names for shared boards
      if (sharedRaw.length > 0) {
        const ownerIds = [...new Set(sharedRaw.map((b) => b.owner_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", ownerIds);
        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.name]));
        sharedRaw.forEach((b) => { b._ownerName = profileMap[b.owner_id] ?? null; });
      }

      setSharedBoards(sharedRaw);

      // Fetch preview images for all boards
      const allBoards = [...fetchedOwned, ...sharedRaw];
      if (allBoards.length > 0) {
        const boardIds = allBoards.map((b) => b.id);
        const { data: tacksData } = await supabase
          .from("tacks")
          .select("board_id, content_url")
          .in("board_id", boardIds);

        if (tacksData) {
          const imageMap: Record<string, string[]> = {};
          for (const tack of tacksData) {
            if (!imageMap[tack.board_id]) imageMap[tack.board_id] = [];
            if (imageMap[tack.board_id].length < 3) {
              imageMap[tack.board_id].push(tack.content_url);
            }
          }
          setBoardImages(imageMap);
        }
      }
    };

    fetchBoards();
  }, []);

  const handleNewBoard = () => {
    const effectivePlan = isFreePlan ? "free" : (plan as any);
    if (!canCreateBoard(effectivePlan, ownedBoards.length)) {
      setShowUpgradeModal(true);
      return;
    }
    router.push("/board/new");
  };

  const hasAny = ownedBoards.length > 0 || sharedBoards.length > 0;

  return (
    <>
      <section className="px-6 pb-8 pt-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Your Boards ── */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl md:text-3xl text-ink/90 leading-none">Your Boards</h2>
            <div className="flex items-center gap-4">
              {ownedBoards.length > DESKTOP_BOARD_LIMIT && (
                <Link
                  href="/boards"
                  className="hidden md:inline text-sm text-ink/40 hover:text-ink/70 transition-colors"
                >
                  See all {ownedBoards.length} →
                </Link>
              )}
              <button
                onClick={handleNewBoard}
                className="flex items-center gap-1.5 text-sm font-medium text-papaya hover:text-papaya/70 transition-colors"
              >
                <span>New board</span>
                <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
          </div>

          {!hasAny ? (
            <button
              onClick={handleNewBoard}
              className="w-full py-10 border-2 border-dashed border-ink/10 rounded-2xl hover:border-papaya/40 hover:bg-papaya/3 transition-all group flex flex-col items-center justify-center gap-3 mb-6"
            >
              <div className="w-12 h-12 rounded-full bg-ink/5 group-hover:bg-papaya/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 stroke-ink/30 group-hover:stroke-papaya stroke-[1.5] fill-none transition-colors" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p className="text-ink/40 group-hover:text-papaya/70 transition-colors text-sm">Create your first board</p>
            </button>
          ) : (
            <>
              {/* Mobile horizontal scroll — owned */}
              {ownedBoards.length > 0 && (
                <div className="md:hidden overflow-x-auto -mx-6 px-6 mb-5">
                  <div className="flex gap-3 pb-3">
                    {ownedBoards.map((board, index) => (
                      <BoardCardMobile key={board.id} board={board} index={index} boardImages={boardImages} />
                    ))}
                    <button
                      onClick={handleNewBoard}
                      className="relative flex-shrink-0 w-36 aspect-[3/4] border-2 border-dashed border-ink/15 rounded-2xl hover:border-papaya/50 hover:bg-papaya/5 transition-all flex items-center justify-center group"
                    >
                      <svg className="w-6 h-6 stroke-ink/25 group-hover:stroke-papaya stroke-[1.5] fill-none transition-colors" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop grid — owned — max 4 in one row */}
              {ownedBoards.length > 0 && (
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {ownedBoards.slice(0, DESKTOP_BOARD_LIMIT).map((board, index) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      index={index}
                      boardImages={boardImages}
                      badge={
                        isTeamPlan ? (
                          <div className="mt-1">
                            <StatusBadge status={board.status} />
                          </div>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {/* ── Shared with you ── */}
              {sharedBoards.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="font-serif text-xl md:text-2xl text-ink/90 leading-none">Shared with you</h2>
                    {sharedBoards.length > DESKTOP_BOARD_LIMIT && (
                      <Link
                        href="/boards"
                        className="hidden md:inline text-sm text-ink/40 hover:text-ink/70 transition-colors"
                      >
                        See all {sharedBoards.length} →
                      </Link>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden overflow-x-auto -mx-6 px-6 mb-5">
                    <div className="flex gap-3 pb-3">
                      {sharedBoards.map((board, index) => (
                        <div key={board.id} className="relative flex-shrink-0">
                          <BoardCardMobile board={board} index={index} boardImages={boardImages} />
                          <span className="absolute top-2 left-2 text-[10px] font-medium bg-white/90 text-ink/60 px-1.5 py-0.5 rounded-full z-20 capitalize">
                            {board._role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop — max 4 */}
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {sharedBoards.slice(0, DESKTOP_BOARD_LIMIT).map((board, index) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        index={index}
                        boardImages={boardImages}
                        badge={
                          <div className="mt-1 flex items-center gap-1.5">
                            {board._ownerName && (
                              <span className="text-[10px] text-white/60 truncate">{board._ownerName}</span>
                            )}
                            <span className="text-[10px] font-medium bg-white/20 text-white px-1.5 py-0.5 rounded-full capitalize">
                              {board._role}
                            </span>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {showUpgradeModal && (
        <UpgradeModal
          message={getUpgradeMessage(plan as any, "max_boards")}
          feature="max_boards"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
