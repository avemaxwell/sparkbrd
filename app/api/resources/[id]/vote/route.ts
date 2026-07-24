import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST /api/resources/[id]/vote — body: { vote: 1 | -1 }
// Labs-only up/down voting: one vote per person (changing your mind updates
// your existing vote rather than casting a second one, via the UNIQUE
// (resource_id, user_id) constraint). Promotion/removal happen synchronously
// right here rather than on a schedule, since crossing a threshold should
// feel immediate.
const PROMOTE_AT_NET_SCORE = 10;
const REMOVE_AT_DOWNVOTES = 20;

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { vote } = await request.json();
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'vote must be 1 or -1' }, { status: 400 });
    }

    const { data: resource } = await supabase
      .from('resources')
      .select('id, classroom_proven, status')
      .eq('id', id)
      .single();
    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    const { error: voteError } = await supabase
      .from('resource_votes')
      .upsert({ resource_id: id, user_id: user.id, vote }, { onConflict: 'resource_id,user_id' });
    if (voteError) throw voteError;

    const { data: allVotes } = await admin
      .from('resource_votes')
      .select('vote')
      .eq('resource_id', id);

    const upvotes = (allVotes ?? []).filter((v) => v.vote === 1).length;
    const downvotes = (allVotes ?? []).filter((v) => v.vote === -1).length;
    const netScore = upvotes - downvotes;

    let updatedStatus = resource.status;
    let updatedProven = resource.classroom_proven;

    if (downvotes >= REMOVE_AT_DOWNVOTES && resource.status === 'published') {
      await admin
        .from('resources')
        .update({ status: 'draft', labs_removed_at: new Date().toISOString(), labs_removed_reason: 'downvotes' })
        .eq('id', id);
      updatedStatus = 'draft';
    } else if (netScore >= PROMOTE_AT_NET_SCORE && !resource.classroom_proven) {
      await admin
        .from('resources')
        .update({ classroom_proven: true, classroom_proven_at: new Date().toISOString() })
        .eq('id', id);
      updatedProven = true;
    }

    return NextResponse.json({
      upvotes,
      downvotes,
      netScore,
      myVote: vote,
      status: updatedStatus,
      classroom_proven: updatedProven,
    });
  } catch (err) {
    console.error('POST /api/resources/[id]/vote error:', err);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
