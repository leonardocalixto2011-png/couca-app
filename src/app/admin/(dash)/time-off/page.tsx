import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/fmt";
import { DeleteTimeOffButton } from "@/components/admin/ui";
import { TimeOffForm } from "./TimeOffForm";

export default async function AdminTimeOff() {
  const rows = await prisma.timeOff.findMany({
    where: { endAt: { gte: new Date(Date.now() - 864e5) } },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Congés / blocages</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Toute plage bloquée disparaît des créneaux réservables.
        </p>
      </div>

      <TimeOffForm />

      <div>
        <h2 className="mb-3 text-lg">À venir</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-faint">Aucun blocage.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-white px-4 py-3 text-[0.9rem]"
              >
                <span>
                  {fmtDateTime(r.startAt)} <span className="text-ink-faint">→</span> {fmtDateTime(r.endAt)}
                </span>
                {r.reason && <span className="text-ink-faint italic">“{r.reason}”</span>}
                <span className="ml-auto">
                  <DeleteTimeOffButton id={r.id} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
