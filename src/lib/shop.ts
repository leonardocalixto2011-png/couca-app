import { prisma } from "./prisma";

export type ProductOptionValue = { value: string; labelFr: string; labelEn: string };
export type ProductOption = { nameFr: string; nameEn: string; values: ProductOptionValue[] };

export type ProductView = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  priceCents: number;
  images: string[];
  options: ProductOption[];
  active: boolean;
};

function toView(p: {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  priceCents: number;
  images: unknown;
  options: unknown;
  active: boolean;
}): ProductView {
  return {
    slug: p.slug,
    nameFr: p.nameFr,
    nameEn: p.nameEn,
    descriptionFr: p.descriptionFr,
    descriptionEn: p.descriptionEn,
    priceCents: p.priceCents,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    options: Array.isArray(p.options) ? (p.options as ProductOption[]) : [],
    active: p.active,
  };
}

export async function listProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toView);
}

export async function getProduct(slug: string): Promise<ProductView | null> {
  const p = await prisma.product.findUnique({ where: { slug } });
  return p && p.active ? toView(p) : null;
}

export type CartLineInput = { slug: string; qty: number; selected: Record<string, string> };

export type ValidatedLine = {
  productId: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  priceCents: number;
  qty: number;
  options: Record<string, string>; // nameFr -> resolved labelFr
  optionsEn: Record<string, string>;
};

/** Validate a client cart against the DB. Throws on any invalid line. */
export async function validateCart(lines: CartLineInput[]): Promise<{
  lines: ValidatedLine[];
  subtotalCents: number;
}> {
  if (!lines.length) throw new Error("EMPTY_CART");
  const slugs = [...new Set(lines.map((l) => l.slug))];
  const products = await prisma.product.findMany({ where: { slug: { in: slugs }, active: true } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const out: ValidatedLine[] = [];
  for (const line of lines) {
    const p = bySlug.get(line.slug);
    if (!p) throw new Error("PRODUCT_UNAVAILABLE");
    const qty = Math.max(1, Math.min(20, Math.round(line.qty)));
    const opts = Array.isArray(p.options) ? (p.options as ProductOption[]) : [];

    const options: Record<string, string> = {};
    const optionsEn: Record<string, string> = {};
    for (const opt of opts) {
      const chosen = line.selected?.[opt.nameFr];
      const match = opt.values.find((v) => v.value === chosen);
      if (!match) throw new Error("OPTION_REQUIRED");
      options[opt.nameFr] = match.labelFr;
      optionsEn[opt.nameEn] = match.labelEn;
    }

    out.push({
      productId: p.id,
      slug: p.slug,
      nameFr: p.nameFr,
      nameEn: p.nameEn,
      priceCents: p.priceCents,
      qty,
      options,
      optionsEn,
    });
  }

  const subtotalCents = out.reduce((s, l) => s + l.priceCents * l.qty, 0);
  return { lines: out, subtotalCents };
}

export async function getOrderByReference(reference: string) {
  return prisma.order.findUnique({ where: { reference } });
}

export async function markOrderPaid(id: string, shipping?: unknown) {
  return prisma.order.update({
    where: { id },
    data: { status: "PAID", shippingJson: (shipping as object) ?? undefined },
  });
}
