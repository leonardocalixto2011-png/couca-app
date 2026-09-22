import { prisma } from "./prisma";
import { loadBookingForEmail } from "./booking";
import { depositPayUrl } from "./deposit";
import { sendDepositReminder, sendOwnerBookingNotice } from "./email";

/**
 * Sends the "your spot is waiting" email for a booking that still has no
 * deposit, at most once per booking, and gives the studio a heads-up. The
 * claim on depositReminderSentAt happens first so the Stripe webhook and the
 * daily cron can never both send it.
 */
export async function remindUnpaidDeposit(bookingId: string, source: "cron" | "stripe-expired"): Promise<boolean> {
  const claimed = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "PENDING",
      depositPaid: false,
      depositReminderSentAt: null,
      startAt: { gt: new Date(Date.now() + 60 * 60e3) },
    },
    data: { depositReminderSentAt: new Date() },
  });
  if (claimed.count === 0) return false;

  const data = await loadBookingForEmail(bookingId);
  if (!data) return false;
  await Promise.all([
    sendDepositReminder(data, depositPayUrl(data.reference, source)),
    sendOwnerBookingNotice(data),
  ]);
  return true;
}
