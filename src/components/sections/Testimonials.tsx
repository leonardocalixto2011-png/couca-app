"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";

/** Honest placeholder — no invented reviews. Structure only. */
const SLOTS = [
  { fr: "Votre expérience Couca & Co. prendra place ici.", en: "Your Couca & Co. experience will go here.", who: { fr: "Première cliente", en: "First client" } },
  { fr: "Un mot sur la tenue, le confort, l'ambiance du studio.", en: "A word on wear, comfort, the studio's vibe.", who: { fr: "Membre Couca Club", en: "Couca Club member" } },
  { fr: "Votre look préféré, dans vos mots.", en: "Your favourite look, in your words.", who: { fr: "Modèle de lancement", en: "Launch model" } },
];

export function Testimonials() {
  const { t, locale } = useLocale();

  return (
    <section className="section-pad bg-blush">
      <div className="container-x">
        <Reveal className="mb-9 grid gap-x-12 gap-y-6 md:grid-cols-2 md:items-end">
          <div>
            <span className="eyebrow">{t("voices.eyebrow")}</span>
            <h2 className="mt-4 text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)]">{t("voices.h2")}</h2>
          </div>
          <p className="max-w-[52ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft">
            {t("voices.p")}
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {SLOTS.map((s, i) => (
            <figure
              key={i}
              className="flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-dashed border-[var(--line-gold)] bg-[color-mix(in_srgb,var(--color-gold)_5%,transparent)] p-6"
            >
              <Icon name="quote" className="h-6 w-6 text-gold-muted" />
              <p className="text-[0.94rem] italic text-ink-faint">{locale === "fr" ? s.fr : s.en}</p>
              <figcaption className="mt-auto text-[0.8rem] uppercase tracking-[0.14em] text-ink-faint">
                {locale === "fr" ? s.who.fr : s.who.en}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
