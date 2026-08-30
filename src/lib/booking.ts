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
        locale: input.locale,
        estimatedTotalCents: priceCents,
        depositCents: DEPOSIT_CENTS,
        status: "PENDING",
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
    estimatedTotalCents: priceCents,
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
