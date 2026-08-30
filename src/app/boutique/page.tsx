import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Boutique" };

export default function BoutiquePage() {
  return <ComingSoon titleKey="nav.boutique" />;
}
