"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { locale, toggle, t } = useLocale();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.switch")}
      className={cn(
        "inline-flex min-w-[46px] h-[46px] items-center justify-center rounded-full border px-3 font-ui text-[0.78rem] font-bold tracking-[0.1em] transition-colors",
        "border-[var(--line-gold)] text-ink hover:border-gold-muted hover:bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)]",
        className,
      )}
    >
      {locale === "fr" ? "EN" : "FR"}
    </button>
  );
}
