"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { useCart } from "./shop/CartProvider";
import { Icon } from "./Icon";
import { LangToggle } from "./LangToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#services", key: "nav.services" },
  { href: "/#prix", key: "nav.prices" },
  { href: "/#inspo", key: "nav.inspo" },
  { href: "/#couca-club", key: "nav.club" },
  { href: "/boutique", key: "nav.boutique" },
  { href: "/compte", key: "nav.account" },
  { href: "/#contact", key: "nav.contact" },
] as const;

export function Nav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-[var(--nav-h)] items-center border-b transition-[border-color,box-shadow,background] duration-300",
        "bg-[color-mix(in_srgb,var(--color-cream)_82%,transparent)] backdrop-blur-[14px]",
        scrolled
          ? "border-line shadow-[0_10px_30px_-24px_rgba(45,43,42,0.4)]"
          : "border-transparent",
      )}
    >
      <div className="container-x flex w-full items-center justify-between gap-5">
        <Link href="/" className="flex flex-col leading-none text-ink" aria-label={`${t("nav.home")} — Couca & Co. Beauty`}>
          <span className="font-display text-[1.32rem] font-semibold tracking-[0.02em]">
            Couca &amp; Co.
          </span>
          <span className="mt-1 text-[0.6rem] uppercase tracking-[0.34em] text-ink-faint">
            Nail Studio
          </span>
        </Link>

        <nav aria-label={t("nav.home")} className="hidden items-center gap-[clamp(1rem,2.2vw,1.9rem)] lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative py-1.5 text-[0.92rem] font-medium tracking-[0.02em] text-ink-soft transition-colors hover:text-ink"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/panier"
            aria-label={`${t("nav.cart")}${cart.count ? ` (${cart.count})` : ""}`}
            className="relative inline-flex h-[46px] items-center rounded-full border border-[var(--line-gold)] px-3 text-[0.82rem] font-semibold text-ink hover:border-gold-muted"
          >
            {t("nav.cart")}
            {cart.count > 0 && (
              <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[0.7rem] text-white tabular-nums">
                {cart.count}
              </span>
            )}
          </Link>
          <LangToggle />
          <Link href="/reserver" className="btn btn--sm hidden lg:inline-flex">
            <Icon name="instagram" />
            {t("nav.book")}
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line-gold)] text-ink lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} width={20} height={20} />
          </button>
        </div>
      </div>
    </header>

      {/* mobile drawer — sibling of <header> so `fixed` is viewport-relative
          (a backdrop-filter ancestor would otherwise trap it) */}
      <div
        id="mobile-drawer"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 top-[var(--nav-h)] z-[95] flex flex-col gap-1 overflow-y-auto bg-cream px-[clamp(1.25rem,5vw,2.75rem)] pb-10 pt-8 transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          open ? "translate-y-0" : "-translate-y-[110%]",
        )}
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="border-b border-line py-2.5 font-display text-[1.7rem] font-medium text-ink hover:text-terracotta"
          >
            {t(l.key)}
          </Link>
        ))}
        <Link href="/reserver" onClick={() => setOpen(false)} className="btn btn--block mt-6">
          <Icon name="instagram" />
          {t("nav.bookRdv")}
        </Link>
        <p className="mt-auto pt-8 text-sm text-ink-faint">
          L&rsquo;Assomption · Rive-Nord de Montréal
        </p>
      </div>
    </>
  );
}
