import type { PlanId } from '@/config/pricing';

/**
 * 供应商无关的结账/事件抽象，切换 Gumroad/Stripe/LemonSqueezy 只改 adapter。
 *
 * 能力说明：`email / successUrl / metadata` 是抽象层的通用参数，
 * 但 **Gumroad hosted checkout 不支持它们**（会被 adapter 忽略）；
 * 权益归属以 webhook 的 email 为准。换 Stripe 时可原样利用这些参数。
 */
export interface CheckoutOptions {
  plan: Exclude<PlanId, 'free'>;
  email?: string;
  /** 成功后回跳地址（Gumroad 忽略） */
  successUrl?: string;
  /** 透传到供应商的元数据（Gumroad 不支持） */
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: 'gumroad' | 'lemonsqueezy' | 'stripe';
  /** 返回托管结账页 URL（当前直接读后台配置链接；接入 SDK 型供应商时在 adapter 内实现） */
  createCheckoutUrl(opts: CheckoutOptions): Promise<string>;
}

/** webhook 归一化后的事件形状（供应商无关） */
export type NormalizedEvent = {
  eventId: string;
  plan: PlanId;
  status: 'active' | 'canceled' | 'expired';
  customerRef?: string | null;
  email?: string | null;
  currentPeriodEnd?: number | null;
  raw: unknown;
};
