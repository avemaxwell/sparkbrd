// Plan model — free / plus / creator_pro / district.
// Marketplace is a seller flag (profiles.is_creator), not a plan tier: anyone can sell.
export type Plan = 'free' | 'plus' | 'creator_pro' | 'district';

export const PLAN_NAMES: Record<Plan, string> = {
  free: 'Free',
  plus: 'Sparkurio Plus',
  creator_pro: 'Creator Pro',
  district: 'District',
};

export function planDisplayName(plan: string | null | undefined): string {
  return PLAN_NAMES[(plan as Plan) || 'free'] ?? PLAN_NAMES.free;
}

// Collections are unlimited in count for everyone. The only gate is
// public vs. private: Free can publish unlimited public collections,
// Plus (and above) unlocks unlimited private ones.
export function canCreatePrivateCollection(plan: string | null | undefined): boolean {
  return (plan || 'free') !== 'free';
}

// Canvas-editor perks (custom pin colors, frames, resource downloads from a
// board, Studio Board templates/status) predate the content-marketplace pivot
// and aren't part of the new tier spec. Rather than rip out working editor
// code, they stay as paid-tier perks — unlocked by any plan above Free.
type EditorFeature = 'custom_colors' | 'tack_frames' | 'unlimited_downloads' | 'studio_boards' | 'board_status';

// Verified educators get unlimited downloads free, regardless of plan — the
// one Educator Perk currently wired to a real gate. See lib/educator.ts.
export function hasFeature(plan: string | null | undefined, feature: EditorFeature, isVerifiedEducator?: boolean): boolean {
  if (feature === 'unlimited_downloads' && isVerifiedEducator) return true;
  return (plan || 'free') !== 'free';
}

export function getUpgradeMessage(feature: EditorFeature | 'private_collection'): string {
  if (feature === 'private_collection') return 'Upgrade to Sparkurio Plus for unlimited private collections';
  if (feature === 'custom_colors') return 'Upgrade to Sparkurio Plus for custom pin colors';
  if (feature === 'tack_frames') return 'Upgrade to Sparkurio Plus to add frames and borders to your resources';
  if (feature === 'unlimited_downloads') return 'Upgrade to Sparkurio Plus for unlimited downloads';
  if (feature === 'studio_boards') return 'Upgrade to Sparkurio Plus for Studio Boards — creative briefs, section labels, and status tracking';
  if (feature === 'board_status') return 'Upgrade to Sparkurio Plus to use collection status — Draft, In Review, and Approved';
  return 'Upgrade to unlock this feature';
}
