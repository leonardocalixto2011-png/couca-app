import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/shop";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { JsonLd, productLd } from "@/components/JsonLd";

export async function generateStaticParams() {
  const products = await listProducts().catch(() => []);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p
    ? { title: p.nameFr, description: p.descriptionFr?.slice(0, 155) ?? undefined }
    : { title: "Boutique" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <section className="section-pad">
      <JsonLd data={productLd(product)} />
      <div className="container-x">
        <ProductDetail product={product} />
      </div>
    </section>
  );
}
