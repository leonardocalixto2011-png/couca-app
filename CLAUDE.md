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

## Phase 2 — in progress

- ✅ `src/lib/policy.ts` — confirmed deposit / cancellation / duration constants.
- ✅ `src/lib/availability.ts` — pure slot-generation (open window × 15-min grid,
  minus busy intervals, minus lead time). `src/lib/availability.test.ts` — 8
  vitest cases pass (`npm test`).
- ⬜ Server actions to query real availability (Prisma: BusinessHours + Bookings +
  TimeOff) and create a PENDING booking inside a transaction (double-booking guard).
- ⬜ `/reserver` multi-step flow (service+add-ons prefilled from calculator query →
  date → slot → contact → review → confirm). Stripe deposit + Resend email are
  clean stubs until those accounts exist (`STRIPE_SECRET_KEY` / `RESEND_API_KEY`).
- ⬜ Needs a live `DATABASE_URL` (free Neon) + `npm run db:push && npm run db:seed`
  before the flow can persist anything.

## Later phases

3. Admin dashboard (Auth.js ADMIN role) — services/hours/prices, bookings, time off.
4. Boutique — products, cart, Stripe checkout, order management.
5. Customer accounts + real Couca Club loyalty tracking.
6. SEO (locale routing), polish, deploy to coucabeauty.ca (Vercel + Neon).

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
