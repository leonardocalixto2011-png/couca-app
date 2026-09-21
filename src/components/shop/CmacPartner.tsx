"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { CMAC_BEAUTY, cmacUtm } from "@/lib/brand";
import type { CmacProduct } from "@/lib/cmac";
import { Icon } from "@/components/Icon";

function fmt(n: number, locale: "fr" | "en"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
}

/**
 * Partner block for CMAC Beauty — link-outs only. These products are sold and
 * shipped by CMAC Beauty (separate store + Stripe) and never touch Couca's cart.
 */
export function CmacPartner({ products }: { products: CmacProduct[] }) {
  const { t, locale } = useLocale();
  const shopUrl = cmacUtm(CMAC_BEAUTY.home, "referral", "boutique");

  return (
    <section
      aria-labelledby="cmac-partner-title"
      className="mt-16 rounded-[var(--radius-xl)] border border-line bg-blush p-[clamp(1.25rem,0.8rem+2vw,2.5rem)]"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">{t("cmac.eyebrow")}</span>
          <h2 id="cmac-partner-title" className="mt-3 text-[clamp(1.8rem,1.4rem+2vw,2.6rem)]">
            {t("cmac.title")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-ink-soft">{t("cmac.intro")}</p>
        </div>
        <div className="shrink-0 self-start rounded-[var(--radius-lg)] border border-dashed border-terracotta/60 bg-white px-5 py-3 text-center md:self-auto">
          <span className="block text-[0.78rem] uppercase tracking-[0.16em] text-ink-soft">
            {t("cmac.codeLabel")}
          </span>
          <b className="font-display text-[1.7rem] font-semibold tracking-[0.08em] text-terracotta">
            {CMAC_BEAUTY.code}
          </b>
        </div>
      </div>

      {products.length > 0 && (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-white"
            >
              <div className="aspect-square overflow-hidden bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote partner feed images */}
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <b className="font-display text-[1.05rem] font-semibold">{p.title}</b>
                {p.price != null && (
                  <span className="tabular-nums">
                    {p.salePrice != null ? (
                      <>
                        <span className="font-semibold text-terracotta">{fmt(p.salePrice, locale)}</span>{" "}
                        <s className="text-[0.88rem] text-ink-faint">{fmt(p.price, locale)}</s>
                      </>
                    ) : (
                      <span className="font-semibold text-terracotta">{fmt(p.price, locale)}</span>
                    )}
                  </span>
                )}
                <a
                  href={cmacUtm(p.link, "referral", "boutique")}
                  target="_blank"
                  rel="noopener"
                  className="btn btn--sm mt-3 self-start"
                >
                  {t("cmac.shop")}
                  <span className="sr-only"> {t("cmac.newTab")}</span>
                  <Icon name="arrow" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        {products.length === 0 ? (
          <a href={shopUrl} target="_blank" rel="noopener" className="btn">
            {t("cmac.shopAll")}
            <span className="sr-only"> {t("cmac.newTab")}</span>
            <Icon name="arrow" />
          </a>
        ) : (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener"
            className="text-[0.94rem] text-terracotta underline-offset-4 hover:underline"
          >
            {t("cmac.shopAll")} →
          </a>
        )}
        <small className="text-[0.8rem] text-ink-faint">{t("cmac.soldBy")}</small>
      </div>
    </section>
  );
}
