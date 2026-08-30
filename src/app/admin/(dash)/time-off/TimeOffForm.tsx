"use client";

import { useState, useTransition } from "react";
import { addTimeOff } from "@/app/admin/actions";

export function TimeOffForm() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!start || !end || new Date(end) <= new Date(start)) {
      setErr("Plage invalide.");
      return;
    }
    startT(async () => {
      try {
        // datetime-local values are wall-clock; treat as studio-local by sending ISO w/o TZ shift
        await addTimeOff({ startAt: start, endAt: end, reason });
        setStart("");
        setEnd("");
        setReason("");
      } catch {
        setErr("Échec de l'enregistrement.");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-line bg-white px-4 py-3"
    >
      <label className="flex flex-col gap-1 text-[0.8rem]">
        <span className="font-semibold text-ink-soft">Début</span>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-[var(--radius-lg)] border border-line px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-[0.8rem]">
        <span className="font-semibold text-ink-soft">Fin</span>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-[var(--radius-lg)] border border-line px-2 py-1"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-[0.8rem]">
        <span className="font-semibold text-ink-soft">Raison (optionnel)</span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-[var(--radius-lg)] border border-line px-2 py-1"
        />
      </label>
      <button type="submit" disabled={pending} className="btn btn--sm">
        Ajouter
      </button>
      {err && <p className="w-full text-sm text-terracotta">{err}</p>}
    </form>
  );
}
