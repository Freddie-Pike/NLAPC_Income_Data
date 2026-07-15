import { describe, it, expect } from "vitest";
import {
  sumLineItems,
  computeShortfall,
  getHousehold,
  povertyStats,
  povertyLineShare,
  DEEP_POVERTY_FRACTION,
  type Household,
  type LineItem,
} from "@/lib/graph-data";
import { getSeedGraphData } from "@/lib/seed-data";
import { isSourceKey } from "@/lib/sources";

// The dataset parsed from the committed CSV (the single source of truth),
// replacing the retired hand-typed `seed` literal.
const seed = getSeedGraphData();

const items = (amounts: number[]): LineItem[] =>
  amounts.map((amount, i) => ({
    key: `k${i}`,
    label: `L${i}`,
    amount,
    estimate: false,
    source: "gov-nl-is-2025",
  }));

// Minimal household builder for the povertyStats edge cases.
const household = (
  income: number[],
  povertyLineMonthly: number,
): Household => ({
  id: "single",
  label: "Test household",
  income: items(income),
  costs: items([]),
  povertyLineMonthly,
  povertyLineSource: "maytree-nl-2024",
});

describe("pure helpers", () => {
  it("sumLineItems adds monthly amounts (empty → 0)", () => {
    expect(sumLineItems([])).toBe(0);
    expect(sumLineItems(items([561, 522, 71]))).toBe(1154);
  });

  it("computeShortfall is income − costs (negative when food outruns income)", () => {
    expect(computeShortfall(items([1000, 500]), items([1200]))).toBe(300);
    expect(computeShortfall(items([1000]), items([1200, 300]))).toBe(-500);
  });

  it("getHousehold finds by id and returns undefined for unknown", () => {
    expect(getHousehold(seed, "couple")?.id).toBe("couple");
    // @ts-expect-error, exercising the runtime guard with an invalid id
    expect(getHousehold(seed, "nope")).toBeUndefined();
  });
});

describe("seed invariants (honest & defensible)", () => {
  it("has the three modelled households in canonical order", () => {
    expect(seed.households.map((h) => h.id)).toEqual([
      "single",
      "couple",
      "family4",
    ]);
  });

  it("puts food as costs[0] for every household (the shape's contract)", () => {
    for (const h of seed.households) {
      expect(h.costs[0]?.key).toBe("food");
    }
  });

  it("resolves every figure's source to a known citation key", () => {
    for (const h of seed.households) {
      for (const item of [...h.income, ...h.costs]) {
        expect(isSourceKey(item.source), `${h.id}/${item.key}`).toBe(true);
      }
      expect(isSourceKey(h.povertyLineSource), `${h.id} poverty`).toBe(true);
    }
  });

  it("keeps every household's total income below its MBM poverty line", () => {
    for (const h of seed.households) {
      expect(sumLineItems(h.income)).toBeLessThan(h.povertyLineMonthly);
    }
  });

  it("carries the meta the chart labels itself with", () => {
    expect(seed.meta.currency).toBe("CAD");
    expect(seed.meta.period).toBe("monthly");
    expect(seed.meta.monthlyFactor).toBe(4.33);
    expect(seed.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("povertyStats (derived poverty claim)", () => {
  it("exports the 75%-of-line deep-poverty fraction", () => {
    expect(DEEP_POVERTY_FRACTION).toBe(0.75);
  });

  it("counts all three mock households below the line, two of them deep", () => {
    // single ~54% of line and couple ~59% are deep; family4 ~77% is below the
    // line but NOT in deep poverty.
    expect(povertyStats(seed.households)).toEqual({
      total: 3,
      belowLine: 3,
      deepPoverty: 2,
    });
  });

  it("returns all zeros for an empty household list", () => {
    expect(povertyStats([])).toEqual({
      total: 0,
      belowLine: 0,
      deepPoverty: 0,
    });
  });

  it("does not count a household whose income meets or exceeds its line", () => {
    // income exactly at the line → not below, not deep.
    expect(povertyStats([household([2247], 2247)])).toEqual({
      total: 1,
      belowLine: 0,
      deepPoverty: 0,
    });
    // income above the line → not below.
    expect(povertyStats([household([3000], 2247)])).toEqual({
      total: 1,
      belowLine: 0,
      deepPoverty: 0,
    });
  });

  it("counts below-line-but-not-deep separately from deep poverty", () => {
    // 90% of line → below but not deep.
    const shallow = household([900], 1000);
    // 50% of line → below AND deep.
    const deep = household([500], 1000);
    expect(povertyStats([shallow, deep])).toEqual({
      total: 2,
      belowLine: 2,
      deepPoverty: 1,
    });
  });
});

describe("povertyLineShare (income ÷ its own MBM line)", () => {
  it("matches each modelled household (single/couple deep, family4 below)", () => {
    const shares = Object.fromEntries(
      seed.households.map((h) => [h.id, povertyLineShare(h)]),
    );
    // single ~54%, couple ~59% (both under the 75% deep line); family4 ~77%.
    expect(shares.single).toBeCloseTo(0.539, 2);
    expect(shares.couple).toBeCloseTo(0.587, 2);
    expect(shares.family4).toBeCloseTo(0.77, 2);
    // The chart's ordering claim: single and couple are below the deep line,
    // family4 is below the poverty line but above the deep line.
    expect(shares.single).toBeLessThan(DEEP_POVERTY_FRACTION);
    expect(shares.couple).toBeLessThan(DEEP_POVERTY_FRACTION);
    expect(shares.family4).toBeGreaterThan(DEEP_POVERTY_FRACTION);
    expect(shares.family4).toBeLessThan(1);
  });

  it("returns 1 at the line and 0 for a non-positive line (÷0 guard)", () => {
    expect(povertyLineShare(household([1000], 1000))).toBe(1);
    expect(povertyLineShare(household([1000], 0))).toBe(0);
  });
});
