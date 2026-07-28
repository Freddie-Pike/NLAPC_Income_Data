/**
 * NL Eats, sources registry.
 *
 * The single source of truth mapping every citation key used in the data
 * (`LineItem.source`, `Household.povertyLineSource`) to a citation label and a
 * live primary-source URL. Three consumers depend on it:
 *   1. the CSV parser (`lib/parse-sheet-csv.ts`) validates that every row's
 *      `source` resolves here, an unknown key is a hard parse error;
 *   2. the data table + chart tooltip render each figure's `short` citation
 *      (the table links it to `url`; the tooltip shows the name only, since a
 *      transient tooltip can't hold a reachable link);
 *   3. the "Sources & methodology" section lists every `label` as a link.
 *
 * Verified 2026-07-15: every url was opened and read at its exact address, and the
 * canada.ca links (cra-* and health-canada), which 403-block automated fetchers,
 * were confirmed in a real browser. Every displayed number must resolve to a key
 * here (honest and defensible). The canada.ca links stay bot-blocked, so re-check
 * those figures in a browser before each public release.
 */

export interface Source {
  /** compact citation for dense surfaces (table cell, tooltip line) */
  short: string;
  /** full human-readable citation label (sources section) */
  label: string;
  /** one-line description of what the source backs (link-preview card) */
  description: string;
  /** primary-source URL (opens in a new tab) */
  url: string;
}

export const SOURCES = {
  "gov-nl-is-2025": {
    short: "NL Gov, IS enhancements (2025)",
    label: "NL Gov, Income Support enhancements release (24 Jun 2025)",
    description:
      "Provincial news release detailing the September 2025 Income Support enhancements.",
    url: "https://www.gov.nl.ca/releases/2025/fa-en/0624n04/",
  },
  "gov-nl-is-overview": {
    short: "NL Gov, Income Support overview",
    label: "NL Gov, Income Support program overview (rate table)",
    description:
      "Program overview with the basic, shelter, and fuel rate table.",
    url: "https://www.gov.nl.ca/sswb/income-support/overview/",
  },
  "gov-nl-nlcb": {
    short: "NL Gov, NL Child Benefit",
    label: "NL Gov, Newfoundland & Labrador Child Benefit",
    description: "The NL Child Benefit, per-child monthly amounts.",
    url: "https://www.gov.nl.ca/sswb/income-support/child/",
  },
  "cra-ccb": {
    short: "CRA, Canada Child Benefit",
    label: "CRA, Canada Child Benefit, “How much you can get” (2026–27)",
    description:
      "Federal Canada Child Benefit, maximum amounts by child age (2026–27).",
    url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/how-much.html",
  },
  "cra-cgeb": {
    short: "CRA, CGEB (ex-GST/HST credit)",
    label:
      "CRA, Canada Groceries and Essentials Benefit (formerly the GST/HST credit)",
    description:
      "The renamed, revalued federal grocery credit (eff. July 2026).",
    url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/how-much.html",
  },
  "cra-nl-programs": {
    short: "CRA, NL provincial programs",
    label:
      "CRA, NL provincial programs (NL Child Benefit + NL Income Supplement)",
    description:
      "CRA page for NL programs, the NL Child Benefit and NL Income Supplement.",
    url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html",
  },
  "gov-nl-fuel": {
    short: "NL Gov, Fuel Supplement (policy manual)",
    label:
      "NL Gov, Income & Employment Support Policy Manual, Ch. 6 (Fuel Supplement)",
    description:
      "Income & Employment Support policy manual, the fuel-supplement amounts.",
    url: "https://www.gov.nl.ca/sswb/policymanual/files/policymanual-pdf-is-shelter-fuel-supp.pdf",
  },
  "maytree-nl-2024": {
    short: "Maytree, Welfare in Canada: NL (2024)",
    label: "Maytree, Welfare in Canada: Newfoundland and Labrador (2024)",
    description:
      "Welfare income vs. the Market Basket Measure poverty line for NL households.",
    url: "https://maytree.com/changing-systems/data-measuring/welfare-in-canada/newfoundland-and-labrador/",
  },
  "statcan-deep-poverty": {
    short: "StatCan, deep income poverty",
    label:
      "Statistics Canada, Deep income poverty: Exploring the dimensions of poverty in Canada",
    description:
      "Canada's official measure, stated on the page: a household is in deep income poverty when its disposable income falls below 75% of the Market Basket Measure threshold.",
    url: "https://www150.statcan.gc.ca/n1/pub/75f0002m/75f0002m2025001-eng.htm",
  },
  "foodfirst-nfb-2024": {
    short: "Food First NL, NFB 2024",
    label: "Food First NL, 2024 Nutritious Food Basket",
    description:
      "2024 Nutritious Food Basket, the weekly cost of healthy eating by NL region.",
    url: "https://www.foodfirstnl.ca/blog/2024-nl-nfb",
  },
  "foodfirst-nfb-2023": {
    short: "Food First NL, NFB 2023",
    label: "Food First NL, 2023 Nutritious Food Basket in context",
    description: "The 2023 Nutritious Food Basket, in context.",
    url: "https://www.foodfirstnl.ca/blog/2023-nutritious-food-basket-context",
  },
  "foodfirst-nfb-2022": {
    short: "Food First NL, NFB 2022",
    label: "Food First NL, 2022 Nutritious Food Basket in context",
    description: "The 2022 Nutritious Food Basket, in context.",
    url: "https://www.foodfirstnl.ca/blog/2022-nutritious-food-basket-context",
  },
  "foodfirst-fi-2024": {
    short: "Food First NL, food insecurity (2024)",
    label: "Food First NL, 2024 food-insecurity statistics",
    description: "2024 NL food-insecurity statistics.",
    url: "https://www.foodfirstnl.ca/blog/2024-food-insecurity-stats",
  },
  "proof-2024": {
    short: "PROOF, food insecurity 2024",
    label: "PROOF (U of T), Household food insecurity 2024 (NL 30.1%)",
    description:
      "PROOF's 2024 household food-insecurity data (NL at 30.1%, among the highest of the provinces).",
    url: "https://proof.utoronto.ca/2025/new-data-on-household-food-insecurity-in-2024/",
  },
  "proof-fi-working-2026": {
    short: "PROOF, working households (2026)",
    label:
      "PROOF (U of T, 2026), most food-insecure working households have a permanent full-time earner",
    description:
      "PROOF (2026): most food-insecure working households have a permanent, full-time earner.",
    url: "https://proof.utoronto.ca/2026/the-main-income-earner-of-most-food-insecure-working-households-has-a-permanent-full-time-job-new-research-reveals/",
  },
  "healthcanada-nfb": {
    short: "Health Canada, National NFB",
    label:
      "Health Canada, National Nutritious Food Basket (methodology & exclusions)",
    description:
      "The national protocol behind the food basket, its method and exclusions.",
    url: "https://www.canada.ca/en/health-canada/services/food-nutrition/food-nutrition-surveillance/national-nutritious-food-basket.html",
  },
  "nlapc-basic-income": {
    short: "NLAPC, Basic Income NL",
    label: "NLAPC, Basic Income NL (policy framing)",
    description: "NLAPC's Basic Income NL policy framing.",
    url: "https://www.nlantipoverty.ca/advocacy/basic-income",
  },
} as const satisfies Record<string, Source>;

/** Every valid citation key (union type derived from the registry). */
export type SourceKey = keyof typeof SOURCES;

/** True if `key` resolves to a known source (used by the CSV validator). */
export function isSourceKey(key: string): key is SourceKey {
  return Object.prototype.hasOwnProperty.call(SOURCES, key);
}

/**
 * Look up a citation. Returns `undefined` for an unknown key so callers can
 * degrade gracefully (the UI falls back to showing the raw key).
 */
export function getSource(key: string): Source | undefined {
  return isSourceKey(key) ? SOURCES[key] : undefined;
}
