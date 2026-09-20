import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadBookingForEmail } from "@/lib/booking";
import { sendBookingReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Day-before reminders. Runs once a day (see vercel.json). Picks every active
 * booking starting 20–48 h from now that hasn't been reminded yet, so each
 * appointment gets exactly one reminder roughly a day ahead.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const due = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSentAt: null,
      startAt: { gte: new Date(now + 20 * 3600e3), lt: new Date(now + 48 * 3600e3) },
    },
    select: { id: true },
  });

  let sent = 0;
  for (const { id } of due) {
    const data = await loadBookingForEmail(id);
    if (!data) continue;
    await sendBookingReminder(data);
    await prisma.booking.update({ where: { id }, data: { reminderSentAt: new Date() } });
    sent++;
  }

  return NextResponse.json({ checked: due.length, sent });
}
