"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";

const SERVICES = [
  { key: "courte", price: "45 $", icon: "nail" as const },
  { key: "moyenne", price: "50 $", icon: "nail" as const },
  { key: "longue", price: "55 $", icon: "nail" as const },
  { key: "french", price: "+5 $", icon: "brush" as const },
  { key: "simple", price: "+5 $", icon: "spark" as const },
  { key: "art3d", price: "+10–20 $", icon: "gem" as const },
];

export function Services() {
  const { t } = useLocale();

  return (
    <section id="services" className="section-pad bg-blush">
      <div className="container-x">
        <Reveal className="mb-[clamp(2.5rem,1.8rem+3vw,4rem)] grid gap-x-12 gap-y-6 md:grid-cols-2 md:items-end">
          <h2 className="max-w-[15ch] text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)]">
            {t("services.h2")}
          </h2>
          <p className="max-w-[46ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft">
            {t("services.p")}
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Reveal
              as="article"
              key={s.key}
              className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-line bg-white p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-[var(--line-gold)] hover:shadow-[var(--shadow-soft-md)]"
            >
              <span className="mb-1 grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-blush text-terracotta">
                <Icon name={s.icon} className="h-[22px] w-[22px]" />
              </span>
              <h3 className="flex items-baseline justify-between gap-4 text-[clamp(1.3rem,1.12rem+0.8vw,1.6rem)]">
                <span>{t(`svc.${s.key}.t`)}</span>
                <span className="whitespace-nowrap font-ui text-[0.98rem] font-semibold text-terracotta">
                  {s.price}
                </span>
              </h3>
              <p className="text-sm text-ink-soft">{t(`svc.${s.key}.d`)}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] bg-gradient-to-br from-blush to-cream p-8">
            <p className="max-w-[46ch] text-ink-soft">{t("prix.p")}</p>
            <Link href="/#prix" className="btn btn--ghost">
              {t("calc.title")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
