/**
 * SourcesMethodology, the "Sources & methodology" section.
 *
 * The secondary proof surface: for a visitor who won't touch the instrument, the
 * cited evidence stands on its own. Every source is a link to its primary source,
 * grouped by what it backs; three short notes explain how the Nutritious Food
 * Basket is measured, what the Market Basket Measure poverty line means, and why
 * some figures are labelled estimates.
 *
 * Restrained instrument aesthetic: Lato headings, ink/muted-ink prose capped near
 * 68ch, hairline dividers, no eyebrows, no numbered markers, no cards, no hero
 * tiles. Static server component; light/dark via tokens. All year/date references
 * derive from the single `graphMeta` source so the prose can never drift from the
 * data.
 */

import { type SourceKey } from "@/lib/sources";
import {
  DEEP_POVERTY_FRACTION,
  graphMeta,
  povertyStats,
  type Household,
} from "@/lib/graph-data";
import CitationLink from "@/app/components/CitationLink";

// Small integers read more classic spelled out ("two of the three") than as digits.
const NUM_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
const numWord = (n: number): string => NUM_WORDS[n] ?? String(n);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// Sources grouped by what they back (real content groups, not decorative labels).
const GROUPS: { heading: string; keys: SourceKey[] }[] = [
  {
    heading: "Income & benefits",
    keys: [
      "gov-nl-is-2025",
      "gov-nl-is-overview",
      "gov-nl-nlcb",
      "gov-nl-fuel",
      "cra-ccb",
      "cra-cgeb",
      "cra-nl-programs",
    ],
  },
  {
    heading: "Cost of healthy eating",
    keys: [
      "foodfirst-nfb-2024",
      "foodfirst-nfb-2023",
      "foodfirst-nfb-2022",
      "healthcanada-nfb",
    ],
  },
  { heading: "Poverty benchmark", keys: ["maytree-nl-2024"] },
  {
    heading: "Food insecurity in NL",
    keys: ["proof-2024", "proof-fi-working-2026", "foodfirst-fi-2024"],
  },
  { heading: "Advocacy", keys: ["nlapc-basic-income"] },
];

const h4Style: React.CSSProperties = {
  margin: "0 0 8px",
  fontFamily: "var(--font-heading)",
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "-0.01em",
};
const proseStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: "68ch",
  fontSize: 15,
  lineHeight: 1.6,
};

export default function SourcesMethodology({
  households,
  intro,
  showHeading = true,
}: {
  households: Household[];
  /** Editable lead paragraph, from `lib/site-copy.ts`. */
  intro: string;
  /**
   * Render the section's own "Sources & methodology" title + intro. False when the
   * page already supplies an <h1> for this content (the standalone sources page).
   */
  showHeading?: boolean;
}) {
  // Year/date references are derived from the single `graphMeta` source (never
  // hard-coded) so the prose can't drift from the data on a refresh.
  const { incomeYear, foodYear, povertyYear, monthlyFactor, lastUpdated } =
    graphMeta;

  // Derive the poverty-line claim from the households actually modelled here, so
  // it can never drift from the chart/table a skeptic can check on the same page
  // (the instrument ships three households, not Maytree's four). Counts recompute
  // from the same single source (the loaded dataset, passed in by the server
  // page); nothing about "how many fall below" is hardcoded.
  const { total: totalHh, belowLine, deepPoverty } = povertyStats(households);
  // Deep-poverty threshold as a percent, derived from the single
  // `DEEP_POVERTY_FRACTION` source so the prose can't drift from the cutoff.
  const deepPct = DEEP_POVERTY_FRACTION * 100;
  const belowClause =
    belowLine === totalHh
      ? `All ${numWord(totalHh)} households modelled here fall below it`
      : `${cap(numWord(belowLine))} of the ${numWord(totalHh)} households modelled here fall below it`;
  const deepClause =
    deepPoverty === 0
      ? "none are in deep poverty"
      : deepPoverty === totalHh
        ? `all are in deep poverty, below ${deepPct}% of the line`
        : `${numWord(deepPoverty)} of them are in deep poverty, below ${deepPct}% of the line`;

  return (
    <section
      id="sources"
      aria-label="Sources and methodology"
      className="grid gap-8"
    >
      {showHeading && (
        <div className="grid gap-3">
          <h2
            id="sources-heading"
            style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 2.6vw, 1.85rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            Sources &amp; methodology
          </h2>
          <p className="text-ink-muted" style={{ ...proseStyle }}>
            {intro}
          </p>
        </div>
      )}

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Primary sources */}
        <div className="grid content-start gap-6">
          <h3
            style={{ margin: 0, fontSize: 13, fontWeight: 600 }}
            className="text-ink-muted"
          >
            Primary sources
          </h3>
          {GROUPS.map((group) => (
            <div key={group.heading} className="grid gap-2.5">
              <h4 style={h4Style} className="text-ink">
                {group.heading}
              </h4>
              <ul
                className="grid gap-2"
                style={{ margin: 0, padding: 0, listStyle: "none" }}
              >
                {group.keys.map((key) => (
                  <li key={key} style={{ fontSize: 14, lineHeight: 1.5 }}>
                    <CitationLink sourceKey={key} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Methodology & caveats */}
        <div className="grid content-start gap-6">
          <h3
            style={{ margin: 0, fontSize: 13, fontWeight: 600 }}
            className="text-ink-muted"
          >
            Methodology &amp; caveats
          </h3>

          <div className="grid gap-2">
            <h4 style={h4Style} className="text-ink">
              How the Nutritious Food Basket is measured
            </h4>
            <p className="text-ink-muted" style={proseStyle}>
              The Nutritious Food Basket prices 61 minimally-processed foods for
              a reference family of four, compiled each autumn by the NL
              Statistics Agency and published in context by Food First NL. It
              assumes every meal is cooked from scratch at home, so it
              understates real cost, and it excludes special or therapeutic
              diets, food preparation, cooking and transportation, restaurant
              and prepared meals, and non-food grocery items. It is a
              cost-monitoring tool, not a recommended diet. Weekly figures are
              the source of truth; monthly figures here use weekly&nbsp;×{" "}
              {`${monthlyFactor} (calendar month)`}, while Food First NL&apos;s
              own published monthly figure uses&nbsp;× 4.
            </p>
          </div>

          <div className="grid gap-2">
            <h4 style={h4Style} className="text-ink">
              What the poverty line (MBM) means
            </h4>
            <p className="text-ink-muted" style={proseStyle}>
              The dashed line is the Market Basket Measure, Canada&apos;s
              official poverty line. It is the cost of a specific basket of
              goods and services representing a modest, basic standard of living
              for a reference household in a given region. The value shown is
              the monthly line (annual&nbsp;÷ 12) from Maytree&apos;s Welfare in
              Canada: Newfoundland and Labrador ({povertyYear}). {belowClause},
              and {deepClause}.
            </p>
          </div>

          <div className="grid gap-2">
            <h4 style={h4Style} className="text-ink">
              Why some figures are estimates
            </h4>
            <p className="text-ink-muted" style={proseStyle}>
              NL publishes only the family-of-four food basket, so the
              single-adult and couple food figures are derived estimates (a
              reference-group share plus a one-person surcharge, not a flat ÷
              4). The Canada Child Benefit varies with children&apos;s ages, and
              the couple poverty line is scaled because Maytree does not model a
              childless couple. The federal CRA figures (Canada Child Benefit,
              the Canada Groceries and Essentials Benefit, formerly the GST/HST
              credit, and NL programs) rest on secondary sources because
              canada.ca blocks automated fetchers; re-check them in a browser
              before a public release.
            </p>
          </div>
        </div>
      </div>

      <p
        className="text-ink-muted"
        style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}
      >
        Income rates reflect the NL {incomeYear} Income Support enhancement;
        food is the {foodYear} Nutritious Food Basket; the poverty line is
        Maytree {povertyYear}. Figures last verified {lastUpdated}.
      </p>
    </section>
  );
}
