import { prisma } from "@/lib/prisma";
import { ServicesEditor } from "./ServicesEditor";
import { SyncMenuButton } from "./SyncMenuButton";

export default async function AdminServices() {
  const services = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Services &amp; prix</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Le calculateur et la réservation utilisent ces valeurs.
        </p>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line-gold)] px-4 py-3.5">
        <p className="mb-2.5 text-sm text-ink-soft">
          Un nouveau service a été ajouté au site&nbsp;? Synchronisez pour le rendre
          réservable en ligne.
        </p>
        <SyncMenuButton />
      </div>
      <ServicesEditor
        services={services.map((s) => ({
          slug: s.slug,
          nameFr: s.nameFr,
          category: s.category,
          priceCents: s.priceCents,
          durationMin: s.durationMin,
          active: s.active,
        }))}
      />
    </div>
  );
}
