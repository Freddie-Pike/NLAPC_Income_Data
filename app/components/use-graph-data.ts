"use client";

/**
 * useGraphData, the shared client fetch for the graph payload.
 *
 * Extracted so every page (the gap, below-the-line, income makeup) reads the same
 * fixed-shape data the same way. The API already falls back to the committed
 * snapshot with `meta.stale=true` when the live Sheet is unreachable, so a rejected
 * fetch here is a genuine network/HTTP error, surfaced rather than papered over.
 */

import { useEffect, useState } from "react";
import type { GraphData } from "@/lib/graph-data";

export interface GraphFetchState {
  data: GraphData | null;
  /** true → `data` is the committed snapshot fallback (live Sheet unreachable) */
  stale: boolean;
  loading: boolean;
}

export function useGraphData(): GraphFetchState {
  const [state, setState] = useState<GraphFetchState>({
    data: null,
    stale: false,
    loading: true,
  });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/graph-data")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GraphData>;
      })
      .then((data) => {
        if (!cancelled)
          setState({ data, stale: Boolean(data.meta.stale), loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, stale: false, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
