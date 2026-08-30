"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";

export function PromoBanner() {
  const { t } = useLocale();

  return (
    <section id="modeles" className="section-pad">
      <div className="container-x">
        <Reveal className="on-dark grid items-center gap-x-12 gap-y-6 rounded-[var(--radius-2xl)] bg-[radial-gradient(130%_120%_at_12%_0%,color-mix(in_srgb,var(--color-gold)_22%,transparent),transparent_55%),var(--color-charcoal)] p-[clamp(2.4rem,1.8rem+3vw,3.6rem)] text-blush-light md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-muted px-4 py-2 font-ui text-[0.7rem] font-bold uppercase tracking-[0.2em] text-charcoal">
              <Icon name="spark" className="h-[13px] w-[13px]" />
              {t("promo.badge")}
            </span>
            <h2 className="my-3.5 text-[clamp(1.9rem,1.4rem+2.4vw,2.9rem)] text-cream">
              {t("promo.h2")} ✨
            </h2>
            <p className="max-w-[48ch] text-blush-light">{t("promo.p")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/reserver" className="btn">
              {t("promo.cta")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
