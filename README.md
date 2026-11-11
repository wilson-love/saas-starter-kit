# overseas-saas-starter

Production-grade, generic **Next.js SaaS starter** extracted from a live, stable production app.
Auth, multi-tenant organizations, payments, email and analytics — pre-wired and verified.
Clone it, rename it, and start building your own product.

## Features

- **Auth** — better-auth magic-link email login (no passwords), session management, email verification
- **Multi-tenant** — organizations plugin: create orgs, invite members, roles (owner/admin/member), per-org data isolation
- **Payments** — Creem as default merchant of record, **Stripe reserved** behind a payment abstraction layer; pricing page, idempotent webhook, entitlement storage, free-tier quota enforcement
- **Database** — Postgres (Neon) + Drizzle, ready migrations, TTL cache
- **Email** — Resend + React Email (magic link, waitlist), terminal-print fallback in dev
- **Observability** — funnel analytics (signup → feature_used → paywall → checkout → granted) + Vercel Analytics
- **Demo business** — org-scoped Notes (app/notes) showing exactly how to add your own tenant-isolated tables
- **UI** — shadcn/ui-style components on Tailwind v4
- **Quality gates** — typecheck, lint, tests, build enforced in CI

## Tech Stack

| Layer    | Choice |
| -------- | ------ |
| Framework | Next.js (App Router, Turbopack), React 19, TypeScript strict |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle |
| Auth | better-auth (magic link + organizations) |
| Payments | Creem (default) / Stripe (reserved) |
| Email | Resend + React Email |
| UI | Tailwind CSS v4 + shadcn/ui-style components |
| Deploy | Vercel |

## Quick Start

```bash
# 1. Copy the template to a new directory
bash scripts/new-saas.sh my-saas

# 2. Install and set up
cd my-saas
pnpm install
cp .env.example .env          # fill DATABASE_URL, then:
pnpm setup:local              # generates BETTER_AUTH_SECRET + runs migrations

# 3. Run
pnpm dev                      # http://localhost:3000
pnpm check:config             # verify environment readiness
```

Sign in with any email (magic link is printed to the terminal when RESEND_API_KEY is unset),
create an organization at `/orgs`, write org-scoped notes at `/notes`, and see plans at `/pricing`.

## Project Structure

```
app/
  page.tsx            landing page
  sign-in/            magic-link sign in
  pricing/            pricing page (Creem checkout)
  account/            account + plan status
  orgs/               organizations: create / switch / invite / roles
  notes/              demo business (org-scoped, quota demo)
  api/
    auth/[...all]     better-auth endpoints
    checkout/         creates Creem checkout URL
    billing/creem/webhook/  payment webhook (signature + idempotent)
    notes/            demo CRUD (tenant isolation + free quota)
    waitlist/         pre-launch waitlist
    analytics/        funnel summary (token protected)
    health/           health check
config/
  env.ts              zod-validated env schema
  pricing.ts          plans & free quota
lib/
  auth.ts             better-auth server config (magic link + organizations)
  auth-client.ts      better-auth client
  billing/            payment abstraction: types / creem / entitlements
  db/                 schema, Neon client, TTL cache, migrate runner
  email/              Resend + React Email templates
  server/             usage quota, analytics funnel, notes, waitlist
  card/               generic satori SVG->PNG renderer
scripts/
  new-saas.sh         copy template → rename → setup
  setup-local.ts      local .env bootstrap + migrations
  check-config.ts     environment readiness checker
docs/
  DEVELOPER_HANDOFF.md  AI-dev handbook (give this to codex/claude code)
```

## Requirements

- Node.js >= 20, pnpm >= 10
- A Postgres database (e.g. Neon free tier)

## Documentation

- **For AI coding tools (codex / claude code):** `docs/DEVELOPER_HANDOFF.md` — everything needed to build a new SaaS from this template, including env acquisition, payment setup, multi-tenant development, and deployment checklist.
- **For humans:** this README plus `scripts/new-saas.sh`.

## License

MIT — see [LICENSE](./LICENSE). Based on the official [nextjs/saas-starter](https://github.com/nextjs/saas-starter).
