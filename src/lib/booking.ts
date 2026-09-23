import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "./prisma";
import {
  generateSlotMinutes,
  minutesToLabel,
  type Interval,
} from "./availability";
import {
  BOOKING_HORIZON_DAYS,
  BOOKING_LEAD_MIN,
  DEPOSIT_CENTS,
  SLOT_STEP_MIN,
  STUDIO_TZ,
} from "./policy";
import type { BookingStatus } from "@prisma/client";
import type { Locale } from "@/i18n/messages";
import { REFERRAL_CENTS, checkReferralForBooking, normalizeReferralCode } from "./referral";
import type { BookingEmailData } from "./email";

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];

export type Slot = { minutes: number; label: string; iso: string };

export type BookableService = {
  slug: string;
  nameFr: string;
  nameEn: string;
  priceCents: number;
  durationMin: number;
};

/** Gel sets, then add-ons — active only, in display order. */
export async function listCatalogue(): Promise<{
  sets: BookableService[];
  addons: BookableService[];
}> {
  const rows = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: { slug: true, nameFr: true, nameEn: true, priceCents: true, durationMin: true, category: true },
  });
  return {
    sets: rows.filter((r) => r.category === "GEL_SET"),
    addons: rows.filter((r) => r.category === "ADDON"),
  };
}

/** 0=Sun..6=Sat → which weekdays the studio is ever open (for the date picker). */
export async function openWeekdays(): Promise<number[]> {
  const rows = await prisma.businessHours.findMany({ where: { isOpen: true }, select: { weekday: true } });
  return rows.map((r) => r.weekday);
}

function studioMidnightUtc(dateISO: string): Date {
  // dateISO = "YYYY-MM-DD"; midnight that calendar day in the studio timezone
  return fromZonedTime(`${dateISO}T00:00:00`, STUDIO_TZ);
}

function minutesOfDayInStudio(d: Date): number {
  const z = toZonedTime(d, STUDIO_TZ);
  return z.getHours() * 60 + z.getMinutes();
}

function todayISOInStudio(): string {
  const z = toZonedTime(new Date(), STUDIO_TZ);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const day = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function resolveServices(serviceSlug: string, addonSlugs: string[]) {
  const service = await prisma.service.findUnique({ where: { slug: serviceSlug } });
  if (!service || !service.active || service.category !== "GEL_SET") {
    throw new Error("INVALID_SERVICE");
  }
  const addons = addonSlugs.length
    ? await prisma.service.findMany({
        where: { slug: { in: addonSlugs }, active: true, category: "ADDON" },
      })
    : [];
  const durationMin = service.durationMin + addons.reduce((s, a) => s + a.durationMin, 0);
  const priceCents = service.priceCents + addons.reduce((s, a) => s + a.priceCents, 0);
  return { service, addons, durationMin, priceCents };
}

/** Available start times for a given service + add-ons on a given calendar day. */
export async function getDayAvailability(params: {
  serviceSlug: string;
  addonSlugs: string[];
  dateISO: string;
}): Promise<{ slots: Slot[]; durationMin: number; closed: boolean }> {
  const { serviceSlug, addonSlugs, dateISO } = params;
  const { durationMin } = await resolveServices(serviceSlug, addonSlugs);

  const dayStart = studioMidnightUtc(dateISO);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekday = toZonedTime(dayStart, STUDIO_TZ).getDay();

  const hours = await prisma.businessHours.findUnique({ where: { weekday } });
  if (!hours || !hours.isOpen) return { slots: [], durationMin, closed: true };

  const [bookings, timeOff] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { in: ACTIVE_STATUSES }, startAt: { gte: dayStart, lt: dayEnd } },
      select: { startAt: true, endAt: true },
    }),
    prisma.timeOff.findMany({
      where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const busy: Interval[] = [];
  for (const b of bookings) {
    busy.push({ startMin: minutesOfDayInStudio(b.startAt), endMin: minutesOfDayInStudio(b.endAt) });
  }
  for (const off of timeOff) {
    const s = off.startAt < dayStart ? 0 : minutesOfDayInStudio(off.startAt);
    const e = off.endAt > dayEnd ? 1440 : minutesOfDayInStudio(off.endAt);
    busy.push({ startMin: s, endMin: e });
  }

  const isToday = dateISO === todayISOInStudio();
  const earliestStartMin = isToday ? minutesOfDayInStudio(new Date()) + BOOKING_LEAD_MIN : 0;

  const minutes = generateSlotMinutes({
    day: { isOpen: true, openMin: hours.openMin, closeMin: hours.closeMin },
    durationMin,
    busy,
    earliestStartMin,
    step: SLOT_STEP_MIN,
  });

  const slots: Slot[] = minutes.map((m) => ({
    minutes: m,
    label: minutesToLabel(m),
    iso: fromZonedTime(
      `${dateISO}T${minutesToLabel(m)}:00`,
      STUDIO_TZ,
    ).toISOString(),
  }));

  return { slots, durationMin, closed: false };
}

export type CreateBookingInput = {
  serviceSlug: string;
  addonSlugs: string[];
  startIso: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  inspoImages?: string[];
  /** Referral ("parrainage") code from a friend: 10 $ off a first visit. */
  referralCode?: string;
  locale: "fr" | "en";
};

export type CreatedBooking = {
  id: string;
  reference: string;
  startAt: Date;
  endAt: Date;
  serviceName: { fr: string; en: string };
  addonNames: { fr: string; en: string }[];
  estimatedTotalCents: number;
  depositCents: number;
};

/** Creates a PENDING booking, re-checking the slot inside a transaction. */
export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  const { service, addons, durationMin, priceCents } = await resolveServices(
    input.serviceSlug,
    input.addonSlugs,
  );

  const startAt = new Date(input.startIso);
  if (Number.isNaN(startAt.getTime())) throw new Error("INVALID_START");
  const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);

  const now = Date.now();
  if (startAt.getTime() < now + BOOKING_LEAD_MIN * 60 * 1000) throw new Error("TOO_SOON");
  if (startAt.getTime() > now + BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000) {
    throw new Error("TOO_FAR");
  }

  // Validate against opening hours for that weekday.
  const weekday = toZonedTime(startAt, STUDIO_TZ).getDay();
  const hours = await prisma.businessHours.findUnique({ where: { weekday } });
  const startMin = toZonedTime(startAt, STUDIO_TZ).getHours() * 60 + toZonedTime(startAt, STUDIO_TZ).getMinutes();
  if (!hours || !hours.isOpen || startMin < hours.openMin || startMin + durationMin > hours.closeMin) {
    throw new Error("OUTSIDE_HOURS");
  }

  const email = input.contactEmail.trim().toLowerCase();
  const name = input.contactName.trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("INVALID_CONTACT");

  const booking = await prisma.$transaction(async (tx) => {
    const clash = await tx.booking.findFirst({
      where: {
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (clash) throw new Error("SLOT_TAKEN");

    const overlappingOff = await tx.timeOff.findFirst({
      where: { startAt: { lt: endAt }, endAt: { gt: startAt } },
      select: { id: true },
    });
    if (overlappingOff) throw new Error("SLOT_TAKEN");

    // Referral code: only for a first visit, and never your own code.
    let referralCode: string | null = null;
    if (input.referralCode?.trim()) {
      const code = normalizeReferralCode(input.referralCode);
      if (!code || !(await checkReferralForBooking(code, email, tx))) throw new Error("REFERRAL_INVALID");
      referralCode = code;
    }
    const referralDiscountCents = referralCode ? REFERRAL_CENTS : 0;

    // Link (or create) the customer record by email so history + loyalty attach.
    const customer = await tx.customer.upsert({
      where: { email },
      create: { email, name, phone: input.contactPhone?.trim() || null, locale: input.locale },
      update: {},
    });

    return tx.booking.create({
      data: {
        serviceId: service.id,
        addonSlugs: addons.map((a) => a.slug),
        startAt,
        endAt,
        contactName: name,
        contactEmail: email,
        contactPhone: input.contactPhone?.trim() || null,
        notes: input.notes?.trim() || null,
        inspoImages: (input.inspoImages ?? []).filter((u) => /^https:\/\//.test(u)).slice(0, 3),
        locale: input.locale,
        estimatedTotalCents: Math.max(0, priceCents - referralDiscountCents),
        depositCents: DEPOSIT_CENTS,
        referralCode,
        referralDiscountCents,
        status: "PENDING",
        customerId: customer.id,
      },
    });
  });

  return {
    id: booking.id,
    reference: booking.reference,
    startAt: booking.startAt,
    endAt: booking.endAt,
    serviceName: { fr: service.nameFr, en: service.nameEn },
    addonNames: addons.map((a) => ({ fr: a.nameFr, en: a.nameEn })),
    estimatedTotalCents: booking.estimatedTotalCents ?? priceCents,
    depositCents: DEPOSIT_CENTS,
  };
}

export async function getBookingByReference(reference: string) {
  return prisma.booking.findUnique({
    where: { reference },
    include: { service: true },
  });
}

export async function markDepositPaid(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { depositPaid: true, status: "CONFIRMED" },
    include: { service: true },
  });
}

/** Everything the confirmation / reminder / owner emails need, addon slugs resolved to names. */
export async function loadBookingForEmail(bookingId: string): Promise<BookingEmailData | null> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, customer: { select: { referralCreditCents: true } } },
  });
  if (!b) return null;
  const slugs = Array.isArray(b.addonSlugs) ? (b.addonSlugs as string[]) : [];
  const addons = slugs.length
    ? await prisma.service.findMany({ where: { slug: { in: slugs } }, select: { slug: true, nameFr: true, nameEn: true } })
    : [];
  const bySlug = new Map(addons.map((a) => [a.slug, a]));
  const locale: Locale = b.locale === "en" ? "en" : "fr";
  const pick = (s: { nameFr: string; nameEn: string }) => (locale === "fr" ? s.nameFr : s.nameEn);
  return {
    reference: b.reference,
    locale,
    contactName: b.contactName,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    serviceName: pick(b.service),
    addonNames: slugs.map((s) => bySlug.get(s)).filter((a): a is NonNullable<typeof a> => Boolean(a)).map(pick),
    startAt: b.startAt,
    endAt: b.endAt,
    durationMin: Math.round((b.endAt.getTime() - b.startAt.getTime()) / 60000),
    estimatedTotalCents: b.estimatedTotalCents,
    depositCents: b.depositCents,
    depositPaid: b.depositPaid,
    notes: b.notes,
    inspoImages: Array.isArray(b.inspoImages) ? (b.inspoImages as string[]) : [],
    referralCode: b.referralCode,
    referralDiscountCents: b.referralDiscountCents,
    referralCreditCents: b.customer?.referralCreditCents ?? 0,
  };
}

/**
 * Which of the next `days` calendar days can actually take this booking.
 * One pass over hours/bookings/time-off instead of a query per day, so the
 * date step can grey out full days and point at the next real opening.
 */
export async function listOpenDates(params: {
  serviceSlug: string;
  addonSlugs: string[];
  days?: number;
}): Promise<string[]> {
  const { serviceSlug, addonSlugs } = params;
  const days = Math.min(params.days ?? BOOKING_HORIZON_DAYS, BOOKING_HORIZON_DAYS);
  const { durationMin } = await resolveServices(serviceSlug, addonSlugs);

  const todayISO = todayISOInStudio();
  const first = studioMidnightUtc(todayISO);
  const rangeEnd = new Date(first.getTime() + (days + 1) * 24 * 60 * 60 * 1000);

  const [hours, bookings, timeOff] = await Promise.all([
    prisma.businessHours.findMany(),
    prisma.booking.findMany({
      where: { status: { in: ACTIVE_STATUSES }, startAt: { gte: first, lt: rangeEnd } },
      select: { startAt: true, endAt: true },
    }),
    prisma.timeOff.findMany({
      where: { startAt: { lt: rangeEnd }, endAt: { gt: first } },
      select: { startAt: true, endAt: true },
    }),
  ]);
  const hoursByWeekday = new Map(hours.map((h) => [h.weekday, h]));

  const open: string[] = [];
  for (let i = 1; i <= days; i++) {
    const dayStart = new Date(first.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const zoned = toZonedTime(dayStart, STUDIO_TZ);
    const dateISO = `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, "0")}-${String(zoned.getDate()).padStart(2, "0")}`;
    const h = hoursByWeekday.get(zoned.getDay());
    if (!h || !h.isOpen) continue;

    const busy: Interval[] = [];
    for (const b of bookings) {
      if (b.startAt < dayEnd && b.endAt > dayStart) {
        busy.push({ startMin: minutesOfDayInStudio(b.startAt), endMin: minutesOfDayInStudio(b.endAt) });
      }
    }
    for (const off of timeOff) {
      if (off.startAt < dayEnd && off.endAt > dayStart) {
        busy.push({
          startMin: off.startAt < dayStart ? 0 : minutesOfDayInStudio(off.startAt),
          endMin: off.endAt > dayEnd ? 1440 : minutesOfDayInStudio(off.endAt),
        });
      }
    }

    const minutes = generateSlotMinutes({
      day: { isOpen: true, openMin: h.openMin, closeMin: h.closeMin },
      durationMin,
      busy,
      step: SLOT_STEP_MIN,
    });
    if (minutes.length > 0) open.push(dateISO);
  }
  return open;
}
