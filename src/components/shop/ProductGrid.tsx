"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMoneyFromCents } from "@/lib/utils";
import { ProductArt } from "./ProductArt";
import type { ProductView } from "@/lib/shop";

export function ProductGrid({ products }: { products: ProductView[] }) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="eyebrow">Couca &amp; Co. Beauty</span>
        <h1 className="mt-3 text-[clamp(2.2rem,1.6rem+3vw,3.4rem)]">{t("shop.title")}</h1>
        <p className="mt-2 max-w-[46ch] text-ink-soft">{t("shop.intro")}</p>
      </div>

      {products.length === 0 ? (
        <p className="text-ink-faint">—</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const name = locale === "fr" ? p.nameFr : p.nameEn;
            return (
              <Link
                key={p.slug}
                href={`/boutique/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft-md)]"
              >
                <ProductArt images={p.images} name={name} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <b className="font-display text-[1.05rem] font-semibold">{name}</b>
                  <span className="mt-auto font-semibold tabular-nums text-terracotta">
                    {formatMoneyFromCents(p.priceCents, locale)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
