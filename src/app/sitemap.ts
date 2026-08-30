import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { listProducts } from "@/lib/shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || BRAND.domain;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/reserver`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/boutique`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  let products: MetadataRoute.Sitemap = [];
  try {
    const rows = await listProducts();
    products = rows.map((p) => ({
      url: `${base}/boutique/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    /* DB unavailable at build — ship the static routes */
  }

  return [...staticRoutes, ...products];
}
