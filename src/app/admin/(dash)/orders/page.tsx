import { adminListOrders } from "@/lib/admin";
import { fmtDateTime } from "@/lib/fmt";
import { formatMoneyFromCents } from "@/lib/utils";
import { OrderStatusControl } from "@/components/admin/ui";

type OrderItem = { nameFr: string; qty: number; options?: Record<string, string> };

export default async function AdminOrders() {
  const orders = await adminListOrders();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Commandes</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-ink-faint">Aucune commande.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.12em] text-ink-faint">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Client</th>
                <th className="py-2 pr-3 font-semibold">Articles</th>
                <th className="py-2 pr-3 font-semibold">Total</th>
                <th className="py-2 pr-3 font-semibold">Réf.</th>
                <th className="py-2 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const items = (Array.isArray(o.items) ? o.items : []) as OrderItem[];
                return (
                  <tr key={o.id} className="border-b border-line/70 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                    <td className="py-2.5 pr-3">{o.contactEmail || "—"}</td>
                    <td className="py-2.5 pr-3">
                      {items.map((it, idx) => (
                        <span key={idx} className="block text-[0.85rem]">
                          {it.qty}× {it.nameFr}
                          {it.options && Object.values(it.options).length > 0 && (
                            <span className="text-ink-faint"> ({Object.values(it.options).join(", ")})</span>
                          )}
                        </span>
                      ))}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatMoneyFromCents(o.subtotalCents)}</td>
                    <td className="py-2.5 pr-3 font-mono text-[0.72rem] text-ink-faint">
                      {o.reference.slice(-8)}
                    </td>
                    <td className="py-2.5">
                      <OrderStatusControl id={o.id} status={o.status} />
                    </td>
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
