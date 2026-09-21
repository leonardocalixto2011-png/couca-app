import type { Metadata } from "next";
import { listProducts } from "@/lib/shop";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CmacPartner } from "@/components/shop/CmacPartner";
import { getCmacPicks } from "@/lib/cmac";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "La boutique Couca & Co. Beauty — dont le prémélange Krèm haïtienne 750 mL à faire soi-même.",
};

export default async function BoutiquePage() {
  const [products, cmacPicks] = await Promise.all([listProducts(), getCmacPicks()]);
  return (
    <section className="section-pad">
      <div className="container-x">
        <ProductGrid products={products} />
        <CmacPartner products={cmacPicks} />
      </div>
    </section>
  );
}
