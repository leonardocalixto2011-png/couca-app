/** Fixed brand facts — see the handoff prompt's KNOWN FACTS. Do not embellish. */
export const BRAND = {
  name: "Couca & Co. Beauty",
  shortName: "Couca & Co.",
  studioType: "Nail Studio",
  areaServed: "Montréal / L'Assomption",
  instagramHandle: "@coucaandcobeauty",
  instagramProfile: "https://www.instagram.com/coucaandcobeauty/",
  instagramDM: "https://ig.me/m/coucaandcobeauty",
  email: "coucabeautyco@outlook.com",
  domain: "https://coucabeauty.ca",
} as const;

/** Real launch pricing (dollars). Source of truth for the calculator + seed. */
export const PRICING = {
  lengths: [
    { key: "courte", price: 45 },
    { key: "moyenne", price: 50 },
    { key: "longue", price: 55 },
  ],
  addons: {
    french: 5,
    simple: 5,
    art3d: [10, 15, 20] as const,
  },
} as const;

/** Real Couca Club loyalty tiers. */
export const LOYALTY_TIERS = [
  { visit: 3, rewardKey: "club.r3.short" },
  { visit: 5, rewardKey: "club.r5.short" },
  { visit: 10, rewardKey: "club.r10.short" },
] as const;
