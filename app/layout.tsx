import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { env } from '@/config/env';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';

// 接入新业务时替换为你的站点名/描述（或从 env 注入）
const SITE_TITLE = 'Your SaaS — Ship your product on this starter';
const SITE_DESC =
  'A production-grade Next.js SaaS starter with auth, multi-tenant organizations, payments, email, and analytics.';

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL || 'http://localhost:3000'),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: 'Your SaaS',
  openGraph: {
    type: 'website',
    siteName: 'Your SaaS',
    title: SITE_TITLE,
    description: SITE_DESC,
    url: env.APP_URL || 'http://localhost:3000',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans">
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
