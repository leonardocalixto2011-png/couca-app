"use client";

import { useState, useTransition } from "react";
import { updateService } from "@/app/admin/actions";

type Svc = {
  slug: string;
  nameFr: string;
  category: string;
  priceCents: number;
  durationMin: number;
  active: boolean;
};

export function ServicesEditor({ services }: { services: Svc[] }) {
  const [rows, setRows] = useState(services);
  const [saving, start] = useTransition();
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  function patch(slug: string, p: Partial<Svc>) {
    setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...p } : r)));
  }
  function save(r: Svc) {
    start(async () => {
      await updateService(r.slug, {
        priceCents: r.priceCents,
        durationMin: r.durationMin,
        active: r.active,
      });
      setSavedSlug(r.slug);
      setTimeout(() => setSavedSlug(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.slug}
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-white px-4 py-3"
        >
          <span className="min-w-[160px] flex-1 font-medium">
            {r.nameFr}
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-ink-faint">
              {r.category === "GEL_SET" ? "Pose" : "Option"}
            </span>
          </span>
          <label className="flex items-center gap-1.5 text-[0.85rem]">
            <span className="text-ink-faint">Prix $</span>
            <input
              type="number"
              min={0}
              step={1}
              value={Math.round(r.priceCents / 100)}
              onChange={(e) => patch(r.slug, { priceCents: Number(e.target.value) * 100 })}
              className="w-[70px] rounded-[var(--radius-lg)] border border-line px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[0.85rem]">
            <span className="text-ink-faint">Durée min</span>
            <input
              type="number"
              min={5}
              step={5}
              value={r.durationMin}
              onChange={(e) => patch(r.slug, { durationMin: Number(e.target.value) })}
              className="w-[70px] rounded-[var(--radius-lg)] border border-line px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[0.85rem]">
            <input
              type="checkbox"
              checked={r.active}
              onChange={(e) => patch(r.slug, { active: e.target.checked })}
            />
            Actif
          </label>
          <button type="button" disabled={saving} onClick={() => save(r)} className="btn btn--sm">
            {savedSlug === r.slug ? "✓" : "Enregistrer"}
          </button>
        </div>
      ))}
    </div>
  );
}
