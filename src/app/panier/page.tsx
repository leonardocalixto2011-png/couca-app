import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return (
    <section className="section-pad">
      <div className="container-x">
        <CartView />
      </div>
    </section>
  );
}
