import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getBookingByReference, loadBookingForEmail, markDepositPaid } from "@/lib/booking";
import { getOrderByReference, markOrderPaid } from "@/lib/shop";
import { prisma } from "@/lib/prisma";
import { remindUnpaidDeposit } from "@/lib/deposit-reminder";
import { sendBookingConfirmation, sendOwnerBookingNotice, sendOwnerOrderNotice } from "@/lib/email";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", secret);
  } catch (err) {
    console.error("[stripe] webhook signature check failed", err);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reference = session.metadata?.reference;
    const kind = session.metadata?.kind;

    if (kind === "shop" && reference) {
      const order = await getOrderByReference(reference);
      if (order && order.status === "PENDING") {
        const shipping =
          (session as unknown as { shipping_details?: unknown }).shipping_details ??
          (session as unknown as { collected_information?: unknown }).collected_information ??
          session.customer_details;
        await markOrderPaid(order.id, shipping);
        const contactEmail = session.customer_details?.email ?? order.contactEmail;
        await prisma.order.update({ where: { id: order.id }, data: { contactEmail } });
        console.info(`[shop] order ${reference} paid`);

        const items = Array.isArray(order.items)
          ? (order.items as { nameFr: string; qty: number; priceCents: number; options?: Record<string, string> }[])
          : [];
        await sendOwnerOrderNotice({
          reference: order.reference,
          contactEmail,
          items: items.map((i) => ({ name: i.nameFr, qty: i.qty, priceCents: i.priceCents, options: i.options })),
          subtotalCents: order.subtotalCents,
          shipping,
        });
      }
      return NextResponse.json({ received: true });
    }

    if (reference) {
      const existing = await getBookingByReference(reference);
      if (existing && !existing.depositPaid) {
        await markDepositPaid(existing.id);
        const data = await loadBookingForEmail(existing.id);
        if (data) {
          await Promise.all([sendBookingConfirmation(data), sendOwnerBookingNotice(data)]);
        }
      }
    }
  }

  // Abandoned deposit checkout (sessions expire after 1 h, see src/lib/deposit.ts):
  // send the "your spot is waiting" email while the booking is still fresh.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.kind === "booking" && session.metadata.bookingId) {
      await remindUnpaidDeposit(session.metadata.bookingId, "stripe-expired");
    }
  }

  return NextResponse.json({ received: true });
}
