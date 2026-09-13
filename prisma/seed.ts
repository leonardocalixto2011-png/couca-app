/**
 * Seed — Couca & Co. Beauty.
 *
 * PRICING, LOYALTY tiers, service DURATIONS and OPENING HOURS below are
 * OWNER-CONFIRMED. Hours: 7 days a week, 13:00–18:00.
 */
import { PrismaClient, ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SERVICES = [
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

// Real Couca Club tiers.
const LOYALTY = [
  { visit: 3, rewardKey: "club.r3.short" },
  { visit: 5, rewardKey: "club.r5.short" },
  { visit: 10, rewardKey: "club.r10.short" },
];

const KREM_FLAVOURS = [
  { value: "coco", labelFr: "Coco classique", labelEn: "Classic Coconut" },
  { value: "ananas", labelFr: "Ananas", labelEn: "Pineapple" },
  { value: "mangue", labelFr: "Mangue", labelEn: "Mango" },
  { value: "cafe", labelFr: "Café", labelEn: "Coffee" },
  { value: "chocolat", labelFr: "Chocolat", labelEn: "Chocolate" },
  { value: "amande", labelFr: "Amande", labelEn: "Almond" },
  { value: "epice", labelFr: "Épicé traditionnel", labelEn: "Traditional Spiced" },
];

const KREM_FR = `Vous apportez la bouteille. On apporte la Krèm. 🇭🇹✨

Préparez votre Krèm haïtienne maison avec notre prémélange prêt-à-mélanger de 750 mL. La base crémeuse et savoureuse est déjà faite, les ingrédients et les épices sont dosés avec soin. Il ne vous reste qu'à ajouter votre alcool préféré, mélanger, réfrigérer et déguster.

Choisissez votre saveur. Choisissez votre spiritueux. Faites-en la vôtre.

Inclus : 1 × prémélange Krèm 750 mL · instructions de préparation complètes · la saveur de votre choix.

Comment ça marche : 1) Choisissez votre saveur. 2) Ajoutez votre alcool préféré selon la quantité recommandée dans les instructions. 3) Mélangez soigneusement et réfrigérez tel qu'indiqué. 4) Versez et savourez. 🇭🇹

Pour les Fêtes, un souper de famille, une soirée entre filles, ou simplement une envie de tradition haïtienne — vous avez la base, vous en faites la vôtre.

750 mL · Prémélange Krèm haïtienne à faire soi-même · Alcool non inclus.`;

const KREM_EN = `You bring the bottle. We bring the Krèm. 🇭🇹✨

Make your own Haitian Krèm at home with our ready-to-mix 750 mL premix. We've prepared the creamy, flavorful base and carefully balanced the ingredients and spices. All you need to do is add your favorite alcohol, mix, chill, and enjoy.

Choose your flavor. Choose your spirit. Make it yours.

Included: 1 × 750 mL Krèm premix · complete preparation instructions · flavor of your choice.

How it works: 1) Choose your flavor. 2) Add your favorite alcohol using the recommended amount in the instructions. 3) Mix thoroughly and refrigerate as directed. 4) Pour and enjoy. 🇭🇹

Holiday celebration, family gathering, girls' night, or just a craving for Haitian tradition — you've got the base, you make it yours.

750 mL · DIY Haitian Krèm Premix · Alcohol not included.`;

const PRODUCTS = [
  {
    slug: "krem-premix-750",
    nameFr: "Prémélange Krèm haïtienne — 750 mL",
    nameEn: "Haitian Krèm Premix — 750 mL",
    descriptionFr: KREM_FR,
    descriptionEn: KREM_EN,
    priceCents: 3000,
    options: [{ nameFr: "Saveur", nameEn: "Flavour", values: KREM_FLAVOURS }],
    stock: null,
    active: true,
  },
];

async function main() {
  for (let i = 0; i < SERVICES.length; i++) {
    const s = SERVICES[i];
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { ...s, sortOrder: i, active: true },
      create: { ...s, sortOrder: i },
    });
  }
  // Retire any service that is no longer in the menu (e.g. the old "pose-gel-*").
  const keepSlugs = SERVICES.map((s) => s.slug);
  await prisma.service.updateMany({
    where: { slug: { notIn: keepSlugs } },
    data: { active: false },
  });

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p, options: p.options as object, sortOrder: i },
      create: { ...p, options: p.options as object, sortOrder: i },
    });
  }

  // Opening hours: open 7 days a week, 13:00–18:00 (owner-confirmed).
  const OPEN_MIN = 13 * 60; // 13:00
  const CLOSE_MIN = 18 * 60; // 18:00
  const openDays = [0, 1, 2, 3, 4, 5, 6]; // Sun … Sat — all days
  for (let weekday = 0; weekday < 7; weekday++) {
    const isOpen = openDays.includes(weekday);
    await prisma.businessHours.upsert({
      where: { weekday },
      update: { isOpen, openMin: OPEN_MIN, closeMin: CLOSE_MIN },
      create: { weekday, isOpen, openMin: OPEN_MIN, closeMin: CLOSE_MIN },
    });
  }

  // Admin user — from ADMIN_EMAIL / ADMIN_PASSWORD env vars (skipped if unset).
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", passwordHash },
      create: { email: adminEmail, name: "Couca & Co. Admin", role: "ADMIN", passwordHash },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.log("No ADMIN_EMAIL / ADMIN_PASSWORD set — skipped admin user.");
  }

  const bases = SERVICES.filter((s) => s.category === ServiceCategory.GEL_SET).length;
  const extras = SERVICES.length - bases;
  console.log(`Seeded ${bases} base services + ${extras} extras, ${PRODUCTS.length} product(s), hours 7d 13:00–18:00.`);
  console.log("Loyalty tiers (reference, enforced in app logic):", LOYALTY);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
