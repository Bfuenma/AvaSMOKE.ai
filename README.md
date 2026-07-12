# AvaSmoke.Ai

AI-powered, store-grounded product discovery for licensed smoke and vape
retailers. Customers enter through a store-specific QR code, verify proximity,
confirm they are 21+, and receive recommendations from that store’s available
inventory only.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Vercel AI SDK with provider abstraction for OpenAI, Anthropic, or explicit
  mock mode
- shadcn/ui primitives, Motion-ready CSS, Recharts, Zod, React Hook Form

## Local setup

1. Copy `.env.example` to `.env.local` and configure Supabase.
2. Install dependencies with `npm install`.
3. Start the local Supabase stack with `npm run db:start` (Docker required).
4. Apply and seed the development database with `npm run db:reset`.
5. Generate database types with `npm run db:types`.
6. Run the app with `npm run dev`.

When Supabase is absent, local development uses a clearly labeled fixture mode.
It is never enabled automatically in production. The customer fixture URL is:

`/app/store/northstar-smoke-vape?qr=demo-northstar`

## Supabase

The initial migration is
`supabase/migrations/20260712145000_initial_avasmoke_schema.sql`. It defines
roles, inventory, QR sessions, recommendations, conversations, applications,
feedback, analytics, upload jobs, constraints, indexes, triggers, and RLS.

The public browser cannot enumerate shops, products, inventory, or analytics.
QR validation and customer writes run through authenticated server routes. The
service-role key is server-only. Shop application inserts are validated,
honeypot-protected in the application route, and database-rate-limited.

Browser geolocation is a proximity control, not tamper-proof proof of physical
presence. Stores that require stronger fraud resistance should pair it with a
rotating in-store QR or staff-assisted challenge in a later release.

`supabase/seed.sql` is development-only and contains two fictional stores,
twenty fictional products, different store inventories, active/disabled QR
codes, sessions, recommendations, requests, and one application. Never run it
against production.

### First platform admin

Create a user through the Supabase dashboard, then promote it in a trusted SQL
session:

```sql
update public.profiles
set role = 'platform_admin', status = 'active'
where email = 'admin@example.com';
```

Public sign-up is disabled. Future shop accounts remain pending until an admin
reviews an application.

## AI configuration

Set `AI_PROVIDER` to `openai`, `anthropic`, or `mock`, and set an explicit
`AI_MODEL`. Provider keys are read only on the server. If a provider or model is
missing, extraction and chat return clearly labeled mock-mode output rather
than pretending analysis succeeded.

For direct Anthropic access, use `AI_PROVIDER=anthropic`,
`AI_MODEL=claude-sonnet-4-6`, and store `ANTHROPIC_API_KEY` in `.env.local` or
the deployment platform’s encrypted environment settings. Never prefix the key
with `NEXT_PUBLIC_`, paste it into source code, or commit it.

The recommendation ranker is deterministic and filters out hidden,
out-of-stock, and inactive products before AI is called. AI may explain
eligible results but cannot add or reorder products.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
