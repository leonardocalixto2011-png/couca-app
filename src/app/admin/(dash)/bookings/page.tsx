import Link from "next/link";
import { listBookings } from "@/lib/admin";
import { fmtDateTime } from "@/lib/fmt";
import { formatMoneyFromCents } from "@/lib/utils";
import { StatusPill, StatusControl } from "@/components/admin/ui";

const FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const FILTER_LABEL: Record<string, string> = {
  ALL: "Toutes",
  PENDING: "En attente",
  CONFIRMED: "Confirmées",
  COMPLETED: "Terminées",
  CANCELLED: "Annulées",
  NO_SHOW: "Absences",
};

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "ALL" } = await searchParams;
  const bookings = await listBookings({ status });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Réservations</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${f}`}
            className={`rounded-full border px-3 py-1 text-[0.8rem] ${
              status === f
                ? "border-charcoal bg-charcoal text-cream"
                : "border-line text-ink-soft hover:border-gold-muted"
            }`}
          >
            {FILTER_LABEL[f]}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-ink-faint">Aucune réservation.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.12em] text-ink-faint">
                <th className="py-2 pr-3 font-semibold">Quand</th>
                <th className="py-2 pr-3 font-semibold">Client</th>
                <th className="py-2 pr-3 font-semibold">Service</th>
                <th className="py-2 pr-3 font-semibold">Réf.</th>
                <th className="py-2 pr-3 font-semibold">Dépôt</th>
                <th className="py-2 pr-3 font-semibold">Statut</th>
                <th className="py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-line/70 align-top">
                  <td className="py-2.5 pr-3 whitespace-nowrap">{fmtDateTime(b.startAt)}</td>
                  <td className="py-2.5 pr-3">
                    {b.contactName}
                    <span className="block text-[0.78rem] text-ink-faint">
                      {b.contactEmail}
                      {b.contactPhone ? ` · ${b.contactPhone}` : ""}
                    </span>
                    {b.notes && <span className="block text-[0.78rem] italic text-ink-faint">“{b.notes}”</span>}
                    {Array.isArray(b.inspoImages) && (b.inspoImages as string[]).length > 0 && (
                      <span className="mt-1.5 flex gap-1.5">
                        {(b.inspoImages as string[]).map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener" className="block h-12 w-12 overflow-hidden rounded-[8px] border border-line">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="Inspo" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">{b.service.nameFr}</td>
                  <td className="py-2.5 pr-3 font-mono text-[0.72rem] text-ink-faint">{b.reference.slice(-8)}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {formatMoneyFromCents(b.depositCents)}
                    <span className="block text-[0.72rem] text-ink-faint">
                      {b.depositPaid ? "payé" : b.depositForfeited ? "perdu" : "à venir"}
                    </span>
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
  );
}
