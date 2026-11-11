'use client';

import Link from 'next/link';
import { signOut, useSession } from '@/lib/auth-client';

export default function AuthNav() {
  const { data: session, isPending } = useSession();

  if (isPending) return <span className="text-xs text-slate-400">…</span>;
  if (!session) {
    return (
      <Link href="/sign-in" className="font-semibold text-brand-700 hover:text-brand-800">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/account" className="text-slate-600 hover:text-brand-700">
        Account
      </Link>
      <span className="hidden max-w-32 truncate text-xs text-slate-500 sm:inline">
        {session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="font-semibold text-slate-600 hover:text-brand-700"
      >
        Sign out
      </button>
    </div>
  );
}
