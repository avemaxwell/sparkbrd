import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logTeamActivity } from '@/lib/team-activity';

const VALID_REACTIONS = ['❤️', '🔥', '✨', '👀', '😍'];

// Resolve canonical tack id — if tack has an origin, reactions live on the origin
async function resolveCanonicalId(supabase: Awaited<ReturnType<typeof createClient>>, tackId: string): Promise<string> {
  const { data } = await supabase
    .from('tacks')
    .select('id, origin_item_id')
    .eq('id', tackId)
    .single();
  return data?.origin_item_id ?? tackId;
}

async function fetchCounts(supabase: Awaited<ReturnType<typeof createClient>>, canonicalId: string, userId: string | null) {
  const { data: countRows } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('tack_id', canonicalId);

  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
  }

  let user_reactions: string[] = [];
  if (userId) {
    const { data: userRows } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('tack_id', canonicalId)
      .eq('user_id', userId);
    user_reactions = (userRows ?? []).map(r => r.reaction_type);
  }

  return { counts, user_reactions };
}

// Resource reactions are kept separate from the tack path below (no team
// activity log, no origin-tack resolution — resources don't have that concept).
async function toggleResourceReaction(supabase: Awaited<ReturnType<typeof createClient>>, resourceId: string, userId: string, reactionType: string) {
  const { count: deleted } = await supabase
    .from('reactions')
    .delete({ count: 'exact' })
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType);

  let action: 'added' | 'removed' = 'removed';
  if ((deleted ?? 0) === 0) {
    await supabase.from('reactions').insert({ resource_id: resourceId, user_id: userId, reaction_type: reactionType });
    action = 'added';

    const { data: resource } = await supabase.from('resources').select('owner_id').eq('id', resourceId).single();
    if (resource?.owner_id && resource.owner_id !== userId) {
      await supabase.from('notifications').insert({
        recipient_id: resource.owner_id,
        actor_id: userId,
        type: 'reaction_on_my_tack',
      });
    }
  }

  const { data: countRows } = await supabase.from('reactions').select('reaction_type').eq('resource_id', resourceId);
  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
  const { data: userRows } = await supabase.from('reactions').select('reaction_type').eq('resource_id', resourceId).eq('user_id', userId);

  return { action, counts, user_reactions: (userRows ?? []).map(r => r.reaction_type) };
}

// POST — toggle a reaction
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tack_id, resource_id, reaction_type } = await request.json();
    if ((!tack_id && !resource_id) || !VALID_REACTIONS.includes(reaction_type)) {
      return NextResponse.json({ error: 'Invalid tack_id/resource_id or reaction_type' }, { status: 400 });
    }

    if (resource_id) {
      const result = await toggleResourceReaction(supabase, resource_id, user.id, reaction_type);
      return NextResponse.json(result);
    }

    const canonicalId = await resolveCanonicalId(supabase, tack_id);

    // Try delete first (toggle off)
    const { count: deleted } = await supabase
      .from('reactions')
      .delete({ count: 'exact' })
      .eq('tack_id', canonicalId)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type);

    let action: 'added' | 'removed';

    if ((deleted ?? 0) > 0) {
      action = 'removed';
    } else {
      // Insert (toggle on)
      await supabase.from('reactions').insert({
        tack_id: canonicalId,
        user_id: user.id,
        reaction_type,
      });
      action = 'added';

      // Notify tack owner if reacting to someone else's tack
      const { data: tack } = await supabase
        .from('tacks')
        .select('user_id, board_id')
        .eq('id', canonicalId)
        .single();

      if (tack && tack.user_id !== user.id) {
        await supabase.from('notifications').insert({
          recipient_id: tack.user_id,
          actor_id: user.id,
          type: 'reaction_on_my_tack',
          board_id: tack.board_id,
          tack_id: canonicalId,
        });
      }

      // Log to team activity feed
      if (tack?.board_id) {
        const admin = createAdminClient();
        const { data: boardRow } = await admin.from('boards').select('team_id, name').eq('id', tack.board_id).single();
        const { data: actorProfile } = await admin.from('profiles').select('name, avatar_url').eq('id', user.id).single();
        if (boardRow?.team_id) {
          await logTeamActivity({
            teamId: boardRow.team_id,
            userId: user.id,
            type: 'reaction_added',
            actorName: actorProfile?.name ?? null,
            actorAvatar: actorProfile?.avatar_url ?? null,
            boardId: tack.board_id,
            boardName: boardRow.name,
            tackId: canonicalId,
            tackThumbnail: (tack as any).content_url ?? null,
          });
        }
      }
    }

    const { counts, user_reactions } = await fetchCounts(supabase, canonicalId, user.id);
    return NextResponse.json({ action, counts, user_reactions });
  } catch (err) {
    console.error('POST /api/reactions error:', err);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
