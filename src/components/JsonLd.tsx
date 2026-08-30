import { BRAND } from "@/lib/brand";

/** Renders a <script type="application/ld+json"> block. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function nailSalonLd() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || BRAND.domain;
  return {
    "@context": "https://schema.org",
    "@type": "NailSalon",
    name: BRAND.name,
    description:
      "Nail studio boutique à Montréal et L'Assomption — pose gel, French finish, nail art 3D.",
    url: base,
    email: BRAND.email,
    areaServed: ["Montréal", "L'Assomption"],
    sameAs: [BRAND.instagramProfile],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "13:00",
        closes: "18:00",
      },
    ],
  };
}

export function productLd(p: {
  slug: string;
  nameFr: string;
  descriptionFr: string | null;
  priceCents: number;
  images: string[];
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || BRAND.domain;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nameFr,
    description: (p.descriptionFr ?? "").slice(0, 400),
    image: p.images.map((i) => (i.startsWith("http") ? i : `${base}${i}`)),
    brand: { "@type": "Brand", name: BRAND.name },
    offers: {
      "@type": "Offer",
      url: `${base}/boutique/${p.slug}`,
      priceCurrency: "CAD",
      price: (p.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };
}
