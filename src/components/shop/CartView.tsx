"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { useCart } from "./CartProvider";
import { checkout } from "@/app/boutique/actions";
import { Icon } from "@/components/Icon";
import { formatMoneyFromCents } from "@/lib/utils";

export function CartView() {
  const { t, locale } = useLocale();
  const cart = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    start(async () => {
      const res = await checkout(
        cart.items.map((i) => ({ slug: i.slug, qty: i.qty, selected: i.selected })),
        locale,
      );
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setError(res.error === "PAYMENT_UNAVAILABLE" ? t("shop.payUnavailable") : t("shop.checkoutFailed"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="text-[clamp(2rem,1.6rem+2vw,3rem)]">{t("shop.cartTitle")}</h1>

      {cart.items.length === 0 ? (
        <div className="mt-6">
          <p className="text-ink-soft">{t("shop.cartEmpty")}</p>
          <Link href="/boutique" className="btn btn--ghost mt-4">
            {t("shop.continue")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 flex flex-col divide-y divide-line">
            {cart.items.map((item, i) => {
              const name = locale === "fr" ? item.nameFr : item.nameEn;
              const labels = Object.values(locale === "fr" ? item.optionLabelsFr : item.optionLabelsEn);
              return (
                <li key={i} className="flex items-start gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-display text-[1.05rem] font-semibold">{name}</p>
                    {labels.length > 0 && (
                      <p className="text-[0.85rem] text-ink-faint">{labels.join(" · ")}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={item.qty}
                        onChange={(e) => cart.setQty(i, Number(e.target.value) || 1)}
                        aria-label={t("shop.qty")}
                        className="w-[60px] rounded-[var(--radius-lg)] border border-line px-2 py-1 text-center text-[0.85rem]"
                      />
                      <button
                        type="button"
                        onClick={() => cart.remove(i)}
                        className="text-[0.8rem] text-terracotta underline underline-offset-2"
                      >
                        {t("shop.remove")}
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums text-ink">
                    {formatMoneyFromCents(item.priceCents * item.qty, locale)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--line-gold)] pt-4">
            <span className="font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("shop.subtotal")}
            </span>
            <span className="font-display text-2xl font-semibold tabular-nums text-terracotta">
              {formatMoneyFromCents(cart.subtotalCents, locale)}
            </span>
          </div>

          <p className="mt-2 text-[0.82rem] text-ink-faint">{t("shop.shippingNote")}</p>
          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}

          <button type="button" onClick={pay} disabled={pending} className="btn btn--block mt-5">
            <Icon name="check" />
            {pending ? "…" : t("shop.checkout")}
          </button>
          <Link href="/boutique" className="mt-3 block text-center text-sm text-ink-soft hover:text-terracotta">
            {t("shop.continue")}
          </Link>
        </>
      )}
    </div>
  );
}
