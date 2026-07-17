import type { Plan } from './plan-limits';

// Price IDs aren't secret — Stripe Checkout requires them client-side too —
// so these are read from NEXT_PUBLIC_ vars and shared by the checkout button
// (client) and the webhook handler (server) alike.
export const STRIPE_PRICES = {
  plusMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY || '',
  plusAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_ANNUAL || '',
  creatorProMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_PRO_MONTHLY || '',
  // Not yet purchasable — checkout is intentionally blocked with a "coming
  // soon" notice until the Homeschool+ plan is fully wired (plan enum,
  // webhook mapping, feature gates). Price IDs are recorded now so the UI
  // can show real, correct pricing ahead of launch.
  homeschoolMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMESCHOOL_MONTHLY || '',
  homeschoolAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMESCHOOL_ANNUAL || '',
};

export function planForPriceId(priceId: string): { plan: Plan; billingPeriod: 'monthly' | 'annual' } | null {
  if (priceId && priceId === STRIPE_PRICES.plusMonthly) return { plan: 'plus', billingPeriod: 'monthly' };
  if (priceId && priceId === STRIPE_PRICES.plusAnnual) return { plan: 'plus', billingPeriod: 'annual' };
  if (priceId && priceId === STRIPE_PRICES.creatorProMonthly) return { plan: 'creator_pro', billingPeriod: 'monthly' };
  return null;
}
