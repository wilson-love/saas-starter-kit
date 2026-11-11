import { LinkButton } from '@/components/ui';
import WaitlistForm from '@/components/WaitlistForm';

const STEPS = [
  {
    title: 'Sign in with email',
    body: 'One-click magic link — no passwords to remember, no credentials to leak. Your account works across any of your organizations.',
  },
  {
    title: 'Invite your team',
    body: 'Create an organization, invite members by email, and assign roles. Every piece of data is scoped to your organization.',
  },
  {
    title: 'Unlock with a plan',
    body: 'Start free with a weekly quota. Upgrade to a paid plan through a secure hosted checkout and your entitlement updates instantly.',
  },
] as const;

const FEATURES = [
  'Magic-link auth (better-auth) with email verification',
  'Multi-tenant organizations, members and roles',
  'Gumroad payment (provider-agnostic abstraction) with idempotent webhooks',
  'Postgres + Drizzle schema with ready migrations',
  'Resend transactional email with local dev fallback',
  'Funnel analytics + Vercel Analytics',
  'shadcn/ui-style components on Tailwind v4',
];

export default function HomePage() {
  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(20,184,166,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 lg:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
            Next.js SaaS starter · Auth + payments + multi-tenant
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Ship your next SaaS on a{' '}
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-gold-400 bg-clip-text text-transparent">
              production-grade starter
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Authentication, organizations, payments, email and analytics — pre-wired and verified.
            Clone it, rename it, and start building your own product today.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/sign-in" className="px-6 py-3 text-base shadow-lg shadow-brand-500/20">
              Get started free
            </LinkButton>
            <LinkButton
              href="/pricing"
              variant="secondary"
              className="border-slate-600 bg-white/5 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/10"
            >
              View pricing
            </LinkButton>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Free weekly quota · No card required · Payments by our merchant of record
          </p>
        </div>
      </section>

      {/* ===== Waitlist ===== */}
      <section className="mx-auto max-w-5xl px-4 pb-8">
        <div className="rounded-2xl border border-brand-200 bg-brand-700 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold">Get launch updates</h2>
            <p className="mt-1 text-sm text-brand-50">
              Join the early list for product access and launch pricing.
            </p>
          </div>
          <div className="sm:min-w-[28rem]">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ===== Steps ===== */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 border-t-2 border-t-brand-500/60 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== What you get ===== */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl bg-brand-800 p-8 text-white sm:p-12">
          <h2 className="text-2xl font-bold">Everything included</h2>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-200">✓</span>
                <span className="text-brand-50">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <LinkButton href="/sign-in" variant="secondary">
              Create your account
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
