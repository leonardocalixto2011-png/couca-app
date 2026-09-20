import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n/messages";
import { getGoogleReviews } from "@/lib/reviews";
import { Testimonials } from "./Testimonials";

/** Server wrapper: fetches Google reviews (cached 1h) and hands them to the client section. */
export async function TestimonialsSection() {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const google = await getGoogleReviews(locale);
  // The Business Profile's own "ask for a review" link works without the
  // Places API, so the CTA can go live before a Maps key exists.
  const reviewUrl = google?.writeReviewUrl ?? process.env.GOOGLE_REVIEW_URL ?? null;
  return <Testimonials google={google} reviewUrl={reviewUrl} />;
}
