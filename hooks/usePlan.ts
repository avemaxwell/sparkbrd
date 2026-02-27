import { useUser } from './useUser';

interface PlanLimits {
  max_boards: number;
  max_tacks_per_board: number;
}

const DEFAULT_LIMITS: PlanLimits = {
  max_boards: 10,
  max_tacks_per_board: 50,
};

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    limits: { max_boards: 10, max_tacks_per_board: 50 },
    features: [
      '10 boards',
      '50 tacks per board',
      '4 background presets',
      'Sparkbrd branding on shared boards',
    ],
  },
  pro: {
    name: 'Pro',
    price: 8,
    limits: { max_boards: -1, max_tacks_per_board: 200 },
    features: [
      'Unlimited boards',
      '200 tacks per board',
      'Custom background colors',
      'No branding on shared boards',
      'Download boards as images',
      'Priority support',
    ],
  },
  team: {
    name: 'Team',
    price: 15,
    limits: { max_boards: -1, max_tacks_per_board: -1 },
    features: [
      'Everything in Pro',
      'Unlimited tacks',
      'Real-time collaboration',
      'Shared team workspace',
      'Admin controls',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    limits: { max_boards: -1, max_tacks_per_board: -1 },
    features: [
      'Everything in Team',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
    ],
  },
};

export function usePlan() {
  const { profile } = useUser();
  
  const plan = profile?.plan || 'free';
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
  const limits: PlanLimits = profile?.plan_limits || DEFAULT_LIMITS;
  const boardCount = profile?.board_count || 0;

  const canCreateBoard = limits.max_boards === -1 || boardCount < limits.max_boards;
  const boardsRemaining = limits.max_boards === -1 ? Infinity : limits.max_boards - boardCount;

  const canAddTack = (currentTackCount: number) => {
    return limits.max_tacks_per_board === -1 || currentTackCount < limits.max_tacks_per_board;
  };

  const tacksRemaining = (currentTackCount: number) => {
    if (limits.max_tacks_per_board === -1) return Infinity;
    return limits.max_tacks_per_board - currentTackCount;
  };

  const isFreePlan = plan === 'free';
  const isProPlan = plan === 'pro';
  const isTeamPlan = plan === 'team';
  const isEnterprisePlan = plan === 'enterprise';
  const isPaidPlan = !isFreePlan;

  return {
    plan,
    planDetails,
    limits,
    boardCount,
    canCreateBoard,
    boardsRemaining,
    canAddTack,
    tacksRemaining,
    isFreePlan,
    isProPlan,
    isTeamPlan,
    isEnterprisePlan,
    isPaidPlan,
    allPlans: PLAN_DETAILS,
  };
}