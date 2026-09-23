import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadBookingForEmail } from "@/lib/booking";
import { sendBookingFollowUp, sendBookingReminder, sendRebookNudge, sendWaitlistOpening } from "@/lib/email";
import { listOpenDates } from "@/lib/booking";
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
 * 3. Fill nudge: ~18 days after a completed set, when the client has no
 * upcoming appointment booked.
 * 4. Waitlist: when the calendar has room again, tell everyone waiting.
 * 5. Day-after follow-up (thank you + Google review + book the next visit) for
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

  // "Time for your fill" — 18 to 25 days after a completed set, only for
  // clients with nothing booked ahead.
  const nudgeWindow = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      rebookNudgeSentAt: null,
      endAt: { gte: new Date(now - 25 * 86400e3), lt: new Date(now - 18 * 86400e3) },
    },
    select: { id: true, contactEmail: true, service: { select: { slug: true } } },
  });

  let nudges = 0;
  for (const b of nudgeWindow) {
    const upcoming = await prisma.booking.count({
      where: { contactEmail: b.contactEmail, status: { in: ["PENDING", "CONFIRMED"] }, startAt: { gt: new Date(now) } },
    });
    await prisma.booking.update({ where: { id: b.id }, data: { rebookNudgeSentAt: new Date() } });
    if (upcoming > 0) continue;
    const data = await loadBookingForEmail(b.id);
    if (!data) continue;
    await sendRebookNudge(data, b.service.slug);
    nudges++;
  }

  // Waitlist: notify as soon as the calendar has openings in the next 21 days.
  const waiting = await prisma.waitlist.findMany({
    where: { notifiedAt: null, closedAt: null },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  let waitlistNotified = 0;
  if (waiting.length > 0) {
    const openSoon = await listOpenDates({ serviceSlug: "gelx-court", addonSlugs: [], days: 21 });
    if (openSoon.length > 0) {
      for (const w of waiting) {
        const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://coucabeauty.ca"}/reserver${w.serviceSlug ? `?service=${encodeURIComponent(w.serviceSlug)}` : ""}`;
        await sendWaitlistOpening(
          { name: w.name, email: w.email, phone: w.phone, locale: w.locale === "en" ? "en" : "fr" },
          url,
        );
        await prisma.waitlist.update({ where: { id: w.id }, data: { notifiedAt: new Date() } });
        waitlistNotified++;
      }
    }
  }

  return NextResponse.json({ checked: due.length, sent, depositReminders, nudges, waitlistNotified, followUpsChecked: doneWindow.length, followUps });
}
