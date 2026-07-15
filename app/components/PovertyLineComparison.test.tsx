// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import PovertyLineComparison from "@/app/components/PovertyLineComparison";
import { getSeedGraphData } from "@/lib/seed-data";

beforeAll(() => {
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

/**
 * PovertyLineComparison tests (waffle unit-grids). The grids are plain viewBox SVG
 * (coordinates computed from the data, not measured), so they render in jsdom. We
 * assert on the accessible layer: the sr-only summary, the threshold legend, and
 * each household's headline share, which all render as HTML/text.
 */

afterEach(cleanup);

const seed = getSeedGraphData();

describe("PovertyLineComparison", () => {
  it("summarises every household and the below-line count (sr-only)", () => {
    const { container } = render(
      <PovertyLineComparison households={seed.households} meta={seed.meta} />,
    );
    const text = container.textContent ?? "";
    for (const h of seed.households) {
      expect(text).toContain(h.label);
    }
    expect(text).toContain("fall below the line");
  });

  it("labels the deep-poverty threshold and each household's share", () => {
    render(
      <PovertyLineComparison households={seed.households} meta={seed.meta} />,
    );
    expect(screen.getByText("Deep poverty (75%)")).toBeTruthy();
    // headline percentages: single 54%, couple 59%, family4 77%
    expect(screen.getByText("54%")).toBeTruthy();
    expect(screen.getByText("59%")).toBeTruthy();
    expect(screen.getByText("77%")).toBeTruthy();
  });

  it("renders with a household highlighted without error", () => {
    const { container } = render(
      <PovertyLineComparison
        households={seed.households}
        selectedId="couple"
        meta={seed.meta}
      />,
    );
    expect(container.textContent).toContain("Couple");
  });
});
