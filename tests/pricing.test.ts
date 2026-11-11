import { describe, expect, it } from 'vitest';
import { PRICING } from '@/config/pricing';

describe('pricing config', () => {
  it('free tier exposes a positive weekly quota', () => {
    expect(PRICING.free.weeklyQuota).toBeGreaterThan(0);
  });

  it('paid plans expose checkout env keys and USD prices', () => {
    expect(PRICING.oneoff.checkoutUrlEnv).toBe('PAYMENT_LINK_ONEOFF');
    expect(PRICING.pro.variantIdEnv).toBe('CREEM_PRODUCT_PRO');
    expect(PRICING.creator.variantIdEnv).toBe('CREEM_PRODUCT_CREATOR');
    for (const plan of [PRICING.oneoff, PRICING.pro, PRICING.creator]) {
      expect(plan.priceUsd).toBeGreaterThan(0);
    }
  });
});
