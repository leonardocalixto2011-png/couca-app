"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { BRAND } from "@/lib/brand";

export function InstagramBridge() {
  const { t } = useLocale();

  return (
    <section className="on-dark section-pad bg-charcoal text-blush-light">
      <Reveal className="container-x mx-auto max-w-[620px] text-center">
        <span className="inline-flex items-center gap-3 font-display text-[clamp(1.7rem,1.3rem+2vw,2.6rem)] font-semibold text-cream">
          <Icon name="instagram" className="h-[0.9em] w-[0.9em] text-gold-muted" />
          {BRAND.instagramHandle}
        </span>
        <p className="mt-2.5 text-[0.78rem] uppercase tracking-[0.24em] text-gold-muted">
          {BRAND.areaServed}
        </p>
        <h2 className="mb-2.5 mt-5.5 text-[clamp(1.8rem,1.4rem+2vw,2.6rem)] text-cream">
          {t("ig.h2")} <span className="text-rose">♡</span>
        </h2>
        <p className="mb-7 text-blush-light">{t("ig.p")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={BRAND.instagramDM} target="_blank" rel="noopener" className="btn">
            <Icon name="mail" />
            {t("ig.dm")}
          </a>
          <a href={BRAND.instagramProfile} target="_blank" rel="noopener" className="btn btn--ghost">
            <Icon name="instagram" />
            {t("ig.follow")}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
