export const metadata = { title: 'Terms — Your SaaS' };

export default function TermsPage() {
  return (
    <article className="prose mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-slate-700">
      <h1 className="text-2xl font-extrabold text-slate-900">Terms of Service</h1>
      <p>Last updated: 2026-09-29</p>

      <h2 className="mt-6 font-bold text-slate-900">Acceptable use</h2>
      <ul>
        <li>You may not use the service for unlawful purposes or to disrupt the service.</li>
        <li>You may not scrape, resell, or attempt to abuse the service.</li>
        <li>Outputs are informational and provided without warranty.</li>
      </ul>

      <h2 className="mt-6 font-bold text-slate-900">Subscriptions &amp; refunds</h2>
      <p>
        Paid plans renew until canceled. Billing is processed by our merchant of record under their
        terms. Refund requests are handled case by case; contact us at{' '}
        <a href="mailto:support@yourdomain.com" className="underline">
          support@yourdomain.com
        </a>
        .
      </p>

      <h2 className="mt-6 font-bold text-slate-900">Availability</h2>
      <p>
        The service depends on third-party infrastructure. We do not guarantee uninterrupted
        availability and may change or discontinue features over time.
      </p>

      <h2 className="mt-6 font-bold text-slate-900">Limitation of liability</h2>
      <p>
        The service is provided “as is”, without warranties of any kind, to the maximum extent
        permitted by law.
      </p>
    </article>
  );
}
