import { prisma } from "./prisma";
import { LOYALTY_TIERS } from "./brand";

export type LoyaltyState = {
  visits: number;
  nextTier: { visit: number; rewardKey: string } | null;
  unlocked: { visit: number; rewardKey: string }[];
};

export function loyaltyState(visits: number): LoyaltyState {
  const tiers = [...LOYALTY_TIERS];
  return {
    visits,
    unlocked: tiers.filter((t) => visits >= t.visit),
    nextTier: tiers.find((t) => visits < t.visit) ?? null,
  };
}

/**
 * Credit one Couca Club visit for a booking that just became COMPLETED.
 * Idempotent via Booking.loyaltyCounted. Records a LoyaltyEvent for each
 * threshold newly reached.
 */
export async function creditBookingVisit(bookingId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.loyaltyCounted || booking.status !== "COMPLETED") return;

    let customerId = booking.customerId;
    if (!customerId) {
      const customer = await tx.customer.upsert({
        where: { email: booking.contactEmail },
        create: { email: booking.contactEmail, name: booking.contactName, locale: booking.locale },
        update: {},
      });
      customerId = customer.id;
      await tx.booking.update({ where: { id: bookingId }, data: { customerId } });
    }

    const customer = await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyVisits: { increment: 1 } },
    });
    await tx.booking.update({ where: { id: bookingId }, data: { loyaltyCounted: true } });

    for (const tier of LOYALTY_TIERS) {
      if (customer.loyaltyVisits === tier.visit) {
        await tx.loyaltyEvent.create({
          data: { customerId, visitNumber: tier.visit, rewardKey: tier.rewardKey },
        });
      }
    }
  });
}

/** If a booking is un-completed, roll the visit back (keeps counts honest). */
export async function uncreditBookingVisit(bookingId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.loyaltyCounted || !booking.customerId) return;
    await tx.customer.update({
      where: { id: booking.customerId },
      data: { loyaltyVisits: { decrement: 1 } },
    });
    await tx.booking.update({ where: { id: bookingId }, data: { loyaltyCounted: false } });
  });
}
