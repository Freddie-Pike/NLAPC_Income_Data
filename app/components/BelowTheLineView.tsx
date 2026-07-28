"use client";

/**
 * BelowTheLineView, the "below-the-line" page body.
 *
 * Fetches the shared payload and renders the cross-household comparison, one bar
 * per household as a share of its own poverty line. It highlights the household the
 * visitor picked elsewhere (from the shared context) so the choice follows them,
 * but the page reads on its own for a visitor who lands here first.
 */

import PovertyLineComparison from "@/app/components/PovertyLineComparison";
import HouseholdSelector from "@/app/components/HouseholdSelector";
import { useGraphData } from "@/app/components/use-graph-data";
import { useHousehold } from "@/app/components/HouseholdProvider";

export default function BelowTheLineView() {
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

  return (
    <div className="grid gap-5">
      {/* selector changes which household's grid is framed (the shared choice) */}
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
      <PovertyLineComparison
        households={data.households}
        selectedId={householdId}
        meta={data.meta}
      />
    </div>
  );
}
