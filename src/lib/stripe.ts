import Stripe from "stripe";

let cached: Stripe | null = null;

/** Returns a Stripe client, or null when STRIPE_SECRET_KEY is not configured
 *  (the booking flow then falls back to confirming without an online deposit). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
