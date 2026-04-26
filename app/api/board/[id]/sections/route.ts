import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/board/[id]/sections
//
// Two modes:
//   { template: "studio" }  — inserts the 5 preset Studio Board labels
//   { sections: [{ content, position_x, position_y, color, z_index }] }
//                           — inserts one or more arbitrary section labels
//
// Uses the admin client so RLS on text_blocks never blocks board owners.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller owns the board (or is an editor)
  const { data: board } = await admin
    .from("boards")
    .select("id, owner_id, vibe")
    .eq("id", boardId)
    .single();

  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const isOwner = board.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await admin
      .from("board_members")
      .select("role")
      .eq("board_id", boardId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership || membership.role !== "editor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();

  let rows: object[];

  if (body.template === "studio") {
    const defaultColor = board.vibe === "dark" ? "#FFFFFF" : "#1A1A1A";
    const STUDIO_SECTIONS = [
      { content: "Art Direction",    position_x: 80,  position_y: 80  },
      { content: "Color Story",      position_x: 80,  position_y: 420 },
      { content: "Reference Images", position_x: 680, position_y: 80  },
      { content: "Typography Feels", position_x: 680, position_y: 420 },
      { content: "What to Avoid",    position_x: 80,  position_y: 760 },
    ];
    rows = STUDIO_SECTIONS.map((s, i) => ({
      board_id: boardId,
      user_id: user.id,
      content: s.content,
      font_style: "section",
      font_size: 12,
      color: defaultColor,
      position_x: s.position_x,
      position_y: s.position_y,
      width: 480,
      rotation: 0,
      z_index: i + 1,
      nowrap: true,
    }));
  } else if (Array.isArray(body.sections) && body.sections.length > 0) {
    rows = body.sections.map((s: any) => ({
      board_id: boardId,
      user_id: user.id,
      content: s.content ?? "Section Title",
      font_style: "section",
      font_size: 12,
      color: s.color ?? (board.vibe === "dark" ? "#FFFFFF" : "#1A1A1A"),
      position_x: Math.round(s.position_x ?? 200),
      position_y: Math.round(s.position_y ?? 200),
      width: 480,
      rotation: 0,
      z_index: s.z_index ?? 1,
      nowrap: true,
    }));
  } else {
    return NextResponse.json({ error: "Provide template:'studio' or sections:[]" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("text_blocks")
    .insert(rows)
    .select();

  if (error) {
    console.error("sections route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sections: data });
}
