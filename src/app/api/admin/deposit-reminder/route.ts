import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { remindUnpaidDeposit } from "@/lib/deposit-reminder";

export const dynamic = "force-dynamic";

/**
 * Manually send the "your spot is waiting" email for ONE booking, by
 * reference (POST ?ref=...). Same once-per-booking rule as the automatic
 * triggers. Protected by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "missing ref" }, { status: 400 });

  const b = await prisma.booking.findUnique({
    where: { reference: ref },
    select: { id: true, status: true, depositPaid: true, depositReminderSentAt: true, startAt: true },
  });
  if (!b) return NextResponse.json({ error: "not found" }, { status: 404 });

  const sent = await remindUnpaidDeposit(b.id, "cron");
  return NextResponse.json({
    sent,
    status: b.status,
    depositPaid: b.depositPaid,
    alreadySentAt: b.depositReminderSentAt,
    startAt: b.startAt,
  });
}
