import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDepositCheckout, siteBase } from "@/lib/deposit";

export const dynamic = "force-dynamic";

/**
 * "Payer mon dépôt" link from the deposit reminder email and the
 * back-from-Stripe screen. Opens a fresh Stripe Checkout for a booking that is
 * still waiting on its deposit; otherwise sends the client somewhere sensible.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const base = siteBase();
  const b = await prisma.booking.findUnique({
    where: { reference },
    select: { id: true, reference: true, status: true, depositPaid: true, startAt: true, contactEmail: true, locale: true },
  });

  if (!b) return NextResponse.redirect(`${base}/reserver`, 303);
  if (b.depositPaid) return NextResponse.redirect(`${base}/reserver?confirmed=${b.reference}`, 303);
  if (b.status !== "PENDING" || b.startAt.getTime() <= Date.now()) {
    return NextResponse.redirect(`${base}/reserver?expired=${b.reference}`, 303);
  }

  try {
    const url = await createDepositCheckout(b, base);
    if (url) return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("[deposit] checkout session failed", err);
  }
  return NextResponse.redirect(`${base}/reserver?cancelled=${b.reference}`, 303);
}
