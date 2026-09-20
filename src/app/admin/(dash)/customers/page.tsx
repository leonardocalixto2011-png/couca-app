import Link from "next/link";
import { adminListCustomers } from "@/lib/admin";
import { fmtDate } from "@/lib/fmt";
import { LOYALTY_TIERS } from "@/lib/brand";
import { LoyaltyAdjust } from "./LoyaltyAdjust";

function nextTier(visits: number) {
  return LOYALTY_TIERS.find((t) => visits < t.visit)?.visit ?? null;
}

export default async function AdminCustomers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const customers = await adminListCustomers(q);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Clientes</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Le compteur Couca Club monte tout seul quand une réservation passe à «&nbsp;Terminée&nbsp;». Les boutons ± servent aux cas
          spéciaux (visite sans réservation en ligne, inscription après la visite, autre courriel).
        </p>
      </div>

      <form className="flex gap-2" action="/admin/customers">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nom, courriel ou téléphone…"
          className="w-full max-w-[360px] rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2 text-[0.92rem]"
        />
        <button type="submit" className="btn btn--sm">Chercher</button>
        {q && (
          <Link href="/admin/customers" className="btn btn--ghost btn--sm">
            Effacer
          </Link>
        )}
      </form>

      {customers.length === 0 ? (
        <p className="text-sm text-ink-faint">Aucune cliente{q ? " pour cette recherche" : ""}.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.12em] text-ink-faint">
                <th className="py-2 pr-3 font-semibold">Cliente</th>
                <th className="py-2 pr-3 font-semibold">Contact</th>
                <th className="py-2 pr-3 font-semibold">Réservations</th>
                <th className="py-2 pr-3 font-semibold">Dernière visite</th>
                <th className="py-2 pr-3 font-semibold">Couca Club</th>
                <th className="py-2 font-semibold">Compte</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const next = nextTier(c.loyaltyVisits);
                return (
                  <tr key={c.id} className="border-b border-line/70 align-top">
                    <td className="py-2.5 pr-3 font-medium">{c.name ?? <span className="text-ink-faint">—</span>}</td>
                    <td className="py-2.5 pr-3 text-[0.82rem] text-ink-soft">
                      {c.email}
                      {c.phone && <span className="block">{c.phone}</span>}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      <Link href={`/admin/bookings`} className="underline-offset-2 hover:underline">
                        {c._count.bookings}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-ink-soft">
                      {c.bookings[0] ? fmtDate(c.bookings[0].startAt) : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <LoyaltyAdjust customerId={c.id} visits={c.loyaltyVisits} />
                      <span className="block text-[0.72rem] text-ink-faint">
                        {next ? `prochaine attention à la ${next}e` : "tous les paliers atteints"}
                      </span>
                    </td>
                    <td className="py-2.5 text-[0.78rem] text-ink-faint">{c.userId ? "inscrite" : "invitée"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
