"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

interface Board {
  id: string;
  name: string;
}

type State = 'idle' | 'picking' | 'saving' | 'done' | 'error';

interface Props {
  tackId: string;
}

export default function RetackButton({ tackId }: Props) {
  const { profile } = useUser();
  const [state, setState] = useState<State>('idle');
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoaded, setBoardsLoaded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (state !== 'picking') return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setState('idle');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [state]);

  const openPicker = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!profile) return; // unauthenticated — button shouldn't render but guard anyway

    setState('picking');

    if (!boardsLoaded) {
      const supabase = createClient();
      const { data } = await supabase
        .from('boards')
        .select('id, name')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });
      setBoards(data ?? []);
      setBoardsLoaded(true);
    }
  };

  const handleSelect = async (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setState('saving');

    try {
      const res = await fetch(`/api/tacks/${tackId}/retack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: boardId }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Retack failed:', data.error);
        setState('error');
        setTimeout(() => setState('idle'), 2000);
        return;
      }

      setState('done');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  // Not logged in — show a subtle link instead
  if (!profile) {
    return (
      <Link
        href="/login"
        onClick={e => e.stopPropagation()}
        className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
        title="Sign in to save"
      >
        <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </Link>
    );
  }

  return (
    <div ref={popoverRef} className="absolute bottom-2 right-2 z-10">
      {/* Trigger button */}
      <button
        onClick={state === 'picking' ? (e) => { e.stopPropagation(); setState('idle'); } : openPicker}
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 ${
          state === 'done'
            ? 'bg-green-500 opacity-100'
            : state === 'error'
            ? 'bg-red-400 opacity-100'
            : 'bg-white/90 backdrop-blur-sm hover:bg-white'
        }`}
        title="Save to board"
      >
        {state === 'saving' ? (
          <div className="w-3.5 h-3.5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
        ) : state === 'done' ? (
          <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : state === 'error' ? (
          <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        )}
      </button>

      {/* Board picker popover */}
      {state === 'picking' && (
        <div
          className="absolute bottom-10 right-0 w-52 bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <p className="px-4 pt-3 pb-2 text-xs font-semibold text-ink/40 uppercase tracking-widest">
            Save to board
          </p>

          {!boardsLoaded ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
            </div>
          ) : boards.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-xs text-ink/40 mb-2">No boards yet.</p>
              <Link
                href="/board/new"
                className="block text-center text-xs font-medium text-papaya hover:text-papaya/80 transition-colors"
              >
                Create a board →
              </Link>
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto pb-2">
              {boards.map(board => (
                <li key={board.id}>
                  <button
                    onClick={(e) => handleSelect(e, board.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-ink/5 transition-colors truncate"
                  >
                    {board.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
