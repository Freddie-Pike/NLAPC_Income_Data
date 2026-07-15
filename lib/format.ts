/** Shared, pure formatters (kept out of components so Phase-2 Vitest can test them). */

const CAD = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

/** $1,211, whole-dollar CAD, no cents (monthly figures). */
export function formatCAD(amount: number): string {
  return CAD.format(Math.round(amount));
}

/** Signed money, e.g. "−$761" / "+$1,045" (used by the shortfall figure). */
export function formatSignedCAD(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "−" : "+"; // real minus sign U+2212
  return `${sign}${formatCAD(Math.abs(rounded))}`;
}
