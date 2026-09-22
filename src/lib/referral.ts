import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { siteBase } from "./deposit";

/**
 * Couca referral program ("parrainage").
 * - Every client gets a personal code (e.g. LISE7K) and a share link.
 * - A new client who books with a code gets REFERRAL_CENTS off her FIRST visit
 *   (taken off the in-studio total; the $20 deposit is unchanged).
 * - When that visit is marked COMPLETED, the referrer earns the same amount as
 *   credit on her next visit (shown to the owner; used from /admin/customers).
 */
export const REFERRAL_CENTS = 1000;

type Db = PrismaClient | Prisma.TransactionClient;

const SUFFIX_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeReferralCode(raw?: string | null): string | null {
  const c = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length >= 4 && c.length <= 12 ? c : null;
}

export function referralShareUrl(code: string): string {
  return `${siteBase()}/reserver?parrain=${encodeURIComponent(code)}`;
}

function prefixFromName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  const letters = first
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (letters || "COUCA").slice(0, 6);
}

function randomSuffix(n = 3): string {
  let s = "";
  for (let i = 0; i < n; i++) s += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  return s;
}

/** Returns the customer's code, creating a unique one the first time. */
export async function ensureReferralCode(customerId: string, db: Db = prisma): Promise<string | null> {
  const c = await db.customer.findUnique({ where: { id: customerId }, select: { referralCode: true, name: true } });
  if (!c) return null;
  if (c.referralCode) return c.referralCode;
  const prefix = prefixFromName(c.name);
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = prefix + randomSuffix(attempt < 3 ? 3 : 4);
    try {
      const res = await db.customer.updateMany({ where: { id: customerId, referralCode: null }, data: { referralCode: code } });
      if (res.count === 1) return code;
      const now = await db.customer.findUnique({ where: { id: customerId }, select: { referralCode: true } });
      if (now?.referralCode) return now.referralCode;
    } catch {
      const again = await db.customer.findUnique({ where: { id: customerId }, select: { referralCode: true } });
      if (again?.referralCode) return again.referralCode;
      // unique clash on the code: try another suffix
    }
  }
  return null;
}

/**
 * Validates a code for a new booking. Valid when it belongs to someone else
 * and the booking email has no earlier (non-cancelled) booking.
 */
export async function checkReferralForBooking(code: string, email: string, db: Db): Promise<boolean> {
  const referrer = await db.customer.findUnique({ where: { referralCode: code }, select: { email: true } });
  if (!referrer || referrer.email.toLowerCase() === email.toLowerCase()) return false;
  const prior = await db.booking.count({ where: { contactEmail: email, status: { not: "CANCELLED" } } });
  return prior === 0;
}

/** Credits the referrer once the referred visit is completed. Idempotent. */
export async function rewardReferrerForBooking(bookingId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.booking.updateMany({
      where: { id: bookingId, status: "COMPLETED", referralCode: { not: null }, referralRewardedAt: null },
      data: { referralRewardedAt: new Date() },
    });
    if (claimed.count === 0) return false;
    const b = await tx.booking.findUnique({ where: { id: bookingId }, select: { referralCode: true } });
    if (!b?.referralCode) return false;
    const res = await tx.customer.updateMany({
      where: { referralCode: b.referralCode },
      data: { referralCreditCents: { increment: REFERRAL_CENTS } },
    });
    return res.count > 0;
  });
}
