import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForms } from "./AuthForms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; mode?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/compte");
  const sp = await searchParams;

  return (
    <section className="section-pad">
      <div className="container-x mx-auto max-w-[420px]">
        <AuthForms from={sp.from} initialMode={sp.mode === "register" ? "register" : "login"} />
      </div>
    </section>
  );
}
