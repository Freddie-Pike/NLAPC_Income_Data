import { describe, it, expect } from "vitest";
import { formatCAD, formatSignedCAD } from "@/lib/format";

/**
 * Money-formatter tests. These drive the shortfall figure and every axis/table
 * value, so the rounding and the signed-minus glyph are load-bearing.
 */

describe("formatCAD", () => {
  it("formats whole-dollar CAD with grouping and no cents", () => {
    expect(formatCAD(1211)).toBe("$1,211");
    expect(formatCAD(0)).toBe("$0");
    expect(formatCAD(3463.4)).toBe("$3,463"); // rounds
    expect(formatCAD(3462.6)).toBe("$3,463");
  });

  it("rounds a fractional cost up and groups the thousands (robust digits check)", () => {
    // family4 food line ($1,454.9-ish) rounds to $1,455. Assert digits/grouping
    // robustly rather than over-asserting en-CA locale spacing.
    const out = formatCAD(1454.9);
    expect(out).toContain("$");
    expect(out).toContain("1,455");
    expect(out).not.toContain(".");
  });
});

describe("formatSignedCAD", () => {
  it("uses a real minus sign (U+2212) for negatives and + for non-negatives", () => {
    expect(formatSignedCAD(-761)).toBe("−$761");
    expect(formatSignedCAD(1045)).toBe("+$1,045");
    expect(formatSignedCAD(0)).toBe("+$0");
  });

  it("never uses an ASCII hyphen for the minus", () => {
    expect(formatSignedCAD(-500).startsWith("-")).toBe(false);
    expect(formatSignedCAD(-500).startsWith("−")).toBe(true);
  });

  it("prefixes negatives with the minus glyph + $ and keeps the magnitude digits", () => {
    const out = formatSignedCAD(-537);
    expect(out.startsWith("−$")).toBe(true);
    expect(out).toContain("537");
  });
});
