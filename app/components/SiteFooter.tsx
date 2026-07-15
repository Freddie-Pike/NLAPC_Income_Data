/**
 * SiteFooter, shared across every page.
 *
 * A quiet instrument footer, a sibling of SiteNav: the brand mark, an attribution
 * line that links out to the NLAPC, a light row of the site's pages, and the "last
 * verified" date, elevated as the footer's signature freshness signal and derived
 * from the single `graphMeta` source so it can never drift from the data. Compact
 * and static; light/dark via tokens.
 */

import Link from "next/link";
import Image from "next/image";
import { graphMeta } from "@/lib/graph-data";
import { SITE_LINKS } from "@/app/components/site-links";
import logo from "@/public/nl-eats-logo.png";

export default function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-border">
      <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-x-10 gap-y-6 px-4 py-7 text-sm text-ink-muted sm:flex-row sm:px-6 lg:px-8">
        {/* left: brand mark + attribution (NLAPC folded into the sentence as the link) */}
        <div className="grid gap-2">
          <span className="inline-flex items-center gap-2">
            <Image
              src={logo}
              alt=""
              aria-hidden
              width={22}
              height={22}
              className="brand-logo"
              style={{ width: 22, height: 22, objectFit: "contain" }}
            />
            <span
              className="font-extrabold tracking-tight text-ink"
              style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}
            >
              NL&nbsp;Eats
            </span>
          </span>
          <p style={{ margin: 0, maxWidth: "40ch", lineHeight: 1.55 }}>
            Built for the{" "}
            <a
              href="https://www.nlantipoverty.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              Newfoundland &amp; Labrador Anti-Poverty Coalition&nbsp;↗
            </a>
          </p>
        </div>

        {/* right: page links + the "last verified" freshness readout */}
        <div className="grid gap-4 sm:justify-items-end sm:text-right">
          <nav
            aria-label="Site"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:justify-end"
          >
            {SITE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-semibold whitespace-nowrap text-ink-muted no-underline transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p style={{ margin: 0 }}>
            Figures last verified{" "}
            <time dateTime={graphMeta.lastUpdated} className="tabular text-ink">
              {graphMeta.lastUpdated}
            </time>
          </p>
        </div>
      </div>
    </footer>
  );
}
