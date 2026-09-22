import { getStripe } from "./stripe";
import { BRAND } from "./brand";
import { DEPOSIT_CENTS } from "./policy";

/**
 * Stripe Checkout for a booking's $20 deposit. Sessions expire after one hour,
 * so an abandoned checkout fires `checkout.session.expired` quickly and the
 * client gets the "your spot is waiting" email while the booking is still fresh.
 */
const SESSION_TTL_SEC = 60 * 60;

export type DepositBooking = {
  id: string;
  reference: string;
  contactEmail: string;
  locale: string;
};

export function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || BRAND.domain;
}

/** Public link that opens a fresh deposit checkout for this booking. */
export function depositPayUrl(reference: string, source?: string): string {
  const q = source ? `?utm_source=${encodeURIComponent(source)}&utm_medium=email&utm_campaign=deposit` : "";
  return `${siteBase()}/reserver/payer/${encodeURIComponent(reference)}${q}`;
}

export async function createDepositCheckout(b: DepositBooking, origin = siteBase()): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const fr = b.locale !== "en";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: b.contactEmail,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: DEPOSIT_CENTS,
          product_data: {
            name: fr ? "Dépôt de réservation — Couca & Co. Beauty" : "Booking deposit — Couca & Co. Beauty",
            description: fr
              ? "Non remboursable · appliqué au montant final en studio"
              : "Non-refundable · applied to your final in-studio total",
          },
        },
      },
    ],
    metadata: { kind: "booking", bookingId: b.id, reference: b.reference },
    payment_intent_data: {
      description: `Couca & Co. Beauty — dépôt RDV #${b.reference.slice(-8)}`,
      metadata: { kind: "booking", reference: b.reference },
    },
    success_url: `${origin}/reserver?confirmed=${b.reference}`,
    cancel_url: `${origin}/reserver?cancelled=${b.reference}`,
  });
  return session.url ?? null;
}

/** True while a booking can still be secured by paying its deposit. */
export function isAwaitingDeposit(b: { status: string; depositPaid: boolean; startAt: Date }): boolean {
  return b.status === "PENDING" && !b.depositPaid && b.startAt.getTime() > Date.now();
}
