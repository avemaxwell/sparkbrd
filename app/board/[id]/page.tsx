"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BoardCanvas from "@/components/board/BoardCanvas";
import MosaicBoard from "@/components/board/MosaicBoard";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const [boardType, setBoardType] = useState<'canvas' | 'mosaic' | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("boards")
      .select("board_type")
      .eq("id", boardId)
      .single()
      .then(({ data }: { data: { board_type?: string } | null }) => {
        setBoardType((data?.board_type as 'canvas' | 'mosaic') ?? 'canvas');
      });
  }, [boardId]);

  if (boardType === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
      </div>
    );
  }

  if (boardType === 'mosaic') return <MosaicBoard />;
  return <BoardCanvas />;
}
