import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDayAvailability } from "@/lib/booking";

export const dynamic = "force-dynamic";

/**
 * Read-only health view of the booking calendar: opening hours, time off and
 * how many slots the next few days actually offer. Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("service") ?? "acrylique-court";
  const [hours, timeOff, services] = await Promise.all([
    prisma.businessHours.findMany({ orderBy: { weekday: "asc" } }),
    prisma.timeOff.findMany({ where: { endAt: { gte: new Date() } }, orderBy: { startAt: "asc" }, take: 20 }),
    prisma.service.findMany({ select: { slug: true, active: true, durationMin: true, priceCents: true } }),
  ]);

  const days: Record<string, unknown> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 86400e3);
    const dateISO = d.toISOString().slice(0, 10);
    try {
      const r = await getDayAvailability({ serviceSlug: slug, addonSlugs: [], dateISO });
      days[dateISO] = { closed: r.closed, durationMin: r.durationMin, slots: r.slots.length, first: r.slots[0]?.label ?? null };
    } catch (err) {
      days[dateISO] = { error: String(err) };
    }
  }

  return NextResponse.json({ service: slug, hours, timeOff, services, days });
}
