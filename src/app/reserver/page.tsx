import type { Metadata } from "next";
import { listCatalogue, openWeekdays, getBookingByReference } from "@/lib/booking";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";

export const metadata: Metadata = { title: "Réservation" };

const LENGTH_TO_SLUG: Record<string, string> = {
  courte: "pose-gel-courte",
  moyenne: "pose-gel-moyenne",
  longue: "pose-gel-longue",
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
  if (first(sp.simple)) prefillAddons.push("nail-art-simple");
  if (first(sp.art3d)) prefillAddons.push("nail-art-3d");
  const lengthParam = first(sp.length);

  return (
    <section className="section-pad">
      <div className="container-x">
        <BookingFlow
          sets={sets}
          addons={addons}
          openWeekdays={weekdays}
          prefill={{
            serviceSlug: lengthParam ? LENGTH_TO_SLUG[lengthParam] : undefined,
            addonSlugs: prefillAddons,
          }}
        />
      </div>
    </section>
  );
}
