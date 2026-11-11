import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { getFunnelSummary } from '@/lib/server/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = env.ANALYTICS_TOKEN;
  if (!token || req.headers.get('authorization') !== `Bearer ${token}`) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }

  const rawDays = new URL(req.url).searchParams.get('days');
  const days = rawDays ? Number(rawDays) : 30;
  return NextResponse.json({
    ok: true,
    funnel: await getFunnelSummary(Number.isFinite(days) ? days : 30),
  });
}
