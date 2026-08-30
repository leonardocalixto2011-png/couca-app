import type { Metadata } from "next";
import { getOrderByReference } from "@/lib/shop";
import { OrderThanks } from "@/components/shop/OrderThanks";

export const metadata: Metadata = { title: "Merci", robots: { index: false } };

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const ref = order ?? "";
  const found = ref ? Boolean(await getOrderByReference(ref)) : false;

  return (
    <section className="section-pad">
      <div className="container-x">
        <OrderThanks reference={ref} found={found} />
      </div>
    </section>
  );
}
