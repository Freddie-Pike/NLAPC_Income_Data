"use client";

/**
 * ThemeToggle, cycles Light → Dark → System, persisted in localStorage. It
 * resolves the mode to a concrete light/dark value and writes `data-theme` on
 * <html>, the single signal the CSS tokens and the chart's SVG marks both read.
 * The no-flash script in app/layout.tsx applies the same resolution before paint.
 *
 * Mode is read through useSyncExternalStore so it's SSR-safe and never sets state
 * inside an effect.
 */

import { useEffect, useSyncExternalStore } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "nleats-theme";
const EVT = "nleats-theme-change";
const ORDER: Mode[] = ["light", "dark", "system"];
const LABEL: Record<Mode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};
const ICON: Record<Mode, string> = { light: "☀", dark: "☾", system: "◐" };

function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function resolve(mode: Mode): "light" | "dark" {
  return mode === "system" ? (systemDark() ? "dark" : "light") : mode;
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVT, cb);
  };
}
function getMode(): Mode {
  const m = localStorage.getItem(KEY);
  return m === "light" || m === "dark" ? m : "system";
}
function getServerMode(): Mode {
  return "system";
}

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getMode, getServerMode);

  useEffect(() => {
    const apply = () =>
      document.documentElement.setAttribute("data-theme", resolve(mode));
    apply();
    if (mode !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, [mode]);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Safari Private Browsing throws on localStorage writes. Ignore it: the
      // theme still applies now, it just won't survive a reload.
    }
    window.dispatchEvent(new Event(EVT));
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Colour theme: ${LABEL[mode]}. Activate to change.`}
      title={`Theme: ${LABEL[mode]}`}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface font-semibold text-ink"
      style={{
        padding: "7px 12px",
        fontSize: 13,
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      <span aria-hidden style={{ fontSize: 14 }}>
        {ICON[mode]}
      </span>
      <span
        className="hidden sm:inline"
        style={{ minWidth: "3.6ch", textAlign: "left" }}
      >
        {LABEL[mode]}
      </span>
    </button>
  );
}
