/**
 * Booking policy — OWNER-CONFIRMED values. Do not change without the owner.
 * (Opening hours live in the BusinessHours table and are still PLACEHOLDER
 *  until the owner confirms them — see prisma/seed.ts.)
 */

/** Flat, non-refundable deposit, applied to the final in-studio bill. */
export const DEPOSIT_CENTS = 2000; // $20
export const DEPOSIT_REFUNDABLE = false;

/** Free reschedule/cancel with at least this much notice; deposit is kept.
 *  Inside the window, or a no-show, forfeits the deposit. */
export const CANCELLATION_NOTICE_HOURS = 48;

/** Extra chair time per nail-art add-on (French / Simple / 3D). */
export const ADDON_DURATION_MIN = 15;

/** Base gel-set durations by length key (minutes). */
export const BASE_DURATION_MIN: Record<"courte" | "moyenne" | "longue", number> = {
  courte: 45,
  moyenne: 60,
  longue: 75,
};

/** Studio timezone — Montréal / L'Assomption. */
export const STUDIO_TZ = "America/Toronto";

/** Booking-grid granularity and how far ahead people can book. */
export const SLOT_STEP_MIN = 15;
export const BOOKING_LEAD_MIN = 120; // no same-day slots inside 2h
export const BOOKING_HORIZON_DAYS = 45;
