import { describe, it, expect, vi, afterEach } from "vitest";
import {
  loadGraphDataWithFallback,
  isSheetConfigured,
} from "@/lib/load-graph-data";

/**
 * Loader tests. Exercise BOTH sources — the committed CSV snapshot and the Google
 * Sheet — and confirm they are never both active at once (the env gate is the
 * single switch), plus the resilient fallback + security format-validation.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A minimal valid sheet CSV (one household) used to prove the Sheet path is read.
const SHEET_CSV = [
  "household,section,key,label,amount,estimate,source,poverty_line_monthly,notes",
  "single,income,basic,Basic,561,FALSE,gov-nl-is-2025,,",
  "single,cost,food,Food,450,TRUE,foodfirst-nfb-2024,,",
  "single,poverty,poverty-line,MBM,2247,FALSE,maytree-nl-2024,2247,",
].join("\n");

describe("loadGraphDataWithFallback", () => {
  it("reads the committed CSV snapshot (fresh) when the Sheet is unconfigured", async () => {
    expect(isSheetConfigured()).toBe(false);
    const { data, stale } = await loadGraphDataWithFallback();
    expect(stale).toBe(false);
    expect(data.households).toHaveLength(3); // the full seed, not the 1-household sheet
  });

  it("reads the Google Sheet (not the snapshot) when configured — one active source", async () => {
    vi.stubEnv("GOOGLE_SHEET_ID", "abc123_XY-Z");
    vi.stubEnv("GOOGLE_SHEET_GID", "0");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(SHEET_CSV, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { data, stale } = await loadGraphDataWithFallback();
    expect(stale).toBe(false);
    expect(data.households).toHaveLength(1); // proves it parsed the sheet, not the seed
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain(
      "https://docs.google.com/spreadsheets/d/abc123_XY-Z/export?format=csv&gid=0",
    );
  });

  it("falls back to the snapshot and flags stale when the Sheet fetch fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("GOOGLE_SHEET_ID", "abc123");
    vi.stubEnv("GOOGLE_SHEET_GID", "0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );

    const { data, stale } = await loadGraphDataWithFallback();
    expect(stale).toBe(true);
    expect(data.households).toHaveLength(3); // last-known figures from the snapshot
  });

  it("rejects a malformed sheet id and falls back (never fetches)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("GOOGLE_SHEET_ID", "bad/../id"); // slash → fails format validation
    vi.stubEnv("GOOGLE_SHEET_GID", "0");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { data, stale } = await loadGraphDataWithFallback();
    expect(stale).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled(); // SSRF defense-in-depth: no request built
    expect(data.households).toHaveLength(3);
  });
});
