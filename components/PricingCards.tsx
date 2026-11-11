'use client';

import { useState } from 'react';
import { PRICING, type PlanId } from '@/config/pricing';
import { Button, Card } from './ui';

const PLANS: Array<{
  id: Exclude<PlanId, 'free'>;
  name: string;
  price: string;
  blurb: string;
  features: readonly string[];
  highlight?: boolean;
}> = [
  {
    id: 'oneoff',
    name: 'One-time',
    price: `$${PRICING.oneoff.priceUsd}`,
    blurb: 'Pay once',
    features: ['One-time deep access', 'All core features unlocked', 'No recurring billing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: `$${PRICING.pro.priceUsd}/mo`,
    blurb: 'For power users',
    highlight: true,
    features: PRICING.pro.features,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: `$${PRICING.creator.priceUsd}/mo`,
    blurb: 'For teams & creators',
    features: PRICING.creator.features,
  },
];

export default function PricingCards() {
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');

  async function checkout(plan: Exclude<PlanId, 'free'>) {
    setBusy(plan);
    setError('');
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setError(data.message ?? 'Checkout is not configured yet.');
      }
    } catch {
      setError('Network error, please retry.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Free */}
        <Card>
          <h3 className="text-lg font-bold">Free</h3>
          <p className="mt-1 text-2xl font-extrabold">$0</p>
          <p className="text-xs text-slate-500">
            {PRICING.free.weeklyQuota} uses / week
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {PRICING.free.features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        </Card>

        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={p.highlight ? 'border-2 border-brand-500 ring-2 ring-brand-100' : ''}
          >
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="mt-1 text-2xl font-extrabold">{p.price}</p>
            <p className="text-xs text-slate-500">{p.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant={p.highlight ? 'primary' : 'secondary'}
              disabled={!!busy}
              onClick={() => checkout(p.id)}
            >
              {busy === p.id ? 'Redirecting…' : 'Choose'}
            </Button>
          </Card>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
