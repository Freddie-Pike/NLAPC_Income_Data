"use client";

/**
 * IncomeCostExplorer, the gap page's interactive instrument.
 *
 * The chart (left) reads against a control + readout rail (right), with the sourced
 * data table full-width below. The household comes from the shared context (so the
 * choice follows the visitor across pages); a monthly-food input overrides costs[0]
 * live, and the readout recomputes on every change.
 *
 * Honest framing: the shortfall is income − food, and income includes a
 * rent-earmarked housing line, so the readout is "left AFTER healthy food for rent +
 * everything else", never a disposable surplus. The always-true anchor is the
 * income-vs-MBM-poverty-line gap.
 */

import { useState } from "react";
import type { Household, HouseholdId, LineItem } from "@/lib/graph-data";
import { computeShortfall, getHousehold } from "@/lib/graph-data";
import { formatCAD, formatSignedCAD } from "@/lib/format";
import IncomeCostChart from "@/app/components/IncomeCostChart";
import DataTable from "@/app/components/DataTable";
import HouseholdSelector from "@/app/components/HouseholdSelector";
import { useGraphData } from "@/app/components/use-graph-data";
import { useHousehold } from "@/app/components/HouseholdProvider";

const HOUSEHOLD_PHRASE: Record<HouseholdId, string> = {
  single: "a single adult",
  couple: "a couple",
  family4: "a family of four",
};

function computeIncome(h: Household): number {
  return h.income.reduce((sum, i) => sum + i.amount, 0);
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function IncomeCostExplorer() {
  const { data, stale, loading } = useGraphData();
  const { householdId, setHouseholdId } = useHousehold();
  const [foodOverride, setFoodOverride] = useState<number | null>(null);

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="grid place-items-center rounded-2xl border border-border bg-surface text-ink-muted"
        style={{ minHeight: 460 }}
      >
        Loading the numbers…
      </div>
    );
  }
  if (!data) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-border bg-surface p-5 text-ink"
      >
        Couldn’t load the data. Please refresh to try again.
      </div>
    );
  }

  const base = getHousehold(data, householdId) ?? data.households[0];
  const baseFood = base.costs[0];
  const foodValue = foodOverride ?? baseFood.amount;
  const overridden =
    foodOverride !== null &&
    Math.round(foodOverride) !== Math.round(baseFood.amount);

  const foodItem: LineItem = overridden
    ? {
        ...baseFood,
        amount: foodValue,
        estimate: false,
        label: "Healthy food (your budget)",
        // A user-entered figure is not a cited source, clear it so the tooltip
        // and table don't attribute the number to Food First NL (honesty).
        source: "",
        note: `Your entered monthly food budget. Reset restores the ${data.meta.foodYear} Nutritious Food Basket figure.`,
      }
    : baseFood;
  const displayHousehold: Household = {
    ...base,
    costs: [foodItem, ...base.costs.slice(1)],
  };

  const changeHousehold = (id: HouseholdId) => {
    setHouseholdId(id);
    setFoodOverride(null);
  };
  const maxFood = Math.max(
    2000,
    Math.ceil((computeIncome(base) * 1.3) / 100) * 100,
  );

  return (
    <section
      aria-label="Explore an NL household's income against the cost of healthy eating"
      className="grid gap-5"
    >
      {/* control bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <HouseholdSelector
          households={data.households}
          selected={householdId}
          onSelect={changeHousehold}
        />
        <p className="tabular text-xs text-ink-muted">
          Monthly CAD · Newfoundland &amp; Labrador · data as of{" "}
          {data.meta.lastUpdated}
        </p>
      </div>

      {/* non-blocking notice when the live source is unreachable */}
      {stale && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted"
          style={{ margin: 0 }}
        >
          Live data is temporarily unavailable, showing the last-known figures
          (as of {data.meta.lastUpdated}).
        </p>
      )}

      {/* instrument: chart (left) + readout rail (right) */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <IncomeCostChart household={displayHousehold} meta={data.meta} />
        <div className="grid content-start gap-5">
          <ShortfallReadout
            household={displayHousehold}
            foodValue={foodValue}
          />
          <FoodControl
            value={foodValue}
            max={maxFood}
            defaultValue={baseFood.amount}
            foodYear={data.meta.foodYear}
            overridden={overridden}
            onChange={(v) => setFoodOverride(v)}
            onReset={() => setFoodOverride(null)}
          />
        </div>
      </div>

      <DataTable household={displayHousehold} />
    </section>
  );
}

// ── shortfall readout (an instrument gauge, not a hero-metric tile) ──

function ShortfallReadout({
  household,
  foodValue,
}: {
  household: Household;
  foodValue: number;
}) {
  const income = computeIncome(household);
  const shortfall = computeShortfall(household.income, household.costs);
  const inDeficit = shortfall < 0;
  const mbmGap = income - household.povertyLineMonthly; // negative → below the line
  const phrase = HOUSEHOLD_PHRASE[household.id];

  const gapWord = mbmGap < 0 ? "below" : "above";
  const liveSummary = inDeficit
    ? `Food alone exceeds total income by ${formatCAD(Math.abs(shortfall))} per month. Total income is ${formatCAD(Math.abs(mbmGap))} ${gapWord} the poverty line.`
    : `${formatCAD(shortfall)} per month left after healthy food. Total income is ${formatCAD(Math.abs(mbmGap))} ${gapWord} the poverty line.`;

  return (
    <div
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
      style={{ display: "grid", gap: 6 }}
    >
      {/* Concise, atomic live region so slider drags announce one short line, not the whole block */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {liveSummary}
      </span>
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {inDeficit
          ? "Food alone exceeds total income"
          : "Left after healthy food"}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          color: inDeficit ? "var(--chart-deficit)" : "var(--ink)",
        }}
      >
        {inDeficit ? formatSignedCAD(shortfall) : formatCAD(shortfall)}
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--ink-muted)",
            marginLeft: 8,
          }}
        >
          /mo
        </span>
      </p>
      <p
        className="text-[15px] leading-normal text-ink-muted"
        style={{ margin: 0 }}
      >
        {inDeficit ? (
          <>
            {capitalize(phrase)}’s whole monthly income can’t cover a{" "}
            {formatCAD(foodValue)} food budget, healthy food alone outruns
            everything the household receives.
          </>
        ) : (
          <>
            after a {formatCAD(foodValue)} food basket, {phrase} is left with
            this for rent, heat, power, transport, and everything else.
          </>
        )}
      </p>

      <div
        className="mt-2 flex items-center gap-2.5 border-t border-border pt-4 text-sm text-ink-muted"
        style={{ lineHeight: 1.4 }}
      >
        <span
          aria-hidden
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "var(--ink-muted)",
            flex: "0 0 auto",
          }}
        />
        <span>
          Total income is{" "}
          <strong className="tabular text-ink">
            {formatCAD(Math.abs(mbmGap))} {mbmGap < 0 ? "below" : "above"}
          </strong>{" "}
          the poverty line (MBM)
          {household.povertyLineEstimate ? ", estimate" : ""}.
        </span>
      </div>
    </div>
  );
}

// ── food input (number + range, synced) ──

function FoodControl({
  value,
  max,
  defaultValue,
  foodYear,
  overridden,
  onChange,
  onReset,
}: {
  value: number;
  max: number;
  defaultValue: number;
  foodYear: number;
  overridden: boolean;
  onChange: (v: number) => void;
  onReset: () => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  return (
    <div
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
      style={{ display: "grid", gap: 12 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <label
          htmlFor="food-number"
          className="text-[15px] font-semibold text-ink"
        >
          Monthly food budget
        </label>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="text-ink-muted">
            $
          </span>
          <input
            id="food-number"
            type="number"
            min={0}
            max={max}
            step={10}
            value={Math.round(value)}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
            className="tabular rounded-lg border border-border bg-bg text-ink"
            aria-label="Monthly food budget in Canadian dollars"
            style={{
              width: 88,
              padding: "6px 8px",
              fontSize: 15,
              textAlign: "right",
            }}
          />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={10}
        value={Math.round(value)}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label="Monthly food budget slider"
        style={{ width: "100%", accentColor: "var(--accent)" }}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p
          className="text-xs text-ink-muted"
          style={{ margin: 0, maxWidth: "42ch" }}
        >
          Default is the {foodYear} Nutritious Food Basket estimate (
          {formatCAD(defaultValue)}/mo). Enter your own to watch the gap move.
        </p>
        <button
          type="button"
          onClick={onReset}
          disabled={!overridden}
          className="rounded-lg border border-border text-[13px] font-semibold"
          style={{
            padding: "6px 10px",
            background: "transparent",
            color: overridden ? "var(--ink)" : "var(--ink-muted)",
            cursor: overridden ? "pointer" : "default",
            opacity: overridden ? 1 : 0.5,
          }}
        >
          Reset to food basket
        </button>
      </div>
    </div>
  );
}
