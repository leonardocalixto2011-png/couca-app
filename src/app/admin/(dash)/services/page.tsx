import { prisma } from "@/lib/prisma";
import { ServicesEditor } from "./ServicesEditor";

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
