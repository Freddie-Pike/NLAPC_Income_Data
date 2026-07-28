"use client";

/**
 * IncomeMakeupExplorer, the "income" page body.
 *
 * The household selector (wired to the shared context) over the ranked
 * program-by-program breakdown, with the sourced data table as its accessible twin.
 * No food control here: this page is about where the income comes from, which does
 * not depend on the food budget.
 */

import { getHousehold } from "@/lib/graph-data";
import IncomeComposition from "@/app/components/IncomeComposition";
import DataTable from "@/app/components/DataTable";
import HouseholdSelector from "@/app/components/HouseholdSelector";
import { useGraphData } from "@/app/components/use-graph-data";
import { useHousehold } from "@/app/components/HouseholdProvider";

export default function IncomeMakeupExplorer() {
  const { data, stale, loading } = useGraphData();
  const { householdId, setHouseholdId } = useHousehold();

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="grid place-items-center rounded-2xl border border-border bg-surface text-ink-muted"
        style={{ minHeight: 320 }}
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

  const household = getHousehold(data, householdId) ?? data.households[0];

  return (
    <section
      aria-label="Explore where an NL household's monthly income comes from"
      className="grid gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <HouseholdSelector
          households={data.households}
          selected={householdId}
          onSelect={setHouseholdId}
        />
        <p className="tabular text-xs text-ink-muted">
          Monthly CAD · Newfoundland &amp; Labrador · data as of{" "}
          {data.meta.lastUpdated}
        </p>
      </div>

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

      <IncomeComposition household={household} meta={data.meta} />
      <DataTable household={household} />
    </section>
  );
}
