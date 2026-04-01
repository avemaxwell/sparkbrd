"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Board } from "@/types/board";
import { usePlan } from "@/hooks/usePlan";
import { canCreateBoard, getUpgradeMessage } from "@/lib/plan-limits";
import UpgradeModal from "@/components/UpgradeModal";

export default function BoardsSection() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan, isFreePlan } = usePlan();

  useEffect(() => {
    const fetchBoards = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("boards")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      setBoards(data || []);
    };

    fetchBoards();
  }, []);

  const handleNewBoard = () => {
    const effectivePlan = isFreePlan ? "free" : (plan as any);
    const canCreate = canCreateBoard(effectivePlan, boards.length);

    if (!canCreate) {
      setShowUpgradeModal(true);
      return;
    }

    router.push("/board/new");
  };

  const BOARD_GRADIENTS = [
    "from-papaya/30 to-mustard/20",
    "from-aqua/25 to-blush/20",
    "from-blush/30 to-papaya/15",
    "from-mustard/25 to-aqua/20",
    "from-papaya/20 to-blush/25",
    "from-aqua/30 to-mustard/15",
  ];

  return (
    <>
      <section className="px-6 pb-16 pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink/90 leading-none">Your Boards</h2>
              <p className="text-ink/40 text-sm mt-1.5">Curated collections</p>
            </div>
            <button
              onClick={handleNewBoard}
              className="flex items-center gap-2 text-sm font-medium text-papaya hover:text-papaya/70 transition-colors"
            >
              <span>New board</span>
              <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>

          {boards.length === 0 ? (
            /* Empty state */
            <button
              onClick={handleNewBoard}
              className="w-full py-16 border-2 border-dashed border-ink/10 rounded-2xl hover:border-papaya/40 hover:bg-papaya/3 transition-all group flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-ink/5 group-hover:bg-papaya/10 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 stroke-ink/30 group-hover:stroke-papaya stroke-[1.5] fill-none transition-colors" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p className="text-ink/40 group-hover:text-papaya/70 transition-colors text-sm">Create your first board</p>
            </button>
          ) : (
            /* Mobile: Horizontal scroll */
            <>
              <div className="md:hidden overflow-x-auto -mx-6 px-6">
                <div className="flex gap-3 pb-3">
                  {boards.map((board, index) => (
                    <Link
                      key={board.id}
                      href={`/board/${board.id}`}
                      className={`relative flex-shrink-0 w-36 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${BOARD_GRADIENTS[index % BOARD_GRADIENTS.length]}`}
                    >
                      <div className="absolute inset-0 p-4 flex flex-col justify-between">
                        <div className="w-5 h-5 rounded-full bg-white/60" />
                        <h3 className="font-serif text-sm text-ink/80 line-clamp-2 leading-snug">{board.name}</h3>
                      </div>
                    </Link>
                  ))}
                  {/* Add new */}
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

              {/* Desktop: Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {boards.map((board, index) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className={`group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br ${BOARD_GRADIENTS[index % BOARD_GRADIENTS.length]}`}
                    style={{ transitionDelay: `${index * 30}ms` }}
                  >
                    {/* Pin circle */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/50 group-hover:bg-white/80 transition-colors" />
                    {/* Board name */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/10 to-transparent">
                      <h3 className="font-serif text-base text-ink/80 line-clamp-2 leading-snug">{board.name}</h3>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  </Link>
                ))}
              </div>
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
