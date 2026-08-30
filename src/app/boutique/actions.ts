"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { validateCart, type CartLineInput } from "@/lib/shop";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function checkout(
  lines: CartLineInput[],
  locale: "fr" | "en",
): Promise<CheckoutResult> {
  let validated;
  try {
    validated = await validateCart(lines);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "INVALID_CART" };
  }

  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "PAYMENT_UNAVAILABLE" };

  const order = await prisma.order.create({
    data: {
      status: "PENDING",
      contactEmail: "",
      items: validated.lines.map((l) => ({
        productId: l.productId,
        slug: l.slug,
        nameFr: l.nameFr,
        nameEn: l.nameEn,
        priceCents: l.priceCents,
        qty: l.qty,
        options: locale === "fr" ? l.options : l.optionsEn,
      })),
      subtotalCents: validated.subtotalCents,
      locale,
    },
  });

  try {
    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["CA"] },
      phone_number_collection: { enabled: true },
      line_items: validated.lines.map((l) => {
        const optStr = Object.values(locale === "fr" ? l.options : l.optionsEn).join(" · ");
        return {
          quantity: l.qty,
          price_data: {
            currency: "cad",
            unit_amount: l.priceCents,
            product_data: {
              name: locale === "fr" ? l.nameFr : l.nameEn,
              description: optStr || undefined,
            },
          },
        };
      }),
      metadata: { kind: "shop", orderId: order.id, reference: order.reference },
      payment_intent_data: {
        description: `Couca & Co. Beauty — boutique #${order.reference.slice(-8)}`,
        metadata: { kind: "shop", reference: order.reference },
      },
      success_url: `${origin}/boutique/merci?order=${order.reference}`,
      cancel_url: `${origin}/panier`,
    });
    if (!session.url) throw new Error("NO_SESSION_URL");
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[shop] checkout failed", err);
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { ok: false, error: "CHECKOUT_FAILED" };
  }
}
