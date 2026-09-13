"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { Reveal } from "@/components/Reveal";
import { LookCalculator } from "./LookCalculator";

type Row = { name: string; amt: string; sub?: string };

export function Pricing() {
  const { t } = useLocale();

  const rows: Row[] = [
    { name: `${t("menu.acrylique")} — ${t("menu.len.court")}`, amt: "45 $" },
    { name: `${t("menu.acrylique")} — ${t("menu.len.moyen")}`, amt: "50 $" },
    { name: `${t("menu.acrylique")} — ${t("menu.len.long")}`, amt: "55 $" },
    { name: `${t("menu.gelx")} — ${t("menu.len.court")}`, amt: "45 $" },
    { name: `${t("menu.gelx")} — ${t("menu.len.moyen")}`, amt: "50 $" },
    { name: `${t("menu.gelx")} — ${t("menu.len.long")}`, amt: "55 $" },
    { name: t("menu.builder"), amt: "45 $+" },
    { name: t("menu.russe"), amt: "40 $" },
    { name: t("svc.homme.t"), amt: "35 $" },
    { name: t("svc.remplissage.t"), amt: "40 $" },
  ];

  return (
    <section id="prix" className="section-pad bg-blush">
      <div className="container-x">
        <Reveal className="mb-[clamp(2.5rem,1.8rem+3vw,4rem)] grid gap-x-12 gap-y-6 md:grid-cols-2 md:items-end">
          <div>
            <span className="eyebrow">{t("prix.eyebrow")}</span>
            <h2 className="mt-4 max-w-[15ch] text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)]">
              {t("prix.h2")}
            </h2>
          </div>
          <p className="max-w-[46ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft">
            {t("prix.p")}
          </p>
        </Reveal>

        <div className="grid gap-[clamp(2rem,1.4rem+4vw,3.4rem)] lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <h3 className="mb-3 text-[clamp(1.3rem,1.12rem+0.8vw,1.6rem)]">{t("prix.listTitle")}</h3>
            {rows.map((r) => (
              <div key={r.name} className="flex items-baseline gap-3.5 border-b border-line py-3.5">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="flex-1 -translate-y-1 border-b border-dotted border-[var(--line-gold)]" />
                <span className="font-semibold tabular-nums text-terracotta">{r.amt}</span>
              </div>
            ))}
            <div className="py-4">
              <span className="font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {t("prix.extrasTitle")}
              </span>
              <p className="mt-1.5 text-[0.9rem] text-ink-soft">{t("prix.extras")}</p>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              <span className="mr-2 inline-flex items-center rounded-full border border-[var(--line-gold)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
                {t("prix.eyebrow")}
              </span>
              {t("prix.note")}
            </p>
          </Reveal>

          <Reveal>
            <LookCalculator />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
