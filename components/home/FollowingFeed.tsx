"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FollowingTack {
  id: string;
  content_url: string;
  note: string | null;
  created_at: string;
  board_id: string;
  boards: { id: string; name: string };
  owner_profile: { id: string; name: string | null; avatar_url: string | null } | null;
}

export default function FollowingFeed() {
  const [tacks, setTacks] = useState<FollowingTack[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 500) setColumnCount(2);
      else if (w < 768) setColumnCount(3);
      else if (w < 1024) setColumnCount(4);
      else setColumnCount(5);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    fetch('/api/feed/following')
      .then(r => r.json())
      .then(d => { setTacks(d.tacks ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
      </div>
    );
  }

  if (tacks.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <p className="font-serif text-2xl text-ink/30 mb-2">Nothing here yet</p>
        <p className="text-ink/30 text-sm">Follow some people and their public tacks will appear here.</p>
        <Link href="/explore" className="mt-6 inline-block px-5 py-2.5 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/85 transition-colors">
          Explore people
        </Link>
      </div>
    );
  }

  // Masonry columns
  const columns: FollowingTack[][] = Array.from({ length: columnCount }, () => []);
  tacks.forEach((t, i) => columns[i % columnCount].push(t));

  return (
    <div
      className="grid gap-2 md:gap-3 px-2 md:px-3"
      style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
    >
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-2 md:gap-3">
          {col.map(tack => (
            <Link
              key={tack.id}
              href={`/board/${tack.board_id}`}
              className="block rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="relative">
                <img
                  src={tack.content_url}
                  alt=""
                  className="w-full object-cover"
                />
              </div>
              <div className="px-3 py-2.5">
                {tack.owner_profile && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Link
                      href={`/user/${tack.owner_profile.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-gradient-to-br from-blush to-mustard flex-shrink-0">
                        {tack.owner_profile.avatar_url ? (
                          <img src={tack.owner_profile.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : null}
                      </div>
                      <span className="text-[11px] text-ink/50 truncate">{tack.owner_profile.name}</span>
                    </Link>
                    <span className="text-[11px] text-ink/30">·</span>
                    <span className="text-[11px] text-ink/30 truncate">{tack.boards?.name}</span>
                  </div>
                )}
                {tack.note && (
                  <p className="text-xs text-ink/60 line-clamp-2">{tack.note}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
