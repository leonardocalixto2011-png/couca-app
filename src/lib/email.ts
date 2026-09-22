/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise logs
 * to the server console so flows still work end-to-end in dev.
 *
 * Client-facing emails (confirmation, reminder) are HTML with an .ics calendar
 * attachment and include the studio address — it is shared only here and on
 * the post-booking confirmation page, never on public pages.
 */
import type { Locale } from "@/i18n/messages";
import { BRAND, CMAC_BEAUTY, cmacUtm } from "./brand";
import { formatMoneyFromCents } from "./utils";
import { STUDIO_TZ } from "./policy";

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

type Attachment = { filename: string; content: string }; // base64

type SendInput = {
  to: string | string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
};

export type SendResult = { ok: boolean; status: number; id?: string; error?: string; to: string | string[] };

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`;
  if (!apiKey) {
    console.info(`[email:dev] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return { ok: true, status: 0, to: input.to };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: input.to,
        bcc: input.bcc?.length ? input.bcc : undefined,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
        attachments: input.attachments,
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[email] Resend responded ${res.status}: ${body}`);
      return { ok: false, status: res.status, error: body.slice(0, 300), to: input.to };
    }
    let id: string | undefined;
    try {
      id = (JSON.parse(body) as { id?: string }).id;
    } catch {
      // Resend always returns JSON; the id is only used for diagnostics.
    }
    return { ok: true, status: res.status, id, to: input.to };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, status: 0, error: String(err), to: input.to };
  }
}

/** Parses a comma/semicolon/space-separated list of email addresses. */
function splitList(v: string | undefined): string[] {
  return (v ?? "")
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.includes("@"));
}

/**
 * Inboxes that get the full booking/order alert. Defaults to the studio's
 * real inbox (BRAND.email). ADMIN_EMAIL is only a login id: admin@coucabeauty.ca
 * has no Cloudflare forwarding rule, so mail sent there is dropped.
 */
export function ownerNotifyAddresses(): string[] {
  const list = splitList(process.env.OWNER_NOTIFY_EMAIL);
  return list.length ? list : [BRAND.email];
}

/**
 * Optional carrier email-to-SMS gateways (e.g. 4385054220@txt.bell.ca) that get
 * a short text-only alert, so the studio phone buzzes like an SMS.
 */
export function ownerSmsAddresses(): string[] {
  return splitList(process.env.OWNER_SMS_EMAIL);
}

export type ClientSendOptions = { studioOnly?: boolean };

/**
 * Every email to a client goes through here so the studio inbox always gets a
 * copy. The copy is its own email ("[Copie → client] subject") rather than a
 * BCC: it is easy to spot and filter in Outlook, and Resend reports its
 * delivery separately. `studioOnly` sends just the copy.
 */
async function sendClientEmail(
  input: Omit<SendInput, "bcc"> & { to: string },
  opts: ClientSendOptions = {},
): Promise<SendResult[]> {
  const client = input.to.toLowerCase();
  const studio = ownerNotifyAddresses().filter((a) => a.toLowerCase() !== client);
  const sends: Promise<SendResult>[] = [];
  if (!opts.studioOnly) sends.push(sendEmail(input));
  if (studio.length) {
    sends.push(
      sendEmail({
        ...input,
        to: studio,
        subject: `[Copie → ${input.to}] ${input.subject}`,
        text: `Copie de l'email envoyé à ${input.to}\n\n${input.text}`,
        replyTo: input.to,
      }),
    );
  }
  return Promise.all(sends);
}

async function sendOwnerSms(text: string): Promise<void> {
  const to = ownerSmsAddresses();
  if (!to.length) return;
  // Gateways truncate around 160 chars; keep it to one plain line.
  await Promise.all(to.map((addr) => sendEmail({ to: addr, subject: "Couca", text: text.slice(0, 155) })));
}

// ---------------------------------------------------------------------------
// Booking email payload
// ---------------------------------------------------------------------------

export type BookingEmailData = {
  reference: string;
  locale: Locale;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  serviceName: string;
  addonNames: string[];
  startAt: Date;
  endAt: Date;
  durationMin: number;
  estimatedTotalCents: number | null;
  depositCents: number;
  depositPaid: boolean;
  notes: string | null;
  inspoImages: string[];
};

const COPY = {
  fr: {
    confirmedSubject: (ref: string) => `Réservation confirmée — ${ref.slice(-8).toUpperCase()}`,
    reminderSubject: (when: string) => `Rappel — votre rendez-vous ${when}`,
    confirmedTitle: "Réservation confirmée",
    reminderTitle: "À demain !",
    hello: (name: string) => `Bonjour ${name},`,
    confirmedLead: "Votre place est réservée. Voici le récapitulatif de votre rendez-vous — on a hâte de vous recevoir.",
    reminderLead: "Petit rappel : votre rendez-vous chez Couca & Co. Beauty est demain. Voici tout ce qu'il faut savoir.",
    detailsTitle: "Votre rendez-vous",
    service: "Service",
    extras: "Extras",
    when: "Date et heure",
    duration: "Durée",
    reference: "Référence",
    minutes: "min",
    whereTitle: "Où nous trouver",
    directions: "Itinéraire",
    whereNote: "Adresse réservée aux clientes avec un rendez-vous confirmé — merci de ne pas la partager publiquement.",
    amountsTitle: "Montants",
    estTotal: "Total estimé en studio",
    deposit: "Dépôt",
    depositPaid: "payé ✓",
    depositPending: "à régler",
    balance: "Solde à régler en studio",
    balanceNote: "Le montant final est confirmé en studio selon vos ongles.",
    calendar: "Un fichier calendrier est joint à ce courriel — ouvrez-le pour ajouter le rendez-vous à votre téléphone.",
    policyTitle: "Dépôt et annulation",
    policy:
      "Le dépôt de 20 $ n'est pas remboursable et est appliqué au montant final. Report ou annulation sans frais jusqu'à 48 h avant le rendez-vous : le dépôt est conservé pour une prochaine visite. À moins de 48 h ou en cas d'absence, le dépôt est perdu.",
    questions: "Une question ? Répondez à ce courriel ou écrivez-nous sur Instagram.",
    seeYou: "À très vite,",
    signature: "L'équipe Couca & Co. Beauty",
    partner: "Entre deux rendez-vous, prolongez l'effet à la maison avec notre partenaire CMAC Beauty — 10 % avec le code COUCA10",
    icsSummary: (svc: string) => `Couca & Co. Beauty — ${svc}`,
  },
  en: {
    confirmedSubject: (ref: string) => `Booking confirmed — ${ref.slice(-8).toUpperCase()}`,
    reminderSubject: (when: string) => `Reminder — your appointment ${when}`,
    confirmedTitle: "Booking confirmed",
    reminderTitle: "See you tomorrow!",
    hello: (name: string) => `Hi ${name},`,
    confirmedLead: "Your spot is booked. Here's a recap of your appointment — we can't wait to see you.",
    reminderLead: "Quick reminder: your appointment at Couca & Co. Beauty is tomorrow. Here's everything you need.",
    detailsTitle: "Your appointment",
    service: "Service",
    extras: "Extras",
    when: "Date & time",
    duration: "Duration",
    reference: "Reference",
    minutes: "min",
    whereTitle: "Where to find us",
    directions: "Directions",
    whereNote: "Address shared with confirmed clients only — please don't post it publicly.",
    amountsTitle: "Amounts",
    estTotal: "Estimated in-studio total",
    deposit: "Deposit",
    depositPaid: "paid ✓",
    depositPending: "due",
    balance: "Balance due in studio",
    balanceNote: "The final amount is confirmed in studio based on your nails.",
    calendar: "A calendar file is attached — open it to add the appointment to your phone.",
    policyTitle: "Deposit & cancellation",
    policy:
      "The $20 deposit is non-refundable and is applied to your final total. Free reschedule or cancellation up to 48h before: the deposit is kept toward a future visit. Inside 48h, or a no-show, forfeits the deposit.",
    questions: "Questions? Reply to this email or message us on Instagram.",
    seeYou: "See you soon,",
    signature: "The Couca & Co. Beauty team",
    partner: "Between appointments, keep the glow going at home with our partner CMAC Beauty — 10% off with code COUCA10",
    icsSummary: (svc: string) => `Couca & Co. Beauty — ${svc}`,
  },
} as const;

function fmtWhen(d: Date, locale: Locale, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: STUDIO_TZ,
    ...opts,
  }).format(d);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// ICS calendar attachment
// ---------------------------------------------------------------------------

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildBookingIcs(d: BookingEmailData): string {
  const c = COPY[d.locale];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Couca & Co. Beauty//Booking//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${d.reference}@coucabeauty.ca`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(d.startAt)}`,
    `DTEND:${icsDate(d.endAt)}`,
    `SUMMARY:${icsText(c.icsSummary(d.serviceName))}`,
    `LOCATION:${icsText(BRAND.studioAddress.line)}`,
    `DESCRIPTION:${icsText(`${c.reference} ${d.reference}\n${BRAND.domain}/reserver?confirmed=${d.reference}`)}`,
    `URL:${BRAND.domain}/reserver?confirmed=${d.reference}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(c.icsSummary(d.serviceName))}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// Client email (confirmation + reminder share one template)
// ---------------------------------------------------------------------------

const C = {
  cream: "#faf8f5",
  blush: "#f9ece8",
  ink: "#2d2b2a",
  soft: "#6f5f5b",
  faint: "#9a8c88",
  line: "#eadfda",
  rose: "#b86b6c",
  terracotta: "#9e4b50",
  gold: "#c5a059",
};

function row(label: string, value: string, strong = false): string {
  return `<tr>
    <td style="padding:7px 0;color:${C.faint};font-size:14px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:7px 0 7px 16px;color:${strong ? C.terracotta : C.ink};font-size:14px;text-align:right;${strong ? "font-weight:600;" : ""}">${value}</td>
  </tr>`;
}

function card(title: string, inner: string, accent = false): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid ${accent ? C.gold : C.line};border-radius:16px;background:#ffffff;">
    <tr><td style="padding:18px 20px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.soft};font-family:Arial,Helvetica,sans-serif;font-weight:600;">${esc(title)}</p>
      ${inner}
    </td></tr>
  </table>`;
}

function renderClientEmail(kind: "confirmation" | "reminder", d: BookingEmailData) {
  const c = COPY[d.locale];
  const money = (n: number) => formatMoneyFromCents(n, d.locale);
  const when = fmtWhen(d.startAt, d.locale);
  const title = kind === "confirmation" ? c.confirmedTitle : c.reminderTitle;
  const lead = kind === "confirmation" ? c.confirmedLead : c.reminderLead;
  const subject =
    kind === "confirmation"
      ? c.confirmedSubject(d.reference)
      : c.reminderSubject(fmtWhen(d.startAt, d.locale, { weekday: "long", day: "numeric", month: "long", hour: undefined, minute: undefined }));

  const balance = d.estimatedTotalCents != null ? Math.max(0, d.estimatedTotalCents - (d.depositPaid ? d.depositCents : 0)) : null;

  const detailRows = [
    row(c.service, esc(d.serviceName)),
    d.addonNames.length ? row(c.extras, esc(d.addonNames.join(", "))) : "",
    row(c.when, esc(when)),
    row(c.duration, `${d.durationMin} ${c.minutes}`),
    row(c.reference, `<span style="font-family:Menlo,Consolas,monospace;font-size:12px;">${esc(d.reference)}</span>`),
  ].join("");

  const amountRows = [
    d.estimatedTotalCents != null ? row(c.estTotal, money(d.estimatedTotalCents)) : "",
    row(c.deposit, `${money(d.depositCents)} <span style="color:${d.depositPaid ? C.rose : C.faint};font-size:12px;">${d.depositPaid ? c.depositPaid : c.depositPending}</span>`),
    balance != null ? row(c.balance, money(balance), true) : "",
  ].join("");

  const addr = BRAND.studioAddress;
  const partnerUrl = cmacUtm(CMAC_BEAUTY.home, "email", "booking-confirmation");
  const partnerHtml =
    kind === "confirmation"
      ? `<p style="margin:0 6px 14px;font-size:12px;color:${C.faint};line-height:1.5;">${esc(c.partner)} → <a href="${esc(partnerUrl)}" style="color:${C.terracotta};text-decoration:none;">cmacbeauty.ca</a></p>`
      : "";
  const html = `<!doctype html>
<html lang="${d.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};">
  <tr><td style="padding:0 6px 18px;">
    <span style="font-size:22px;font-weight:600;letter-spacing:0.01em;">Couca &amp; Co.</span>
    <span style="display:block;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:${C.gold};font-family:Arial,Helvetica,sans-serif;">Nail Studio</span>
  </td></tr>
  <tr><td style="padding:0 6px 6px;">
    <h1 style="margin:0;font-size:30px;font-weight:500;line-height:1.15;">${esc(title)}</h1>
  </td></tr>
  <tr><td style="padding:0 6px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${C.soft};">
    <p style="margin:0 0 6px;">${esc(c.hello(d.contactName))}</p>
    <p style="margin:0;">${esc(lead)}</p>
  </td></tr>
  <tr><td style="font-family:Arial,Helvetica,sans-serif;">
    ${card(c.detailsTitle, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>`)}
    ${card(
      c.whereTitle,
      `<p style="margin:0 0 10px;font-size:15px;color:${C.ink};line-height:1.5;">${esc(addr.street)}<br>${esc(addr.city)} (${esc(addr.province)}) ${esc(addr.postal)}</p>
       <a href="${addr.mapsUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${C.terracotta};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">${esc(c.directions)} →</a>
       <p style="margin:12px 0 0;font-size:12px;color:${C.faint};line-height:1.5;">${esc(c.whereNote)}</p>`,
      true,
    )}
    ${card(c.amountsTitle, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${amountRows}</table><p style="margin:8px 0 0;font-size:12px;color:${C.faint};">${esc(c.balanceNote)}</p>`)}
    <p style="margin:0 6px 18px;font-size:13px;color:${C.soft};line-height:1.5;">📅 ${esc(c.calendar)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border:1px dashed ${C.gold};border-radius:14px;background:#fdf9f3;">
      <tr><td style="padding:14px 18px;font-size:12.5px;line-height:1.55;color:${C.soft};">
        <strong style="color:${C.ink};">${esc(c.policyTitle)}</strong><br>${esc(c.policy)}
      </td></tr>
    </table>
    <p style="margin:0 6px 4px;font-size:14px;color:${C.soft};line-height:1.55;">${esc(c.questions)}</p>
    <p style="margin:0 6px 26px;font-size:14px;color:${C.soft};line-height:1.55;">${esc(c.seeYou)}<br><span style="color:${C.ink};">${esc(c.signature)}</span></p>
    ${partnerHtml}
    <p style="margin:0 6px;font-size:12px;color:${C.faint};">
      <a href="${BRAND.instagramProfile}" style="color:${C.terracotta};text-decoration:none;">Instagram ${esc(BRAND.instagramHandle)}</a>
      &nbsp;·&nbsp; <a href="${BRAND.domain}" style="color:${C.terracotta};text-decoration:none;">coucabeauty.ca</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    title,
    "",
    c.hello(d.contactName),
    lead,
    "",
    `${c.service}: ${d.serviceName}`,
    d.addonNames.length ? `${c.extras}: ${d.addonNames.join(", ")}` : null,
    `${c.when}: ${when}`,
    `${c.duration}: ${d.durationMin} ${c.minutes}`,
    `${c.reference}: ${d.reference}`,
    "",
    `${c.whereTitle}: ${addr.line}`,
    `${c.directions}: ${addr.mapsUrl}`,
    "",
    d.estimatedTotalCents != null ? `${c.estTotal}: ${money(d.estimatedTotalCents)}` : null,
    `${c.deposit}: ${money(d.depositCents)} (${d.depositPaid ? c.depositPaid : c.depositPending})`,
    balance != null ? `${c.balance}: ${money(balance)}` : null,
    "",
    `${c.policyTitle}: ${c.policy}`,
    "",
    c.seeYou,
    c.signature,
    `${BRAND.instagramHandle} · ${BRAND.domain}`,
    kind === "confirmation" ? "" : null,
    kind === "confirmation" ? `${c.partner} → ${partnerUrl}` : null,
  ]
    .filter((l) => l != null)
    .join("\n");

  return { subject, html, text };
}

export async function sendBookingConfirmation(d: BookingEmailData): Promise<void> {
  const { subject, html, text } = renderClientEmail("confirmation", d);
  await sendClientEmail({
    to: d.contactEmail,
    subject,
    html,
    text,
    replyTo: BRAND.email,
    attachments: [{ filename: "couca-rendez-vous.ics", content: Buffer.from(buildBookingIcs(d)).toString("base64") }],
  });
}

/**
 * Sends a copy of a booking's confirmation to the studio inbox ONLY (never the
 * client). Used to backfill bookings made before the studio was BCC'd.
 */
export async function sendConfirmationCopyToStudio(d: BookingEmailData): Promise<void> {
  const { subject, html, text } = renderClientEmail("confirmation", d);
  await sendEmail({
    to: ownerNotifyAddresses(),
    subject: `[Copie studio] ${subject} · ${d.contactName}`,
    html,
    text: `Copie de la confirmation envoyée à ${d.contactName} <${d.contactEmail}>

${text}`,
    replyTo: d.contactEmail,
    attachments: [{ filename: "couca-rendez-vous.ics", content: Buffer.from(buildBookingIcs(d)).toString("base64") }],
  });
}

export async function sendBookingReminder(d: BookingEmailData): Promise<void> {
  const { subject, html, text } = renderClientEmail("reminder", d);
  await sendClientEmail({ to: d.contactEmail, subject, html, text, replyTo: BRAND.email });
}

// ---------------------------------------------------------------------------
// Deposit reminder: booking picked but the $20 deposit was never paid
// ---------------------------------------------------------------------------

const DEPOSIT = {
  fr: {
    subject: (when: string) => `Votre place du ${when} vous attend ✨`,
    eyebrow: "Plus qu'une étape",
    title: "Votre place vous attend",
    lead: "Vous avez choisi votre moment chez Couca & Co. Beauty, mais le dépôt n'a pas été complété. Votre rendez-vous n'est donc pas encore confirmé.",
    stepsTitle: "Confirmer en 1 minute",
    steps: [
      "Touchez le bouton ci-dessous.",
      "Réglez le dépôt de 20 $ en toute sécurité avec Stripe.",
      "Recevez aussitôt votre confirmation, l'adresse du studio et le fichier calendrier.",
    ],
    cta: "Confirmer ma place · 20 $",
    applied: "Le dépôt est déduit de votre total en studio : vous ne payez rien de plus.",
    hold: "Les places non confirmées peuvent être offertes à une autre cliente. Confirmez dès que possible pour garder la vôtre.",
    change: "Ce moment ne vous convient plus ? Répondez simplement à ce courriel et on trouve un autre créneau ensemble.",
    secure: "Paiement sécurisé par Stripe · Visa, Mastercard, Apple Pay, Google Pay",
  },
  en: {
    subject: (when: string) => `Your spot on ${when} is waiting ✨`,
    eyebrow: "One step left",
    title: "Your spot is waiting",
    lead: "You picked your time at Couca & Co. Beauty, but the deposit wasn't completed, so your appointment isn't confirmed yet.",
    stepsTitle: "Confirm in 1 minute",
    steps: [
      "Tap the button below.",
      "Pay the $20 deposit securely with Stripe.",
      "Get your confirmation, the studio address and a calendar file right away.",
    ],
    cta: "Confirm my spot · $20",
    applied: "The deposit comes off your in-studio total, so you pay nothing extra.",
    hold: "Unconfirmed spots may be offered to another client. Confirm soon to keep yours.",
    change: "Time doesn't work anymore? Just reply to this email and we'll find another slot together.",
    secure: "Secure payment by Stripe · Visa, Mastercard, Apple Pay, Google Pay",
  },
} as const;

export async function sendDepositReminder(
  d: BookingEmailData,
  payUrl: string,
  opts: ClientSendOptions = {},
): Promise<SendResult[]> {
  const k = DEPOSIT[d.locale];
  const c = COPY[d.locale];
  const when = fmtWhen(d.startAt, d.locale);
  const shortWhen = fmtWhen(d.startAt, d.locale, { weekday: "long", day: "numeric", month: "long", hour: undefined, minute: undefined });
  const subject = k.subject(shortWhen);

  const detailRows = [
    row(c.service, esc(d.serviceName)),
    d.addonNames.length ? row(c.extras, esc(d.addonNames.join(", "))) : "",
    row(c.when, `<strong>${esc(when)}</strong>`),
    row(c.duration, `${d.durationMin} ${c.minutes}`),
    d.estimatedTotalCents != null ? row(c.estTotal, formatMoneyFromCents(d.estimatedTotalCents, d.locale)) : "",
  ].join("");

  const steps = k.steps
    .map(
      (s, i) => `<tr>
        <td style="width:30px;padding:6px 0;vertical-align:top;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:999px;background:${C.blush};color:${C.terracotta};font-size:12px;font-weight:700;text-align:center;">${i + 1}</span></td>
        <td style="padding:6px 0;font-size:14px;color:${C.ink};line-height:1.5;">${esc(s)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="${d.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(k.lead)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};">
  <tr><td style="padding:0 6px 18px;">
    <span style="font-size:22px;font-weight:600;">Couca &amp; Co.</span>
    <span style="display:block;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:${C.gold};font-family:Arial,Helvetica,sans-serif;">Nail Studio</span>
  </td></tr>
  <tr><td style="padding:0 6px 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.terracotta};font-weight:700;">${esc(k.eyebrow)}</td></tr>
  <tr><td style="padding:0 6px 6px;"><h1 style="margin:0;font-size:32px;font-weight:500;line-height:1.12;">${esc(k.title)}</h1></td></tr>
  <tr><td style="padding:0 6px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${C.soft};">
    <p style="margin:0 0 6px;">${esc(c.hello(d.contactName))}</p>
    <p style="margin:0;">${esc(k.lead)}</p>
  </td></tr>
  <tr><td style="font-family:Arial,Helvetica,sans-serif;">
    ${card(c.detailsTitle, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid ${C.gold};border-radius:16px;background:#fdf9f3;">
      <tr><td style="padding:20px 20px 22px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.soft};font-weight:600;">${esc(k.stepsTitle)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${steps}</table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <a href="${esc(payUrl)}" style="display:block;padding:15px 22px;border-radius:999px;background:${C.terracotta};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;text-align:center;">${esc(k.cta)} →</a>
        </td></tr></table>
        <p style="margin:12px 0 0;font-size:12px;color:${C.faint};text-align:center;">🔒 ${esc(k.secure)}</p>
        <p style="margin:12px 0 0;font-size:13px;color:${C.soft};line-height:1.5;text-align:center;">${esc(k.applied)}</p>
      </td></tr>
    </table>
    <p style="margin:0 6px 10px;font-size:13px;color:${C.soft};line-height:1.55;">${esc(k.hold)}</p>
    <p style="margin:0 6px 18px;font-size:13px;color:${C.soft};line-height:1.55;">${esc(k.change)}</p>
    <p style="margin:0 6px 26px;font-size:14px;color:${C.soft};line-height:1.55;">${esc(c.seeYou)}<br><span style="color:${C.ink};">${esc(c.signature)}</span></p>
    <p style="margin:0 6px;font-size:12px;color:${C.faint};">
      <a href="${BRAND.instagramProfile}" style="color:${C.terracotta};text-decoration:none;">Instagram ${esc(BRAND.instagramHandle)}</a>
      &nbsp;·&nbsp; <a href="${BRAND.domain}" style="color:${C.terracotta};text-decoration:none;">coucabeauty.ca</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    k.title,
    "",
    c.hello(d.contactName),
    k.lead,
    "",
    `${c.service}: ${d.serviceName}${d.addonNames.length ? ` + ${d.addonNames.join(", ")}` : ""}`,
    `${c.when}: ${when}`,
    "",
    `${k.cta}: ${payUrl}`,
    k.applied,
    "",
    k.hold,
    k.change,
    "",
    c.seeYou,
    c.signature,
  ].join("\n");

  return sendClientEmail(
    {
      to: d.contactEmail,
      subject,
      html,
      text,
      replyTo: BRAND.email,
    },
    opts,
  );
}

// ---------------------------------------------------------------------------
// Day-after follow-up: thank you + Google review + book the next visit
// ---------------------------------------------------------------------------

const FOLLOW = {
  fr: {
    subject: "Merci pour votre visite 💅🏾",
    title: "Merci d'être venue !",
    lead: "J'espère que vous adorez vos ongles. Votre avis compte énormément pour un petit studio comme le nôtre.",
    reviewTitle: "30 secondes pour nous aider",
    reviewText: "Un avis Google aide d'autres clientes à nous trouver. Une photo de vos ongles dans l'avis, c'est encore mieux !",
    reviewCta: "Laisser un avis Google",
    rebookTitle: "Votre prochain rendez-vous",
    rebookFill: "Pour des ongles impeccables, un remplissage est idéal après 2 à 3 semaines. Les places partent vite : réservez dès maintenant.",
    rebookOther: "Réservez votre prochaine visite en quelques clics, le créneau de votre choix vous attend.",
    rebookCta: "Réserver mon prochain rendez-vous",
    club: "Chaque visite compte dans votre Couca Club : les récompenses arrivent vite.",
    issue: "Un souci avec votre pose ? Répondez simplement à ce courriel, on s'en occupe.",
  },
  en: {
    subject: "Thank you for your visit 💅🏾",
    title: "Thanks for coming in!",
    lead: "I hope you love your nails. Your feedback means a lot to a small studio like ours.",
    reviewTitle: "30 seconds to help us",
    reviewText: "A Google review helps other clients find us. A photo of your nails in the review is even better!",
    reviewCta: "Leave a Google review",
    rebookTitle: "Your next appointment",
    rebookFill: "For flawless nails, a fill is ideal after 2 to 3 weeks. Spots go fast, so book now.",
    rebookOther: "Book your next visit in a few taps. Your favourite time slot is waiting.",
    rebookCta: "Book my next appointment",
    club: "Every visit counts toward your Couca Club rewards.",
    issue: "Any issue with your set? Just reply to this email and we'll take care of it.",
  },
} as const;

/** Sets that grow out and need a fill; everything else rebooks the same service. */
const FILL_SERVICES = /^(acrylique|gelx|builder-gel|remplissage)/;

export function rebookSlugFor(serviceSlug: string): string {
  return FILL_SERVICES.test(serviceSlug) ? "remplissage" : serviceSlug;
}

export async function sendBookingFollowUp(d: BookingEmailData, serviceSlug: string): Promise<void> {
  const f = FOLLOW[d.locale];
  const reviewUrl = process.env.GOOGLE_REVIEW_URL || null;
  const rebookSlug = rebookSlugFor(serviceSlug);
  const rebookUrl = `${BRAND.domain}/reserver?service=${encodeURIComponent(rebookSlug)}&utm_source=email&utm_medium=followup&utm_campaign=rebook`;
  const rebookText = rebookSlug === "remplissage" ? f.rebookFill : f.rebookOther;
  const btn = (href: string, label: string, bg: string) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${bg};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${esc(label)} →</a>`;

  const reviewCard = reviewUrl
    ? card(
        f.reviewTitle,
        `<p style="margin:0 0 6px;font-size:22px;letter-spacing:0.1em;color:${C.gold};">★★★★★</p>
         <p style="margin:0 0 12px;font-size:14px;color:${C.ink};line-height:1.55;">${esc(f.reviewText)}</p>
         ${btn(reviewUrl, f.reviewCta, C.terracotta)}`,
        true,
      )
    : "";

  const html = `<!doctype html>
<html lang="${d.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(f.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};">
  <tr><td style="padding:0 6px 18px;">
    <span style="font-size:22px;font-weight:600;">Couca &amp; Co.</span>
    <span style="display:block;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:${C.gold};font-family:Arial,Helvetica,sans-serif;">Nail Studio</span>
  </td></tr>
  <tr><td style="padding:0 6px 6px;"><h1 style="margin:0;font-size:30px;font-weight:500;line-height:1.15;">${esc(f.title)}</h1></td></tr>
  <tr><td style="padding:0 6px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${C.soft};">
    <p style="margin:0 0 6px;">${esc(COPY[d.locale].hello(d.contactName))}</p>
    <p style="margin:0;">${esc(f.lead)}</p>
  </td></tr>
  <tr><td style="font-family:Arial,Helvetica,sans-serif;">
    ${reviewCard}
    ${card(f.rebookTitle, `<p style="margin:0 0 12px;font-size:14px;color:${C.ink};line-height:1.55;">${esc(rebookText)}</p>${btn(rebookUrl, f.rebookCta, C.ink)}<p style="margin:12px 0 0;font-size:12px;color:${C.faint};">${esc(f.club)}</p>`)}
    <p style="margin:0 6px 4px;font-size:14px;color:${C.soft};line-height:1.55;">${esc(f.issue)}</p>
    <p style="margin:0 6px 26px;font-size:14px;color:${C.soft};line-height:1.55;">${esc(COPY[d.locale].seeYou)}<br><span style="color:${C.ink};">${esc(COPY[d.locale].signature)}</span></p>
    <p style="margin:0 6px;font-size:12px;color:${C.faint};">
      <a href="${BRAND.instagramProfile}" style="color:${C.terracotta};text-decoration:none;">Instagram ${esc(BRAND.instagramHandle)}</a>
      &nbsp;·&nbsp; <a href="${BRAND.domain}" style="color:${C.terracotta};text-decoration:none;">coucabeauty.ca</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    f.title,
    "",
    COPY[d.locale].hello(d.contactName),
    f.lead,
    "",
    reviewUrl ? `${f.reviewText}\n${f.reviewCta}: ${reviewUrl}` : null,
    "",
    rebookText,
    `${f.rebookCta}: ${rebookUrl}`,
    "",
    f.issue,
    COPY[d.locale].seeYou,
    COPY[d.locale].signature,
  ]
    .filter((l) => l != null)
    .join("\n");

  await sendClientEmail({ to: d.contactEmail, subject: f.subject, html, text, replyTo: BRAND.email });
}

// ---------------------------------------------------------------------------
// Owner notifications
// ---------------------------------------------------------------------------

function ownerFrame(title: string, inner: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:18px 12px;background:${C.cream};font-family:Arial,Helvetica,sans-serif;color:${C.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="padding:0 0 10px;font-family:Georgia,serif;font-size:18px;font-weight:600;">Couca &amp; Co. <span style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${C.gold};margin-left:6px;">Espace studio</span></td></tr>
  <tr><td style="padding:0 0 14px;font-size:22px;font-family:Georgia,serif;">${esc(title)}</td></tr>
  <tr><td>${inner}</td></tr>
</table></body></html>`;
}

export async function sendOwnerBookingNotice(d: BookingEmailData): Promise<void> {
  const to = ownerNotifyAddresses();
  const when = fmtWhen(d.startAt, "fr");
  const shortWhen = new Intl.DateTimeFormat("fr-CA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: STUDIO_TZ }).format(d.startAt);
  const pendingDeposit = !d.depositPaid;
  const subject = `${pendingDeposit ? "Dépôt en attente" : "Nouvelle réservation"} · ${d.contactName} · ${shortWhen}`;
  const money = (n: number) => formatMoneyFromCents(n, "fr");

  const photos = d.inspoImages.length
    ? `<p style="margin:14px 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.soft};font-weight:600;">Photos inspo (${d.inspoImages.length})</p>
       <table role="presentation" cellpadding="0" cellspacing="0"><tr>${d.inspoImages
         .map((u) => `<td style="padding:0 8px 8px 0;"><a href="${u}"><img src="${u}" width="150" alt="Inspo" style="display:block;width:150px;height:150px;object-fit:cover;border-radius:12px;border:1px solid ${C.line};"></a></td>`)
         .join("")}</tr></table>`
    : "";

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;background:#fff;"><tr><td style="padding:14px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Cliente", `<strong>${esc(d.contactName)}</strong>`)}
        ${row("Courriel", `<a href="mailto:${esc(d.contactEmail)}" style="color:${C.terracotta};">${esc(d.contactEmail)}</a>`)}
        ${d.contactPhone ? row("Téléphone", `<a href="tel:${esc(d.contactPhone.replace(/\s/g, ""))}" style="color:${C.terracotta};">${esc(d.contactPhone)}</a>`) : ""}
        ${row("Service", esc(d.serviceName))}
        ${d.addonNames.length ? row("Extras", esc(d.addonNames.join(", "))) : ""}
        ${row("Quand", `<strong>${esc(when)}</strong>`)}
        ${row("Durée", `${d.durationMin} min`)}
        ${d.estimatedTotalCents != null ? row("Total estimé", money(d.estimatedTotalCents)) : ""}
        ${row("Dépôt", `${money(d.depositCents)} — ${d.depositPaid ? "payé ✓" : "non payé"}`, true)}
        ${row("Réf.", `<span style="font-family:Menlo,Consolas,monospace;font-size:12px;">${esc(d.reference)}</span>`)}
      </table>
      ${d.notes ? `<p style="margin:12px 0 0;padding:10px 12px;background:${C.blush};border-radius:10px;font-size:13px;line-height:1.5;"><strong>Note de la cliente :</strong><br>${esc(d.notes).replace(/\n/g, "<br>")}</p>` : ""}
      ${photos}
    </td></tr></table>
    <p style="margin:16px 0 0;"><a href="${BRAND.domain}/admin/bookings" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${C.ink};color:#fff;text-decoration:none;font-size:13px;font-weight:600;">Ouvrir dans l'espace studio →</a></p>`;

  const text = [
    subject,
    `Cliente: ${d.contactName} <${d.contactEmail}>${d.contactPhone ? ` · ${d.contactPhone}` : ""}`,
    `Service: ${d.serviceName}${d.addonNames.length ? ` + ${d.addonNames.join(", ")}` : ""}`,
    `Quand: ${when} (${d.durationMin} min)`,
    d.estimatedTotalCents != null ? `Total estimé: ${money(d.estimatedTotalCents)}` : null,
    `Dépôt: ${money(d.depositCents)} — ${d.depositPaid ? "payé" : "non payé"}`,
    `Réf: ${d.reference}`,
    d.notes ? `Note: ${d.notes}` : null,
    d.inspoImages.length ? `Photos: ${d.inspoImages.join(" ")}` : null,
    `${BRAND.domain}/admin/bookings`,
  ]
    .filter((l) => l != null)
    .join("\n");

  await Promise.all([
    sendEmail({ to, subject, html: ownerFrame(pendingDeposit ? "Réservation en attente de dépôt" : "Nouvelle réservation", inner), text, replyTo: d.contactEmail }),
    sendOwnerSms(`RDV Couca: ${d.contactName}, ${shortWhen}, ${d.serviceName}${d.contactPhone ? `, ${d.contactPhone}` : ""}. Dépôt ${d.depositPaid ? "payé" : "non payé"}.`),
  ]);
}

export type OrderNoticeData = {
  reference: string;
  contactEmail: string;
  items: { name: string; qty: number; priceCents: number; options?: Record<string, string> }[];
  subtotalCents: number;
  shipping: unknown;
};

export async function sendOwnerOrderNotice(o: OrderNoticeData): Promise<void> {
  const to = ownerNotifyAddresses();
  const money = (n: number) => formatMoneyFromCents(n, "fr");
  const subject = `Nouvelle commande boutique · ${money(o.subtotalCents)} · ${o.reference.slice(-8).toUpperCase()}`;
  const ship = o.shipping as { name?: string; phone?: string; address?: Record<string, string | null> } | null;
  const addrLines = ship?.address
    ? [ship.name, ship.address.line1, ship.address.line2, `${ship.address.postal_code ?? ""} ${ship.address.city ?? ""}`.trim(), ship.address.state, ship.phone ?? ship?.phone]
        .filter(Boolean)
        .map(String)
    : [];

  const lines = o.items
    .map((i) => {
      const opts = i.options && Object.keys(i.options).length ? ` <span style="color:${C.faint};">(${esc(Object.values(i.options).join(", "))})</span>` : "";
      return row(`${i.qty} × ${esc(i.name)}${opts}`, money(i.priceCents * i.qty));
    })
    .join("");

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;background:#fff;"><tr><td style="padding:14px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${lines}
        ${row("Sous-total", `<strong>${money(o.subtotalCents)}</strong>`, true)}
        ${row("Courriel", `<a href="mailto:${esc(o.contactEmail)}" style="color:${C.terracotta};">${esc(o.contactEmail)}</a>`)}
        ${row("Réf.", `<span style="font-family:Menlo,Consolas,monospace;font-size:12px;">${esc(o.reference)}</span>`)}
      </table>
      ${addrLines.length ? `<p style="margin:12px 0 0;padding:10px 12px;background:${C.blush};border-radius:10px;font-size:13px;line-height:1.5;"><strong>Livraison :</strong><br>${addrLines.map(esc).join("<br>")}</p>` : ""}
    </td></tr></table>
    <p style="margin:16px 0 0;"><a href="${BRAND.domain}/admin/orders" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${C.ink};color:#fff;text-decoration:none;font-size:13px;font-weight:600;">Ouvrir les commandes →</a></p>`;

  const text = [
    subject,
    ...o.items.map((i) => `${i.qty} × ${i.name}${i.options ? ` (${Object.values(i.options).join(", ")})` : ""} — ${money(i.priceCents * i.qty)}`),
    `Sous-total: ${money(o.subtotalCents)}`,
    `Courriel: ${o.contactEmail}`,
    addrLines.length ? `Livraison: ${addrLines.join(", ")}` : null,
    `Réf: ${o.reference}`,
    `${BRAND.domain}/admin/orders`,
  ]
    .filter((l) => l != null)
    .join("\n");

  await Promise.all([
    sendEmail({ to, subject, html: ownerFrame("Nouvelle commande boutique", inner), text, replyTo: o.contactEmail }),
    sendOwnerSms(`Commande Couca: ${money(o.subtotalCents)}, ${o.contactEmail}. Voir l'espace studio.`),
  ]);
}
