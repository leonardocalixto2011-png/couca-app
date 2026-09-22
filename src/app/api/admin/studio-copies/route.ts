import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadBookingForEmail } from "@/lib/booking";
import { sendConfirmationCopyToStudio } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Backfill: email the studio inbox a copy of each existing booking's
 * confirmation. Clients are never emailed. Protected by CRON_SECRET.
 *
 *   GET  → dry run, lists the bookings that would be copied
 *   POST → sends the copies (optionally ?ids=a,b to limit)
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

async function candidates(ids: string[] | null) {
  return prisma.booking.findMany({
    where: {
      status: { not: "CANCELLED" },
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: { startAt: "asc" },
    select: { id: true, reference: true, status: true, contactName: true, contactEmail: true, startAt: true, depositPaid: true },
  });
}

function parseIds(req: NextRequest): string[] | null {
  const raw = req.nextUrl.searchParams.get("ids");
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : null;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = await candidates(parseIds(req));
  return NextResponse.json({ count: list.length, bookings: list });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = await candidates(parseIds(req));
  let sent = 0;
  for (const b of list) {
    const data = await loadBookingForEmail(b.id);
    if (!data) continue;
    await sendConfirmationCopyToStudio(data);
    sent++;
    await new Promise((r) => setTimeout(r, 600)); // stay under Resend's rate limit
  }
  return NextResponse.json({ sent, of: list.length });
}
