"use server";

import { headers } from "next/headers";
import {
  createBooking,
  getDayAvailability,
  listOpenDates,
  loadBookingForEmail,
  type CreateBookingInput,
  type Slot,
} from "@/lib/booking";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOwnerWaitlistNotice, sendWaitlistAck } from "@/lib/email";
import { sendBookingConfirmation, sendOwnerBookingNotice } from "@/lib/email";
import { createDepositCheckout } from "@/lib/deposit";

export type SlotsResult =
  | { ok: true; slots: Slot[]; durationMin: number; closed: boolean }
  | { ok: false; error: string };

export async function fetchSlots(input: {
  serviceSlug: string;
  addonSlugs: string[];
  dateISO: string;
}): Promise<SlotsResult> {
  try {
    const { slots, durationMin, closed } = await getDayAvailability(input);
    return { ok: true, slots, durationMin, closed };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UNKNOWN" };
  }
}

/** Days in the booking horizon that still have at least one free slot. */
export async function fetchOpenDates(input: {
  serviceSlug: string;
  addonSlugs: string[];
}): Promise<{ ok: true; dates: string[] } | { ok: false }> {
  try {
    return { ok: true, dates: await listOpenDates(input) };
  } catch {
    return { ok: false };
  }
}

/** Client asks to be told when a spot frees up. */
export async function joinWaitlist(input: {
  name: string;
  email: string;
  phone?: string;
  serviceSlug?: string;
  serviceName?: string;
  wantedDate?: string;
  locale: "fr" | "en";
}): Promise<{ ok: boolean }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !/^[^@s]+@[^@s]+.[^@s]+$/.test(email)) return { ok: false };
  try {
    const recent = await prisma.waitlist.findFirst({
      where: { email, closedAt: null, createdAt: { gt: new Date(Date.now() - 7 * 86400e3) } },
      select: { id: true },
    });
    if (!recent) {
      await prisma.waitlist.create({
        data: {
          name,
          email,
          phone: input.phone?.trim() || null,
          serviceSlug: input.serviceSlug || null,
          wantedDate: input.wantedDate || null,
          locale: input.locale,
        },
      });
      const entry = {
        name,
        email,
        phone: input.phone?.trim() || null,
        serviceName: input.serviceName ?? null,
        wantedDate: input.wantedDate ?? null,
        locale: input.locale,
      };
      await Promise.all([sendWaitlistAck(entry), sendOwnerWaitlistNotice(entry)]);
    }
    return { ok: true };
  } catch (err) {
    console.error("[waitlist] failed", err);
    return { ok: false };
  }
}

export type SubmitResult =
  | { ok: true; mode: "checkout"; url: string }
  | { ok: true; mode: "confirmed"; reference: string }
  | { ok: false; error: string };

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function submitBooking(input: CreateBookingInput): Promise<SubmitResult> {
  let booking;
  try {
    booking = await createBooking(input);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UNKNOWN" };
  }

  if (getStripe()) {
    try {
      const url = await createDepositCheckout(
        { id: booking.id, reference: booking.reference, contactEmail: input.contactEmail, locale: input.locale ?? "fr" },
        await siteOrigin(),
      );
      if (url) return { ok: true, mode: "checkout", url };
    } catch (err) {
      console.error("[stripe] checkout session failed", err);
      // fall through to confirmed-without-payment
    }
  }

  // No Stripe (or it failed): confirm the request; deposit is collected in studio.
  const data = await loadBookingForEmail(booking.id);
  if (data) {
    await Promise.all([sendBookingConfirmation(data), sendOwnerBookingNotice(data)]);
  }
  return { ok: true, mode: "confirmed", reference: booking.reference };
}
