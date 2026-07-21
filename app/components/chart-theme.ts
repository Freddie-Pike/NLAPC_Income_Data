"use client";

/**
 * Shared chart theme, one validated palette for every chart.
 *
 * The scheme-aware hex ramps live here (not in globals.css) because CSS `var()`
 * does not resolve in SVG presentation attributes; the surrounding HTML chrome
 * still uses the CSS design tokens and themes automatically. These hexes mirror
 * the `--chart-*` tokens in globals.css and are validated in both modes
 * (income-vs-cost bases clear the CVD floor; the 7-step income ramp is a
 * SEQUENTIAL ramp, told apart by 2px surface gaps + direct labels, never by hue).
 *
 * `useColorScheme` follows the resolved theme (`data-theme`, set by ThemeToggle
 * and the no-flash script) so the SVG marks stay in sync with the CSS tokens.
 */

import { useEffect, useState } from "react";

export type Scheme = "light" | "dark";

export interface ChartPalette {
  incomeShades: string[];
  costShades: string[];
  incomeBase: string;
  costBase: string;
  surface: string;
  ink: string;
  muted: string;
  grid: string;
  poverty: string;
  /** brand accent (chrome only: selection highlight, eyebrows — never a data hue) */
  accent: string;
}

export const PALETTE: Record<Scheme, ChartPalette> = {
  light: {
    // Darkened so every shade clears WCAG 3:1 non-text contrast on the #F7F8FA
    // surface (the two lightest steps of the prior ramp were sub-3:1).
    incomeShades: [
      "#0D366B",
      "#104281",
      "#184F95",
      "#1C5CAB",
      "#256ABF",
      "#2A78D6",
      "#3987E5",
    ],
    costShades: ["#EB6834", "#C9531F", "#A84418"],
    incomeBase: "#2A78D6",
    costBase: "#EB6834",
    surface: "#F7F8FA",
    ink: "#00091D",
    muted: "#4A5165",
    grid: "#E9EAEE",
    poverty: "#4A5165",
    accent: "#FAC637",
  },
  dark: {
    incomeShades: [
      "#3987E5",
      "#5598E7",
      "#6DA7EC",
      "#86B6EF",
      "#9EC5F4",
      "#B7D3F6",
      "#CDE2FB",
    ],
    costShades: ["#D95926", "#E67A4D", "#EE9670"],
    incomeBase: "#3987E5",
    costBase: "#D95926",
    surface: "#0F1729",
    ink: "#EEF1F6",
    muted: "#9AA3B8",
    grid: "#2A3350",
    poverty: "#9AA3B8",
    accent: "#FAC637",
  },
};

export function useColorScheme(): Scheme {
  const [scheme, setScheme] = useState<Scheme>("light");
  useEffect(() => {
    // Follow the resolved theme (data-theme, set by ThemeToggle / the no-flash
    // script) so the SVG marks stay in sync with the CSS tokens; fall back to the
    // OS preference if the attribute isn't present.
    const read = (): Scheme => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") return attr;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };
    const update = () => setScheme(read());
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);
  return scheme;
}

/** Pick a ramp step by index, clamped to the last shade. */
export function shadeFor(shades: string[], index: number): string {
  return shades[Math.min(index, shades.length - 1)];
}
