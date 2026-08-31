"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { PRICING } from "@/lib/brand";
import { money } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DEFAULT_SERVICE = "acrylique-moyen";

export function LookCalculator() {
  const { t } = useLocale();
  const [service, setService] = useState<string>(DEFAULT_SERVICE);
  const [french, setFrench] = useState(false);
  const [chrome, setChrome] = useState(false);
  const [simple, setSimple] = useState(false);
  const [art3d, setArt3d] = useState(false);
  const [art3dPrice, setArt3dPrice] = useState<number>(15);
  const [strass, setStrass] = useState(false);

  const { items, total } = useMemo(() => {
    const base = PRICING.services.find((s) => s.slug === service) ?? PRICING.services[0];
    const list: { label: string; price: number; base?: boolean }[] = [
      { label: t(`calc.svc.${base.key}`), price: base.price, base: true },
    ];
    if (french) list.push({ label: t("calc.addon.french"), price: PRICING.addons.french });
    if (chrome) list.push({ label: t("calc.addon.chrome"), price: PRICING.addons.chrome });
    if (simple) list.push({ label: t("calc.addon.simple"), price: PRICING.addons.simple });
    if (art3d) list.push({ label: t("calc.addon.art3d"), price: art3dPrice });
    if (strass) list.push({ label: t("calc.addon.strass"), price: PRICING.addons.strass });
    return { items: list, total: list.reduce((s, i) => s + i.price, 0) };
  }, [service, french, chrome, simple, art3d, art3dPrice, strass, t]);

  const bookHref = useMemo(() => {
    const p = new URLSearchParams({ service, total: String(total) });
    if (french) p.set("french", "1");
    if (chrome) p.set("chrome", "1");
    if (simple) p.set("simple", "1");
    if (art3d) p.set("art3d", String(art3dPrice));
    if (strass) p.set("strass", "1");
    return `/reserver?${p.toString()}`;
  }, [service, french, chrome, simple, art3d, art3dPrice, strass, total]);

  function reset() {
    setService(DEFAULT_SERVICE);
    setFrench(false);
    setChrome(false);
    setSimple(false);
    setArt3d(false);
    setArt3dPrice(15);
    setStrass(false);
  }

  return (
    <div
      id="calc"
      className="rounded-[var(--radius-2xl)] border border-[var(--line-gold)] bg-white p-[clamp(1.5rem,1.1rem+2vw,2.4rem)] shadow-[var(--shadow-soft-md)]"
    >
      <p className="mb-1 flex items-center gap-2 font-display text-[clamp(1.3rem,1.12rem+0.8vw,1.6rem)]">
        <Icon name="spark" className="h-5 w-5 text-gold" />
        {t("calc.title")}
      </p>
      <p className="mb-6 text-sm text-ink-faint">{t("calc.sub")}</p>

      <fieldset className="mb-6">
        <legend className="mb-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {t("calc.legendBase")}
        </legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PRICING.services.map((s) => (
            <button
              key={s.slug}
              type="button"
              aria-pressed={service === s.slug}
              onClick={() => setService(s.slug)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-[var(--radius-lg)] border px-3 py-3 text-center text-[0.86rem] font-medium leading-tight transition-colors",
                service === s.slug
                  ? "border-terracotta bg-blush text-terracotta"
                  : "border-line text-ink-soft hover:border-gold-muted",
              )}
            >
              {t(`calc.svc.${s.key}`)}
              <b className="font-ui text-[0.98rem] font-bold">{money(s.price)}</b>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-2">
        <legend className="mb-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {t("calc.legendFin")}
        </legend>
        <div className="flex flex-col gap-2.5">
          <Toggle checked={french} onChange={setFrench} label={t("calc.addon.french")} price="+5 $" />
          <Toggle checked={chrome} onChange={setChrome} label={t("calc.addon.chrome")} price="+5 $" />
          <Toggle checked={simple} onChange={setSimple} label={t("calc.addon.simple")} price="+5 $" />
          <Toggle
            checked={art3d}
            onChange={setArt3d}
            label={t("calc.addon.art3d")}
            sub={t("calc.addon.art3dSub")}
            price="+10–20 $"
          />
          {art3d && (
            <div className="mt-1 rounded-[var(--radius-lg)] border border-dashed border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_6%,transparent)] px-4 pb-4 pt-3.5">
              <p className="mb-2.5 text-[0.82rem] text-ink-soft">{t("calc.segHelp")}</p>
              <div className="flex gap-2" role="radiogroup" aria-label={t("calc.addon.art3d")}>
                {PRICING.addons.art3d.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={art3dPrice === p}
                    onClick={() => setArt3dPrice(p)}
                    className={cn(
                      "flex-1 rounded-full border px-2 py-2.5 text-center text-[0.9rem] font-semibold tabular-nums transition-colors",
                      art3dPrice === p
                        ? "border-terracotta bg-terracotta text-white"
                        : "border-line text-ink-soft",
                    )}
                  >
                    {money(p)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Toggle checked={strass} onChange={setStrass} label={t("calc.addon.strass")} price="+5 $" />
        </div>
      </fieldset>

      <div className="mt-6 border-t border-line pt-6">
        <h4 className="mb-2.5 font-display text-[1.15rem] font-semibold">{t("calc.summaryTitle")}</h4>
        <ul className="flex flex-col gap-1.5">
          {items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-4 text-[0.94rem] text-ink-soft">
              <span>{i.label}</span>
              <span className="font-medium tabular-nums text-ink">
                {(i.base ? "" : "+") + money(i.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-[var(--line-gold)] pt-4">
          <span className="font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("calc.totalLabel")}
          </span>
          <span
            className="font-display text-[clamp(2rem,1.6rem+2vw,2.8rem)] font-semibold leading-none tabular-nums text-terracotta"
            aria-live="polite"
          >
            {money(total)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link href={bookHref} className="btn btn--block">
          <Icon name="check" />
          {t("calc.book")} • {money(total)}
        </Link>
        <button
          type="button"
          onClick={reset}
          className="self-center p-1.5 font-ui text-[0.85rem] text-ink-faint underline underline-offset-[3px] hover:text-terracotta"
        >
          {t("calc.reset")}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  sub,
  price,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
  price: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-[var(--radius-lg)] border px-4 py-3.5 transition-colors",
        checked ? "border-terracotta bg-blush" : "border-line hover:border-gold-muted",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border transition-colors",
          checked ? "border-terracotta bg-terracotta text-white" : "border-gold-muted text-transparent",
        )}
      >
        <Icon name="check" className="h-[13px] w-[13px]" />
      </span>
      <span className="flex-1 text-[0.96rem] font-medium">
        {label}
        {sub && <small className="block font-normal text-[0.8rem] text-ink-faint">{sub}</small>}
      </span>
      <span className="font-bold tabular-nums text-terracotta">{price}</span>
    </label>
  );
}
