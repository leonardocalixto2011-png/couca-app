"use server";

import { headers } from "next/headers";
import {
  createBooking,
  getDayAvailability,
  loadBookingForEmail,
  type CreateBookingInput,
  type Slot,
} from "@/lib/booking";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation, sendOwnerBookingNotice } from "@/lib/email";
import { DEPOSIT_CENTS } from "@/lib/policy";

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

  const stripe = getStripe();
  if (stripe) {
    try {
      const origin = await siteOrigin();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: input.contactEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "cad",
              unit_amount: DEPOSIT_CENTS,
              product_data: {
                name:
                  input.locale === "fr"
                    ? "Dépôt de réservation — Couca & Co. Beauty"
                    : "Booking deposit — Couca & Co. Beauty",
                description:
                  input.locale === "fr"
                    ? "Non remboursable · appliqué au montant final en studio"
                    : "Non-refundable · applied to your final in-studio total",
              },
            },
          },
        ],
        metadata: { kind: "booking", bookingId: booking.id, reference: booking.reference },
        payment_intent_data: {
          description: `Couca & Co. Beauty — dépôt RDV #${booking.reference.slice(-8)}`,
          metadata: { kind: "booking", reference: booking.reference },
        },
        success_url: `${origin}/reserver?confirmed=${booking.reference}`,
        cancel_url: `${origin}/reserver?cancelled=${booking.reference}`,
      });
      if (session.url) return { ok: true, mode: "checkout", url: session.url };
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
