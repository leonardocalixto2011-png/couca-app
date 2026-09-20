"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import type { GoogleReviewsData } from "@/lib/reviews";

/** Honest placeholder — no invented reviews. Structure only. */
const SLOTS = [
  { fr: "Votre expérience Couca & Co. prendra place ici.", en: "Your Couca & Co. experience will go here.", who: { fr: "Première cliente", en: "First client" } },
  { fr: "Un mot sur la tenue, le confort, l'ambiance du studio.", en: "A word on wear, comfort, the studio's vibe.", who: { fr: "Membre Couca Club", en: "Couca Club member" } },
  { fr: "Votre look préféré, dans vos mots.", en: "Your favourite look, in your words.", who: { fr: "Modèle de lancement", en: "Launch model" } },
];

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={className} aria-label={`${n} / 5`}>
      {"★".repeat(Math.round(n))}
      <span className="text-line">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

export function Testimonials({
  google,
  reviewUrl,
}: {
  google: GoogleReviewsData | null;
  reviewUrl: string | null;
}) {
  const { t, locale } = useLocale();
  const live = google && google.reviews.length > 0;

  return (
    <section id="avis" className="section-pad bg-blush">
      <div className="container-x">
        <Reveal className="mb-9 grid gap-x-12 gap-y-6 md:grid-cols-2 md:items-end">
          <div>
            <span className="eyebrow">{live ? t("voices.google.eyebrow") : t("voices.eyebrow")}</span>
            <h2 className="mt-4 text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)]">
              {live ? t("voices.google.h2") : t("voices.h2")}
            </h2>
            {google && (
              <p className="mt-3 flex items-center gap-2.5 text-ink-soft">
                <Stars n={google.rating} className="text-[1.1rem] tracking-[0.08em] text-gold" />
                <span className="text-[0.95rem]">
                  {t("voices.ratingOf", { r: google.rating.toFixed(1), n: google.count })}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="max-w-[52ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft md:text-right">
              {live ? t("voices.google.p") : t("voices.p")}
            </p>
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener" className="btn btn--ghost btn--sm">
                <Icon name="spark" />
                {t("voices.leaveReview")}
              </a>
            )}
          </div>
        </Reveal>

        {live ? (
          <div className="grid gap-4 md:grid-cols-3">
            {google.reviews.map((r, i) => (
              <Reveal
                as="figure"
                key={i}
                className="flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-line bg-white p-6"
              >
                <Stars n={r.rating} className="text-[0.95rem] tracking-[0.08em] text-gold" />
                <blockquote className="text-[0.95rem] leading-relaxed text-ink">
                  {r.text.length > 320 ? r.text.slice(0, 317).trimEnd() + "…" : r.text}
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-2.5 text-[0.8rem] text-ink-faint">
                  {r.authorPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.authorPhoto} alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
                  )}
                  <span className="font-medium text-ink-soft">{r.author}</span>
                  {r.when && <span>· {r.when}</span>}
                </figcaption>
              </Reveal>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
