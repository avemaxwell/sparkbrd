"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

interface Board {
  id: string;
  name: string;
  description: string | null;
  vibe: string;
  background_color: string | null;
  cover_url: string | null;
  tack_count: number;
}

export default function BoardsSection() {
  const { profile, loading: userLoading } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("boards")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setBoards(data || []);
      setLoading(false);
    };

    if (!userLoading) {
      fetchBoards();
    }
  }, [profile, userLoading]);

  const getBackgroundStyle = (board: Board) => {
    const colors = board.background_color?.split(",") || ["#fef3e2", "#fce7f3"];
    const c1 = colors[0] || "#fef3e2";
    const c2 = colors[1] || "#fce7f3";

    switch (board.vibe) {
      case "gradient":
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
      case "starburst":
        return { background: `repeating-conic-gradient(from 0deg, ${c1} 0deg 15deg, ${c2} 15deg 30deg)` };
      case "swirl":
        return { 
          background: `
            radial-gradient(ellipse at 20% 80%, ${c1} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${c2} 0%, transparent 50%),
            linear-gradient(135deg, ${c1} 0%, ${c2} 100%)
          `
        };
      case "solid":
        return { backgroundColor: c1 };
      default:
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
    }
  };

  if (!profile) return null;

  return (
    <section className="px-6 py-8 max-w-6xl mx-auto">
      {/* Section header */}
      <div 
        className={`flex items-end justify-between mb-6 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-ink/90">Your Boards</h2>
          <p className="text-ink/40 text-sm mt-1">Curated collections</p>
        </div>
        {boards.length > 0 && (
          <Link 
            href="/boards"
            className="text-sm text-ink/40 hover:text-ink/60 transition-colors"
          >
            View all
          </Link>
        )}
      </div>

      {/* Boards horizontal scroll on mobile, grid on desktop */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 md:w-auto aspect-[3/4] rounded-xl bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div 
          className={`text-center py-12 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-ink/40 mb-4 text-sm">No boards yet</p>
          <Link
            href="/board/new"
            className="inline-block px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/90 transition-colors"
          >
            Create your first board
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-6 scrollbar-hide">
          {boards.map((board, index) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className={`flex-shrink-0 w-32 md:w-auto group transition-all duration-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 75}ms` }}
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl">
                {/* Background */}
                <div 
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                  style={getBackgroundStyle(board)}
                />

                {/* Cover image if exists */}
                {board.cover_url && (
                  <div className="absolute inset-2 rounded-lg overflow-hidden shadow-md">
                    <img
                      src={board.cover_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-serif text-sm text-white truncate drop-shadow-md">
                    {board.name}
                  </h3>
                  <p className="text-white/60 text-xs">
                    {board.tack_count}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* New board card */}
          <Link
            href="/board/new"
            className={`flex-shrink-0 w-32 md:w-auto group transition-all duration-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${boards.length * 75}ms` }}
          >
            <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-ink/10 flex items-center justify-center transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-ink/20 group-hover:bg-ink/5">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-ink/10 transition-colors">
                  <svg className="w-4 h-4 stroke-ink/40 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="text-ink/40 text-xs font-medium">New</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}