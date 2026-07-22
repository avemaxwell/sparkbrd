import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ resource_id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { resource_id } = await params;

    const { data: countRows } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('resource_id', resource_id);

    const counts: Record<string, number> = {};
    for (const row of countRows ?? []) {
      counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
    }

    let user_reactions: string[] = [];
    if (user) {
      const { data: userRows } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('resource_id', resource_id)
        .eq('user_id', user.id);
      user_reactions = (userRows ?? []).map(r => r.reaction_type);
    }

    return NextResponse.json({ counts, user_reactions });
  } catch (err) {
    console.error('GET /api/reactions/resource/[resource_id] error:', err);
    return NextResponse.json({ counts: {}, user_reactions: [] });
  }
}
