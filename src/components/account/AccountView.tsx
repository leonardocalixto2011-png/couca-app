"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { updateProfile, signOutCustomer } from "@/app/compte/actions";
import { fmtDateTime } from "@/lib/fmt";
import { formatMoneyFromCents, cn } from "@/lib/utils";

type Reward = { visit: number; rewardKey: string };
type Booking = {
  id: string;
  startAt: string;
  status: string;
  serviceNameFr: string;
  serviceNameEn: string;
  estimatedTotalCents: number | null;
};

const STATUS_LABEL: Record<string, { fr: string; en: string }> = {
  PENDING: { fr: "En attente", en: "Pending" },
  CONFIRMED: { fr: "Confirmée", en: "Confirmed" },
  COMPLETED: { fr: "Terminée", en: "Completed" },
  CANCELLED: { fr: "Annulée", en: "Cancelled" },
  NO_SHOW: { fr: "Absence", en: "No-show" },
};

export function AccountView({
  name,
  email,
  phone,
  visits,
  unlocked,
  nextTier,
  bookings,
}: {
  name: string;
  email: string;
  phone: string;
  visits: number;
  unlocked: Reward[];
  nextTier: Reward | null;
  bookings: Booking[];
}) {
  const { t, locale } = useLocale();
  const [pName, setPName] = useState(name);
  const [pPhone, setPPhone] = useState(phone);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const pct = Math.min(100, (visits / 10) * 100);

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Couca &amp; Co. Beauty</span>
          <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2vw,2.8rem)]">
            {t("acc.hello")} {name || email}
          </h1>
        </div>
        <form action={signOutCustomer}>
          <button type="submit" className="btn btn--ghost btn--sm">
            {t("acc.signOut")}
          </button>
        </form>
      </div>

      {/* Loyalty */}
      <div className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--line-gold)] bg-gradient-to-b from-[#34302f] to-[#211f1e] p-6 text-blush-light">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-cream">
            Couca Club <span className="text-gold">♡</span>
          </span>
          <span className="font-display text-3xl font-semibold tabular-nums text-cream">
            {visits}
            <span className="font-ui text-sm text-blush-light">{t("club.countSuffix")}</span>
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-muted to-gold" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-[0.88rem]">
          {[3, 5, 10].map((v) => {
            const on = visits >= v;
            const key = v === 3 ? "club.r3" : v === 5 ? "club.r5" : "club.r10";
            return (
              <li key={v} className={cn("flex items-center gap-2", on ? "text-gold" : "text-blush-light/70")}>
                <span className="w-8 font-display text-lg">{v}ᵉ</span>
                <span className="flex-1">{t(`${key}.t`)}</span>
                {on && <Icon name="check" className="h-4 w-4" />}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[0.82rem] text-blush-light/80">
          {nextTier ? t("acc.nextReward", { k: nextTier.visit - visits }) : t("acc.maxReward")}
        </p>
      </div>

      {/* Profile */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg">{t("acc.profile")}</h2>
        <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-white p-5">
          <label className="flex flex-col gap-1 text-[0.8rem]">
            <span className="font-semibold text-ink-soft">{t("book.name")}</span>
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              className="rounded-[var(--radius-lg)] border border-line px-3 py-2 text-[0.92rem]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.8rem]">
            <span className="font-semibold text-ink-soft">{t("book.phone")}</span>
            <input
              value={pPhone}
              onChange={(e) => setPPhone(e.target.value)}
              className="rounded-[var(--radius-lg)] border border-line px-3 py-2 text-[0.92rem]"
            />
          </label>
          <p className="text-[0.8rem] text-ink-faint">{email}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateProfile({ name: pName, phone: pPhone });
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              })
            }
            className="btn btn--sm self-start"
          >
            {saved ? t("acc.saved") : t("acc.save")}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg">{t("acc.history")}</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-ink-faint">
            {t("acc.noBookings")}{" "}
            <Link href="/reserver" className="underline">
              {t("nav.bookRdv")}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-[0.9rem]">
                <span>
                  {fmtDateTime(new Date(b.startAt))}
                  <span className="block text-[0.8rem] text-ink-faint">
                    {locale === "fr" ? b.serviceNameFr : b.serviceNameEn}
                  </span>
                </span>
                <span className="text-right">
                  <span className="text-[0.78rem] text-ink-faint">
                    {(locale === "fr" ? STATUS_LABEL[b.status]?.fr : STATUS_LABEL[b.status]?.en) ?? b.status}
                  </span>
                  {b.estimatedTotalCents != null && (
                    <span className="block tabular-nums">{formatMoneyFromCents(b.estimatedTotalCents, locale)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
