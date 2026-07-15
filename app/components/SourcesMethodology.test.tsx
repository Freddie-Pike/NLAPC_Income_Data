// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SourcesMethodology from "@/app/components/SourcesMethodology";
import { getSeedGraphData } from "@/lib/seed-data";
import { siteCopy } from "@/lib/site-copy";

// The households the server page passes in — sourced from the committed snapshot.
const households = getSeedGraphData().households;

/**
 * SourcesMethodology tests. A sync server-style component
 * (no "use client", no async, no server-only APIs) so it renders in jsdom.
 *
 * The load-bearing check: the poverty sentence is DERIVED from povertyStats over
 * the households actually modelled, so it must read "All three ... fall below it,
 * and two of them are in deep poverty" (not a hardcoded claim that could drift).
 */

afterEach(cleanup);

describe("SourcesMethodology", () => {
  it("derives the poverty-line claim from povertyStats (3 below, 2 deep)", () => {
    const { container } = render(
      <SourcesMethodology
        households={households}
        intro={siteCopy.sourcesIntro}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain(
      "All three households modelled here fall below it, and two of them are in deep poverty",
    );
  });

  it("lists primary-source citation links", () => {
    render(
      <SourcesMethodology
        households={households}
        intro={siteCopy.sourcesIntro}
      />,
    );
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("renders the three methodology sub-headings", () => {
    render(
      <SourcesMethodology
        households={households}
        intro={siteCopy.sourcesIntro}
      />,
    );
    expect(
      screen.getByText("How the Nutritious Food Basket is measured"),
    ).toBeTruthy();
    expect(screen.getByText("What the poverty line (MBM) means")).toBeTruthy();
    expect(screen.getByText("Why some figures are estimates")).toBeTruthy();
  });
});
