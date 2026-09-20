import type { Metadata } from "next";
import { listCatalogue, openWeekdays, getBookingByReference } from "@/lib/booking";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { inspoUploadEnabled } from "@/lib/inspo";

export const metadata: Metadata = { title: "Réservation" };

// Back-compat for old calculator links that used ?length=courte|moyenne|longue.
const LENGTH_TO_SLUG: Record<string, string> = {
  courte: "acrylique-court",
  moyenne: "acrylique-moyen",
  longue: "acrylique-long",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ReserverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const confirmedRef = first(sp.confirmed);

  if (confirmedRef) {
    const booking = await getBookingByReference(confirmedRef);
    return (
      <section className="section-pad">
        <div className="container-x">
          <BookingConfirmation
            reference={confirmedRef}
            found={Boolean(booking)}
            serviceNameFr={booking?.service.nameFr ?? null}
            serviceNameEn={booking?.service.nameEn ?? null}
            startIso={booking?.startAt.toISOString() ?? null}
            depositPaid={booking?.depositPaid ?? false}
            estimatedTotalCents={booking?.estimatedTotalCents ?? null}
            depositCents={booking?.depositCents ?? 2000}
          />
        </div>
      </section>
    );
  }

  const [{ sets, addons }, weekdays] = await Promise.all([listCatalogue(), openWeekdays()]);

  const prefillAddons: string[] = [];
  if (first(sp.french)) prefillAddons.push("french-finish");
  if (first(sp.chrome)) prefillAddons.push("chrome");
  if (first(sp.simple)) prefillAddons.push("nail-art-simple");
  if (first(sp.art3d)) prefillAddons.push("nail-art-3d");
  if (first(sp.strass)) prefillAddons.push("strass-charms");

  const serviceParam = first(sp.service);
  const lengthParam = first(sp.length);
  const knownSlugs = new Set(sets.map((s) => s.slug));
  const prefillService =
    serviceParam && knownSlugs.has(serviceParam)
      ? serviceParam
      : lengthParam
        ? LENGTH_TO_SLUG[lengthParam]
        : undefined;

  return (
    <section className="section-pad">
      <div className="container-x">
        <BookingFlow
          sets={sets}
          addons={addons}
          openWeekdays={weekdays}
          prefill={{
            serviceSlug: prefillService,
            addonSlugs: prefillAddons,
          }}
          inspoEnabled={inspoUploadEnabled()}
        />
      </div>
    </section>
  );
}
