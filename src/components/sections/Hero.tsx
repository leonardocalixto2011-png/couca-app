"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";

export function Hero() {
  const { t } = useLocale();

  return (
    <section id="accueil" className="relative overflow-hidden pb-[var(--section-pad)] pt-[clamp(3rem,2rem+6vw,6rem)]">
      <div className="container-x grid items-center gap-[clamp(3rem,2rem+6vw,5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="eyebrow mb-6">{t("hero.eyebrow")}</span>
          <h1 className="text-[clamp(2.9rem,1.9rem+5vw,5.6rem)] font-medium">
            {t("hero.h1a")}
            <br />
            <span className="inline-block font-script text-[1.14em] font-normal leading-[0.8] text-rose">
              {t("hero.h1script")}
            </span>{" "}
            {t("hero.h1b")}
          </h1>
          <p className="mt-7 max-w-[40ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft">
            {t("hero.lead")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-4">
            <Link href="/reserver" className="btn">
              {t("hero.cta1")}
              <Icon name="arrow" />
            </Link>
            <Link href="/#prix" className="btn btn--ghost">
              {t("hero.cta2")}
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink-faint">
            <Icon name="check" className="h-[15px] w-[15px] text-rose" />
            {t("hero.note")}
          </p>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px]">
          <div className="absolute inset-[6%_12%_14%_0] -rotate-[5deg] rounded-[var(--radius-2xl)] bg-gradient-to-br from-blush-light to-blush shadow-[var(--shadow-soft-md)]" />
          <div className="absolute inset-[12%_0_0_16%] overflow-hidden rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft-lg)]">
            <Image
              src="/img/web-4.jpg"
              alt={t("hero.imgAlt")}
              fill
              priority
              sizes="(max-width: 1000px) 80vw, 440px"
              className="object-cover"
            />
          </div>
          <span className="absolute left-[-4%] top-[3%] inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[0.78rem] font-semibold text-ink shadow-[var(--shadow-soft-md)]">
            <Icon name="spark" className="h-[15px] w-[15px] text-gold" />
            {t("promo.h2")}
          </span>
          <span className="absolute bottom-[6%] right-[-6%] inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[0.78rem] font-semibold text-ink shadow-[var(--shadow-soft-md)]">
            {t("hero.priceBadge")}
          </span>
        </div>
      </div>
    </section>
  );
}
