"use client";

import { useTransition } from "react";
import { adjustLoyaltyVisits } from "@/app/admin/actions";

export function LoyaltyAdjust({ customerId, visits }: { customerId: string; visits: number }) {
  const [pending, start] = useTransition();
  const btn =
    "grid h-7 w-7 place-items-center rounded-full border border-line text-[0.95rem] leading-none hover:border-terracotta hover:text-terracotta disabled:opacity-40";
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={btn}
        disabled={pending || visits <= 0}
        onClick={() => start(() => adjustLoyaltyVisits(customerId, -1))}
        aria-label="Retirer une visite"
      >
        −
      </button>
      <span className="min-w-[2ch] text-center font-semibold tabular-nums">{visits}</span>
      <button
        type="button"
        className={btn}
        disabled={pending}
        onClick={() => start(() => adjustLoyaltyVisits(customerId, 1))}
        aria-label="Ajouter une visite"
      >
        +
      </button>
    </span>
  );
}
