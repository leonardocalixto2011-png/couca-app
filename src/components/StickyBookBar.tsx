"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export function StickyBookBar() {
  const { t } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.6;
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - window.innerHeight * 0.9;
      setShow(past && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[80] border-t border-line px-[clamp(1.25rem,5vw,2.75rem)] py-3 lg:hidden",
        "bg-[color-mix(in_srgb,var(--color-cream)_90%,transparent)] backdrop-blur-[12px]",
        "transition-transform duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        show ? "translate-y-0" : "translate-y-[120%]",
      )}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Link href="/reserver" className="btn btn--block">
        <Icon name="instagram" />
        {t("nav.bookRdv")}
      </Link>
    </div>
  );
}
