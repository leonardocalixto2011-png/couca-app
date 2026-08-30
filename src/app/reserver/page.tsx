import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Réservation" };

export default function ReserverPage() {
  return <ComingSoon titleKey="nav.bookRdv" />;
}
