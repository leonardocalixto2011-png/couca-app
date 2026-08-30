import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("UNAUTHORIZED");
  return session;
}

export async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function dashboardData() {
  const now = new Date();
  const [upcoming, pendingCount, weekCount, services, hours, timeOff] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { startAt: "asc" },
      take: 25,
      include: { service: true },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { gte: now, lt: new Date(now.getTime() + 7 * 864e5) },
      },
    }),
    prisma.service.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.businessHours.findMany({ orderBy: { weekday: "asc" } }),
    prisma.timeOff.findMany({ where: { endAt: { gte: now } }, orderBy: { startAt: "asc" } }),
  ]);
  return { upcoming, pendingCount, weekCount, services, hours, timeOff };
}

export async function listBookings(filter: { status?: string } = {}) {
  return prisma.booking.findMany({
    where: filter.status && filter.status !== "ALL" ? { status: filter.status as never } : {},
    orderBy: { startAt: "desc" },
    take: 200,
    include: { service: true },
  });
}

export async function adminListProducts() {
  return prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function adminListOrders() {
  return prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
