/**
 * 通用产品漏斗埋点：signup -> feature_used -> paywall_hit -> checkout_started -> payment_granted。
 * 接入新业务时，用 trackEvent 记录业务事件（如 'note_created'）。
 */
import { gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { analyticsEvent, user } from '@/lib/db/schema';

export const FUNNEL_EVENTS = [
  'signup',
  'feature_used',
  'paywall_hit',
  'checkout_started',
  'payment_granted',
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export async function trackEvent(
  name: FunnelEvent,
  details: { userId?: string; plan?: string } = {},
): Promise<void> {
  await db.insert(analyticsEvent).values({
    name,
    userId: details.userId ?? null,
    plan: details.plan ?? null,
  });
}

export interface FunnelSummary {
  since: number;
  days: number;
  counts: Record<FunnelEvent, number> & { registrations: number; activeUsers: number };
  rates: Record<string, number>;
}

export async function getFunnelSummary(days = 30): Promise<FunnelSummary> {
  const safeDays = Math.min(365, Math.max(1, Math.floor(days)));
  const since = Date.now() - safeDays * 24 * 3600_000;
  const sinceDate = new Date(since);
  const rows = await db
    .select({ name: analyticsEvent.name })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, sinceDate));
  const counts = Object.fromEntries(FUNNEL_EVENTS.map((e) => [e, 0])) as Record<FunnelEvent, number>;
  for (const row of rows) {
    if (FUNNEL_EVENTS.includes(row.name as FunnelEvent)) counts[row.name as FunnelEvent] += 1;
  }
  const regRows = await db
    .select({ id: user.id })
    .from(user)
    .where(gte(user.createdAt, sinceDate));
  const registrations = regRows.length;
  const ratio = (n: number, d: number) => (d > 0 ? Number((n / d).toFixed(4)) : 0);
  return {
    since,
    days: safeDays,
    counts: { ...counts, registrations, activeUsers: counts.feature_used },
    rates: {
      firstUseFromRegistration: ratio(counts.feature_used, registrations),
      paywallFromUse: ratio(counts.paywall_hit, counts.feature_used),
      checkoutFromPaywall: ratio(counts.checkout_started, counts.paywall_hit),
      paymentFromCheckout: ratio(counts.payment_granted, counts.checkout_started),
    },
  };
}
