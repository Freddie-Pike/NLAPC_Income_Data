"use client";

/**
 * IncomeComposition, "where the income comes from" as a treemap.
 *
 * The selected household's income, one tile per benefit program, each tile's AREA
 * proportional to its dollars, so the one or two programs that carry the household
 * dwarf the scatter of tiny credits at a glance. Area encoding is honest by
 * construction (no distorted scale); the tiles share the income-blue ramp (a
 * sequential tint by rank, not a second variable). The housing tile is tagged
 * because that benefit only reimburses rent, it is received but not spendable.
 *
 * Uses Recharts' Treemap for the squarified layout; an sr-only summary and the data
 * table carry every figure as text for the keyboard/screen-reader path.
 *
 * The tiles get a light motion touch (a staggered spring entrance, largest first,
 * plus a soft drop-shadow and a small hover lift) so the composition assembles and
 * reads with depth. The view stays strictly top-down: the elevation is decorative,
 * never a tilt, so tile area still equals dollars and the encoding stays honest. All
 * of it is disabled under prefers-reduced-motion.
 */

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { motion, useReducedMotion } from "motion/react";
import type { GraphMeta, Household, LineItem } from "@/lib/graph-data";
import { sumLineItems } from "@/lib/graph-data";
import { formatCAD } from "@/lib/format";
import { getSource } from "@/lib/sources";
import {
  PALETTE,
  shadeFor,
  useColorScheme,
} from "@/app/components/chart-theme";

interface TileDatum {
  name: string;
  size: number;
  key: string;
  estimate: boolean;
  source: string;
  note?: string;
  share: number; // % of total income
  fill: string;
  // Recharts' Treemap data type carries a string index signature.
  [k: string]: string | number | boolean | undefined;
}

// ── tooltip ──

interface TooltipProps {
  active?: boolean;
  payload?: { payload?: TileDatum }[];
}

function TreemapTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const tile = payload[0]?.payload;
  if (!tile || typeof tile.size !== "number") return null;
  const source = getSource(tile.source);
  return (
    <div
      role="tooltip"
      style={{
        background: "var(--surface)",
        color: "var(--ink)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 12px",
        maxWidth: 280,
        boxShadow: "0 6px 24px rgba(0,9,29,0.14)",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>
        {tile.name}
        {tile.estimate && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              fontWeight: 400,
              color: "var(--ink-muted)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "0 4px",
            }}
          >
            estimate
          </span>
        )}
      </div>
      <div className="tabular" style={{ fontWeight: 600 }}>
        {formatCAD(tile.size)} · {tile.share}% of income
      </div>
      {source && (
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 3 }}>
          Source: {source.short}
        </div>
      )}
    </div>
  );
}

// ── tile ──

function makeTile(
  data: TileDatum[],
  textColor: string,
  ring: string,
  reduce: boolean,
) {
  function Tile(props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    index?: number;
    name?: string;
  }) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    // Prefer the index Recharts passes; fall back to matching by (unique) name so
    // the tile still resolves across Recharts versions.
    const index = typeof props.index === "number" ? props.index : -1;
    const tile =
      (index >= 0 ? data[index] : undefined) ??
      data.find((candidate) => candidate.name === props.name);
    // Recharts' content type requires a non-null element; empty group for gaps.
    if (!tile || width <= 0 || height <= 0) return <g />;
    const roomy = width > 74 && height > 44;
    const tag =
      tile.key === "housing" ? "rent only" : tile.estimate ? "estimate" : "";
    // Scale/opacity animate about the tile's own centre (fill-box) so the entrance
    // and hover lift never shift the tile off its dollar-proportional footprint.
    return (
      <motion.g
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={reduce ? false : { opacity: 1, scale: 1 }}
        whileHover={reduce ? undefined : { scale: 1.015 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 26,
          delay: reduce ? 0 : Math.max(0, index) * 0.04,
        }}
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          filter: "drop-shadow(0 3px 8px rgba(0, 9, 29, 0.18))",
        }}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          fill={tile.fill}
          stroke={ring}
          strokeWidth={2}
        />
        {roomy && (
          <text
            x={x + 10}
            y={y + 22}
            fill={textColor}
            fontSize={13}
            fontWeight={600}
          >
            {tile.name.length > 22 ? `${tile.name.slice(0, 21)}…` : tile.name}
          </text>
        )}
        {roomy && (
          <text
            x={x + 10}
            y={y + 42}
            fill={textColor}
            fontSize={15}
            fontWeight={800}
          >
            {formatCAD(tile.size)}
          </text>
        )}
        {roomy && tag && (
          <text
            x={x + 10}
            y={y + 60}
            fill={textColor}
            fontSize={11}
            opacity={0.85}
          >
            {tag}
          </text>
        )}
      </motion.g>
    );
  }
  return Tile;
}

export interface IncomeCompositionProps {
  household: Household;
  meta: GraphMeta;
}

export default function IncomeComposition({
  household,
  meta,
}: IncomeCompositionProps) {
  const scheme = useColorScheme();
  const c = PALETTE[scheme];
  const reduce = useReducedMotion() ?? false;

  const total = sumLineItems(household.income);
  const ranked: LineItem[] = [...household.income].sort(
    (a, b) => b.amount - a.amount,
  );
  const data: TileDatum[] = ranked.map((item, i) => ({
    name: item.label,
    size: item.amount,
    key: item.key,
    estimate: item.estimate,
    source: item.source,
    note: item.note,
    share: total > 0 ? Math.round((item.amount / total) * 100) : 0,
    fill: shadeFor(c.incomeShades, i),
  }));

  const textColor = scheme === "light" ? "#FFFFFF" : c.ink;

  const summary = `${household.label}: total monthly income ${formatCAD(
    total,
  )}, from ${ranked.length} programs, each tile sized by its dollars. ${ranked
    .map(
      (i) =>
        `${i.label} ${formatCAD(i.amount)}${i.estimate ? " (estimate)" : ""}${
          i.key === "housing" ? " (reimburses rent only)" : ""
        }`,
    )
    .join(". ")}.`;

  return (
    <figure style={{ margin: 0 }}>
      <p className="sr-only">{summary}</p>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "20px 18px 14px",
        }}
      >
        <div
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          style={{ paddingBottom: 14 }}
        >
          <span className="inline-flex items-center gap-2 text-sm text-ink">
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: c.incomeBase,
              }}
            />
            Each tile sized by its share of income
          </span>
          <span className="text-sm text-ink-muted">
            Total{" "}
            <strong className="tabular text-ink">{formatCAD(total)}</strong>/mo
          </span>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <Treemap
            data={data}
            dataKey="size"
            content={makeTile(data, textColor, c.surface, reduce)}
            isAnimationActive={false}
            aria-label={summary}
          >
            <Tooltip content={<TreemapTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <figcaption
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          padding: "12px 8px 0",
          lineHeight: 1.5,
        }}
      >
        {household.label}, monthly income by benefit program (NL{" "}
        {meta.incomeYear} Income Support and {meta.federalYear} federal
        benefits), tile area in proportion to dollars. The housing benefit
        reimburses rent up to a cap: it is received, but not spendable on food
        or anything else. Estimate-tagged figures are derived, see the sources
        page and the data table for the method.
      </figcaption>
    </figure>
  );
}
