import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { adminSignOut } from "@/app/admin/actions";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/bookings", label: "Réservations" },
  { href: "/admin/hours", label: "Horaires" },
  { href: "/admin/services", label: "Services & prix" },
  { href: "/admin/time-off", label: "Congés / blocages" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin/login");

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-[clamp(1.25rem,5vw,2.5rem)] py-10 md:flex-row md:gap-12">
      <aside className="md:w-[220px] md:flex-none">
        <div className="mb-6">
          <p className="font-display text-xl font-semibold">Couca &amp; Co.</p>
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-ink-faint">Espace studio</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-[var(--radius-lg)] px-3 py-2 text-[0.92rem] text-ink-soft hover:bg-blush hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={adminSignOut} className="mt-6">
          <button type="submit" className="btn btn--ghost btn--sm w-full">
            <Icon name="arrow" />
            Déconnexion
          </button>
        </form>
        <p className="mt-4 px-3 text-[0.72rem] text-ink-faint">{session.user.email}</p>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
