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
  subject: string;
  html?: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
};

export async function sendEmail(input: SendInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`;
  if (!apiKey) {
    console.info(`[email:dev] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
        attachments: input.attachments,
      }),
    });
    if (!res.ok) console.error(`[email] Resend responded ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

/** Where owner notifications go. Falls back to the admin login email. */
function splitList(v: string | undefined): string[] {
  return (v ?? "")
    .split(/[,;s]+/)
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
  await sendEmail({
    to: d.contactEmail,
    subject,
    html,
    text,
    replyTo: BRAND.email,
    attachments: [{ filename: "couca-rendez-vous.ics", content: Buffer.from(buildBookingIcs(d)).toString("base64") }],
  });
}

export async function sendBookingReminder(d: BookingEmailData): Promise<void> {
  const { subject, html, text } = renderClientEmail("reminder", d);
  await sendEmail({ to: d.contactEmail, subject, html, text, replyTo: BRAND.email });
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
  const subject = `Nouvelle réservation · ${d.contactName} · ${shortWhen}`;
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
    sendEmail({ to, subject, html: ownerFrame("Nouvelle réservation", inner), text, replyTo: d.contactEmail }),
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
