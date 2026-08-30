"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { LOYALTY_TIERS } from "@/lib/brand";
import { cn } from "@/lib/utils";

const REWARDS = [
  { visit: 3, tKey: "club.r3" },
  { visit: 5, tKey: "club.r5" },
  { visit: 10, tKey: "club.r10" },
];
const STEPS = [1, 2, 3, 5, 10];

export function CoucaClub() {
  const { t } = useLocale();
  const [visit, setVisit] = useState(1);

  const status = useMemo(() => {
    const unlocked = LOYALTY_TIERS.filter((x) => visit >= x.visit);
    const next = LOYALTY_TIERS.find((x) => visit < x.visit);
    let out = t("club.statusPrefix", { v: visit });
    if (unlocked.length) {
      out += t("club.statusUnlocked", {
        label: t(unlocked[unlocked.length - 1].rewardKey),
      });
      if (next) out += t("club.statusNext", { n: next.visit });
    } else if (next) {
      const k = next.visit - visit;
      out += t(k > 1 ? "club.statusNoneN" : "club.statusNone1", { k });
    }
    return out;
  }, [visit, t]);

  return (
    <section id="couca-club" className="on-dark section-pad bg-charcoal text-blush-light">
      <div className="container-x grid items-center gap-[clamp(2.4rem,1.8rem+4vw,4rem)] lg:grid-cols-2">
        <Reveal>
          <span className="eyebrow" style={{ color: "var(--color-gold-muted)" }}>
            {t("club.eyebrow")}
          </span>
          <h2 className="mt-3 text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)] text-cream">
            Couca Club <span className="font-script text-[1.1em] text-gold">♡</span>
          </h2>
          <p className="mt-4 max-w-[46ch] text-blush-light">{t("club.p")}</p>

          <ul className="mt-7 flex flex-col gap-3.5">
            {REWARDS.map((r) => {
              const on = visit >= r.visit;
              return (
                <li
                  key={r.visit}
                  className={cn(
                    "flex items-start gap-4 rounded-[var(--radius-lg)] border p-4 transition-colors",
                    on
                      ? "border-[color-mix(in_srgb,var(--color-gold)_60%,transparent)] bg-[rgba(212,175,55,0.08)]"
                      : "border-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "min-w-[2.6rem] font-display text-2xl font-semibold leading-none",
                      on ? "text-gold" : "text-gold-muted",
                    )}
                  >
                    {r.visit}
                    <sup>e</sup>
                  </span>
                  <span className="flex-1">
                    <b className="block text-[0.98rem] font-semibold text-cream">{t(`${r.tKey}.t`)}</b>
                    <span className="text-[0.88rem] text-blush-light">{t(`${r.tKey}.d`)}</span>
                  </span>
                  {on && <Icon name="check" className="ml-auto h-[18px] w-[18px] text-gold" />}
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal>
          <div className="rounded-[var(--radius-2xl)] border border-[rgba(212,175,55,0.28)] bg-gradient-to-b from-[#34302f] to-[#211f1e] p-[clamp(1.6rem,1.2rem+2vw,2.4rem)] shadow-[var(--shadow-soft-lg)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <span className="font-display text-[1.3rem] font-semibold text-cream">
                Couca Club
                <span className="mt-1 block font-ui text-[0.64rem] uppercase tracking-[0.28em] text-gold-muted">
                  {t("club.cardSub")}
                </span>
              </span>
              <span className="text-[1.4rem] text-rose">♡</span>
            </div>

            <p className="font-display text-[2.6rem] font-semibold leading-none tabular-nums text-cream">
              {visit}
              <small className="font-ui text-base text-blush-light">{t("club.countSuffix")}</small>
            </p>

            <div className="relative mb-1 mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-muted to-gold transition-[width] duration-[700ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${Math.min(100, (visit / 10) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[0.72rem] tabular-nums text-blush-light">
              <span>1</span>
              <span>3</span>
              <span>5</span>
              <span>10</span>
            </div>

            <div className="mt-5 flex gap-2" role="group" aria-label={t("club.stepsAria")}>
              {STEPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={visit === s}
                  onClick={() => setVisit(s)}
                  className={cn(
                    "flex-1 rounded-[var(--radius-lg)] border px-1 py-2.5 font-ui text-[0.92rem] font-semibold tabular-nums transition-colors",
                    visit === s
                      ? "border-transparent bg-gradient-to-r from-gold to-gold-muted text-charcoal"
                      : "border-white/15 text-blush-light hover:border-gold-muted hover:text-cream",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <p className="mt-4 min-h-[1.4em] text-[0.86rem] text-blush-light" aria-live="polite">
              {status}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
