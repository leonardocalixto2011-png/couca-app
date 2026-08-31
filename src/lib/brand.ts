/** Fixed brand facts — see the handoff prompt's KNOWN FACTS. Do not embellish. */
export const BRAND = {
  name: "Couca & Co. Beauty",
  shortName: "Couca & Co.",
  studioType: "Nail Studio",
  /** Service areas / zones served — no separate storefronts. */
  serviceAreas: ["Montréal", "Laval", "L'Assomption", "Repentigny", "Joliette"] as const,
  areaServed: "Montréal · Laval · L'Assomption · Repentigny · Joliette",
  instagramHandle: "@coucaandcobeauty",
  instagramProfile: "https://www.instagram.com/coucaandcobeauty/",
  instagramDM: "https://ig.me/m/coucaandcobeauty",
  email: "coucabeautyco@outlook.com",
  domain: "https://coucabeauty.ca",
  partner: { name: "CMAC Services", url: "https://cmacservices.ca/" },
} as const;

/**
 * Real service menu (dollars). Source of truth for the calculator; the seed
 * mirrors these into the database (in cents) for the booking engine.
 */
export const PRICING = {
  /** Base services shown in the calculator, in display order. */
  services: [
    { slug: "acrylique-court", key: "acryliqueCourt", price: 45 },
    { slug: "acrylique-moyen", key: "acryliqueMoyen", price: 50 },
    { slug: "acrylique-long", key: "acryliqueLong", price: 55 },
    { slug: "gelx-court", key: "gelxCourt", price: 45 },
    { slug: "gelx-moyen", key: "gelxMoyen", price: 50 },
    { slug: "gelx-long", key: "gelxLong", price: 55 },
    { slug: "builder-gel", key: "builderGel", price: 45 },
    { slug: "manucure-russe", key: "manucureRusse", price: 40 },
  ],
  addons: {
    french: 5,
    chrome: 5,
    simple: 5,
    art3d: [10, 15, 20] as const,
    strass: 5,
  },
} as const;

/** Real Couca Club loyalty tiers. */
export const LOYALTY_TIERS = [
  { visit: 3, rewardKey: "club.r3.short" },
  { visit: 5, rewardKey: "club.r5.short" },
  { visit: 10, rewardKey: "club.r10.short" },
] as const;
