"use client";

import { useTransition } from "react";
import { createReferralCode, applyReferralCredit } from "@/app/admin/actions";

export function ReferralCell({
  customerId,
  code,
  creditCents,
}: {
  customerId: string;
  code: string | null;
  creditCents: number;
}) {
  const [pending, start] = useTransition();
  const credit = creditCents / 100;

  return (
    <div className="flex flex-col items-start gap-1.5">
      {code ? (
        <span className="rounded-md border border-dashed border-[var(--line-gold)] px-2 py-0.5 font-mono text-[0.8rem] tracking-[0.08em]">
          {code}
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => createReferralCode(customerId))}
          className="text-[0.78rem] text-ink-soft underline underline-offset-2 disabled:opacity-40"
        >
          Créer son code
        </button>
      )}
      {creditCents > 0 ? (
        <span className="inline-flex items-center gap-2 text-[0.8rem]">
          <strong className="text-terracotta">{credit} $ de crédit</strong>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => applyReferralCredit(customerId))}
            className="rounded-full border border-line px-2 py-0.5 text-[0.72rem] hover:border-terracotta hover:text-terracotta disabled:opacity-40"
          >
            Appliquer 10 $
          </button>
        </span>
      ) : (
        <span className="text-[0.72rem] text-ink-faint">aucun crédit</span>
      )}
    </div>
  );
}
