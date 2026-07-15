/**
 * NL Eats, editable site copy.
 *
 * The site's small, low-churn set of editable prose (the hero headline + intro
 * and the sources lead paragraph) lives here in code, alongside the citation
 * registry in `lib/sources.ts`. Editing it is a code change, so every string is
 * version-controlled and reviewable. React escapes these on render.
 */

/** The editable copy fields. */
export interface SiteCopy {
  heroHeadline: string;
  heroIntro: string;
  sourcesIntro: string;
}

/** The site's copy. Editing these strings is a code change. */
export const siteCopy: SiteCopy = {
  heroHeadline: "What an NL household gets, and what healthy eating costs",
  heroIntro:
    "Even counting every available support, a Newfoundland & Labrador household on income support lands below the poverty line, and healthy food alone takes a punishing share of the cheque. Pick a household, adjust the food budget, and watch the gap. Every figure is cited; estimates are labelled.",
  sourcesIntro:
    "Every figure on this page traces to a primary source below, and every estimate is labelled with the method behind it. NL Eats is built to hold up under a hostile read.",
};
