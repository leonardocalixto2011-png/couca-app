import type { Metadata } from "next";
import { getOrderByReference } from "@/lib/shop";
import { OrderThanks } from "@/components/shop/OrderThanks";
import { TrackOrderConversion } from "@/components/Analytics";

export const metadata: Metadata = { title: "Merci", robots: { index: false } };

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const ref = order ?? "";
  const found = ref ? await getOrderByReference(ref) : null;

  return (
    <section className="section-pad">
      <div className="container-x">
        {found && <TrackOrderConversion reference={found.reference} valueCents={found.subtotalCents} />}
        <OrderThanks reference={ref} found={Boolean(found)} />
      </div>
    </section>
  );
}
