'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button, Card } from './ui';

export default function SignInForm({ initialError = '' }: { initialError?: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSent(false);
    try {
      const result = await signIn.magicLink({
        email,
        callbackURL: '/account',
        // 链接过期 / 已被使用 / 被邮件网关预扫描消费时，回到登录页给出明确提示，而不是落到业务页
        errorCallbackURL: '/sign-in',
        newUserCallbackURL: '/account',
      });
      if (result.error) {
        setError(result.error.message ?? 'Could not send the sign-in link.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error — please retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto mt-10 max-w-md">
      <h1 className="text-xl font-bold">Sign in to your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        We&apos;ll email you a one-time sign-in link. No password needed.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="sign-in-email" className="mb-1 block text-sm font-semibold">
            Email
          </label>
          <input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {sent && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Check your inbox for the sign-in link. It expires in 15 minutes.
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full py-3">
          {busy ? 'Sending…' : 'Email me a sign-in link'}
        </Button>
      </form>
    </Card>
  );
}
