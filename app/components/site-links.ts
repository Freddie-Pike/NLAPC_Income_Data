/**
 * The site's pages, one per nav tab. Shared by the header (SiteNav) and the footer
 * (SiteFooter) so the two can never drift out of sync.
 */

export interface SiteLink {
  href: string;
  /** short label for the top nav */
  label: string;
  /** longer label for the footer / accessible name */
  longLabel: string;
}

export const SITE_LINKS: SiteLink[] = [
  { href: "/", label: "The gap", longLabel: "The gap" },
  {
    href: "/below-the-line",
    label: "Below the line",
    longLabel: "Below the poverty line",
  },
  {
    href: "/income",
    label: "Income makeup",
    longLabel: "Where income comes from",
  },
  { href: "/sources", label: "Sources", longLabel: "Sources & methodology" },
];
