"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

type Cat = "3d" | "french" | "deep" | "custom";

const TILES: { img: string; cat: Cat; catKey: string; titleKey: string; alt: string }[] = [
  { img: "/img/web-7.jpg", cat: "3d", catKey: "inspo.tab.3d", titleKey: "inspo.t.saugefleurs", alt: "Ongles longs French vert sauge avec fleurs 3D blanches, perles et billes dorées" },
  { img: "/img/web-9.jpg", cat: "3d", catKey: "inspo.tab.3d", titleKey: "inspo.t.saugeor", alt: "Ongles vert sauge avec chrome doré, perles et fleurs 3D" },
  { img: "/img/web-4.jpg", cat: "french", catKey: "inspo.tab.french", titleKey: "inspo.t.frenchpois", alt: "French blanche sur ongles carrés avec pois blancs et charm papillon argenté" },
  { img: "/img/web-5.jpg", cat: "deep", catKey: "inspo.tab.deep", titleKey: "inspo.t.bordeauxcoeurs", alt: "French bordeaux avec ongle accent nude à pois et cœurs bordeaux" },
  { img: "/img/web-8.jpg", cat: "deep", catKey: "inspo.tab.deep", titleKey: "inspo.t.cateye", alt: "Ongles amande cat-eye chocolat et chrome doré avec fleurs 3D et perles" },
  { img: "/img/web-6.jpg", cat: "custom", catKey: "inspo.tab.custom", titleKey: "inspo.t.rosepois", alt: "Ongles amande rose poudré avec pois blancs" },
];

const TABS: { key: "all" | Cat; tKey: string }[] = [
  { key: "all", tKey: "inspo.tab.all" },
  { key: "3d", tKey: "inspo.tab.3d" },
  { key: "french", tKey: "inspo.tab.french" },
  { key: "deep", tKey: "inspo.tab.deep" },
  { key: "custom", tKey: "inspo.tab.custom" },
];

export function Gallery() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<"all" | Cat>("all");

  return (
    <section id="inspo" className="section-pad">
      <div className="container-x">
        <Reveal className="mb-9 grid gap-x-12 gap-y-6 md:grid-cols-2 md:items-end">
          <div>
            <span className="eyebrow">{t("inspo.eyebrow")}</span>
            <h2 className="mt-4 text-[clamp(2.1rem,1.5rem+2.9vw,3.4rem)]">{t("inspo.h2")}</h2>
          </div>
          <p className="max-w-[52ch] text-[clamp(1.12rem,1.02rem+0.5vw,1.32rem)] text-ink-soft">
            {t("inspo.p")}
          </p>
        </Reveal>

        <div className="mb-9 flex flex-wrap gap-2.5" role="tablist" aria-label={t("inspo.h2")}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-full border px-4.5 py-2.5 font-ui text-[0.86rem] font-medium transition-colors",
                filter === tab.key
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-line text-ink-soft hover:border-gold-muted hover:text-ink",
              )}
            >
              {t(tab.tKey)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TILES.filter((tile) => filter === "all" || tile.cat === filter).map((tile) => (
            <article
              key={tile.img}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft-md)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[color-mix(in_srgb,var(--color-cream)_88%,transparent)] px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-charcoal">
                  {t(tile.catKey)}
                </span>
                <Image
                  src={tile.img}
                  alt={tile.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
                  className="object-cover transition-transform duration-[550ms] group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2 p-4">
                <b className="font-display text-[1.05rem] font-semibold">{t(tile.titleKey)}</b>
                <Link
                  href="/reserver"
                  className="inline-flex items-center gap-1.5 self-start text-[0.8rem] font-semibold"
                >
                  {t("inspo.cta")}
                  <Icon name="arrow" className="h-[13px] w-[13px]" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-ink-faint">
          <Icon name="spark" className="h-[15px] w-[15px] text-gold-muted" />
          {t("inspo.note")}
        </p>
      </div>
    </section>
  );
}
