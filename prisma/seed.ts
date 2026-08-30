/**
 * Seed — Couca & Co. Beauty.
 *
 * PRICING and LOYALTY tiers below are REAL (from the handoff prompt's KNOWN FACTS).
 * durationMin and BusinessHours are PLACEHOLDERS — they must be replaced with
 * owner-confirmed values before the booking engine goes live (Phase 2).
 */
import { PrismaClient, ServiceCategory } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICES = [
  // --- Gel sets (real prices) ---
  { slug: "pose-gel-courte", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Courte", nameEn: "Gel Set — Short", priceCents: 4500, durationMin: 75 },
  { slug: "pose-gel-moyenne", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Moyenne", nameEn: "Gel Set — Medium", priceCents: 5000, durationMin: 90 },
  { slug: "pose-gel-longue", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Longue", nameEn: "Gel Set — Long", priceCents: 5500, durationMin: 105 },
  // --- Add-ons (real prices; art3d priced at the mid tier, 10–20 $ range in UI) ---
  { slug: "french-finish", category: ServiceCategory.ADDON, nameFr: "French Finish", nameEn: "French Finish", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-simple", category: ServiceCategory.ADDON, nameFr: "Nail Art Simple", nameEn: "Simple Nail Art", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-3d", category: ServiceCategory.ADDON, nameFr: "Nail Art Complexe / 3D", nameEn: "Complex / 3D Nail Art", priceCents: 1500, durationMin: 30 },
] as const;

// Real Couca Club tiers.
const LOYALTY = [
  { visit: 3, rewardKey: "club.r3.short" },
  { visit: 5, rewardKey: "club.r5.short" },
  { visit: 10, rewardKey: "club.r10.short" },
];

async function main() {
  for (let i = 0; i < SERVICES.length; i++) {
    const s = SERVICES[i];
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { ...s, sortOrder: i },
      create: { ...s, sortOrder: i },
    });
  }

  // PLACEHOLDER opening hours — Tue–Sat 10:00–18:00. CONFIRM WITH OWNER.
  const openDays = [2, 3, 4, 5, 6];
  for (let weekday = 0; weekday < 7; weekday++) {
    await prisma.businessHours.upsert({
      where: { weekday },
      update: { isOpen: openDays.includes(weekday) },
      create: { weekday, isOpen: openDays.includes(weekday), openMin: 600, closeMin: 1080 },
    });
  }

  console.log(`Seeded ${SERVICES.length} services + placeholder hours.`);
  console.log("Loyalty tiers (reference, enforced in app logic):", LOYALTY);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
