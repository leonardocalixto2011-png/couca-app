"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { useCart } from "./CartProvider";
import { ProductArt } from "./ProductArt";
import { Icon } from "@/components/Icon";
import { formatMoneyFromCents, cn } from "@/lib/utils";
import type { ProductView } from "@/lib/shop";

export function ProductDetail({ product }: { product: ProductView }) {
  const { t, locale } = useLocale();
  const cart = useCart();
  const router = useRouter();

  const name = locale === "fr" ? product.nameFr : product.nameEn;
  const description = locale === "fr" ? product.descriptionFr : product.descriptionEn;

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.nameFr, ""])),
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const missingOption = product.options.some((o) => !selected[o.nameFr]);

  function addToCart() {
    if (missingOption) return;
    const labelsFr: Record<string, string> = {};
    const labelsEn: Record<string, string> = {};
    for (const o of product.options) {
      const v = o.values.find((x) => x.value === selected[o.nameFr]);
      if (v) {
        labelsFr[o.nameFr] = v.labelFr;
        labelsEn[o.nameEn] = v.labelEn;
      }
    }
    cart.add({
      slug: product.slug,
      qty,
      selected,
      nameFr: product.nameFr,
      nameEn: product.nameEn,
      priceCents: product.priceCents,
      optionLabelsFr: labelsFr,
      optionLabelsEn: labelsEn,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <Link href="/boutique" className="mb-4 inline-block text-sm text-ink-soft hover:text-terracotta">
          {t("shop.backToShop")}
        </Link>
        <ProductArt images={product.images} name={name} className="rounded-[var(--radius-2xl)] border border-line" />
      </div>

      <div>
        <h1 className="text-[clamp(1.8rem,1.4rem+2vw,2.8rem)]">{name}</h1>
        <p className="mt-2 font-display text-2xl font-semibold text-terracotta">
          {formatMoneyFromCents(product.priceCents, locale)}
        </p>

        {product.options.map((o) => (
          <fieldset key={o.nameFr} className="mt-6">
            <legend className="mb-2 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {locale === "fr" ? o.nameFr : o.nameEn}
            </legend>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  aria-pressed={selected[o.nameFr] === v.value}
                  onClick={() => setSelected((s) => ({ ...s, [o.nameFr]: v.value }))}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[0.86rem] transition-colors",
                    selected[o.nameFr] === v.value
                      ? "border-terracotta bg-blush text-terracotta"
                      : "border-line text-ink-soft hover:border-gold-muted",
                  )}
                >
                  {locale === "fr" ? v.labelFr : v.labelEn}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 flex items-center gap-3">
          <label className="font-ui text-[0.8rem] font-semibold text-ink-soft" htmlFor="qty">
            {t("shop.qty")}
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={20}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-[70px] rounded-[var(--radius-lg)] border border-line px-2 py-1.5 text-center"
          />
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={missingOption}
          className="btn mt-6 w-full sm:w-auto"
        >
          <Icon name={added ? "check" : "spark"} />
          {added ? t("shop.added") : t("shop.addToCart")}
        </button>

        {cart.count > 0 && (
          <button
            type="button"
            onClick={() => router.push("/panier")}
            className="btn btn--ghost btn--sm ml-0 mt-3 block sm:ml-3 sm:mt-6 sm:inline-flex"
          >
            {t("shop.cartTitle")} ({cart.count})
          </button>
        )}

        {description && (
          <div className="mt-8 whitespace-pre-line border-t border-line pt-6 text-[0.94rem] text-ink-soft">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
