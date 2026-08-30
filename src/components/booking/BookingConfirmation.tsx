"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { cn, formatMoneyFromCents } from "@/lib/utils";
import { STUDIO_TZ } from "@/lib/policy";

export function BookingConfirmation(props: {
  reference: string;
  found: boolean;
  serviceNameFr: string | null;
  serviceNameEn: string | null;
  startIso: string | null;
  depositPaid: boolean;
  estimatedTotalCents: number | null;
  depositCents: number;
}) {
  const { t, locale } = useLocale();
  const when = props.startIso
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: STUDIO_TZ,
      }).format(new Date(props.startIso))
    : null;
  const serviceName = locale === "fr" ? props.serviceNameFr : props.serviceNameEn;

  return (
    <div className="mx-auto max-w-[560px] text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush text-terracotta">
        <Icon name="check" className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-[clamp(2rem,1.6rem+2vw,3rem)]">{t("book.confirmedTitle")}</h1>
      <p className="mx-auto mt-3 max-w-[42ch] text-ink-soft">{t("book.confirmedLead")}</p>

      <dl
        className={cn(
          "mx-auto mt-7 flex max-w-[420px] flex-col gap-2.5 rounded-[var(--radius-xl)] border p-5 text-left text-[0.94rem]",
          "border-line bg-white",
        )}
      >
        <Row k={t("book.reference")} v={props.reference} strong />
        {serviceName && <Row k={t("book.step.service")} v={serviceName} />}
        {when && <Row k={t("book.step.date")} v={when} />}
        {props.estimatedTotalCents != null && (
          <Row k={t("book.estTotal")} v={formatMoneyFromCents(props.estimatedTotalCents, locale)} />
        )}
        <Row
          k={t("book.depositDue")}
          v={
            formatMoneyFromCents(props.depositCents, locale) +
            (props.depositPaid ? " ✓" : "")
          }
        />
      </dl>

      {!props.found && (
        <p className="mt-4 text-sm text-ink-faint">
          {locale === "fr"
            ? "Référence non trouvée — vérifiez le lien de confirmation."
            : "Reference not found — check your confirmation link."}
        </p>
      )}

      <p className="mx-auto mt-5 max-w-[42ch] text-[0.86rem] text-ink-faint">{t("policy.cancel")}</p>

      <Link href="/" className="btn btn--ghost mt-7">
        {t("nav.home")}
      </Link>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-faint">{k}</dt>
      <dd className={cn("text-right", strong ? "font-semibold text-terracotta" : "text-ink")}>{v}</dd>
    </div>
  );
}
