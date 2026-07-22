import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ─── POST /api/tacks/[id]/retack ─────────────────────────────────────────────
// Copies a public tack onto one of the authenticated user's boards.
// Body: { board_id: string }
//
// origin_item_id tracks the canonical source: if the source tack is itself a
// re-tack, we point to its origin so reaction counts aggregate correctly.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tackId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { board_id } = body as { board_id?: string };
    if (!board_id) return NextResponse.json({ error: 'board_id is required' }, { status: 400 });

    // Verify the target board belongs to the user.
    const { data: targetBoard } = await supabase
      .from('boards')
      .select('id, owner_id')
      .eq('id', board_id)
      .eq('owner_id', user.id)
      .single();

    if (!targetBoard) {
      return NextResponse.json({ error: 'Board not found or not yours' }, { status: 404 });
    }

    // Fetch the source tack. Use admin so we can read tacks from any public board
    // without depending on the caller's RLS context.
    const { data: source } = await admin
      .from('tacks')
      .select(`
        id, content_url, title, note, source, pin_color,
        width, height, rotation, origin_item_id, resource_id,
        boards!inner(is_public, owner_id)
      `)
      .eq('id', tackId)
      .single();

    if (!source) {
      return NextResponse.json({ error: 'Tack not found' }, { status: 404 });
    }

    // Only allow re-tacking from public boards or boards the user is a member of.
    const sourceBoard = (source as any).boards;
    if (!sourceBoard.is_public && sourceBoard.owner_id !== user.id) {
      // Check board membership
      const { data: membership } = await admin
        .from('board_members')
        .select('id')
        .eq('board_id', (source as any).board_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Tack is not public' }, { status: 403 });
      }
    }

    // Canonical origin: if the source is already a re-tack, use its origin;
    // otherwise the source itself is the origin.
    const originItemId = (source as any).origin_item_id ?? tackId;

    // Scatter new tacks slightly so they don't all land in the same spot.
    const scatter = () => Math.floor(Math.random() * 120) - 60;
    const position_x = 300 + scatter();
    const position_y = 200 + scatter();

    // Get current max z_index on the target board.
    const { data: topZ } = await supabase
      .from('tacks')
      .select('z_index')
      .eq('board_id', board_id)
      .order('z_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const z_index = ((topZ as any)?.z_index ?? 0) + 1;

    const { data: newTack, error: insertErr } = await supabase
      .from('tacks')
      .insert({
        board_id,
        content_url: (source as any).content_url,
        title: (source as any).title,
        note: (source as any).note,
        source: (source as any).source,
        pin_color: (source as any).pin_color ?? 'papaya',
        width: (source as any).width ?? 280,
        height: (source as any).height ?? 200,
        rotation: 0,
        position_x,
        position_y,
        z_index,
        origin_item_id: originItemId,
        resource_id: (source as any).resource_id ?? null,
        user_id: user.id,
        added_by: user.id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ tack: newTack });
  } catch (err) {
    console.error('POST /api/tacks/[id]/retack error:', err);
    return NextResponse.json({ error: 'Failed to re-tack' }, { status: 500 });
  }
}
