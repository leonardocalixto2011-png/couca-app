import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { CartProvider } from "@/components/shop/CartProvider";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n/messages";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StickyBookBar } from "@/components/StickyBookBar";
import { JsonLd, nailSalonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const vibes = Great_Vibes({
  variable: "--font-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: {
    default: "Couca & Co. Beauty | Nail Studio – Montréal, Laval & Rive-Nord",
    template: "%s | Couca & Co. Beauty",
  },
  description:
    "Couca & Co. Beauty — nail studio boutique desservant Montréal, Laval, L'Assomption, Repentigny et Joliette. Acrylique, Gel-X, Builder Gel, manucure russe, nail art. Réservation en ligne.",
  openGraph: {
    type: "website",
    locale: "fr_CA",
    alternateLocale: "en_CA",
    siteName: BRAND.name,
    url: BRAND.domain,
  },
  alternates: { canonical: "/" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${inter.variable} ${vibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={nailSalonLd()} />
        <LocaleProvider initialLocale={locale}>
          <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-charcoal focus:px-5 focus:py-3 focus:text-sm focus:text-cream"
          >
            Aller au contenu / Skip to content
          </a>
          <Nav />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <StickyBookBar />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
