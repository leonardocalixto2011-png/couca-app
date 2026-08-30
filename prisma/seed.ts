/**
 * Seed — Couca & Co. Beauty.
 *
 * PRICING, LOYALTY tiers and service DURATIONS below are OWNER-CONFIRMED.
 * BusinessHours is still a PLACEHOLDER (Tue–Sat 10:00–18:00) — replace with the
 * owner's real opening hours before the booking engine goes live.
 */
import { PrismaClient, ServiceCategory } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICES = [
  // --- Gel sets (real prices + confirmed durations) ---
  { slug: "pose-gel-courte", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Courte", nameEn: "Gel Set — Short", priceCents: 4500, durationMin: 45 },
  { slug: "pose-gel-moyenne", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Moyenne", nameEn: "Gel Set — Medium", priceCents: 5000, durationMin: 60 },
  { slug: "pose-gel-longue", category: ServiceCategory.GEL_SET, nameFr: "Pose Gel — Longue", nameEn: "Gel Set — Long", priceCents: 5500, durationMin: 75 },
  // --- Add-ons (real prices; +15 min each; art3d priced at the mid 10–20 $ tier) ---
  { slug: "french-finish", category: ServiceCategory.ADDON, nameFr: "French Finish", nameEn: "French Finish", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-simple", category: ServiceCategory.ADDON, nameFr: "Nail Art Simple", nameEn: "Simple Nail Art", priceCents: 500, durationMin: 15 },
  { slug: "nail-art-3d", category: ServiceCategory.ADDON, nameFr: "Nail Art Complexe / 3D", nameEn: "Complex / 3D Nail Art", priceCents: 1500, durationMin: 15 },
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

  // PLACEHOLDER opening hours — Tue–Sat 10:00–18:00. AWAITING OWNER'S REAL HOURS.
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
