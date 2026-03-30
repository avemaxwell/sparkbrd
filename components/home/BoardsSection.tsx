// Add this to your BoardsSection component in components/home/BoardsSection.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Board } from "@/types/board";
import { canCreateBoard, getUpgradeMessage } from "@/lib/plan-limits";
import UpgradeModal from "@/components/UpgradeModal";

export default function BoardsSection({ 
  boards, 
  plan 
}: { 
  boards: Board[]; 
  plan: string | null;
}) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleNewBoard = () => {
    const canCreate = canCreateBoard(plan as any, boards.length);
    
    if (!canCreate) {
      setShowUpgradeModal(true);
      return;
    }
    
    router.push('/boards/new');
  };

  return (
    <>
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-serif mb-1">Your Boards</h2>
            <p className="text-ink-soft text-sm">Curated collections</p>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto -mx-6 px-6">
            <div className="flex gap-3 pb-2">
              {/* New Board Card */}
              <button
                onClick={handleNewBoard}
                className="relative flex-shrink-0 w-32 aspect-[3/4] border-2 border-dashed border-ink/20 rounded-xl hover:border-papaya hover:bg-papaya/5 transition-all flex items-center justify-center group"
              >
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-ink/5 group-hover:bg-papaya/10 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 stroke-ink-soft group-hover:stroke-papaya stroke-2 fill-none transition-colors" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <p className="text-xs text-ink-soft group-hover:text-papaya transition-colors">New Board</p>
                </div>
              </button>

              {/* Existing Boards */}
              {boards.map((board, index) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="relative flex-shrink-0 w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 group"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-papaya/20 to-aqua/20" />
                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <h3 className="font-serif text-sm text-ink line-clamp-2">{board.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-6 gap-4">
            {/* New Board Card */}
            <button
              onClick={handleNewBoard}
              className="relative aspect-[3/4] border-2 border-dashed border-ink/20 rounded-xl hover:border-papaya hover:bg-papaya/5 transition-all flex items-center justify-center group"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ink/5 group-hover:bg-papaya/10 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 stroke-ink-soft group-hover:stroke-papaya stroke-2 fill-none transition-colors" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="text-sm text-ink-soft group-hover:text-papaya transition-colors">New Board</p>
              </div>
            </button>

            {/* Existing Boards */}
            {boards.map((board, index) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-papaya/20 to-aqua/20" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="font-serif text-lg text-ink line-clamp-2">{board.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {showUpgradeModal && (
        <UpgradeModal
          message={getUpgradeMessage(plan as any, 'max_boards')}
          feature="max_boards"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}