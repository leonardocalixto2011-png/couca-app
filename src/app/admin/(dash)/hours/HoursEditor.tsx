"use client";

import { useState, useTransition } from "react";
import { updateHours } from "@/app/admin/actions";
import { minLabel } from "@/lib/fmt";

type Row = { weekday: number; isOpen: boolean; openMin: number; closeMin: number };
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function toTime(min: number) {
  return minLabel(min);
}
function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function HoursEditor({ hours }: { hours: Row[] }) {
  const [rows, setRows] = useState(hours);
  const [saving, start] = useTransition();
  const [savedDay, setSavedDay] = useState<number | null>(null);

  function patch(w: number, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.weekday === w ? { ...r, ...p } : r)));
  }
  function save(r: Row) {
    start(async () => {
      await updateHours(r.weekday, { isOpen: r.isOpen, openMin: r.openMin, closeMin: r.closeMin });
      setSavedDay(r.weekday);
      setTimeout(() => setSavedDay(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.weekday}
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-white px-4 py-3"
        >
          <span className="w-[90px] font-medium">{DAYS[r.weekday]}</span>
          <label className="flex items-center gap-2 text-[0.85rem]">
            <input
              type="checkbox"
              checked={r.isOpen}
              onChange={(e) => patch(r.weekday, { isOpen: e.target.checked })}
            />
            Ouvert
          </label>
          <input
            type="time"
            step={900}
            value={toTime(r.openMin)}
            disabled={!r.isOpen}
            onChange={(e) => patch(r.weekday, { openMin: toMin(e.target.value) })}
            className="rounded-[var(--radius-lg)] border border-line px-2 py-1 text-[0.85rem] disabled:opacity-40"
          />
          <span className="text-ink-faint">→</span>
          <input
            type="time"
            step={900}
            value={toTime(r.closeMin)}
            disabled={!r.isOpen}
            onChange={(e) => patch(r.weekday, { closeMin: toMin(e.target.value) })}
            className="rounded-[var(--radius-lg)] border border-line px-2 py-1 text-[0.85rem] disabled:opacity-40"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => save(r)}
            className="btn btn--sm ml-auto"
          >
            {savedDay === r.weekday ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      ))}
    </div>
  );
}
