import { dashboardData } from "@/lib/admin";
import { fmtDateTime } from "@/lib/fmt";
import { formatMoneyFromCents } from "@/lib/utils";
import { StatusPill, StatusControl } from "@/components/admin/ui";

export default async function AdminDashboard() {
  const { upcoming, pendingCount, weekCount } = await dashboardData();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Tableau de bord</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Stat label="À venir (7 j)" value={weekCount} />
          <Stat label="En attente" value={pendingCount} accent />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg">Prochaines réservations</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-faint">Aucune réservation à venir.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[0.9rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="py-2 pr-3 font-semibold">Quand</th>
                  <th className="py-2 pr-3 font-semibold">Client</th>
                  <th className="py-2 pr-3 font-semibold">Service</th>
                  <th className="py-2 pr-3 font-semibold">Total est.</th>
                  <th className="py-2 pr-3 font-semibold">Statut</th>
                  <th className="py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.id} className="border-b border-line/70 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{fmtDateTime(b.startAt)}</td>
                    <td className="py-2.5 pr-3">
                      {b.contactName}
                      <span className="block text-[0.78rem] text-ink-faint">{b.contactEmail}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {b.service.nameFr}
                      {Array.isArray(b.addonSlugs) && b.addonSlugs.length > 0 && (
                        <span className="block text-[0.78rem] text-ink-faint">
                          + {(b.addonSlugs as string[]).length} option(s)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {b.estimatedTotalCents != null ? formatMoneyFromCents(b.estimatedTotalCents) : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="py-2.5">
                      <StatusControl id={b.id} status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-white px-4 py-3">
      <p className="text-[0.72rem] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accent ? "text-terracotta" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
