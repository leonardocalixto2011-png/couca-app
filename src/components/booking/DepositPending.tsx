"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { STUDIO_TZ } from "@/lib/policy";
import { BRAND } from "@/lib/brand";

const TXT = {
  fr: {
    eyebrow: "Plus qu'une étape",
    title: "Votre place n'est pas encore confirmée",
    lead: "Le dépôt de 20 $ n'a pas été complété. Réglez-le maintenant pour garder ce moment : il est déduit de votre total en studio.",
    cta: "Confirmer ma place · 20 $",
    hold: "Les places non confirmées peuvent être offertes à une autre cliente.",
    other: "Choisir un autre moment",
    help: "Une question ? Écrivez-nous",
    expiredTitle: "Ce lien n'est plus actif",
    expiredLead: "Ce rendez-vous n'attend plus de dépôt (il est passé ou a été annulé). Choisissez un nouveau moment en quelques clics.",
    book: "Réserver un moment",
  },
  en: {
    eyebrow: "One step left",
    title: "Your spot isn't confirmed yet",
    lead: "The $20 deposit wasn't completed. Pay it now to keep this time. It comes off your in-studio total.",
    cta: "Confirm my spot · $20",
    hold: "Unconfirmed spots may be offered to another client.",
    other: "Pick another time",
    help: "Questions? Message us",
    expiredTitle: "This link is no longer active",
    expiredLead: "This appointment isn't waiting on a deposit anymore (it has passed or was cancelled). Pick a new time in a few taps.",
    book: "Book a time",
  },
} as const;

export function DepositPending(props: {
  reference: string;
  expired: boolean;
  serviceNameFr: string | null;
  serviceNameEn: string | null;
  startIso: string | null;
}) {
  const { locale } = useLocale();
  const k = TXT[locale === "en" ? "en" : "fr"];
  const service = locale === "en" ? props.serviceNameEn : props.serviceNameFr;
  const when = props.startIso
    ? new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: STUDIO_TZ,
      }).format(new Date(props.startIso))
    : null;

  if (props.expired) {
    return (
      <div className="mx-auto max-w-[560px] text-center">
        <h1 className="text-[clamp(1.9rem,1.4rem+2vw,2.6rem)]">{k.expiredTitle}</h1>
        <p className="mt-3 text-ink-soft">{k.expiredLead}</p>
        <Link href="/reserver" className="btn mt-7">
          {k.book}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <span className="eyebrow">{k.eyebrow}</span>
      <h1 className="mt-3 text-[clamp(1.9rem,1.4rem+2vw,2.6rem)]">{k.title}</h1>
      <p className="mt-3 text-ink-soft">{k.lead}</p>

      {(service || when) && (
        <div className="mt-6 rounded-[var(--radius-xl)] border border-line bg-white p-5">
          {service && <p className="font-medium text-ink">{service}</p>}
          {when && <p className="mt-1 text-ink-soft first-letter:uppercase">{when}</p>}
        </div>
      )}

      <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_6%,white)] p-5 text-center">
        <a href={`/reserver/payer/${encodeURIComponent(props.reference)}`} className="btn w-full justify-center">
          <Icon name="spark" />
          {k.cta}
        </a>
        <p className="mt-3 text-[0.85rem] text-ink-faint">{k.hold}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[0.9rem]">
        <Link href="/reserver" className="text-ink-soft underline underline-offset-4">
          {k.other}
        </Link>
        <a href={BRAND.instagramProfile} target="_blank" rel="noopener" className="text-ink-soft underline underline-offset-4">
          {k.help}
        </a>
      </div>
    </div>
  );
}
