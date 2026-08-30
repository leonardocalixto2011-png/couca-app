import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getBookingByReference, markDepositPaid } from "@/lib/booking";
import { getOrderByReference, markOrderPaid } from "@/lib/shop";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation } from "@/lib/email";
import type { Locale } from "@/i18n/messages";

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
        await prisma.order.update({
          where: { id: order.id },
          data: { contactEmail: session.customer_details?.email ?? order.contactEmail },
        });
        console.info(`[shop] order ${reference} paid`);
      }
      return NextResponse.json({ received: true });
    }

    if (reference) {
      const existing = await getBookingByReference(reference);
      if (existing && !existing.depositPaid) {
        const updated = await markDepositPaid(existing.id);
        const locale = (updated.locale as Locale) ?? "fr";
        await sendBookingConfirmation({
          to: updated.contactEmail,
          reference: updated.reference,
          locale,
          serviceName: locale === "fr" ? updated.service.nameFr : updated.service.nameEn,
          addonNames: Array.isArray(updated.addonSlugs) ? (updated.addonSlugs as string[]) : [],
          startAt: updated.startAt,
          estimatedTotalCents: updated.estimatedTotalCents,
          depositCents: updated.depositCents,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
