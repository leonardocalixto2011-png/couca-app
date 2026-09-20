@AGENTS.md

# Couca & Co. Beauty — custom booking + boutique web app

Boutique **nail studio**, Montréal / L'Assomption. This app replaces the existing
single-file marketing site with real online reservations + a small boutique.
Separate project from "CMAC Beauty" (a Shopify store).

## Status — Phase 1 done (scaffold + design system + marketing port + i18n)

- ✅ Next 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4
- ✅ Design system ported from the marketing site → `src/app/globals.css`
  (`@theme` brand tokens + `@layer base` element styles + `@layer components`
  for `.btn`, `.eyebrow`, `.container-x`, `.reveal`). Base styles MUST stay in
  `@layer base` or bare `a{}` overrides `.btn` colour.
- ✅ Fonts via `next/font/google`: Cormorant Garamond (display), Inter (UI),
  Great Vibes (script) → CSS vars `--font-cormorant/-inter/-vibes`.
- ✅ Home page = full port of the marketing site as components under
  `src/components/sections/` (Hero, Services, PromoBanner, Pricing +
  LookCalculator, CoucaClub, Gallery, Testimonials, InstagramBridge).
  `src/components/`: Nav, Footer, StickyBookBar, LangToggle, Reveal, Icon.
- ✅ i18n — FR default. `src/i18n/messages.ts` (flat dotted keys + `translate()`),
  `LocaleProvider` (client context, cookie `couca-locale`, `useT()` / `useLocale()`).
  Locale read server-side from cookie in `layout.tsx` for `<html lang>`.
- ✅ Prisma schema (`prisma/schema.prisma`) — full data model: Service, Product,
  BusinessHours, TimeOff, Booking, Customer, LoyaltyEvent, Order + Auth.js models.
  Client singleton: `src/lib/prisma.ts`. Seed: `prisma/seed.ts`.
- ✅ `src/lib/brand.ts` — KNOWN FACTS (brand, real pricing, loyalty tiers).
- ✅ `npm run build` passes clean. `/reserver` and `/boutique` are honest
  "coming soon" placeholders (`src/components/ComingSoon.tsx`).

## KNOWN FACTS — never change (see `src/lib/brand.ts` + `src/lib/policy.ts`)

Pricing: Pose Gel Courte 45 $ / Moyenne 50 $ / Longue 55 $. Add-ons: French +5 $,
Nail Art Simple +5 $, 3D/Complex +10/15/20 $.
Loyalty: 3rd visit = free Simple nail art; 5th = 15% off next full set;
10th = free Deluxe Care Set + 25% off.
**Deposit** (confirmed): $20 flat, non-refundable, applied to the final in-studio bill.
**Cancellation** (confirmed): ≥48h notice → deposit kept toward a future visit;
inside 48h or no-show → deposit forfeited.
**Durations** (confirmed): Courte 45 min, Moyenne 60, Longue 75; +15 min per
nail-art add-on. In `prisma/seed.ts` + `src/lib/policy.ts`.
Booking today = Instagram DM (`https://ig.me/m/coucaandcobeauty`); the app
replaces it — keep IG DM as a *secondary* contact only.

## STILL PLACEHOLDER — need the owner

- **Opening hours** — seeded Tue–Sat 10:00–18:00 in `prisma/seed.ts`
  (`AWAITING OWNER'S REAL HOURS`). The booking engine reads `BusinessHours`, so
  once the owner confirms, update the seed (or edit via admin in Phase 3).
- **Boutique products** — schema only (`Product` model). No products seeded.
  Await the owner's list, or keep boutique schema-only.
No invented reviews / stats / certifications / hours / products.

## Phase 2 — booking engine DONE (verified end-to-end)

- ✅ `src/lib/policy.ts` — confirmed deposit / cancellation / duration constants + studio TZ.
- ✅ `src/lib/availability.ts` — pure slot generation. `availability.test.ts`: 8 vitest cases (`npm test`).
- ✅ `src/lib/booking.ts` — `listCatalogue`, `openWeekdays`, `getDayAvailability`
  (BusinessHours × Bookings × TimeOff, studio-TZ aware via date-fns-tz, 2h lead time),
  `createBooking` (transaction + overlap/TimeOff guard), `getBookingByReference`, `markDepositPaid`.
- ✅ `src/app/reserver/actions.ts` — `fetchSlots`, `submitBooking`. If `STRIPE_SECRET_KEY`
  is set → Stripe Checkout Session for the $20 CAD deposit; else → confirm directly +
  send confirmation email.
- ✅ `src/app/api/stripe/webhook/route.ts` — `checkout.session.completed` → `depositPaid` +
  `CONFIRMED` + email.
- ✅ `src/lib/email.ts` — Resend via REST when `RESEND_API_KEY` set; else logs to console.
- ✅ `src/lib/stripe.ts` — lazy client, null when unconfigured.
- ✅ `/reserver` multi-step flow (`src/components/booking/BookingFlow.tsx` +
  `BookingConfirmation.tsx`): service+add-ons (prefilled from `?length=&french=&simple=&art3d=`
  off the calculator) → date (closed days disabled) → slot → contact → review (shows
  duration, est. total, $20 deposit, policy) → confirm → `/reserver?confirmed=<ref>`.
- ✅ Verified: booked Longue+Simple+3D (105 min) for a Tuesday 14:00 → row persisted
  (18:00–19:45Z), overlapping slots removed, exact-slot re-book → `SLOT_TAKEN`, email stub logged.

### Local database (dev)

`prisma dev` runs a local Postgres (started once; daemonises). `.env` `DATABASE_URL`
points at it **with `?sslmode=disable&pgbouncer=true&connection_limit=1`** — the
`pgbouncer=true` is required (its proxy is transaction-mode; without it you get
`prepared statement "s0" already exists`). Ports are assigned per machine
(`npx prisma dev ls`). Prod uses Neon — `.env.example` keeps that string.
Stop the Next dev server before `npm run build` on Windows, or `prisma generate`
hits `EPERM` renaming the locked query-engine DLL.

## Phase 2 — still needs the owner

- **Opening hours** — seeded Tue–Sat 10:00–18:00 placeholder. Give real weekly hours.
- **Stripe** — put the test keys in `.env` (`STRIPE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` from `stripe listen`).
  Flow already branches to Checkout when they're present.
- **Resend** — `RESEND_API_KEY` + verified `EMAIL_FROM` domain for real emails.

## Phase 3 — admin dashboard DONE (verified)

- Auth.js v5 Credentials + `bcryptjs`. Split config: `src/auth.config.ts` (edge-safe,
  used by `src/proxy.ts`) + `src/auth.ts` (Node, has the Credentials provider).
  Next 16 renamed `middleware.ts` → **`proxy.ts`** — same contract.
- `src/proxy.ts` guards `/admin/*` (redirects non-ADMIN to `/admin/login`).
- `/admin/login` (`LoginForm.tsx`, `signIn("credentials")`) + `(dash)` route group
  with its own sidebar layout (`src/app/admin/(dash)/layout.tsx`, re-checks role):
  - `/admin` — upcoming bookings + counts, inline status control
  - `/admin/bookings` — filterable list, status select (confirm / cancel / complete /
    no-show; NO_SHOW sets `depositForfeited`, CANCELLED sets `cancelledAt`)
  - `/admin/hours` — per-weekday open toggle + open/close time → drives booking slots
  - `/admin/services` — price ($) / duration (min) / active per service
  - `/admin/time-off` — add (datetime-local, interpreted in studio TZ) / delete blocks
- `src/app/admin/actions.ts` — every mutation `requireAdmin()` + `revalidatePath`.
- `src/lib/admin.ts` (`requireAdmin`, `isAdmin`, `dashboardData`, `listBookings`),
  `src/lib/fmt.ts` (studio-TZ date formatting), `src/components/admin/ui.tsx`.
- Admin user seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env (dev: `admin@coucabeauty.ca`
  / `couca-admin-dev`). Marketing `Nav`/`Footer`/`StickyBookBar` hidden on `/admin`.
- Verified: guard redirects, credential login works, `updateHours` persists.

## Phase 4 — boutique DONE (verified)

- `Product.options` Json = variants: `[{nameFr,nameEn,values:[{value,labelFr,labelEn}]}]`.
  `Order.items` snapshot + `shippingJson` + `locale`.
- Seeded product: **Haitian Krèm premix 750 mL, $30 CAD, 7 flavours** (real, full
  FR/EN copy in `prisma/seed.ts`). No invented beauty SKUs — owner adds those in
  `/admin/products`.
- `src/lib/shop.ts` — `listProducts`, `getProduct`, `validateCart` (re-checks price
  + option validity server-side), `getOrderByReference`, `markOrderPaid`.
- `src/components/shop/CartProvider.tsx` — client cart in `localStorage`
  (`couca-cart`); nav shows a count badge.
- `/boutique` grid · `/boutique/[slug]` (variant + qty + add) · `/panier` (`CartView`)
  · `/boutique/merci` (`OrderThanks`, clears cart).
- `src/app/boutique/actions.ts` `checkout()` — validates, creates PENDING `Order`,
  opens Stripe Checkout (CA shipping + phone collection). Returns `PAYMENT_UNAVAILABLE`
  (shown gracefully) when `STRIPE_SECRET_KEY` is absent.
- Webhook branches on `session.metadata.kind` (`"shop"` vs `"booking"`); shop →
  `Order` PAID + captures email/shipping.
- Admin: `/admin/products` (create / edit / delete; price $, active, images CSV,
  options as JSON) and `/admin/orders` (list + status select).
- Verified: browse → pick flavour → cart → subtotal → checkout fallback message;
  admin products/orders render. build + 8 tests green.

## Phase 5 — customer accounts + real loyalty DONE (verified)

- Credentials `authorize` now accepts any user with a `passwordHash` (not admin-only);
  `src/proxy.ts` also guards `/compte/*` → `/connexion`.
- `/connexion` (`AuthForms.tsx`, login + register tabs) → `src/app/connexion/actions.ts`
  `registerCustomer` (creates User CUSTOMER + Customer; **links prior guest bookings by
  email**). Then client `signIn("credentials")`.
- `/compte` (`AccountView.tsx`) — greeting, real Couca Club card (from
  `Customer.loyaltyVisits`), editable profile (name/phone → `updateProfile`),
  booking history (by `customerId` or matching email), sign out.
- `src/lib/loyalty.ts` — `creditBookingVisit` / `uncreditBookingVisit`, idempotent via
  `Booking.loyaltyCounted`; writes a `LoyaltyEvent` per threshold reached (3/5/10).
  Wired into admin `setBookingStatus`: COMPLETED → +1 visit, un-complete → −1.
- `createBooking` now upserts a `Customer` by email and sets `booking.customerId`.
- Verified via script: guest booking → register same email → booking attaches →
  admin marks COMPLETED → visits 0→1 → repeat credit stays 1 (idempotent).
  Build + 8 tests green.

## Phase 6 — SEO + deploy readiness DONE (code side)

- `robots.ts` (disallows /admin /compte /panier /api), `sitemap.ts` (static + product pages).
- JSON-LD: `NailSalon` in root layout (with 7d 13-18 opening hours), `Product` on
  `/boutique/[slug]`. `src/components/JsonLd.tsx`.
- Dynamic OG image: `src/app/opengraph-image.tsx` (`runtime = "nodejs"`, 1200x630,
  blush→cream, headline). Satori needs `display:flex` on every multi-child div.
- Branded `not-found.tsx` + `error.tsx`. `GET /api/health` → DB ping.
- Prisma: datasource `directUrl = env("DIRECT_URL")` (Neon). **Initial migration
  baselined**: `prisma/migrations/0_init/migration.sql` generated via
  `migrate diff --from-empty`, `migrate resolve --applied 0_init` on the dev DB.
- `package.json` `vercel-build` = `prisma generate && prisma migrate deploy && next build`
  (Vercel auto-detects it).
- `README.md` — full local + Vercel/Neon deploy runbook incl. the Stripe webhook step.

### Not done (deliberately deferred)

- **True locale routing** (`/fr` `/en` paths + hreflang). Current cookie-based i18n
  (`couca-locale`) is fine for launch — FR is indexed as the primary market. Locale
  routing is a follow-up that touches every route.
- **Actual deployment** — needs the owner to create Neon + Vercel accounts, set env
  vars, point the domain, and add the Stripe webhook endpoint.

## Owner action items to go live

1. Decide: Couca's own Stripe account, or keep the shared "cmac" one.
2. Neon project → `DATABASE_URL` (pooled) + `DIRECT_URL` (direct).
3. Vercel: import repo, set all env vars, deploy (runs `vercel-build`).
4. Seed once against prod (`npx tsx prisma/seed.ts` with prod env + ADMIN_*).
5. Point `coucabeauty.ca` at Vercel.
6. Stripe webhook → `https://coucabeauty.ca/api/stripe/webhook`
   (`checkout.session.completed`) → put signing secret in `STRIPE_WEBHOOK_SECRET`.
7. Resend: verify a sending domain, set `RESEND_API_KEY` + `EMAIL_FROM`.

## Setup notes

- Node lives at `C:\Program Files\nodejs` (installed via winget; on PATH via `~/.bashrc`).
- The project path deliberately has **no `&`** — `C:\Users\leona\Couca&co\` breaks
  npm/Next script resolution on Windows, so the app is at `C:\Users\leona\couca-app\`.
  The marketing site + `img/` assets stay in `Couca&co/`. Enhanced photos copied
  to `public/img/web-4..9.jpg`.
- npm 11 requires `npm approve-scripts` for install scripts — approved set is
  pinned in `package.json#allowScripts`.
- `.env` is a local placeholder; real values (Neon, Auth, Stripe, Resend) go in
  per `.env.example`. `prisma migrate` needs a real `DATABASE_URL` first.

## Commands

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run db:generate`
· `npm run db:push` / `db:migrate` · `npm run db:seed` · `npm run db:studio`

## 2026-09-20 — booking experience + admin + growth batch

- **Studio address** (`BRAND.studioAddress`, 209 rue Paré, L'Assomption J5W 0K5) is shown ONLY on the post-booking
  confirmation page and in emails. Never put it in the footer, JSON-LD, OG image or any indexed page — owner does
  not want it on Google Maps.
- **Secteur selector removed** from booking; footer "Secteurs desservis" block removed. `BRAND.serviceAreas` still
  feeds JSON-LD `areaServed` (SEO reach only).
- **Emails** (`src/lib/email.ts`): HTML confirmation + day-before reminder with `.ics` attachment and directions link;
  owner notifications for new bookings (with inspo photos) and boutique orders → `OWNER_NOTIFY_EMAIL`
  (fallback `ADMIN_EMAIL`). `loadBookingForEmail()` in `booking.ts` builds the payload (resolves addon names).
- **Inspo photos**: `Booking.inspoImages` (Json string[]). Client downsizes to 1400px JPEG, `uploadInspoPhoto`
  server action → Vercel Blob. Field only renders when `BLOB_READ_WRITE_TOKEN` is set (`src/lib/inspo.ts`).
  Thumbnails in /admin/bookings and in the owner email. `serverActions.bodySizeLimit` = 8mb.
- **Reminders**: `Booking.reminderSentAt`; `/api/cron/reminders` (Bearer `CRON_SECRET`), `vercel.json` cron daily
  14:00 UTC, window 20–48 h ahead.
- **Admin › Clientes** (`/admin/customers`): search, booking count, last visit, Couca Club ± (`adjustLoyaltyVisits`,
  creates LoyaltyEvent on tier crossing). Marking a booking COMPLETED is still the normal path.
- **Google reviews**: `src/lib/reviews.ts` (Places API New, 1h cache) → `TestimonialsSection` (server) →
  `Testimonials` (client). Needs `GOOGLE_PLACE_ID` + `GOOGLE_MAPS_API_KEY`; falls back to the honest placeholder.
  Adds `aggregateRating` to NailSalon JSON-LD when present.
- **Analytics** (`src/components/Analytics.tsx`): gtag loader gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` /
  `NEXT_PUBLIC_GOOGLE_ADS_ID`; `TrackBookingConversion` on the confirmation page, `TrackOrderConversion` on
  /boutique/merci. Labels: `NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL`, `…_ORDER_LABEL`.
- Migration `20260920120000_inspo_photos_and_reminders` (two additive columns) applies via `vercel-build`.
