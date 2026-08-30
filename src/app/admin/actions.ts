"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/auth";
import { STUDIO_TZ } from "@/lib/policy";
import { creditBookingVisit, uncreditBookingVisit } from "@/lib/loyalty";
import type { BookingStatus } from "@prisma/client";

const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export async function setBookingStatus(id: string, status: string) {
  await requireAdmin();
  if (!STATUSES.includes(status as BookingStatus)) throw new Error("BAD_STATUS");
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: status as BookingStatus,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
      depositForfeited: status === "NO_SHOW",
    },
  });
  if (status === "COMPLETED") await creditBookingVisit(id);
  else if (updated.loyaltyCounted) await uncreditBookingVisit(id);

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/compte");
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

// ---------------------------------------------------------------------------
// Boutique
// ---------------------------------------------------------------------------

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type ProductInput = {
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  priceDollars: number;
  active: boolean;
  imagesCsv: string;
  optionsJson: string;
};

function parseProductInput(data: ProductInput) {
  const nameFr = data.nameFr.trim();
  const nameEn = data.nameEn.trim();
  if (!nameFr || !nameEn) throw new Error("NAME_REQUIRED");
  let options: unknown = [];
  const raw = data.optionsJson.trim();
  if (raw) {
    try {
      options = JSON.parse(raw);
    } catch {
      throw new Error("BAD_OPTIONS_JSON");
    }
    if (!Array.isArray(options)) throw new Error("BAD_OPTIONS_JSON");
  }
  return {
    nameFr,
    nameEn,
    descriptionFr: data.descriptionFr.trim() || null,
    descriptionEn: data.descriptionEn.trim() || null,
    priceCents: Math.max(0, Math.round(data.priceDollars * 100)),
    active: data.active,
    images: data.imagesCsv
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    options: options as object,
  };
}

export async function createProduct(data: ProductInput) {
  await requireAdmin();
  const parsed = parseProductInput(data);
  const base = slugify(parsed.nameFr) || `produit-${Date.now()}`;
  let slug = base;
  for (let n = 2; await prisma.product.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;
  const count = await prisma.product.count();
  await prisma.product.create({ data: { ...parsed, slug, sortOrder: count } });
  revalidatePath("/admin/products");
  revalidatePath("/boutique");
}

export async function updateProduct(slug: string, data: ProductInput) {
  await requireAdmin();
  const parsed = parseProductInput(data);
  await prisma.product.update({ where: { slug }, data: parsed });
  revalidatePath("/admin/products");
  revalidatePath("/boutique");
  revalidatePath(`/boutique/${slug}`);
}

export async function deleteProduct(slug: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { slug } });
  revalidatePath("/admin/products");
  revalidatePath("/boutique");
}

export async function setOrderStatus(id: string, status: string) {
  await requireAdmin();
  const allowed = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];
  if (!allowed.includes(status)) throw new Error("BAD_STATUS");
  await prisma.order.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/admin/orders");
}
