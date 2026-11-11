/**
 * Gumroad webhook（Ping）接收端（基座默认收款链路，已在生产项目验证）。
 *
 * 安全模型（Gumroad 无请求签名）——三件套缺一不可：
 *   1) URL 共享密钥：把回调地址配置成 `https://<域名>/api/billing/gumroad/webhook?token=<GUMROAD_WEBHOOK_SECRET>`，
 *      服务端常量时间比较；缺失或不匹配直接 401。
 *   2) seller_id 白名单：payload 的 seller_id 必须等于 GUMROAD_SELLER_ID，否则忽略（防伪造）。
 *   3) sale_id 幂等：providerEventId 唯一约束，重复投递只发放一次。
 *
 * 必须 Node runtime（Node crypto + Neon HTTP 驱动）。
 */
import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import {
  normalizeGumroadEvent,
  verifyGumroadSecret,
  formToObject,
} from '@/lib/billing/gumroad';
import { grantFromEvent, revokeFromEvent } from '@/lib/billing';
import { trackEvent } from '@/lib/server/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readPayload(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  // Gumroad Ping 默认 application/x-www-form-urlencoded
  const form = await req.formData().catch(() => null);
  if (!form) return {};
  return formToObject(form);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('token') ?? searchParams.get('secret');
  if (!verifyGumroadSecret(secret)) {
    return NextResponse.json({ ok: false, error: 'invalid secret' }, { status: 401 });
  }

  const payload = await readPayload(req);
  const event = normalizeGumroadEvent(payload);
  if (!event) {
    // 非本店商品 / 不认识的事件：200 忽略，避免 Gumroad 反复重投
    return NextResponse.json({ ok: true, ignored: true });
  }

  const firstTime = await grantFromEvent({
    provider: 'gumroad',
    eventId: event.eventId,
    plan: event.plan,
    status: event.status,
    customerRef: event.customerRef,
    email: event.email,
    currentPeriodEnd: event.currentPeriodEnd,
    raw: event.raw,
  });

  // 退款/争议/订阅取消：除记录事件外，还要把同 customerRef 的旧 active 权益翻掉
  let revoked = 0;
  if (event.status !== 'active' && event.customerRef) {
    revoked = await revokeFromEvent({
      provider: 'gumroad',
      customerRef: event.customerRef,
      status: event.status,
    });
  }

  if (firstTime && event.status === 'active') {
    await trackEvent('payment_granted', { plan: event.plan });
  }

  console.log(
    `[billing:gumroad] ${event.eventId} plan=${event.plan} status=${event.status} granted=${firstTime} revoked=${revoked}`,
  );
  return NextResponse.json({ ok: true, duplicate: !firstTime, revoked });
}

/** 健康检查：确认路由存活与配置状态（不暴露密钥值） */
export function GET() {
  return NextResponse.json({
    provider: 'gumroad',
    secretConfigured: !!env.GUMROAD_WEBHOOK_SECRET,
    sellerWhitelisted: !!env.GUMROAD_SELLER_ID,
    productsConfigured: {
      oneoff: !!env.GUMROAD_PRODUCT_ONEOFF,
      pro: !!env.GUMROAD_PRODUCT_PRO,
      creator: !!env.GUMROAD_PRODUCT_CREATOR,
    },
  });
}
