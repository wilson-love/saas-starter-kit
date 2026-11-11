import PricingCards from '@/components/PricingCards';
import { PRICING } from '@/config/pricing';

export const metadata = { title: 'Pricing — Your SaaS' };

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const { locked } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Simple pricing</h1>
      <p className="mt-2 text-slate-600">
        Start free. Upgrade when you need unlimited usage. To reach{' '}
        <strong>${PRICING.mrrTargetUsd} MRR</strong> a creator-sized plan needs a focused, paying
        niche — that is who this is built for.
      </p>
      {locked && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have used this week&apos;s free quota. Upgrade to continue, or reset next week.
        </div>
      )}
      <div className="mt-8">
        <PricingCards />
      </div>
      <p className="mt-8 text-xs text-slate-400">
        Payments are processed by our merchant of record. Prices in USD. Cancel anytime.
      </p>
    </div>
  );
}
