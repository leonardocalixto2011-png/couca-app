import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadBookingForEmail } from "@/lib/booking";
import { sendBookingFollowUp, sendBookingReminder } from "@/lib/email";
import { remindUnpaidDeposit } from "@/lib/deposit-reminder";
import { ensureReferralCode, referralShareUrl } from "@/lib/referral";

export const dynamic = "force-dynamic";

/**
 * Daily client emails (see vercel.json — Hobby allows one run a day, so both
 * jobs share this route).
 *
 * 1. Day-before reminders. Runs once a day (see vercel.json). Picks every active
 * booking starting 20–48 h from now that hasn't been reminded yet, so each
 * appointment gets exactly one reminder roughly a day ahead.
 * 2. Deposit rescue: bookings still waiting on their deposit get one
 * "your spot is waiting" email (safety net for the Stripe expiry webhook).
 * 3. Day-after follow-up (thank you + Google review + book the next visit) for
 * appointments that ended 2–40 h ago. The short look-back window means a deploy
 * never mass-emails old clients.
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

  const unpaid = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      depositPaid: false,
      depositReminderSentAt: null,
      createdAt: { lt: new Date(now - 45 * 60e3) },
      startAt: { gt: new Date(now + 2 * 3600e3) },
    },
    select: { id: true },
  });
  let depositReminders = 0;
  for (const { id } of unpaid) if (await remindUnpaidDeposit(id, "cron")) depositReminders++;

  const doneWindow = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      followUpSentAt: null,
      endAt: { gte: new Date(now - 40 * 3600e3), lt: new Date(now - 2 * 3600e3) },
    },
    select: { id: true, customerId: true, service: { select: { slug: true } } },
  });

  let followUps = 0;
  for (const b of doneWindow) {
    const data = await loadBookingForEmail(b.id);
    if (!data) continue;
    const code = b.customerId ? await ensureReferralCode(b.customerId) : null;
    await sendBookingFollowUp(data, b.service.slug, code ? { code, url: referralShareUrl(code) } : null);
    await prisma.booking.update({ where: { id: b.id }, data: { followUpSentAt: new Date() } });
    followUps++;
  }

  return NextResponse.json({ checked: due.length, sent, depositReminders, followUpsChecked: doneWindow.length, followUps });
}
