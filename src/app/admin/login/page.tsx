import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin — Connexion", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const sp = await searchParams;

  return (
    <section className="section-pad">
      <div className="container-x mx-auto max-w-[400px]">
        <span className="eyebrow">Couca &amp; Co. Beauty</span>
        <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2vw,2.6rem)]">Espace studio</h1>
        <p className="mt-2 text-sm text-ink-soft">Connexion réservée à l&rsquo;administration.</p>
        <LoginForm from={sp.from} initialError={sp.error} />
      </div>
    </section>
  );
}
