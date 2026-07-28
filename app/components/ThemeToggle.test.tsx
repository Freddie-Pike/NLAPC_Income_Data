// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ThemeToggle from "@/app/components/ThemeToggle";

/**
 * ThemeToggle tests. It reads its mode through useSyncExternalStore, persists to
 * localStorage under "nleats-theme", and writes a concrete light/dark value to
 * <html data-theme> (the single signal the CSS tokens + chart SVG read).
 *
 * jsdom has no matchMedia, so we stub it (system → not-dark → resolves "light").
 */

const KEY = "nleats-theme";

beforeEach(() => {
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
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("renders a button whose aria-label names the Colour theme", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toContain("Colour theme");
    // Clean localStorage → defaults to System.
    expect(button.getAttribute("aria-label")).toContain("System");
  });

  it("cycles System → Light → Dark → System and persists each choice", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button); // System → Light
    expect(button.getAttribute("aria-label")).toContain("Light");
    expect(localStorage.getItem(KEY)).toBe("light");

    fireEvent.click(button); // Light → Dark
    expect(button.getAttribute("aria-label")).toContain("Dark");
    expect(localStorage.getItem(KEY)).toBe("dark");

    fireEvent.click(button); // Dark → System
    expect(button.getAttribute("aria-label")).toContain("System");
    expect(localStorage.getItem(KEY)).toBe("system");
  });

  it("writes a concrete light/dark value to <html data-theme> for a chosen mode", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    const root = document.documentElement;

    fireEvent.click(button); // → Light
    expect(root.getAttribute("data-theme")).toBe("light");

    fireEvent.click(button); // → Dark
    expect(root.getAttribute("data-theme")).toBe("dark");

    // System resolves via the (stubbed, not-dark) matchMedia → "light".
    fireEvent.click(button); // → System
    expect(root.getAttribute("data-theme")).toBe("light");
  });
});
