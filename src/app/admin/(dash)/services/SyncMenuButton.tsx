"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncServiceMenu } from "@/app/admin/actions";

export function SyncMenuButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    start(async () => {
      try {
        const r = await syncServiceMenu();
        setMessage(
          `${r.added} ajouté(s) · ${r.updated} mis à jour · ${r.retired} retiré(s)`,
        );
        router.refresh();
      } catch {
        setMessage("La synchronisation a échoué. Réessayez.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={pending} className="btn btn--sm">
        {pending ? "…" : "Synchroniser le menu"}
      </button>
      {message && <span className="text-[0.85rem] text-ink-soft">{message}</span>}
    </div>
  );
}
