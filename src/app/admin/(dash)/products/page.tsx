import { adminListProducts } from "@/lib/admin";
import { ProductsManager } from "./ProductsManager";

export default async function AdminProducts() {
  const rows = await adminListProducts();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]">Boutique — produits</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ajoutez vos produits beauté ici. Le prémélange Krèm est déjà en ligne.
        </p>
      </div>
      <ProductsManager
        products={rows.map((p) => ({
          slug: p.slug,
          nameFr: p.nameFr,
          nameEn: p.nameEn,
          descriptionFr: p.descriptionFr ?? "",
          descriptionEn: p.descriptionEn ?? "",
          priceDollars: Math.round(p.priceCents / 100),
          active: p.active,
          imagesCsv: (Array.isArray(p.images) ? (p.images as string[]) : []).join(", "),
          optionsJson: JSON.stringify(p.options ?? [], null, 2),
        }))}
      />
    </div>
  );
}
