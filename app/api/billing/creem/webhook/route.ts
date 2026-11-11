/**
 * Creem webhook 接收端。三铁律：
 * 1) 验签失败立即 401 拒绝；2) 事件 ID 幂等（重复投递不重复发放）；3) 只信服务端事件。
 * 必须 Node runtime（不用 edge，保证 crypto 与 Neon HTTP 驱动一致）。
 */
import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { verifyCreemSignature, normalizeCreemEvent, grantFromEvent } from '@/lib/billing';
import { trackEvent } from '@/lib/server/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('creem-signature');

  if (!verifyCreemSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const event = normalizeCreemEvent(parsed);
  if (!event) return NextResponse.json({ ok: true, ignored: true });

  const firstTime = await grantFromEvent({
    provider: 'creem',
    eventId: event.eventId,
    plan: event.plan,
    status: event.status,
    customerRef: event.customerRef,
    email: event.email,
    currentPeriodEnd: event.currentPeriodEnd,
    raw: event.raw,
  });
  if (firstTime) await trackEvent('payment_granted', { plan: event.plan });

  console.log(
    `[billing] ${event.eventId} plan=${event.plan} status=${event.status} granted=${firstTime}`,
  );
  return NextResponse.json({ ok: true, duplicate: !firstTime });
}

// 健康检查，方便部署后确认路由存活
export function GET() {
  return NextResponse.json({
    provider: env.PAYMENT_PROVIDER,
    configured: !!env.CREEM_WEBHOOK_SECRET,
  });
}
