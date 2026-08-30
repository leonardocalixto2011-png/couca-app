"use client";

import { useTransition } from "react";
import { setBookingStatus, deleteTimeOff } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)] text-terracotta",
  CONFIRMED: "bg-blush text-terracotta",
  CANCELLED: "bg-line/60 text-ink-faint line-through",
  COMPLETED: "bg-[color-mix(in_srgb,var(--color-rose)_16%,transparent)] text-terracotta",
  NO_SHOW: "bg-line/60 text-ink-faint",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
  NO_SHOW: "Absence",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function StatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setBookingStatus(id, e.target.value))}
      className="rounded-[var(--radius-lg)] border border-line bg-white px-2 py-1 text-[0.8rem]"
      aria-label="Changer le statut"
    >
      {Object.keys(STATUS_LABEL).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteTimeOffButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteTimeOff(id))}
      className="text-[0.8rem] text-terracotta underline underline-offset-2 hover:text-rose"
    >
      Supprimer
    </button>
  );
}
