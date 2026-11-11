'use client';

import { useState } from 'react';
import { Button } from './ui';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'already' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });
      const data = await response.json();
      if (data.status === 'added') {
        setStatus('added');
        setMessage('You’re on the list. Check your inbox for confirmation.');
      } else if (data.status === 'already_registered') {
        setStatus('already');
        setMessage('That email is already on the list.');
      } else {
        setStatus('error');
        setMessage(data.message ?? 'Please enter a valid email address.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error — please retry.');
    }
  }

  if (status === 'added' || status === 'already') {
    return <p className="mt-4 text-sm font-semibold text-brand-100">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="waitlist-email">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="min-h-11 flex-1 rounded-lg border border-brand-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-200 focus:ring-2 focus:ring-brand-200"
      />
      <Button
        type="submit"
        disabled={status === 'loading'}
        variant="secondary"
        className="whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
      </Button>
      {status === 'error' && <p className="text-sm text-red-200">{message}</p>}
    </form>
  );
}
