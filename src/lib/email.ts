/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise logs
 * to the server console so the booking flow still works end-to-end in dev.
 */
import type { Locale } from "@/i18n/messages";
import { translate } from "@/i18n/messages";
import { BRAND } from "./brand";
import { formatMoneyFromCents } from "./utils";
import { STUDIO_TZ } from "./policy";

type BookingEmailInput = {
  to: string;
  reference: string;
  locale: Locale;
  serviceName: string;
  addonNames: string[];
  startAt: Date;
  estimatedTotalCents: number | null;
  depositCents: number;
};

function formatWhen(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: STUDIO_TZ,
  }).format(d);
}

export async function sendBookingConfirmation(input: BookingEmailInput): Promise<void> {
  const t = (k: string, v?: Record<string, string | number>) => translate(input.locale, k, v);
  const when = formatWhen(input.startAt, input.locale);
  const lines = [
    t("book.confirmedTitle"),
    "",
    `${t("book.reference")}: ${input.reference}`,
    `${t("book.step.service")}: ${input.serviceName}`,
    input.addonNames.length ? `${t("book.addToLook")}: ${input.addonNames.join(", ")}` : null,
    `${t("book.step.date")}: ${when}`,
    input.estimatedTotalCents != null
      ? `${t("book.estTotal")}: ${formatMoneyFromCents(input.estimatedTotalCents, input.locale)}`
      : null,
    `${t("book.depositDue")}: ${formatMoneyFromCents(input.depositCents, input.locale)}`,
    "",
    t("policy.cancel"),
    "",
    `${BRAND.name} · ${BRAND.areaServed} · ${BRAND.instagramHandle}`,
  ].filter(Boolean);
  const text = lines.join("\n");
  const subject = `${t("book.confirmedTitle")} — ${input.reference}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`;
  if (!apiKey) {
    console.info(`[email:dev] to=${input.to} subject="${subject}"\n${text}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject, text }),
    });
    if (!res.ok) {
      console.error(`[email] Resend responded ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
