/** Join truthy class names. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Cents → "45 $" (Québec convention: amount, space, dollar sign). */
export function formatMoneyFromCents(cents: number, locale: "fr" | "en" = "fr"): string {
  const amount = Math.round(cents / 100);
  return locale === "fr" ? `${amount} $` : `$${amount}`;
}

/** Whole dollars → "45 $". Used by the calculator, which works in dollars. */
export function money(amount: number): string {
  return `${amount} $`;
}
