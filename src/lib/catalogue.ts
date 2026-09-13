/**
 * Service menu — the single source of truth.
 *
 * PRICES, DURATIONS and the menu itself are OWNER-CONFIRMED. Both the seed
 * script (`prisma/seed.ts`) and the admin "sync" action write this exact list
 * into the database, so the two can never drift.
 *
 * Keep this file free of Next-only imports: `prisma/seed.ts` loads it through
 * plain tsx, outside the Next module graph.
 */
import { ServiceCategory, type PrismaClient } from "@prisma/client";

export const SERVICE_CATALOGUE = [
  // --- Base services (category GEL_SET = "pose de base" in the booking engine) ---
  { slug: "acrylique-court", category: ServiceCategory.GEL_SET, nameFr: "Acrylique — court", nameEn: "Acrylic — short", priceCents: 4500, durationMin: 45 },
  { slug: "acrylique-moyen", category: ServiceCategory.GEL_SET, nameFr: "Acrylique — moyen", nameEn: "Acrylic — medium", priceCents: 5000, durationMin: 60 },
  { slug: "acrylique-long", category: ServiceCategory.GEL_SET, nameFr: "Acrylique — long", nameEn: "Acrylic — long", priceCents: 5500, durationMin: 75 },
  { slug: "gelx-court", category: ServiceCategory.GEL_SET, nameFr: "Gel-X — court", nameEn: "Gel-X — short", priceCents: 4500, durationMin: 45 },
  { slug: "gelx-moyen", category: ServiceCategory.GEL_SET, nameFr: "Gel-X — moyen", nameEn: "Gel-X — medium", priceCents: 5000, durationMin: 60 },
  { slug: "gelx-long", category: ServiceCategory.GEL_SET, nameFr: "Gel-X — long", nameEn: "Gel-X — long", priceCents: 5500, durationMin: 75 },
  { slug: "builder-gel", category: ServiceCategory.GEL_SET, nameFr: "Builder Gel / Bio Gel", nameEn: "Builder Gel / Bio Gel", priceCents: 4500, durationMin: 60 },
  { slug: "manucure-russe", category: ServiceCategory.GEL_SET, nameFr: "Manucure russe", nameEn: "Russian manicure", priceCents: 4000, durationMin: 45 },
  { slug: "service-homme", category: ServiceCategory.GEL_SET, nameFr: "Service Homme", nameEn: "Men's service", priceCents: 3500, durationMin: 30 },
  { slug: "remplissage", category: ServiceCategory.GEL_SET, nameFr: "Remplissage", nameEn: "Fill / Refill", priceCents: 4000, durationMin: 45 },
  // --- Extras (add-ons; +15 min each; art3d priced at the mid 10–20 $ tier) ---
  { slug: "french-finish", category: ServiceCategory.ADDON, nameFr: "French", nameEn: "French", priceCents: 500, durationMin: 15 },
  { slug: "chrome", category: ServiceCategory.ADDON, nameFr: "Chrome", nameEn: "Chrome", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-simple", category: ServiceCategory.ADDON, nameFr: "Nail art simple", nameEn: "Simple nail art", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-3d", category: ServiceCategory.ADDON, nameFr: "Nail art complexe / 3D", nameEn: "Complex / 3D nail art", priceCents: 1500, durationMin: 15 },
  { slug: "strass-charms", category: ServiceCategory.ADDON, nameFr: "Strass / charms", nameEn: "Rhinestones / charms", priceCents: 500, durationMin: 15 },
] as const;

export type SyncResult = { added: number; updated: number; retired: number };

/**
 * Write the catalogue into the database: add what's missing, refresh names and
 * category on what exists, and deactivate anything no longer on the menu.
 *
 * Prices and durations are only set when a service is first created — the owner
 * edits those in /admin/services afterwards, and a sync must not overwrite them.
 */
export async function syncServiceCatalogue(db: PrismaClient): Promise<SyncResult> {
  const existing = await db.service.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map((s) => s.slug));

  let added = 0;
  let updated = 0;
  for (let i = 0; i < SERVICE_CATALOGUE.length; i++) {
    const s = SERVICE_CATALOGUE[i];
    if (existingSlugs.has(s.slug)) {
      await db.service.update({
        where: { slug: s.slug },
        data: { category: s.category, nameFr: s.nameFr, nameEn: s.nameEn, sortOrder: i, active: true },
      });
      updated++;
    } else {
      await db.service.create({ data: { ...s, sortOrder: i } });
      added++;
    }
  }

  const keepSlugs = SERVICE_CATALOGUE.map((s) => s.slug);
  const retired = await db.service.updateMany({
    where: { slug: { notIn: keepSlugs }, active: true },
    data: { active: false },
  });

  return { added, updated, retired: retired.count };
}
