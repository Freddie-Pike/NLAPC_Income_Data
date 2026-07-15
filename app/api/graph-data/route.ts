import { loadGraphDataWithFallback } from "@/lib/load-graph-data";

/**
 * GET /api/graph-data, the single endpoint the chart reads.
 *
 * `loadGraphDataWithFallback()` reads exactly one active source: the Google Sheet
 * when GOOGLE_SHEET_ID/GID are set, otherwise the committed `data/graph-data.csv`
 * snapshot. Both are parsed to the SAME response shape, so the chart is unaffected
 * by which one produced the data.
 *
 * Resilience: if the configured Sheet is unreachable/invalid, the handler serves
 * the committed snapshot with `meta.stale = true` (HTTP 200) so the site never
 * goes down; the client then shows a non-blocking "last-known figures" notice.
 * HTTP 502 is reserved for a genuine unrecoverable failure (the committed snapshot
 * itself can't parse) — and even then the client leaks no internal detail.
 *
 * `revalidate = 3600` opts this GET into a cached response re-generated at most
 * hourly (valid because Cache Components is off and `next.config.ts` is empty).
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const { data, stale } = await loadGraphDataWithFallback();
    // Clone meta to attach `stale`; never mutate the shared `graphMeta`.
    const payload = stale
      ? { ...data, meta: { ...data.meta, stale: true } }
      : data;
    return Response.json(payload);
  } catch (err) {
    // Log the real cause server-side; return a generic message to the client.
    console.error("GET /api/graph-data failed:", err);
    return Response.json(
      { error: "Failed to load graph data" },
      { status: 502 },
    );
  }
}
