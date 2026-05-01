import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// PATCH /api/board/[id]/items
// Updates any fields on a tack or text_block using the service-role client so
// RLS on UPDATE never silently drops the write (board owners are not in
// board_members, so the anon-key client's UPDATE policies block them).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the caller can edit this board
  const { data: board } = await admin
    .from("boards")
    .select("owner_id")
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
  const { table, id, updates } = body as {
    table: string;
    id: string;
    updates: Record<string, unknown>;
  };

  if (!["tacks", "text_blocks"].includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  if (!id || !updates || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "id and updates are required" }, { status: 400 });
  }

  const { error } = await admin.from(table).update(updates).eq("id", id);
  if (error) {
    console.error(`PATCH /api/board/${boardId}/items error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// POST /api/board/[id]/items — insert a new row (used for copy/paste)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: board } = await admin.from("boards").select("owner_id").eq("id", boardId).single();
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const isOwner = board.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await admin
      .from("board_members").select("role")
      .eq("board_id", boardId).eq("user_id", user.id).maybeSingle();
    if (!membership || membership.role !== "editor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { table, data: rowData } = body as { table: string; data: Record<string, unknown> };

  if (!["tacks", "text_blocks"].includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const { data: inserted, error } = await admin
    .from(table)
    .insert({ ...rowData, board_id: boardId, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error(`POST /api/board/${boardId}/items error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: inserted });
}
