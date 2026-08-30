import { prisma } from "@/lib/prisma";
import { HoursEditor } from "./HoursEditor";

export default async function AdminHours() {
  const rows = await prisma.businessHours.findMany({ orderBy: { weekday: "asc" } });
  const byDay = new Map(rows.map((r) => [r.weekday, r]));
  const hours = Array.from({ length: 7 }, (_, w) => {
    const r = byDay.get(w);
    return {
      weekday: w,
      isOpen: r?.isOpen ?? false,
      openMin: r?.openMin ?? 780,
      closeMin: r?.closeMin ?? 1080,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Horaires d&rsquo;ouverture</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ces heures pilotent les plages proposées à la réservation.
        </p>
      </div>
      <HoursEditor hours={hours} />
    </div>
  );
}
