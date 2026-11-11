'use client';

import Link from 'next/link';

/** 全局页脚。Contact 邮箱接入业务时替换为你的域名。 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-brand-300">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-brand-300">
            Terms
          </Link>
          <Link href="/pricing" className="hover:text-brand-300">
            Pricing
          </Link>
          <a href="mailto:support@yourdomain.com" className="hover:text-brand-300">
            Contact: support@yourdomain.com
          </a>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Your SaaS. All rights reserved.</p>
      </div>
    </footer>
  );
}
