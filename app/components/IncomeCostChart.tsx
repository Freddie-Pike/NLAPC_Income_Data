"use client";

/**
 * IncomeCostChart, the primary visualization.
 *
 * Two stacked bars on ONE shared $/month axis (never a dual axis): total income
 * vs. total essential costs, with a dashed Market Basket Measure poverty line.
 * Built to the `dataviz` method: form chosen by the data's job (magnitude
 * comparison), colour assigned by role (income=blue, cost=orange, validated
 * colourblind-safe), baseline pinned at 0, 2px surface gaps between stacked
 * segments, selective direct labels (bar totals only), a two-series legend, a
 * source/estimate tooltip, and a synchronized data-table twin.
 *
 * Pure render: it draws whatever `household` it is handed (the controls layer may
 * pass a household whose food cost has been overridden).
 *
 * SVG marks use concrete hex (CSS `var()` does not resolve in SVG presentation
 * attributes), switched by colour scheme; surrounding HTML chrome uses the CSS
 * design tokens so it themes automatically. The scheme-aware palette lives in
 * `chart-theme.ts`, shared with the other charts.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GraphMeta, Household, LineItem } from "@/lib/graph-data";
import { sumLineItems } from "@/lib/graph-data";
import { formatCAD } from "@/lib/format";
import { getSource } from "@/lib/sources";
import {
  PALETTE,
  shadeFor,
  useColorScheme,
} from "@/app/components/chart-theme";

// ── helpers ──

const INCOME_COL = "Income";
// The cost bar currently holds only food (costs[0]); labelling it "essential costs"
// would overstate it (it excludes rent, utilities, transport…). Kept honest here,
// in the aria description, and in the legend. Rename if more cost segments are added.
const COST_COL = "Healthy food";

/** Round up to a "nice" axis maximum with headroom for the total labels. */
function niceCeil(value: number): number {
  const withHeadroom = value * 1.12;
  const step = 500;
  return Math.ceil(withHeadroom / step) * step;
}

// ── tooltip (module-level & stable; reads segment metadata off the data row) ──

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
}
interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}

function ChartTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const meta = (payload[0]?.payload?._meta ?? {}) as Record<string, LineItem>;
  const rows = payload
    .filter((p) => typeof p.value === "number" && p.value !== 0)
    .map((p) => ({
      item: meta[String(p.dataKey)],
      value: p.value as number,
      color: p.color ?? p.fill,
    }))
    .filter(
      (r): r is { item: LineItem; value: number; color: string | undefined } =>
        Boolean(r.item),
    );
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <div
      role="tooltip"
      style={{
        background: "var(--surface)",
        color: "var(--ink)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 12px",
        maxWidth: 300,
        boxShadow: "0 6px 24px rgba(0,9,29,0.14)",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 4,
        }}
      >
        {rows.map((r) => (
          <li
            key={r.item.key}
            style={{ display: "flex", alignItems: "baseline", gap: 8 }}
          >
            <span
              aria-hidden
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: r.color ?? "var(--ink-muted)",
                flex: "0 0 auto",
                transform: "translateY(1px)",
              }}
            />
            <span style={{ flex: 1 }}>
              {r.item.label}
              {r.item.estimate && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: "var(--ink-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "0 4px",
                  }}
                >
                  estimate
                </span>
              )}
              {r.item.source && (
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--ink-muted)",
                  }}
                >
                  Source: {getSource(r.item.source)?.short ?? r.item.source}
                </span>
              )}
              {(r.item.estimate || r.item.key === "food") && r.item.note && (
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--ink-muted)",
                    marginTop: 3,
                    fontStyle: "italic",
                  }}
                >
                  {r.item.note}
                </span>
              )}
            </span>
            <span className="tabular" style={{ fontWeight: 600 }}>
              {formatCAD(r.value)}
            </span>
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 700,
        }}
      >
        <span>Total</span>
        <span className="tabular">{formatCAD(total)}</span>
      </div>
    </div>
  );
}

// ── reference-line label (name + value, top-right, above the dashed line) ──

interface RefLabelViewBox {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

function makeMbmLabel(text: string, color: string) {
  function MbmLabel(props: { viewBox?: RefLabelViewBox }) {
    const vb = props.viewBox ?? {};
    const x = (vb.x ?? 0) + (vb.width ?? 0) - 6;
    const y = (vb.y ?? 0) - 7;
    return (
      <text
        x={x}
        y={y}
        textAnchor="end"
        fill={color}
        fontSize={12}
        fontWeight={600}
      >
        {text}
      </text>
    );
  }
  return MbmLabel;
}

// ── component ──

export interface IncomeCostChartProps {
  household: Household;
  meta: GraphMeta;
}

export default function IncomeCostChart({
  household,
  meta,
}: IncomeCostChartProps) {
  const scheme = useColorScheme();
  const c = PALETTE[scheme];

  const incomeTotal = sumLineItems(household.income);
  const costTotal = sumLineItems(household.costs);
  const mbm = household.povertyLineMonthly;

  // Rows carry a `_meta` map (segment key → LineItem) so the stable tooltip can read
  // each segment's label/source/estimate without a closure. Recharts ignores fields
  // no <Bar> plots, so `_meta`/`total` are inert to the chart geometry.
  const incomeMeta: Record<string, LineItem> = {};
  household.income.forEach((i) => (incomeMeta[i.key] = i));
  const costMeta: Record<string, LineItem> = {};
  household.costs.forEach((i) => (costMeta[i.key] = i));

  const incomeRow: Record<string, unknown> = {
    name: INCOME_COL,
    total: incomeTotal,
    _meta: incomeMeta,
  };
  household.income.forEach((i) => (incomeRow[i.key] = i.amount));
  const costRow: Record<string, unknown> = {
    name: COST_COL,
    total: costTotal,
    _meta: costMeta,
  };
  household.costs.forEach((i) => (costRow[i.key] = i.amount));
  const chartData = [incomeRow, costRow];

  const topIncomeKey = household.income[household.income.length - 1]?.key;
  const topCostKey = household.costs[household.costs.length - 1]?.key;

  const yMax = niceCeil(Math.max(incomeTotal, costTotal, mbm));
  const mbmText = `Poverty line (MBM) ${formatCAD(mbm)}/mo${household.povertyLineEstimate ? " · est." : ""}`;

  const ariaLabel = `Stacked bar chart comparing a ${household.label}'s total monthly income support (${formatCAD(
    incomeTotal,
  )}) with the monthly cost of a healthy food basket (Nutritious Food Basket, ${formatCAD(
    costTotal,
  )}), against the Market Basket Measure poverty line of ${formatCAD(mbm)} per month. The income bar sits ${
    incomeTotal < mbm ? "below" : "above"
  } the poverty line.`;

  return (
    <figure style={{ margin: 0 }}>
      <p className="sr-only">{ariaLabel}</p>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "20px 16px 12px",
        }}
      >
        {/* legend, two series (identity is never colour-alone) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            padding: "0 8px 12px",
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          <LegendKey color={c.incomeBase} label="Income (all supports)" />
          <LegendKey color={c.costBase} label="Cost of healthy eating (NFB)" />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--ink-muted)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 18,
                height: 0,
                borderTop: `2px dashed ${c.poverty}`,
              }}
            />
            Poverty line (MBM)
          </span>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={chartData}
            margin={{ top: 28, right: 16, bottom: 4, left: 8 }}
            barCategoryGap="18%"
            aria-label={ariaLabel}
          >
            <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
            <XAxis
              dataKey="name"
              tick={{ fill: c.ink, fontSize: 14, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: c.grid }}
            />
            <YAxis
              domain={[0, yMax]}
              tickFormatter={(v: number) => formatCAD(v)}
              tick={{ fill: c.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: c.ink, fillOpacity: 0.04 }}
            />

            {household.income.map((item, i) => {
              const isTop = item.key === topIncomeKey;
              return (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  stackId="stack"
                  fill={shadeFor(c.incomeShades, i)}
                  stroke={c.surface}
                  strokeWidth={2}
                  maxBarSize={132}
                  radius={isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={false}
                >
                  {isTop && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      offset={10}
                      formatter={(value) => formatCAD(Number(value) || 0)}
                      fill={c.ink}
                      fontSize={15}
                      fontWeight={700}
                    />
                  )}
                </Bar>
              );
            })}

            {household.costs.map((item, i) => {
              const isTop = item.key === topCostKey;
              return (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  stackId="stack"
                  fill={shadeFor(c.costShades, i)}
                  stroke={c.surface}
                  strokeWidth={2}
                  maxBarSize={132}
                  radius={isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={false}
                >
                  {isTop && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      offset={10}
                      formatter={(value) => formatCAD(Number(value) || 0)}
                      fill={c.ink}
                      fontSize={15}
                      fontWeight={700}
                    />
                  )}
                </Bar>
              );
            })}

            <ReferenceLine
              y={mbm}
              stroke={c.poverty}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              ifOverflow="extendDomain"
              label={makeMbmLabel(mbmText, c.poverty)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <figcaption
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          padding: "10px 8px 0",
          lineHeight: 1.5,
        }}
      >
        Monthly CAD. Income: NL Income Support ({meta.incomeYear}) and federal
        benefits ({meta.federalYear}) · food: {meta.foodYear} Nutritious Food
        Basket (weekly × {meta.monthlyFactor}) · poverty line:{" "}
        {meta.povertyYear} Market Basket Measure ÷ 12. Bar baseline at 0, one
        axis. Estimate-tagged figures are derived, see the tooltip and the data
        table for the method.
      </figcaption>
    </figure>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        aria-hidden
        style={{ width: 12, height: 12, borderRadius: 3, background: color }}
      />
      {label}
    </span>
  );
}
