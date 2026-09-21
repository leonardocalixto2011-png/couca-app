"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "./Icon";
import { BRAND } from "@/lib/brand";

export function Footer() {
  const { t } = useLocale();
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer id="contact" className="on-dark bg-charcoal py-[clamp(3.5rem,2.5rem+5vw,6rem)] text-blush-light">
      <div className="container-x grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="flex flex-col leading-none">
            <b className="font-display text-2xl font-semibold text-cream">{BRAND.name}</b>
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.34em] text-gold-muted">
              Nail Studio
            </span>
          </span>
          <p className="mt-4 max-w-[34ch] text-[0.94rem] text-blush-light">{t("footer.tag")}</p>
          <Link href="/reserver" className="btn mt-5">
            {t("nav.bookRdv")}
            <Icon name="arrow" />
          </Link>
        </div>

        <nav aria-label={t("footer.navTitle")}>
          <h4 className="mb-4 font-ui text-[0.72rem] uppercase tracking-[0.2em] text-gold-muted">
            {t("footer.navTitle")}
          </h4>
          <ul className="flex flex-col gap-2.5 text-[0.94rem]">
            <li><Link href="/#services" className="text-blush-light hover:text-cream">{t("nav.services")}</Link></li>
            <li><Link href="/#prix" className="text-blush-light hover:text-cream">{t("nav.prices")}</Link></li>
            <li><Link href="/#inspo" className="text-blush-light hover:text-cream">{t("nav.inspo")}</Link></li>
            <li><Link href="/#couca-club" className="text-blush-light hover:text-cream">{t("nav.club")}</Link></li>
            <li><Link href="/boutique" className="text-blush-light hover:text-cream">{t("nav.boutique")}</Link></li>
          </ul>
        </nav>

        <div className="flex flex-col gap-7">
          <div>
            <h4 className="mb-4 font-ui text-[0.72rem] uppercase tracking-[0.2em] text-gold-muted">
              {t("footer.joinTitle")}
            </h4>
            <ul className="flex flex-col gap-2.5 text-[0.94rem]">
              <li>
                <a href={BRAND.instagramProfile} target="_blank" rel="noopener" className="text-blush-light hover:text-cream">
                  Instagram {BRAND.instagramHandle}
                </a>
              </li>
              <li>
                <a href={`mailto:${BRAND.email}`} className="text-blush-light hover:text-cream">
                  {BRAND.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-ui text-[0.72rem] uppercase tracking-[0.2em] text-gold-muted">
              {t("footer.partnersTitle")}
            </h4>
            <ul className="flex flex-col gap-2.5 text-[0.94rem]">
              {BRAND.partners.map((p) => (
                <li key={p.url}>
                  <a href={p.url} target="_blank" rel="noopener" className="text-blush-light hover:text-cream">
                    {p.name}
                  </a>
                  {p.descKey && (
                    <span className="block text-[0.8rem] text-ink-faint">{t(p.descKey)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-x mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[0.8rem] text-ink-faint">
        <span className="font-display text-[1.15rem] italic text-gold-muted">
          {t("footer.statement")}
        </span>
        <span>© {year} Couca &amp; Co. Beauty</span>
      </div>
    </footer>
  );
}
