import type { Metadata } from "next";
import { listProducts } from "@/lib/shop";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "La boutique Couca & Co. Beauty — dont le prémélange Krèm haïtienne 750 mL à faire soi-même.",
};

export default async function BoutiquePage() {
  const products = await listProducts();
  return (
    <section className="section-pad">
      <div className="container-x">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
