"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { BRAND } from "@/lib/brand";

export function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t, locale } = useLocale();
  return (
    <section className="section-pad">
      <div className="container-x mx-auto max-w-[560px] text-center">
        <span className="eyebrow justify-center">{BRAND.name}</span>
        <h1 className="mt-4 text-[clamp(2.2rem,1.6rem+3vw,3.4rem)]">{t(titleKey)}</h1>
        <p className="mx-auto mt-4 max-w-[44ch] text-ink-soft">
          {locale === "fr"
            ? "Cette section arrive bientôt. En attendant, écrivez-nous en message privé pour votre rendez-vous."
            : "This section is coming soon. In the meantime, message us to book your appointment."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={BRAND.instagramDM} target="_blank" rel="noopener" className="btn">
            <Icon name="instagram" />
            {t("ig.dm")}
          </a>
          <Link href="/" className="btn btn--ghost">
            {t("nav.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
