import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parseGraphDataCsv } from "@/lib/parse-sheet-csv";
import { isSourceKey } from "@/lib/sources";

const SEED_CSV = readFileSync(
  fileURLToPath(new URL("../data/graph-data.csv", import.meta.url)),
  "utf8",
);

describe("parseGraphDataCsv", () => {
  it("parses the committed seed CSV into a well-formed GraphData payload", () => {
    // The seed CSV is the single committed snapshot of the Google Sheet (the
    // source of truth); parsing it must yield the fixed contract the chart reads.
    // (This replaces the former equality check against the retired `mockGraphData`
    // literal — kept commented in lib/graph-data.ts for history.)
    const parsed = parseGraphDataCsv(SEED_CSV);
    expect(parsed.households.map((h) => h.id)).toEqual([
      "single",
      "couple",
      "family4",
    ]);
    expect(parsed.meta.currency).toBe("CAD");
    expect(parsed.meta.period).toBe("monthly");
    expect(parsed.meta.monthlyFactor).toBe(4.33);
    for (const h of parsed.households) {
      expect(h.income.length).toBeGreaterThan(0);
      expect(h.costs[0]?.key).toBe("food");
      expect(typeof h.povertyLineMonthly).toBe("number");
      for (const item of [...h.income, ...h.costs]) {
        expect(isSourceKey(item.source), `${h.id}/${item.key}`).toBe(true);
      }
      expect(isSourceKey(h.povertyLineSource), `${h.id} poverty`).toBe(true);
    }
  });

  it("keeps the food row as costs[0] for every household", () => {
    const parsed = parseGraphDataCsv(SEED_CSV);
    for (const h of parsed.households) {
      expect(h.costs[0]?.key).toBe("food");
    }
  });

  it("carries the poverty line, its source, and its estimate flag", () => {
    const parsed = parseGraphDataCsv(SEED_CSV);
    const couple = parsed.households.find((h) => h.id === "couple");
    expect(couple?.povertyLineMonthly).toBe(3179);
    expect(couple?.povertyLineSource).toBe("maytree-nl-2024");
    expect(couple?.povertyLineEstimate).toBe(true); // Maytree has no couple model
    const family = parsed.households.find((h) => h.id === "family4");
    expect(family?.povertyLineEstimate).toBe(false);
  });

  it("throws on an unknown source key", () => {
    const bad = [
      "household,section,key,label,amount,estimate,source,poverty_line_monthly,notes",
      "single,income,basic,Basic,561,FALSE,not-a-real-source,,",
      "single,cost,food,Food,450,TRUE,foodfirst-nfb-2024,,",
      "single,poverty,poverty-line,MBM,2247,FALSE,maytree-nl-2024,2247,",
    ].join("\n");
    expect(() => parseGraphDataCsv(bad)).toThrow(/unknown source/i);
  });

  it("throws on an unknown household id", () => {
    const bad = [
      "household,section,key,label,amount,estimate,source,poverty_line_monthly,notes",
      "duo,income,basic,Basic,561,FALSE,gov-nl-is-2025,,",
    ].join("\n");
    expect(() => parseGraphDataCsv(bad)).toThrow(/unknown household/i);
  });

  it("throws on a non-numeric amount", () => {
    const bad = [
      "household,section,key,label,amount,estimate,source,poverty_line_monthly,notes",
      "single,income,basic,Basic,not-a-number,FALSE,gov-nl-is-2025,,",
    ].join("\n");
    expect(() => parseGraphDataCsv(bad)).toThrow(/invalid amount/i);
  });

  it("throws when a household has no food cost row", () => {
    const bad = [
      "household,section,key,label,amount,estimate,source,poverty_line_monthly,notes",
      "single,income,basic,Basic,561,FALSE,gov-nl-is-2025,,",
      "single,poverty,poverty-line,MBM,2247,FALSE,maytree-nl-2024,2247,",
    ].join("\n");
    expect(() => parseGraphDataCsv(bad)).toThrow(/missing food/i);
  });
});
