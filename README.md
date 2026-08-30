# Couca & Co. Beauty

Bilingual (FR default / EN) booking + boutique web app for a boutique nail studio
in Montréal / L'Assomption. Next.js 16 · React 19 · Tailwind v4 · Prisma 6 ·
Auth.js v5 · Stripe · Resend.

## Local development

```bash
# 1. install
npm install

# 2. local Postgres (leave running in its own terminal)
npx prisma dev

# 3. env — copy and fill DATABASE_URL / DIRECT_URL from `prisma dev` output.
#    Local DATABASE_URL MUST include `?sslmode=disable&pgbouncer=true&connection_limit=1`
cp .env.example .env

# 4. schema + data
npm run db:migrate      # or: npx prisma migrate deploy
npm run db:seed         # services, hours (7d 13:00-18:00), Krem product, admin user

# 5. run
npm run dev             # http://localhost:3000  (or PORT=3100 npm run dev)
```

Admin: `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

```bash
npm run build       # prisma generate + next build
npm test            # vitest (availability engine)
npm run typecheck
```

## Environment

See `.env.example`. Required for a real deployment:

| var | where |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Neon - pooled + direct connection strings |
| `AUTH_SECRET` | `npx auth secret` |
| `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` | `https://coucabeauty.ca` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeded admin login |
| `STRIPE_SECRET_KEY` | Stripe -> API keys (test then live) |
| `STRIPE_WEBHOOK_SECRET` | from the webhook endpoint you create (below) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend + a verified sending domain |

Without `STRIPE_SECRET_KEY` the app still runs: bookings confirm without an online
deposit, and boutique checkout shows a "payment not configured" message.
Without `RESEND_API_KEY` confirmation emails are logged to the server console.

## Deploy (Vercel + Neon)

1. **Neon** - create a project. Copy the **pooled** string to `DATABASE_URL` and the
   **direct** string to `DIRECT_URL`.
2. **Vercel** - import the repo. Add all env vars. Vercel runs `vercel-build`
   (`prisma generate && prisma migrate deploy && next build`) automatically.
3. First deploy done -> seed once:
   `DATABASE_URL=... DIRECT_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx prisma/seed.ts`
4. **Domain** - point `coucabeauty.ca` at Vercel.
5. **Stripe webhook** - Stripe Dashboard -> Developers -> Webhooks -> add endpoint
   `https://coucabeauty.ca/api/stripe/webhook`, event `checkout.session.completed`.
   Put its signing secret in `STRIPE_WEBHOOK_SECRET` and redeploy. This flips a paid
   deposit/order to CONFIRMED/PAID and sends the confirmation email.
6. Health check: `GET /api/health` -> `{ ok: true, db: "up" }`.

## Structure

- `src/app/` - routes. Marketing home `/`; booking `/reserver`; shop `/boutique`,
  `/panier`; account `/compte`, `/connexion`; admin `/admin/*`.
- `src/lib/` - `booking.ts` (availability + createBooking), `availability.ts` (pure,
  tested), `shop.ts`, `loyalty.ts`, `policy.ts` (owner-confirmed rules), `brand.ts`
  (KNOWN FACTS), `auth.ts` / `auth.config.ts`.
- `src/i18n/` - flat message dicts + `LocaleProvider` (cookie `couca-locale`).
- `prisma/` - `schema.prisma`, `migrations/`, `seed.ts`.

See `CLAUDE.md` for the full build log and the owner-confirmed facts.
