import type { Metadata } from "next";
import { getAccountOverview } from "@/lib/account";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function ComptePage() {
  const { user, customer, bookings, loyalty } = await getAccountOverview();

  return (
    <section className="section-pad">
      <div className="container-x">
        <AccountView
          name={customer.name ?? user.name ?? ""}
          email={customer.email}
          phone={customer.phone ?? ""}
          visits={loyalty.visits}
          unlocked={loyalty.unlocked.map((u) => ({ ...u }))}
          nextTier={loyalty.nextTier ? { ...loyalty.nextTier } : null}
          bookings={bookings.map((b) => ({
            id: b.id,
            startAt: b.startAt.toISOString(),
            status: b.status,
            serviceNameFr: b.service.nameFr,
            serviceNameEn: b.service.nameEn,
            estimatedTotalCents: b.estimatedTotalCents,
          }))}
        />
      </div>
    </section>
  );
}
