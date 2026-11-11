import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { activePlan } from '@/lib/billing';
import { Badge, Card, LinkButton } from '@/components/ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Account — Your SaaS' };

const PLAN_LABEL = {
  free: 'Free',
  oneoff: 'One-time',
  pro: 'Pro',
  creator: 'Creator',
} as const;

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) notFound();

  const plan = await activePlan({ email: session.user.email });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">Your account</h1>
      <p className="mt-2 text-sm text-slate-600">{session.user.email}</p>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Current plan</h2>
            <p className="mt-1 text-sm text-slate-600">
              {plan === 'free'
                ? 'Free plan with a weekly usage quota. Upgrade to unlock unlimited usage.'
                : 'Paid entitlement is active. Thank you for supporting the product!'}
            </p>
          </div>
          <Badge tone={plan === 'free' ? 'neutral' : 'good'}>{PLAN_LABEL[plan]}</Badge>
        </div>
        {plan === 'free' && (
          <LinkButton href="/pricing" className="mt-5">
            Upgrade
          </LinkButton>
        )}
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-bold">Organizations</h3>
          <p className="mt-2 text-sm text-slate-600">
            Create teams, invite members, manage roles (multi-tenant).
          </p>
          <Link
            href="/orgs"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Manage organizations
          </Link>
        </Card>
        <Card>
          <h3 className="font-bold">Notes (demo)</h3>
          <p className="mt-2 text-sm text-slate-600">
            Example org-scoped business: notes are isolated per organization.
          </p>
          <Link
            href="/notes"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Open notes
          </Link>
        </Card>
        <Card>
          <h3 className="font-bold">Pricing</h3>
          <p className="mt-2 text-sm text-slate-600">Free tier + paid plans via Creem checkout.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            View plans
          </Link>
        </Card>
      </div>
    </div>
  );
}
