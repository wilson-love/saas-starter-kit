/**
 * Gumroad 适配器（基座默认收款渠道，已在生产项目验证）。
 *
 * 与 Creem 的关键差异：**Gumroad 没有请求签名机制**，webhook 安全靠三件套：
 *   ① URL 里带共享密钥（`?token=…`），服务端常量时间比较；
 *   ② payload 的 `seller_id` 与白名单比对，拒绝伪造来源；
 *   ③ `sale_id` 作为幂等键（重复投递不重复发放；订阅类事件用 `subscription_id`）。
 *
 * Gumroad Ping 以 `application/x-www-form-urlencoded` 投递，字段全部是字符串，
 * 本文件只做防御式读取与归一化，不做业务写入。
 *
 * 能力边界（Gumroad hosted checkout）：
 *   - 不支持 Creem 的 success_url / prefilled_email / metadata 透传，结账只能跳转产品页；
 *   - 权益归属依赖 webhook 的 email 与登录邮箱一致；不一致时需在账户页做人工认领。
 */
import { timingSafeEqual } from 'node:crypto';
import { env } from '@/config/env';
import type { PlanId } from '@/config/pricing';

export type GumroadStatus = 'active' | 'canceled' | 'expired';

export interface NormalizedGumroadEvent {
  eventId: string;
  plan: PlanId;
  status: GumroadStatus;
  customerRef: string | null;
  email: string | null;
  currentPeriodEnd: number | null;
  raw: Record<string, unknown>;
}

const PRODUCT_TO_PLAN = (): Record<string, PlanId> => ({
  [env.GUMROAD_PRODUCT_ONEOFF]: 'oneoff',
  [env.GUMROAD_PRODUCT_PRO]: 'pro',
  [env.GUMROAD_PRODUCT_CREATOR]: 'creator',
});

export interface NormalizeOptions {
  now?: Date;
  /** 缺省取 env.GUMROAD_SELLER_ID */
  sellerId?: string;
  /** 缺省按 env 的三条产品 ID 构建 */
  productMap?: Record<string, PlanId>;
}

/** 常量时间比较，避免时序侧信道。允许 webhook URL 用 `?token=` 或 `?secret=`。 */
export function verifyGumroadSecret(candidate: string | null | undefined): boolean {
  const expected = env.GUMROAD_WEBHOOK_SECRET;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** FormData → 普通对象（Gumroad 只传一层字符串字段） */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function truthy(v: unknown): boolean {
  return v === 'true' || v === 'True' || v === true || v === '1' || v === 1;
}

/** 按订阅周期推算到期时间；一次性产品返回 null（永久有效）。 */
function periodEnd(now: Date, recurrence: string): number | null {
  const d = new Date(now);
  if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }
  if (recurrence === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
    return d.getTime();
  }
  return null;
}

/**
 * 归一化 Gumroad Ping。
 * 返回 null 表示「非本店商品 / 不认识的事件」，调用方应 200 忽略而不是报错。
 */
export function normalizeGumroadEvent(
  payload: Record<string, unknown>,
  opts: NormalizeOptions = {},
): NormalizedGumroadEvent | null {
  const now = opts.now ?? new Date();
  const sellerWhitelist = opts.sellerId ?? env.GUMROAD_SELLER_ID;
  const productMap = opts.productMap ?? PRODUCT_TO_PLAN();

  const sellerId = String(payload.seller_id ?? '');
  if (sellerWhitelist && sellerId !== sellerWhitelist) return null;

  const productId = String(payload.product_id ?? '');
  const plan = productMap[productId];
  if (!plan) return null;

  const saleId = String(payload.sale_id ?? '');
  if (!saleId) return null;

  const subscriptionId = String(payload.subscription_id ?? '');
  const resourceName = String(payload.resource_name ?? 'sale').toLowerCase();
  const refunded = truthy(payload.refunded ?? payload.refund);
  const disputed = truthy(payload.disputed ?? payload.dispute);

  let status: GumroadStatus = 'active';
  let eventId = saleId;
  if (refunded || disputed || resourceName === 'refund' || resourceName === 'dispute') {
    status = 'canceled';
    eventId = `${saleId}:refund`;
  } else if (resourceName === 'cancellation' || resourceName === 'cancel') {
    status = 'expired';
    eventId = subscriptionId ? `${subscriptionId}:cancel` : `${saleId}:cancel`;
  }

  // 归属：订阅用 subscription_id 做稳定关联键，一次性用 sale_id
  const customerRef = subscriptionId || saleId;

  const recurrence = String(payload.recurrence ?? '');
  const currentPeriodEnd = status === 'active' ? periodEnd(now, recurrence) : null;

  return {
    eventId,
    plan,
    status,
    customerRef,
    email: String(payload.email ?? '') || null,
    currentPeriodEnd,
    raw: payload,
  };
}
