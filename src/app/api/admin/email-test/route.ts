import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadBookingForEmail } from "@/lib/booking";
import { depositPayUrl } from "@/lib/deposit";
import { ownerNotifyAddresses, sendDepositReminder, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Delivery check for the studio inbox. Protected by CRON_SECRET. Never emails
 * a client.
 *   POST            → a plain test email to the studio inbox
 *   POST ?ref=REF   → the studio copy of that booking's deposit email
 * Returns Resend's answer for each send (status + message id or error).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ref = req.nextUrl.searchParams.get("ref");
  if (ref) {
    const b = await prisma.booking.findUnique({ where: { reference: ref }, select: { id: true } });
    const data = b ? await loadBookingForEmail(b.id) : null;
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    const results = await sendDepositReminder(data, depositPayUrl(data.reference, "cron"), { studioOnly: true });
    return NextResponse.json({ studio: ownerNotifyAddresses(), results });
  }

  const now = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeStyle: "short", timeZone: "America/Toronto" }).format(new Date());
  const result = await sendEmail({
    to: ownerNotifyAddresses(),
    subject: `Test Couca · réception des courriels · ${now}`,
    text: `Ceci est un test envoyé par coucabeauty.ca le ${now}. Si vous le voyez, les copies et alertes arrivent bien dans cette boîte.`,
    html: `<p style="font-family:Arial,sans-serif;font-size:15px;">Ceci est un test envoyé par <strong>coucabeauty.ca</strong> le ${now}.</p><p style="font-family:Arial,sans-serif;font-size:15px;">Si vous le voyez, les copies et alertes arrivent bien dans cette boîte. 💅🏾</p>`,
  });
  return NextResponse.json({ studio: ownerNotifyAddresses(), result });
}
