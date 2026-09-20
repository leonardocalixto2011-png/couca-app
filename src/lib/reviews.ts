/**
 * Google reviews via the Places API (New). Lights up once GOOGLE_PLACE_ID and
 * GOOGLE_MAPS_API_KEY are set; returns null otherwise so the site keeps its
 * honest placeholder. Cached for an hour.
 */

export type GoogleReview = {
  author: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  when: string; // e.g. "il y a 2 semaines"
  publishedAt: string;
};

export type GoogleReviewsData = {
  rating: number;
  count: number;
  reviews: GoogleReview[];
  mapsUrl: string | null;
  writeReviewUrl: string;
};

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: { displayName?: string; photoUri?: string };
  }[];
};

export function googleReviewsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACE_ID && process.env.GOOGLE_MAPS_API_KEY);
}

export async function getGoogleReviews(locale: "fr" | "en" = "fr"): Promise<GoogleReviewsData | null> {
  const placeId = process.env.GOOGLE_PLACE_ID;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!placeId || !key) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${locale}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) {
      console.error(`[reviews] Places API ${res.status}: ${await res.text()}`);
      return null;
    }
    const p = (await res.json()) as PlacesResponse;
    if (!p.rating || !p.userRatingCount) return null;

    const reviews: GoogleReview[] = (p.reviews ?? [])
      .filter((r) => (r.text?.text ?? r.originalText?.text ?? "").trim().length > 0)
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? "Cliente",
        authorPhoto: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? 5,
        text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
        when: r.relativePublishTimeDescription ?? "",
        publishedAt: r.publishTime ?? "",
      }))
      .sort((a, b) => b.rating - a.rating || (b.publishedAt > a.publishedAt ? 1 : -1))
      .slice(0, 6);

    return {
      rating: p.rating,
      count: p.userRatingCount,
      reviews,
      mapsUrl: p.googleMapsUri ?? null,
      writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`,
    };
  } catch (err) {
    console.error("[reviews] fetch failed", err);
    return null;
  }
}
