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
  /**
   * The "what this does and doesn't claim" framing, on the methodology surface.
   * Pre-empts the two standard deflections ("just get a job", "it's only a safety
   * net") with the coalition's actual, narrower claim.
   */
  claimNote: string;
}

/** The site's copy. Editing these strings is a code change. */
export const siteCopy: SiteCopy = {
  heroHeadline: "What an NL household gets, and what healthy eating costs",
  heroIntro:
    "Even counting every available support, a Newfoundland & Labrador household on income support lands below the poverty line, and healthy food alone takes a punishing share of the cheque. Pick a household, adjust the food budget, and watch the gap. Every figure is cited; estimates are labelled.",
  sourcesIntro:
    "Every figure on this page traces to a primary source below, and every estimate is labelled with the method behind it. NL Eats is built to hold up under a hostile read.",
  claimNote:
    "Income support is a last-resort floor, not a wage, so this gap is not a claim that people are idle: most food-insecure working households in Canada have a permanent, full-time earner. The claim is narrower and harder to dismiss, that even the maximum stack of every available support still leaves a household below the official poverty line, which is why the coalition argues the floor itself has to rise.",
};
