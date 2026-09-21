/** Fixed brand facts — see the handoff prompt's KNOWN FACTS. Do not embellish. */
export const BRAND = {
  name: "Couca & Co. Beauty",
  shortName: "Couca & Co.",
  studioType: "Nail Studio",
  /** Cities clients come from — used for SEO reach (JSON-LD areaServed) only. */
  serviceAreas: ["Montréal", "Laval", "L'Assomption", "Repentigny", "Joliette"] as const,
  /** Short public location line (nav drawer, Instagram bridge). */
  areaServed: "L'Assomption · Rive-Nord de Montréal",
  /**
   * Studio address. Deliberately NOT rendered on any public page, in JSON-LD,
   * or in the OG image — the owner does not want it indexed by Google Maps.
   * It is shared only with clients who have a confirmed booking (confirmation
   * page + emails).
   */
  studioAddress: {
    street: "209 rue Paré",
    city: "L'Assomption",
    province: "QC",
    postal: "J5W 0K5",
    line: "209 rue Paré, L'Assomption (Québec) J5W 0K5",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=209+rue+Par%C3%A9%2C+L%27Assomption%2C+QC+J5W+0K5",
  },
  instagramHandle: "@coucaandcobeauty",
  instagramProfile: "https://www.instagram.com/coucaandcobeauty/",
  instagramDM: "https://ig.me/m/coucaandcobeauty",
  email: "coucabeautyco@outlook.com",
  domain: "https://coucabeauty.ca",
  /** Footer partners. `descKey` is an optional i18n key for a short descriptor. */
  partners: [
    { name: "CMAC Services", url: "https://cmacservices.ca/", descKey: null },
    {
      name: "CMAC Beauty",
      url: "https://cmacbeauty.ca/?utm_source=coucabeauty&utm_medium=referral&utm_campaign=partner",
      descKey: "footer.partner.cmacBeauty",
    },
  ],
} as const;

/**
 * CMAC Beauty — partner store (separate business, separate Stripe account).
 * Its products are NEVER added to Couca's cart/checkout; we only link out.
 */
export const CMAC_BEAUTY = {
  name: "CMAC Beauty",
  home: "https://cmacbeauty.ca/",
  feed: "https://cmacbeauty.ca/feeds/google.xml",
  code: "COUCA10",
} as const;

/** Appends Couca's UTM params to a cmacbeauty.ca URL. */
export function cmacUtm(url: string, medium = "referral", campaign = "partner"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "coucabeauty");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return CMAC_BEAUTY.home;
  }
}

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
    { slug: "service-homme", key: "serviceHomme", price: 35 },
    { slug: "remplissage", key: "remplissage", price: 40 },
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
