'use client';

import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

/** 全局顶栏。接入新业务时把导航换成你的页面。 */
export default function SiteHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span className="inline-block h-7 w-7 rounded-lg bg-brand-500 text-white grid place-items-center text-sm shadow-lg shadow-brand-900/50">
            S
          </span>
          Your SaaS
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/notes" className="hover:text-brand-300">
            Notes
          </Link>
          <Link href="/orgs" className="hover:text-brand-300">
            Organizations
          </Link>
          <Link href="/pricing" className="hover:text-brand-300">
            Pricing
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
