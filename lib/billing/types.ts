import type { PlanId } from '@/config/pricing';

/** 供应商无关的结账/事件抽象，切换 Creem/LemonSqueezy/Stripe 只改 adapter */
export interface CheckoutOptions {
  plan: Exclude<PlanId, 'free'>;
  email?: string;
  /** 成功后回跳地址 */
  successUrl?: string;
  /** 透传到供应商的元数据（如 subject / user_id），webhook 原样回传 */
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: 'creem' | 'lemonsqueezy' | 'stripe';
  /** 返回托管结账页 URL（阶段 0 直接读后台配置链接，阶段 1 可走 SDK 动态创建） */
  createCheckoutUrl(opts: CheckoutOptions): Promise<string>;
}

export type NormalizedEvent = {
  eventId: string;
  plan: PlanId;
  status: 'active' | 'canceled' | 'expired';
  customerRef?: string | null;
  email?: string | null;
  currentPeriodEnd?: number | null;
  raw: unknown;
};
