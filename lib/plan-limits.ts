// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    max_boards: 5,
    max_tacks_per_board: 25,
    custom_colors: false,
    export_boards: false,
    collaboration: false,
    no_branding: false,
    studio_boards: false,
    board_status: false,
  },
  pro: {
    max_boards: 50,
    max_tacks_per_board: 200,
    custom_colors: true,
    export_boards: true,
    collaboration: false,
    no_branding: true,
    studio_boards: false,
    board_status: false,
  },
  team: {
    max_boards: Infinity,
    max_tacks_per_board: Infinity,
    custom_colors: true,
    export_boards: true,
    collaboration: true,
    no_branding: true,
    studio_boards: true,
    board_status: true,
  },
};

export type Plan = 'free' | 'pro' | 'team';
export type Feature = keyof typeof PLAN_LIMITS.free;

// Check if user has access to a feature
export function hasFeature(plan: Plan | null | undefined, feature: Feature): boolean {
  const userPlan = plan || 'free';
  return PLAN_LIMITS[userPlan][feature] === true;
}

// Get plan limit for a specific feature
export function getPlanLimit(plan: Plan | null | undefined, feature: 'max_boards' | 'max_tacks_per_board'): number {
  const userPlan = plan || 'free';
  return PLAN_LIMITS[userPlan][feature];
}

// Check if user can create a new board
export function canCreateBoard(plan: Plan | null | undefined, currentBoardCount: number): boolean {
  const limit = getPlanLimit(plan, 'max_boards');
  return currentBoardCount < limit;
}

// Check if user can add a tack to a board
export function canAddTack(plan: Plan | null | undefined, currentTackCount: number): boolean {
  const limit = getPlanLimit(plan, 'max_tacks_per_board');
  return currentTackCount < limit;
}

// Get upgrade CTA message
export function getUpgradeMessage(plan: Plan | null | undefined, feature: Feature | 'max_boards' | 'max_tacks_per_board'): string {
  const userPlan = plan || 'free';
  
  if (feature === 'max_boards') {
    return userPlan === 'free'
      ? 'Upgrade to Pro for up to 50 boards'
      : "You've reached your board limit";
  }

  if (feature === 'max_tacks_per_board') {
    if (userPlan === 'free') return 'Upgrade to Pro for 200 tacks per board';
    if (userPlan === 'pro') return 'Upgrade to Team for unlimited tacks';
    return "You've reached your tack limit";
  }
  
  if (feature === 'custom_colors') {
    return 'Upgrade to Pro for custom colors';
  }
  
  if (feature === 'export_boards') {
    return 'Upgrade to Pro to export your boards';
  }
  
  if (feature === 'collaboration') {
    return 'Upgrade to Team for real-time collaboration';
  }

  if (feature === 'studio_boards') {
    return 'Upgrade to Team for Studio Boards — creative briefs, section labels, and status tracking';
  }

  if (feature === 'board_status') {
    return 'Upgrade to Team to use board status — Draft, In Review, and Approved';
  }

  return 'Upgrade to unlock this feature';
}