export const metadata = { title: 'Privacy — Your SaaS' };

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-slate-700">
      <h1 className="text-2xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p>Last updated: 2026-09-29</p>

      <h2 className="mt-6 font-bold text-slate-900">What we collect</h2>
      <ul>
        <li>Your email address when you sign in (passwordless magic-link login).</li>
        <li>Data you create while using the service (e.g. your notes, projects, reports).</li>
        <li>
          If you pay, billing is handled by our merchant of record; we store only subscription
          status, never full card numbers.
        </li>
        <li>Basic analytics events (signup, feature usage, checkout) to improve the product.</li>
      </ul>

      <h2 className="mt-6 font-bold text-slate-900">What we never collect</h2>
      <ul>
        <li>Passwords (we do not offer password login at all).</li>
        <li>We do not knowingly collect data from children.</li>
        <li>We do not sell personal data.</li>
      </ul>

      <h2 className="mt-6 font-bold text-slate-900">How we use data</h2>
      <p>
        To operate your account, enforce the free quota, run your subscription, and improve the
        product. Data is stored on our hosting provider&apos;s servers and processed only as needed.
      </p>

      <h2 className="mt-6 font-bold text-slate-900">Cookies</h2>
      <p>We use a single authentication cookie when you sign in. No advertising trackers.</p>

      <h2 className="mt-6 font-bold text-slate-900">Your rights &amp; contact</h2>
      <p>
        You can request export or deletion of your data by emailing us at{' '}
        <a href="mailto:support@yourdomain.com" className="underline">
          support@yourdomain.com
        </a>
        .
      </p>
    </article>
  );
}
