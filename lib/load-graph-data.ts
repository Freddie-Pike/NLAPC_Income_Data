/**
 * NL Eats, graph-data loader with an env gate.
 *
 * ONE function, ONE active source at a time (never both):
 *   • if GOOGLE_SHEET_ID + GOOGLE_SHEET_GID are set → fetch the Google Sheet's
 *     free published-CSV export (no API key, no billing) — the production source
 *     of truth, edited by Food First NL;
 *   • otherwise → read the bundled committed snapshot `data/graph-data.csv`
 *     (via `lib/seed-data.ts`) — the local-development default and the offline
 *     fallback.
 * Both paths feed the SAME `parseGraphDataCsv` transform, so the chart can't tell
 * which produced the data and the Sheet swap is invisible. The env gate is the
 * single switch: exactly one source is live at any moment.
 *
 * Resilience: when the Sheet IS configured but its fetch/parse fails,
 * `loadGraphDataWithFallback` serves the committed snapshot and flags it stale,
 * rather than failing the request — so the Sheet can never take the site down.
 *
 * Env vars are SERVER-ONLY (never `NEXT_PUBLIC_`). This module uses `fetch` and
 * `lib/seed-data.ts` (`node:fs`) and must only be imported by server code (the
 * Route Handler / server components), never a client component.
 */

import { getSeedGraphData } from "@/lib/seed-data";
import { parseGraphDataCsv } from "@/lib/parse-sheet-csv";
import type { GraphData } from "@/lib/graph-data";

/** Max time to wait on the Google Sheet before falling back (ms). */
const SHEET_FETCH_TIMEOUT_MS = 8000;

/**
 * Validate the env-provided Sheet identifiers before building a URL from them.
 * The id/gid are attacker-irrelevant here (they come from trusted server env),
 * but format-checking is defense-in-depth: it guarantees the fetch target stays
 * a well-formed `docs.google.com` export URL and can't be coerced elsewhere.
 */
function isValidSheetId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
}
function isValidSheetGid(gid: string): boolean {
  return /^[0-9]+$/.test(gid);
}

/**
 * Build the published-CSV export URL for a Google Sheet.
 *
 * This `/export?format=csv&gid=` form works for a sheet shared "Anyone with the
 * link → Viewer" (the maintainer's chosen sharing mode). (The alternative
 * "File → Share → Publish to web → CSV" form is
 * `.../spreadsheets/d/e/{PUBLISH_ID}/pub?gid={gid}&single=true&output=csv`, which
 * uses a different published id; if the maintainer switches to that, set
 * GOOGLE_SHEET_ID to the `e/{PUBLISH_ID}` value and adjust this template.)
 */
function sheetCsvUrl(id: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

/** True when the Google Sheet is configured (both env vars present). */
export function isSheetConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEET_GID);
}

async function fetchSheetCsv(id: string, gid: string): Promise<string> {
  if (!isValidSheetId(id) || !isValidSheetGid(gid)) {
    throw new Error("Malformed GOOGLE_SHEET_ID / GOOGLE_SHEET_GID");
  }
  // Abort a hung Google request so it can't stall the route; `next.revalidate`
  // still caches a successful response for at most an hour.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHEET_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(sheetCsvUrl(id, gid), {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Google Sheet fetch failed: HTTP ${res.status}`);
    }
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load the graph dataset from the single active source and parse it to
 * `GraphData`. Sheet path throws on fetch/parse failure; local path throws only
 * if the committed snapshot itself can't parse. Prefer
 * `loadGraphDataWithFallback` in the Route Handler for resilience.
 */
export async function loadGraphData(): Promise<GraphData> {
  const id = process.env.GOOGLE_SHEET_ID;
  const gid = process.env.GOOGLE_SHEET_GID;
  if (id && gid) {
    return parseGraphDataCsv(await fetchSheetCsv(id, gid));
  }
  return getSeedGraphData();
}

/**
 * Resilient load for the Route Handler. When the Sheet is configured but
 * unreachable/invalid, fall back to the committed snapshot and flag it `stale`
 * (the client shows a non-blocking "last-known figures" notice) instead of
 * failing the request. Only re-throws if the committed snapshot itself can't
 * parse (a genuine, unrecoverable error → the caller returns 502).
 */
export async function loadGraphDataWithFallback(): Promise<{
  data: GraphData;
  stale: boolean;
}> {
  const id = process.env.GOOGLE_SHEET_ID;
  const gid = process.env.GOOGLE_SHEET_GID;
  if (!id || !gid) {
    // Sheet not configured: the committed snapshot IS the active source (fresh).
    return { data: getSeedGraphData(), stale: false };
  }
  try {
    return {
      data: parseGraphDataCsv(await fetchSheetCsv(id, gid)),
      stale: false,
    };
  } catch (err) {
    // Log the real cause server-side for the maintainer; the client only learns
    // it is seeing last-known figures (no internal detail leaked).
    console.error("Google Sheet load failed, serving committed snapshot:", err);
    return { data: getSeedGraphData(), stale: true };
  }
}
