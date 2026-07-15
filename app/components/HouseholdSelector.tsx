"use client";

/**
 * HouseholdSelector, native radios styled as a segmented control.
 *
 * Presentational and shared: the gap page and the income page both mount it, each
 * wiring it to the shared household context. Identity is the visible label, not
 * colour; the selected label carries the ink fill and the focus ring.
 */

import type { Household, HouseholdId } from "@/lib/graph-data";

export default function HouseholdSelector({
  households,
  selected,
  onSelect,
}: {
  households: Household[];
  selected: HouseholdId;
  onSelect: (id: HouseholdId) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 p-0 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        Household
      </legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {households.map((h) => {
          const isSel = h.id === selected;
          return (
            <label
              key={h.id}
              className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors"
              style={{
                color: isSel ? "var(--bg)" : "var(--ink)",
                background: isSel ? "var(--ink)" : "transparent",
              }}
            >
              <input
                type="radio"
                name="household"
                value={h.id}
                checked={isSel}
                onChange={() => onSelect(h.id)}
                className="sr-only"
              />
              {h.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
