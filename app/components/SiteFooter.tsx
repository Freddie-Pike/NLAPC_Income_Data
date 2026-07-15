/**
 * SiteFooter, shared across every page.
 *
 * A quiet instrument footer: the site's pages as links, a link out to the NLAPC,
 * and the "last verified" date derived from the single `graphMeta` source so it can
 * never drift from the data. Static; light/dark via tokens.
 */

import Link from "next/link";
import { graphMeta } from "@/lib/graph-data";
import { SITE_LINKS } from "@/app/components/site-links";

export default function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-border">
      <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-10 text-sm text-ink-muted sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr]">
          <nav aria-label="Site" className="grid content-start gap-2.5">
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
              Explore
            </h2>
            {SITE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="source-link">
                {link.longLabel}
              </Link>
            ))}
          </nav>
          <div className="grid content-start gap-2.5">
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>About</h2>
            <a
              href="https://www.nlantipoverty.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              NL Anti-Poverty Coalition ↗
            </a>
          </div>
        </div>

        <p
          className="border-t border-border pt-6"
          style={{ margin: 0, lineHeight: 1.55 }}
        >
          Built for the Newfoundland &amp; Labrador Anti-Poverty Coalition.
          Figures last verified {graphMeta.lastUpdated}.
        </p>
      </div>
    </footer>
  );
}
