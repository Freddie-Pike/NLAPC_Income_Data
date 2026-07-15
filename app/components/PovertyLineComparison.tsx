"use client";

/**
 * PovertyLineComparison, the "it's everyone" view as waffle unit-grids.
 *
 * One 10x10 grid per household: each of the 100 squares is 1% of THAT household's
 * Market Basket Measure poverty line, filled from the bottom by how far the
 * household's total income reaches. The empty squares at the top are the shortfall;
 * a dashed rule marks the 75% deep-poverty threshold. Reading three grids side by
 * side, the pattern lands: none of them fills, and most stop short of the dashed
 * line. Isotype/unit encoding, so area equals share, honest by construction.
 *
 * This is Maytree's welfare-income-vs-MBM framing; income includes the
 * rent-earmarked housing benefit exactly as Maytree counts total welfare income.
 * SVG squares use concrete hex; the HTML chrome uses the design tokens.
 */

import type { GraphMeta, Household, HouseholdId } from "@/lib/graph-data";
import {
  DEEP_POVERTY_FRACTION,
  povertyLineShare,
  sumLineItems,
} from "@/lib/graph-data";
import { formatCAD } from "@/lib/format";
import { PALETTE, useColorScheme } from "@/app/components/chart-theme";

const GRID = 10; // 10 x 10 = 100 squares
const CELL = 16;
const GAP = 3;
const SPAN = GRID * CELL + (GRID - 1) * GAP; // full grid size in viewBox units
const DEEP_PCT = DEEP_POVERTY_FRACTION * 100;

interface Row {
  id: HouseholdId;
  label: string;
  pct: number;
  income: number;
  mbm: number;
  estimateLine: boolean;
  deep: boolean;
  below: boolean;
}

function statusPhrase(row: Row): string {
  if (row.deep) return `deep poverty, below ${DEEP_PCT}%`;
  if (row.below) return "below the line";
  return "at or above the line";
}

/** Join labels as "a", "a and b", or "a, b, and c" (Oxford comma). */
function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export interface PovertyLineComparisonProps {
  households: Household[];
  /** Optional: frame one household (the persisted selection). Omit for none. */
  selectedId?: HouseholdId;
  meta: GraphMeta;
}

export default function PovertyLineComparison({
  households,
  selectedId,
  meta,
}: PovertyLineComparisonProps) {
  const scheme = useColorScheme();
  const c = PALETTE[scheme];

  const rows: Row[] = households.map((h) => {
    const pct = povertyLineShare(h) * 100;
    return {
      id: h.id,
      label: h.label,
      pct,
      income: sumLineItems(h.income),
      mbm: h.povertyLineMonthly,
      estimateLine: Boolean(h.povertyLineEstimate),
      deep: pct < DEEP_PCT,
      below: pct < 100,
    };
  });

  const belowCount = rows.filter((r) => r.below).length;
  const deepCount = rows.filter((r) => r.deep).length;

  // Which poverty lines are estimates is read from the data (each row's
  // `estimateLine`), never hardcoded, so the caption can't drift if the CSV
  // changes which lines are derived.
  const estimateLabels = rows
    .filter((r) => r.estimateLine)
    .map((r) => r.label.toLowerCase());
  const estimateClause =
    estimateLabels.length === 0
      ? ""
      : ` The ${joinLabels(estimateLabels)} line${
          estimateLabels.length > 1 ? "s are estimates" : " is an estimate"
        }, see the sources page.`;

  const summary = `Each household's total monthly income as a share of its Market Basket Measure poverty line, one 10 by 10 grid per household where each square is 1% of the line. ${rows
    .map(
      (r) =>
        `${r.label}: ${formatCAD(r.income)}, ${Math.round(r.pct)}% of the ${formatCAD(
          r.mbm,
        )} line, ${statusPhrase(r)}`,
    )
    .join(
      ". ",
    )}. ${belowCount} of ${rows.length} fall below the line; ${deepCount} are in deep poverty.`;

  return (
    <figure style={{ margin: 0 }}>
      <p className="sr-only">{summary}</p>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "22px 18px 16px",
        }}
      >
        {/* legend */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            padding: "0 2px 20px",
            fontSize: 13,
            color: "var(--ink-muted)",
          }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: c.incomeBase,
              }}
            />
            Income reaches (each square = 1% of the line)
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: "color-mix(in oklch, var(--ink) 9%, transparent)",
              }}
            />
            Shortfall to the poverty line
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              aria-hidden
              style={{
                width: 18,
                height: 0,
                borderTop: `2px dashed ${c.poverty}`,
              }}
            />
            Deep poverty ({DEEP_PCT}%)
          </span>
        </div>

        {/* small multiples */}
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {rows.map((row) => (
            <WaffleCell
              key={row.id}
              row={row}
              selected={row.id === selectedId}
              palette={c}
            />
          ))}
        </div>
      </div>

      <figcaption
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          padding: "12px 8px 0",
          lineHeight: 1.5,
        }}
      >
        Total monthly income (including the rent-earmarked housing benefit, as
        Maytree counts welfare income) as a share of each household&apos;s
        Market Basket Measure poverty line ({meta.povertyYear}, annual ÷ 12). A
        full grid is the poverty line; filled squares are how far income
        reaches. {belowCount} of {rows.length} households fall below the line;{" "}
        {deepCount} are in deep poverty.{estimateClause}
      </figcaption>
    </figure>
  );
}

function WaffleCell({
  row,
  selected,
  palette,
}: {
  row: Row;
  selected: boolean;
  palette: (typeof PALETTE)["light"];
}) {
  const c = palette;
  const filled = Math.max(0, Math.min(100, Math.round(row.pct)));
  const empty = "color-mix(in oklch, currentColor 12%, transparent)";
  const deepY = (1 - DEEP_PCT / 100) * SPAN; // 25% from the top = 75% up from base

  const squares = [];
  for (let rowFromTop = 0; rowFromTop < GRID; rowFromTop++) {
    for (let col = 0; col < GRID; col++) {
      const fromBottom = (GRID - 1 - rowFromTop) * GRID + col;
      const isFilled = fromBottom < filled;
      squares.push(
        <rect
          key={`${rowFromTop}-${col}`}
          x={col * (CELL + GAP)}
          y={rowFromTop * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={3}
          fill={isFilled ? c.incomeBase : empty}
        />,
      );
    }
  }

  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
      <div
        style={{
          borderRadius: 12,
          padding: 8,
          boxShadow: selected ? `0 0 0 2px ${c.accent}` : "none",
        }}
      >
        <svg
          viewBox={`-1 -1 ${SPAN + 2} ${SPAN + 2}`}
          width="100%"
          style={{
            display: "block",
            maxWidth: 190,
            color: c.ink,
            height: "auto",
          }}
          role="img"
          aria-label={`${row.label}: ${Math.round(row.pct)}% of the poverty line`}
        >
          {squares}
          {/* deep-poverty threshold */}
          <line
            x1={0}
            x2={SPAN}
            y1={deepY}
            y2={deepY}
            stroke={c.poverty}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </svg>
      </div>
      <div
        style={{
          display: "grid",
          gap: 2,
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {Math.round(row.pct)}%
        </span>
        <span className="text-[15px] font-semibold text-ink">{row.label}</span>
        <span className="tabular text-xs text-ink-muted">
          {formatCAD(row.income)} of {formatCAD(row.mbm)}
          {row.estimateLine ? " · est." : ""}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: row.deep ? "var(--chart-deficit)" : "var(--ink-muted)",
          }}
        >
          {statusPhrase(row)}
        </span>
      </div>
    </div>
  );
}
