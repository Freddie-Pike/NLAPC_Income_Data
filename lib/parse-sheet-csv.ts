/**
 * NL Eats, CSV → GraphData parser.
 *
 * The single shared transform behind BOTH data paths: the local dev seed file
 * (`data/graph-data.csv`) and, once wired, the Google-Sheet published-CSV
 * export. Because the output is the fixed `GraphData` shape, the chart never
 * knows which source produced it, so the eventual Sheet swap is invisible.
 *
 * Sheet schema: one row per (household, line item), columns
 *   household, section, key, label, amount, estimate, source, poverty_line_monthly, notes
 * where `section` ∈ {income, cost, poverty}. The dedicated `poverty` row carries
 * the household's MBM line on its own row, reusing the shared amount/source/estimate
 * columns so its source + estimate flag round-trip too. `meta` is NOT a Sheet field;
 * it lives in code (`graphMeta`) and is bumped on a data refresh.
 *
 * Every row is validated (unknown household/source, missing food or poverty row,
 * non-numeric amount all throw) so a malformed Sheet fails loudly → the Route
 * Handler returns 502 and the client falls back to the last-known baseline.
 */

import Papa from "papaparse";
import {
  graphMeta,
  type GraphData,
  type GraphMeta,
  type Household,
  type HouseholdId,
  type LineItem,
} from "@/lib/graph-data";
import { isSourceKey } from "@/lib/sources";

/** Raw CSV row (all cells arrive as strings; we coerce below). */
interface RawRow {
  household?: string;
  section?: string;
  key?: string;
  label?: string;
  amount?: string;
  estimate?: string;
  source?: string;
  poverty_line_monthly?: string;
  notes?: string;
}

/** Canonical household order + display labels (not a Sheet column). */
const HOUSEHOLD_LABELS: Record<HouseholdId, string> = {
  single: "Single adult",
  couple: "Couple",
  family4: "Family of four",
};
const HOUSEHOLD_ORDER: HouseholdId[] = ["single", "couple", "family4"];

function isHouseholdId(value: string): value is HouseholdId {
  return value === "single" || value === "couple" || value === "family4";
}

/** "TRUE"/"true"/"1"/"yes" → true; everything else → false. */
function parseBool(value: string | undefined): boolean {
  return /^(true|1|yes)$/i.test((value ?? "").trim());
}

/** Coerce a money cell → finite number, or throw with row context. */
function parseAmount(value: string | undefined, where: string): number {
  const n = Number((value ?? "").trim());
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid amount "${value}" for ${where}`);
  }
  return n;
}

function toLineItem(row: RawRow, where: string): LineItem {
  const key = (row.key ?? "").trim();
  const label = (row.label ?? "").trim();
  const source = (row.source ?? "").trim();
  if (!key) throw new Error(`Missing key for ${where}`);
  if (!label) throw new Error(`Missing label for ${where}`);
  if (!isSourceKey(source)) {
    throw new Error(
      `Unknown source "${source}" for ${where} (not in the registry)`,
    );
  }
  const note = (row.notes ?? "").trim();
  const item: LineItem = {
    key,
    label,
    amount: parseAmount(row.amount, where),
    estimate: parseBool(row.estimate),
    source,
  };
  if (note) item.note = note;
  return item;
}

/** Order cost segments so the food row is `costs[0]` (the shape's contract). */
function foodFirst(costs: LineItem[]): LineItem[] {
  return [...costs].sort((a, b) => {
    if (a.key === "food") return -1;
    if (b.key === "food") return 1;
    return 0;
  });
}

/**
 * Parse a schema-shaped CSV string into the `GraphData` payload.
 *
 * @param csv   raw CSV text (from the local seed file or the Sheet export)
 * @param meta  dataset meta (defaults to the code-managed `graphMeta`)
 */
export function parseGraphDataCsv(
  csv: string,
  meta: GraphMeta = graphMeta,
): GraphData {
  const parsed = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error (row ${first.row}): ${first.message}`);
  }

  // Bucket rows by household, preserving row order within each section.
  const income: Record<string, LineItem[]> = {};
  const costs: Record<string, LineItem[]> = {};
  const poverty: Record<
    string,
    { amount: number; source: string; estimate: boolean }
  > = {};

  parsed.data.forEach((row, i) => {
    const householdRaw = (row.household ?? "").trim();
    if (!householdRaw) return; // skip blank/spacer lines
    const where = `row ${i + 2} (household "${householdRaw}")`; // +2: header + 1-indexed
    if (!isHouseholdId(householdRaw)) {
      throw new Error(`Unknown household "${householdRaw}" at ${where}`);
    }
    const section = (row.section ?? "").trim().toLowerCase();
    if (section === "income") {
      (income[householdRaw] ??= []).push(toLineItem(row, where));
    } else if (section === "cost") {
      (costs[householdRaw] ??= []).push(toLineItem(row, where));
    } else if (section === "poverty") {
      const source = (row.source ?? "").trim();
      if (!isSourceKey(source)) {
        throw new Error(`Unknown poverty-line source "${source}" at ${where}`);
      }
      // Prefer the explicit poverty_line_monthly column, else the amount cell.
      const amountCell = (row.poverty_line_monthly ?? "").trim() || row.amount;
      poverty[householdRaw] = {
        amount: parseAmount(amountCell, `${where} poverty line`),
        source,
        estimate: parseBool(row.estimate),
      };
    } else {
      throw new Error(`Unknown section "${section}" at ${where}`);
    }
  });

  const households: Household[] = HOUSEHOLD_ORDER.filter(
    (id) => income[id] || costs[id] || poverty[id],
  ).map((id) => {
    const inc = income[id] ?? [];
    const cst = foodFirst(costs[id] ?? []);
    const pov = poverty[id];
    if (inc.length === 0)
      throw new Error(`No income rows for household "${id}"`);
    if (!cst.some((c) => c.key === "food")) {
      throw new Error(`Missing food cost row for household "${id}"`);
    }
    if (!pov) throw new Error(`Missing poverty-line row for household "${id}"`);
    return {
      id,
      label: HOUSEHOLD_LABELS[id],
      income: inc,
      costs: cst,
      povertyLineMonthly: pov.amount,
      povertyLineSource: pov.source,
      povertyLineEstimate: pov.estimate,
    };
  });

  if (households.length === 0) {
    throw new Error("CSV contained no household rows");
  }
  return { meta, households };
}
