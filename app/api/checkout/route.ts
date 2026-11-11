import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutUrl } from '@/lib/billing';
import { auth } from '@/lib/auth';
import { env } from '@/config/env';
import { trackEvent } from '@/lib/server/analytics';

export const runtime = 'nodejs';

const schema = z.object({
  plan: z.enum(['oneoff', 'pro', 'creator']),
  email: z.string().email().optional(),
  /** 透传给支付供应商的元数据键（webhook 原样回传），如 user_id / 第三方实体 ID */
  subject: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid plan' }, { status: 400 });
  }
  try {
    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    await trackEvent('checkout_started', { plan: parsed.data.plan, userId: session?.user.id });
    const url = await createCheckoutUrl({
      plan: parsed.data.plan,
      email: parsed.data.email ?? session?.user.email,
      successUrl: `${env.APP_URL}/account`,
      metadata: parsed.data.subject ? { subject: parsed.data.subject } : undefined,
    });
    return NextResponse.json({ url });
  } catch (e) {
    // 技术细节只进服务端日志，不暴露给终端用户
    console.error('[checkout] failed:', e);
    return NextResponse.json(
      { message: 'Checkout is not available right now. Please try again shortly.' },
      { status: 503 },
    );
  }
}
