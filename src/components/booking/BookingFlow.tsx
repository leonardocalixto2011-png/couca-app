"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { cn, formatMoneyFromCents } from "@/lib/utils";
import { DEPOSIT_CENTS, BOOKING_HORIZON_DAYS, STUDIO_TZ } from "@/lib/policy";
import { fetchSlots, submitBooking, type SlotsResult } from "@/app/reserver/actions";
import type { BookableService, Slot } from "@/lib/booking";

type Props = {
  sets: BookableService[];
  addons: BookableService[];
  openWeekdays: number[];
  prefill: { serviceSlug?: string; addonSlugs: string[] };
};

const STEP_KEYS = ["book.step.service", "book.step.date", "book.step.time", "book.step.details", "book.step.review"];

export function BookingFlow({ sets, addons, openWeekdays, prefill }: Props) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [serviceSlug, setServiceSlug] = useState(prefill.serviceSlug ?? sets[0]?.slug ?? "");
  const [addonSlugs, setAddonSlugs] = useState<string[]>(prefill.addonSlugs);
  const [dateISO, setDateISO] = useState<string>("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slotsState, setSlotsState] = useState<SlotsResult | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const svc = sets.find((s) => s.slug === serviceSlug);
  const chosenAddons = addons.filter((a) => addonSlugs.includes(a.slug));
  const durationMin = (svc?.durationMin ?? 0) + chosenAddons.reduce((s, a) => s + a.durationMin, 0);
  const estTotalCents = (svc?.priceCents ?? 0) + chosenAddons.reduce((s, a) => s + a.priceCents, 0);
  const name_ = (s: BookableService) => (locale === "fr" ? s.nameFr : s.nameEn);

  const days = useMemo(() => {
    const out: { iso: string; label: string; open: boolean }[] = [];
    const base = new Date();
    for (let i = 1; i <= BOOKING_HORIZON_DAYS; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({
        iso,
        label: new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(d),
        open: openWeekdays.includes(d.getDay()),
      });
    }
    return out;
  }, [locale, openWeekdays]);

  function toggleAddon(slug: string) {
    setAddonSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function loadSlots(nextDate: string) {
    setDateISO(nextDate);
    setSlot(null);
    setSlotsState(null);
    startTransition(async () => {
      const res = await fetchSlots({ serviceSlug, addonSlugs, dateISO: nextDate });
      setSlotsState(res);
    });
  }

  function go(next: number) {
    setError(null);
    setStep(next);
  }

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const detailsValid = name.trim().length > 1 && emailValid;

  function confirm() {
    if (!svc || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await submitBooking({
        serviceSlug,
        addonSlugs,
        startIso: slot.iso,
        contactName: name,
        contactEmail: email,
        contactPhone: phone || undefined,
        notes: notes || undefined,
        locale,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.mode === "checkout") {
        window.location.href = res.url;
      } else {
        router.push(`/reserver?confirmed=${res.reference}`);
      }
    });
  }

  const whenLabel =
    dateISO && slot
      ? new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: STUDIO_TZ,
        }).format(new Date(slot.iso)) + ` · ${slot.label}`
      : "";

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-10">
        <span className="eyebrow">Couca &amp; Co. Beauty</span>
        <h1 className="mt-3 text-[clamp(2.2rem,1.6rem+3vw,3.4rem)]">{t("book.title")}</h1>
      </div>

      {/* stepper */}
      <ol className="mb-8 flex flex-wrap gap-x-2 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {STEP_KEYS.map((k, i) => (
          <li key={k} className={cn("flex items-center gap-2", i === step && "text-terracotta")}>
            {i > 0 && <span aria-hidden>·</span>}
            <span>{t(k)}</span>
          </li>
        ))}
      </ol>

      {/* STEP 0 — service + add-ons */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("calc.legendBase")}
            </legend>
            {sets.map((s) => (
              <label
                key={s.slug}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-4 py-3.5 transition-colors",
                  serviceSlug === s.slug ? "border-terracotta bg-blush" : "border-line hover:border-gold-muted",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="service"
                    className="sr-only"
                    checked={serviceSlug === s.slug}
                    onChange={() => setServiceSlug(s.slug)}
                  />
                  <span className="font-medium">{name_(s)}</span>
                </span>
                <span className="font-semibold tabular-nums text-terracotta">
                  {formatMoneyFromCents(s.priceCents, locale)}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("calc.legendFin")}
            </legend>
            {addons.map((a) => {
              const on = addonSlugs.includes(a.slug);
              return (
                <label
                  key={a.slug}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-4 py-3.5 transition-colors",
                    on ? "border-terracotta bg-blush" : "border-line hover:border-gold-muted",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleAddon(a.slug)} />
                    <span
                      className={cn(
                        "grid h-[22px] w-[22px] place-items-center rounded-[7px] border",
                        on ? "border-terracotta bg-terracotta text-white" : "border-gold-muted text-transparent",
                      )}
                    >
                      <Icon name="check" className="h-[13px] w-[13px]" />
                    </span>
                    <span className="font-medium">{name_(a)}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-terracotta">
                    +{formatMoneyFromCents(a.priceCents, locale)}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <NavRow
            onNext={() => go(1)}
            nextDisabled={!serviceSlug}
            nextLabel={t("book.next")}
            t={t}
          />
        </div>
      )}

      {/* STEP 1 — date */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <p className="font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("book.pickDate")}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {days.map((d) => (
              <button
                key={d.iso}
                type="button"
                disabled={!d.open}
                onClick={() => {
                  loadSlots(d.iso);
                  go(2);
                }}
                className={cn(
                  "rounded-[var(--radius-lg)] border px-2 py-2.5 text-center text-[0.86rem] transition-colors",
                  d.open
                    ? "border-line hover:border-terracotta hover:bg-blush"
                    : "cursor-not-allowed border-line/60 text-ink-faint line-through",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <NavRow onBack={() => go(0)} t={t} />
        </div>
      )}

      {/* STEP 2 — time */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <p className="font-ui text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("book.pickTime")}
          </p>
          {pending && <p className="text-sm text-ink-faint">…</p>}
          {!pending && slotsState?.ok && slotsState.closed && (
            <p className="text-sm text-ink-soft">{t("book.closed")}</p>
          )}
          {!pending && slotsState?.ok && !slotsState.closed && slotsState.slots.length === 0 && (
            <p className="text-sm text-ink-soft">{t("book.noSlots")}</p>
          )}
          {!pending && slotsState?.ok && slotsState.slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotsState.slots.map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    go(3);
                  }}
                  className={cn(
                    "rounded-full border px-2 py-2.5 text-center text-[0.9rem] tabular-nums transition-colors",
                    slot?.iso === s.iso
                      ? "border-terracotta bg-terracotta text-white"
                      : "border-line hover:border-terracotta hover:bg-blush",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {!pending && slotsState && !slotsState.ok && (
            <p className="text-sm text-terracotta">{t("book.noSlots")}</p>
          )}
          <NavRow onBack={() => go(1)} t={t} />
        </div>
      )}

      {/* STEP 3 — details */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Field label={t("book.name")} value={name} onChange={setName} autoComplete="name" required />
          <Field label={t("book.email")} value={email} onChange={setEmail} type="email" autoComplete="email" required />
          <Field label={t("book.phone")} value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">{t("book.notes")}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem] focus-visible:border-gold-muted"
            />
          </label>
          <NavRow
            onBack={() => go(2)}
            onNext={() => go(4)}
            nextDisabled={!detailsValid}
            nextLabel={t("book.next")}
            t={t}
          />
        </div>
      )}

      {/* STEP 4 — review */}
      {step === 4 && svc && slot && (
        <div className="flex flex-col gap-5">
          <dl className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-line bg-white p-5 text-[0.94rem]">
            <Row k={t("book.step.service")} v={name_(svc)} />
            {chosenAddons.length > 0 && (
              <Row k={t("book.addToLook")} v={chosenAddons.map(name_).join(", ")} />
            )}
            <Row k={t("book.step.date")} v={whenLabel} />
            <Row k={t("book.duration")} v={`${durationMin} min`} />
            <Row k={t("book.estTotal")} v={formatMoneyFromCents(estTotalCents, locale)} />
            <Row k={t("book.depositDue")} v={formatMoneyFromCents(DEPOSIT_CENTS, locale)} strong />
          </dl>

          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_5%,transparent)] p-4 text-[0.86rem] text-ink-soft">
            <p className="mb-1 font-semibold text-ink">{t("policy.depositTitle")} · {t("policy.cancelTitle")}</p>
            <p>{t("policy.deposit")}</p>
            <p className="mt-1.5">{t("policy.cancel")}</p>
          </div>

          {error && (
            <p className="text-sm text-terracotta">
              {error === "SLOT_TAKEN" || error === "TOO_SOON" || error === "OUTSIDE_HOURS"
                ? t("book.noSlots")
                : t("book.noSlots")}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => go(3)} className="btn btn--ghost btn--sm">
              {t("book.back")}
            </button>
            <button type="button" onClick={confirm} disabled={pending} className="btn">
              <Icon name="check" />
              {pending ? "…" : t("book.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  t,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  t: (k: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn btn--ghost btn--sm">
          {t("book.back")}
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled} className="btn btn--sm">
          {nextLabel}
          <Icon name="arrow" />
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">
        {label}
        {required && <span className="text-terracotta"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem] focus-visible:border-gold-muted"
      />
    </label>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-faint">{k}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "font-semibold text-terracotta" : "text-ink")}>{v}</dd>
    </div>
  );
}
