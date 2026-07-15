import { describe, it, expect } from "vitest";
import { SOURCES, getSource, isSourceKey } from "@/lib/sources";
import { getSeedGraphData } from "@/lib/seed-data";

// The dataset parsed from the committed CSV (single source of truth).
const seed = getSeedGraphData();

/**
 * Sources-registry tests. Guards the "every displayed
 * number is cited" invariant: the registry is well-formed AND every citation key
 * the shipped data references resolves to a real source.
 */

describe("SOURCES registry", () => {
  it("every entry has a compact short, a label, a description, and an https URL", () => {
    for (const [key, source] of Object.entries(SOURCES)) {
      expect(source.short, `${key}.short`).toBeTruthy();
      expect(source.label, `${key}.label`).toBeTruthy();
      expect(source.description, `${key}.description`).toBeTruthy();
      expect(source.url, `${key}.url`).toMatch(/^https:\/\//);
    }
  });

  it("isSourceKey / getSource resolve known keys and reject unknown ones", () => {
    expect(isSourceKey("foodfirst-nfb-2024")).toBe(true);
    expect(isSourceKey("not-a-real-key")).toBe(false);
    expect(isSourceKey("nope")).toBe(false);
    expect(getSource("maytree-nl-2024")?.url).toContain("maytree.com");
    expect(getSource("not-a-real-key")).toBeUndefined();
  });

  it("getSource returns a fully-populated metadata object for a known key", () => {
    const source = getSource("maytree-nl-2024");
    expect(source).toBeTruthy();
    expect(source?.short).toBeTruthy();
    expect(source?.label).toBeTruthy();
    expect(source?.description).toBeTruthy();
    expect(source?.url).toMatch(/^https:\/\//);
  });
});

describe("data <-> sources integrity", () => {
  it("every citation key referenced in the seed data resolves in the registry", () => {
    for (const h of seed.households) {
      const keys = [
        ...h.income.map((i) => i.source),
        ...h.costs.map((c) => c.source),
        h.povertyLineSource,
      ].filter((k) => k.length > 0);
      for (const key of keys) {
        expect(
          isSourceKey(key),
          `${h.id} references unknown source "${key}"`,
        ).toBe(true);
      }
    }
  });
});
