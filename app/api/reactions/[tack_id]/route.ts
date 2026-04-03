import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ tack_id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { tack_id } = await params;

    // Resolve canonical id
    const { data: tack } = await supabase
      .from('tacks')
      .select('id, origin_item_id')
      .eq('id', tack_id)
      .single();

    const canonicalId = tack?.origin_item_id ?? tack_id;

    const { data: countRows } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('tack_id', canonicalId);

    const counts: Record<string, number> = {};
    for (const row of countRows ?? []) {
      counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
    }

    let user_reactions: string[] = [];
    if (user) {
      const { data: userRows } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('tack_id', canonicalId)
        .eq('user_id', user.id);
      user_reactions = (userRows ?? []).map(r => r.reaction_type);
    }

    return NextResponse.json({ counts, user_reactions });
  } catch (err) {
    console.error('GET /api/reactions/[tack_id] error:', err);
    return NextResponse.json({ counts: {}, user_reactions: [] });
  }
}
