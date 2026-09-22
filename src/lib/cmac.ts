import { CMAC_BEAUTY } from "@/lib/brand";

/**
 * Live product picks from our partner CMAC Beauty's Google Merchant feed.
 * Server-only. Never throws — returns [] when the feed is unreachable or
 * unparseable, so the partner section degrades to intro + code + link.
 * These products are sold by CMAC Beauty and never enter Couca's cart.
 */
export type CmacProduct = {
  id: string;
  title: string;
  link: string;
  image: string;
  /** Regular price (dollars). */
  price: number | null;
  /** Sale price (dollars), only when lower than `price`. */
  salePrice: number | null;
};

/** Preferred products, in display order. */
const PREFERRED = [
  // Nails, hands & feet first: made for Couca clients, between appointments.
  "set-between-appointments",
  "gel-manicure-gloves",
  "nail-care-pen",
  "set-pedi-night",
  "electric-foot-file",
  "facial-ice-roller",
];
const MAX = 6;

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<g:${name}>([\\s\\S]*?)</g:${name}>`));
  return m ? decode(m[1]) : null;
}

function parsePrice(v: string | null): number | null {
  if (!v) return null;
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function isHttps(u: string | null): u is string {
  return !!u && /^https:\/\//i.test(u);
}

export function parseCmacFeed(xml: string): CmacProduct[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: CmacProduct[] = [];
  for (const raw of items) {
    // Drop the nested shipping block: it carries its own <g:price>.
    const item = raw.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/g, "");
    const id = tag(item, "id");
    const title = tag(item, "title");
    const link = tag(item, "link");
    const image = tag(item, "image_link");
    if (!id || !title || !isHttps(link) || !isHttps(image)) continue;
    if (tag(item, "availability") === "out_of_stock") continue;
    const price = parsePrice(tag(item, "price"));
    const sale = parsePrice(tag(item, "sale_price"));
    out.push({
      id,
      // "LED Red Light Mask – Hands-free glow…" → "LED Red Light Mask"
      title: title.split(/\s+[–—-]\s+/)[0].trim(),
      link,
      image,
      price,
      salePrice: sale != null && (price == null || sale < price) ? sale : null,
    });
  }
  return out;
}

function pick(all: CmacProduct[]): CmacProduct[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const chosen = PREFERRED.map((id) => byId.get(id)).filter((p): p is CmacProduct => !!p);
  for (const p of all) {
    if (chosen.length >= MAX) break;
    if (!chosen.includes(p)) chosen.push(p);
  }
  return chosen.slice(0, MAX);
}

export async function getCmacPicks(): Promise<CmacProduct[]> {
  try {
    const res = await fetch(CMAC_BEAUTY.feed, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    return pick(parseCmacFeed(await res.text()));
  } catch {
    return [];
  }
}
