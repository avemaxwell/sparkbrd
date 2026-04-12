import { createAdminClient } from '@/lib/supabase/server';

export type ActivityType =
  | 'board_created'
  | 'tack_added'
  | 'comment_posted'
  | 'reaction_added'
  | 'member_joined';

interface LogActivityOptions {
  teamId: string;
  userId: string;
  type: ActivityType;
  actorName?: string | null;
  actorAvatar?: string | null;
  boardId?: string | null;
  boardName?: string | null;
  tackId?: string | null;
  tackThumbnail?: string | null;
  commentBody?: string | null;
}

export async function logTeamActivity(opts: LogActivityOptions) {
  try {
    const admin = createAdminClient();
    await admin.from('team_activity').insert({
      team_id: opts.teamId,
      user_id: opts.userId,
      type: opts.type,
      actor_name: opts.actorName ?? null,
      actor_avatar: opts.actorAvatar ?? null,
      board_id: opts.boardId ?? null,
      board_name: opts.boardName ?? null,
      tack_id: opts.tackId ?? null,
      tack_thumbnail: opts.tackThumbnail ?? null,
      comment_body: opts.commentBody ?? null,
    });
  } catch (err) {
    // Non-fatal — activity logging should never break the main action
    console.error('logTeamActivity error:', err);
  }
}
