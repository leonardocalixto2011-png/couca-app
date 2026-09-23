"use client";

import { useState, useTransition } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { joinWaitlist } from "@/app/reserver/actions";

/**
 * Shown when the client hits a wall (day full, or the whole calendar blocked).
 * Captures the booking instead of losing it: the daily job emails everyone
 * waiting as soon as the calendar has room again.
 */
export function WaitlistForm({
  serviceSlug,
  serviceName,
  wantedDate,
}: {
  serviceSlug?: string;
  serviceName?: string;
  wantedDate?: string;
}) {
  const { locale } = useLocale();
  const fr = locale !== "en";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const valid = name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  if (done) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] p-4 text-[0.92rem] text-ink">
        {fr
          ? "C'est noté ! On vous écrit dès qu'une place se libère."
          : "You're on the list! We'll email you as soon as a spot opens up."}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn--ghost btn--sm self-start">
        <Icon name="spark" />
        {fr ? "Prévenez-moi dès qu'une place se libère" : "Tell me when a spot opens"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_5%,transparent)] p-4">
      <p className="text-[0.92rem] text-ink-soft">
        {fr
          ? "Laissez-nous votre nom et votre courriel : vous serez prévenue en priorité, sans engagement."
          : "Leave your name and email: you'll hear first, with no commitment."}
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={fr ? "Votre nom" : "Your name"}
        autoComplete="name"
        className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem]"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={fr ? "Votre courriel" : "Your email"}
        type="email"
        autoComplete="email"
        className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem]"
      />
      {failed && (
        <p className="text-sm text-terracotta">
          {fr ? "Un souci est survenu. Réessayez ou écrivez-nous sur Instagram." : "Something went wrong. Try again or message us on Instagram."}
        </p>
      )}
      <button
        type="button"
        disabled={!valid || pending}
        onClick={() =>
          start(async () => {
            setFailed(false);
            const res = await joinWaitlist({
              name,
              email,
              serviceSlug,
              serviceName,
              wantedDate,
              locale: fr ? "fr" : "en",
            });
            if (res.ok) setDone(true);
            else setFailed(true);
          })
        }
        className="btn btn--sm self-start"
      >
        {pending ? "…" : fr ? "M'ajouter à la liste" : "Add me to the list"}
      </button>
    </div>
  );
}
