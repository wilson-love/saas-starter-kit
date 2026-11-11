/**
 * Creem 适配器：webhook 验签（HMAC-SHA256）+ 事件归一化。
 * 只依赖标准 crypto，不绑死生成式 SDK，降低版本升级返工。
 * 验签算法以官方文档为准：https://docs.creem.io/code/webhooks
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/config/env';
import type { NormalizedEvent } from './types';
import type { PlanId } from '@/config/pricing';

export function verifyCreemSignature(rawBody: string, signature: string | null): boolean {
  // 本地未配置 secret 时仅允许 test 模式显式放行（生产必须配置，否则一律拒绝）
  if (!env.CREEM_WEBHOOK_SECRET) {
    if (env.NODE_ENV !== 'production' && env.CREEM_TEST_MODE) return true;
    return false;
  }
  if (!signature) return false;
  const expected = createHmac('sha256', env.CREEM_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dig(obj: any, ...keys: string[]): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (const k of keys) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function toMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : t;
}

/**
 * 把 Creem webhook 原始事件归一化。对字段做防御式读取，兼容 test/prod 与嵌套差异。
 */
export function normalizeCreemEvent(raw: unknown): NormalizedEvent | null {
  const ev = raw as Record<string, unknown>;
  const eventId = String(ev.id ?? ev.eventId ?? '');
  const type = String(ev.eventType ?? ev.type ?? '');
  const object = (ev.object ?? dig(ev, 'data', 'object') ?? {}) as Record<string, unknown>;

  const email =
    (dig(object, 'customer', 'email') as string) ?? (object.customerEmail as string) ?? null;
  const customerRef =
    (dig(object, 'customer', 'id') as string) ?? (object.customer as string) ?? null;

  const productId = (dig(object, 'product', 'id') as string) ?? (object.product as string) ?? '';
  const metadataPlan = dig(object, 'metadata', 'plan') as string | undefined;

  const plan: PlanId =
    metadataPlan === 'pro' || productId === env.CREEM_PRODUCT_PRO
      ? 'pro'
      : metadataPlan === 'creator' || productId === env.CREEM_PRODUCT_CREATOR
        ? 'creator'
        : 'oneoff';

  let status: NormalizedEvent['status'];
  if (
    type === 'checkout.completed' ||
    type === 'subscription.active' ||
    type === 'subscription.created' ||
    type === 'subscription.resumed'
  ) {
    status = 'active';
  } else if (type === 'subscription.canceled' || type === 'refund.created') {
    status = 'canceled';
  } else if (type === 'subscription.expired') {
    status = 'expired';
  } else {
    return null; // 不关心的事件类型
  }

  const currentPeriodEnd =
    toMs(object.currentPeriodEnd) ?? toMs(dig(object, 'subscription', 'currentPeriodEnd'));

  return {
    eventId: eventId || `${type}:${String(object.id ?? '')}`,
    plan,
    status,
    customerRef,
    email,
    currentPeriodEnd,
    raw,
  };
}
