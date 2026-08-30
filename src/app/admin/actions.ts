"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/auth";
import { STUDIO_TZ } from "@/lib/policy";
import type { BookingStatus } from "@prisma/client";

const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export async function setBookingStatus(id: string, status: string) {
  await requireAdmin();
  if (!STATUSES.includes(status as BookingStatus)) throw new Error("BAD_STATUS");
  await prisma.booking.update({
    where: { id },
    data: {
      status: status as BookingStatus,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
      depositForfeited: status === "NO_SHOW",
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function updateService(
  slug: string,
  data: { priceCents: number; durationMin: number; active: boolean },
) {
  await requireAdmin();
  await prisma.service.update({
    where: { slug },
    data: {
      priceCents: Math.max(0, Math.round(data.priceCents)),
      durationMin: Math.max(5, Math.round(data.durationMin)),
      active: data.active,
    },
  });
  revalidatePath("/admin/services");
}

export async function updateHours(
  weekday: number,
  data: { isOpen: boolean; openMin: number; closeMin: number },
) {
  await requireAdmin();
  const openMin = Math.min(1439, Math.max(0, Math.round(data.openMin)));
  const closeMin = Math.min(1440, Math.max(openMin + 15, Math.round(data.closeMin)));
  await prisma.businessHours.upsert({
    where: { weekday },
    update: { isOpen: data.isOpen, openMin, closeMin },
    create: { weekday, isOpen: data.isOpen, openMin, closeMin },
  });
  revalidatePath("/admin/hours");
}

export async function addTimeOff(data: { startAt: string; endAt: string; reason?: string }) {
  await requireAdmin();
  // datetime-local values are wall-clock — interpret them in the studio timezone
  const startAt = fromZonedTime(data.startAt, STUDIO_TZ);
  const endAt = fromZonedTime(data.endAt, STUDIO_TZ);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new Error("BAD_RANGE");
  }
  await prisma.timeOff.create({ data: { startAt, endAt, reason: data.reason?.trim() || null } });
  revalidatePath("/admin/time-off");
  revalidatePath("/admin");
}

export async function deleteTimeOff(id: string) {
  await requireAdmin();
  await prisma.timeOff.delete({ where: { id } });
  revalidatePath("/admin/time-off");
  revalidatePath("/admin");
}

export async function adminSignOut() {
  await signOut({ redirectTo: "/admin/login" });
}
