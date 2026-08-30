"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { Reveal } from "@/components/Reveal";
import { LookCalculator } from "./LookCalculator";

const ROWS = [
  { key: "svc.courte.t", amt: "45 $" },
  { key: "svc.moyenne.t", amt: "50 $" },
  { key: "svc.longue.t", amt: "55 $" },
  { key: "svc.french.t", amt: "+5 $" },
  { key: "svc.simple.t", amt: "+5 $" },
];

export function Pricing() {
  const { t } = useLocale();

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
            {ROWS.map((r) => (
              <div key={r.key} className="flex items-baseline gap-3.5 border-b border-line py-3.5">
                <span className="font-medium text-ink">{t(r.key)}</span>
                <span className="flex-1 -translate-y-1 border-b border-dotted border-[var(--line-gold)]" />
                <span className="font-semibold tabular-nums text-terracotta">{r.amt}</span>
              </div>
            ))}
            <div className="flex items-baseline gap-3.5 py-3.5">
              <span className="font-medium text-ink">
                {t("prix.art3dName")}
                <small className="block text-[0.82rem] font-normal text-ink-faint">
                  {t("prix.art3dSub")}
                </small>
              </span>
              <span className="flex-1 -translate-y-1 border-b border-dotted border-[var(--line-gold)]" />
              <span className="font-semibold tabular-nums text-terracotta">+10–20 $</span>
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
