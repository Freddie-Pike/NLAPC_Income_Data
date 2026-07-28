// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render, cleanup } from "@testing-library/react";
import IncomeComposition from "@/app/components/IncomeComposition";
import { getHousehold } from "@/lib/graph-data";
import { getSeedGraphData } from "@/lib/seed-data";

/**
 * IncomeComposition tests. The treemap tiles are SVG laid out by Recharts (no
 * geometry in jsdom), so we assert on the accessible layer that renders regardless:
 * the sr-only summary names every program, flags estimates, and marks the rent-only
 * housing line. Recharts' ResponsiveContainer needs ResizeObserver, absent in jsdom.
 */

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // jsdom has no matchMedia; useColorScheme reads it (system → light).
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

const seed = getSeedGraphData();
const family4 = getHousehold(seed, "family4")!;

describe("IncomeComposition", () => {
  it("names every income program in the accessible summary", () => {
    const { container } = render(
      <IncomeComposition household={family4} meta={seed.meta} />,
    );
    const text = container.textContent ?? "";
    for (const item of family4.income) {
      expect(text).toContain(item.label);
    }
  });

  it("flags estimates and the rent-only housing line", () => {
    const { container } = render(
      <IncomeComposition household={family4} meta={seed.meta} />,
    );
    const text = container.textContent ?? "";
    expect(family4.income.some((i) => i.estimate)).toBe(true);
    expect(text).toContain("(estimate)");
    expect(text).toContain("reimburses rent only");
  });
});
