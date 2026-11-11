import { NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { listNotes, createNote } from '@/lib/server/notes';
import { isEntitled, activePlan } from '@/lib/billing';
import { remainingFree, recordUsage } from '@/lib/server/usage';
import { trackEvent } from '@/lib/server/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

/**
 * GET /api/notes —— 当前活跃组织下的笔记（租户隔离演示）
 * POST /api/notes —— 新建笔记（免费额度：每周 quota 次，付费不限）
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const orgId = session.session.activeOrganizationId;
  if (!orgId) {
    return NextResponse.json({ message: 'No active organization. Create one at /orgs.' }, { status: 400 });
  }
  const notes = await listNotes(orgId);
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid title or body' }, { status: 400 });
  }

  const orgId = session.session.activeOrganizationId;
  if (!orgId) {
    return NextResponse.json({ message: 'No active organization. Create one at /orgs.' }, { status: 400 });
  }

  // 免费额度演示：免费用户每周 quota 次，付费用户不限
  const entitled = await isEntitled({ email: session.user.email, subject: session.user.id });
  if (!entitled) {
    const remaining = await remainingFree(session.user.id);
    if (remaining <= 0) {
      await trackEvent('paywall_hit', { userId: session.user.id });
      return NextResponse.json(
        { message: 'Weekly free quota used up. Upgrade at /pricing.' },
        { status: 403 },
      );
    }
  }

  await createNote(orgId, session.user.id, parsed.data.title, parsed.data.body);
  if (!entitled) await recordUsage(session.user.id);

  const plan = await activePlan({ email: session.user.email, subject: session.user.id });
  await trackEvent('feature_used', { userId: session.user.id, plan });
  return NextResponse.json({ ok: true });
}
