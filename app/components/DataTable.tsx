"use client";

/**
 * DataTable, the chart's accessible, honest twin (every value reachable without
 * colour or a mouse). Rendered full-width below the dashboard so opening it never
 * distorts the instrument. Method notes show only where they carry the method
 * (estimates + the food basket's ×4.33 basis), keeping the table scannable.
 */

import type { Household, LineItem } from "@/lib/graph-data";
import { sumLineItems } from "@/lib/graph-data";
import { formatCAD } from "@/lib/format";
import CitationLink from "@/app/components/CitationLink";

const cellHead: React.CSSProperties = {
  padding: "8px 12px",
  color: "var(--ink-muted)",
  fontWeight: 600,
  textAlign: "left",
  whiteSpace: "nowrap",
};
const cell: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--border)",
  color: "var(--ink)",
  textAlign: "left",
  verticalAlign: "top",
};
const num: React.CSSProperties = { textAlign: "right", whiteSpace: "nowrap" };

export default function DataTable({ household }: { household: Household }) {
  const incomeTotal = sumLineItems(household.income);
  const costTotal = sumLineItems(household.costs);
  return (
    <details
      className="group"
      style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          userSelect: "none",
        }}
      >
        <span
          aria-hidden
          className="disclosure-marker"
          style={{ color: "var(--ink-muted)", fontSize: 12 }}
        >
          ▸
        </span>
        The numbers, every figure sourced, {household.label}
      </summary>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: 13.5,
            minWidth: 560,
          }}
        >
          <caption
            style={{
              textAlign: "left",
              color: "var(--ink-muted)",
              padding: "0 0 10px",
              fontSize: 12.5,
            }}
          >
            {household.label}, monthly income support vs. the cost of healthy
            eating (CAD). Estimates are labelled with their method.
          </caption>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th scope="col" style={cellHead}>
                Line item
              </th>
              <th scope="col" style={cellHead}>
                Type
              </th>
              <th scope="col" style={{ ...cellHead, ...num }}>
                Monthly
              </th>
              <th scope="col" style={cellHead}>
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {household.income.map((i) => (
              <DataRow key={`inc-${i.key}`} item={i} type="Income" />
            ))}
            <TotalRow label="Total income" amount={incomeTotal} />
            {household.costs.map((i) => (
              <DataRow key={`cost-${i.key}`} item={i} type="Cost" />
            ))}
            <TotalRow label="Total cost of healthy eating" amount={costTotal} />
            <tr>
              <th scope="row" style={{ ...cell, fontWeight: 600 }}>
                Poverty line (MBM)
                {household.povertyLineEstimate ? " · estimate" : ""}
              </th>
              <td style={cell}>Benchmark</td>
              <td className="tabular" style={{ ...cell, ...num }}>
                {formatCAD(household.povertyLineMonthly)}
              </td>
              <td style={cell}>
                <CitationLink
                  sourceKey={household.povertyLineSource}
                  text="short"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}

function DataRow({ item, type }: { item: LineItem; type: string }) {
  const showNote = (item.estimate || item.key === "food") && item.note;
  return (
    <tr>
      <th scope="row" style={{ ...cell, fontWeight: 400 }}>
        <span style={{ color: "var(--ink)" }}>{item.label}</span>
        {item.estimate && (
          <span
            style={{ marginLeft: 6, fontSize: 11, color: "var(--ink-muted)" }}
          >
            (estimate)
          </span>
        )}
        {showNote && (
          <span
            style={{
              display: "block",
              fontSize: 11.5,
              color: "var(--ink-muted)",
              marginTop: 3,
              maxWidth: "52ch",
              lineHeight: 1.45,
            }}
          >
            {item.note}
          </span>
        )}
      </th>
      <td style={cell}>{type}</td>
      <td className="tabular" style={{ ...cell, ...num }}>
        {formatCAD(item.amount)}
      </td>
      <td style={cell}>
        <CitationLink sourceKey={item.source} text="short" />
      </td>
    </tr>
  );
}

function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <tr
      style={{ background: "color-mix(in oklch, var(--ink) 5%, transparent)" }}
    >
      <th scope="row" style={{ ...cell, fontWeight: 700 }}>
        {label}
      </th>
      <td style={cell} />
      <td className="tabular" style={{ ...cell, ...num, fontWeight: 700 }}>
        {formatCAD(amount)}
      </td>
      <td style={cell} />
    </tr>
  );
}
