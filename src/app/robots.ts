import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || BRAND.domain;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/compte", "/panier", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
