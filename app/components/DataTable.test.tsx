// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import DataTable from "@/app/components/DataTable";
import { getHousehold } from "@/lib/graph-data";
import { getSeedGraphData } from "@/lib/seed-data";

/**
 * DataTable tests. The chart's accessible, honest twin: every
 * income + cost line item, the two totals, and the poverty-line benchmark must
 * be reachable as text, with estimates flagged. The table lives inside a
 * <details>, so the DOM is present regardless of open state.
 */

afterEach(cleanup);

const family4 = getHousehold(getSeedGraphData(), "family4")!;

describe("DataTable", () => {
  it("renders a row for every income line item (by label)", () => {
    render(<DataTable household={family4} />);
    for (const item of family4.income) {
      expect(screen.getByText(item.label)).toBeTruthy();
    }
  });

  it("renders a row for every cost line item, including the food line", () => {
    render(<DataTable household={family4} />);
    for (const item of family4.costs) {
      expect(screen.getByText(item.label)).toBeTruthy();
    }
    // costs[0] is the Nutritious Food Basket line.
    expect(screen.getByText(family4.costs[0].label)).toBeTruthy();
  });

  it("renders the total and poverty-line benchmark rows", () => {
    render(<DataTable household={family4} />);
    expect(screen.getByText("Total income")).toBeTruthy();
    expect(screen.getByText("Total cost of healthy eating")).toBeTruthy();
    expect(screen.getByText("Poverty line (MBM)")).toBeTruthy();
  });

  it("flags estimate line items with an (estimate) marker", () => {
    render(<DataTable household={family4} />);
    const markers = screen.getAllByText("(estimate)");
    const estimateCount = [...family4.income, ...family4.costs].filter(
      (i) => i.estimate,
    ).length;
    expect(estimateCount).toBeGreaterThan(0);
    expect(markers.length).toBe(estimateCount);
  });
});
