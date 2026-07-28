import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "@/app/api/graph-data/route";
import type { GraphData } from "@/lib/graph-data";

/**
 * Endpoint tests. We call the exported `GET` handler directly, no HTTP server,
 * and assert `res.status` + `await res.json()`. `environment: 'node'` is set in
 * vitest.config.ts.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/graph-data", () => {
  it("returns 200 and the graph payload from the local CSV (no env)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = (await res.json()) as GraphData;
    expect(data.meta.currency).toBe("CAD");
    expect(data.meta.period).toBe("monthly");
    expect(data.meta.stale).toBeFalsy(); // committed CSV is the fresh active source
    expect(data.households).toHaveLength(3);
    expect(data.households.map((h) => h.id)).toEqual([
      "single",
      "couple",
      "family4",
    ]);
    for (const h of data.households) {
      expect(h.costs[0].key).toBe("food"); // food is costs[0]
      expect(h.income.length).toBeGreaterThan(0);
      expect(typeof h.povertyLineMonthly).toBe("number");
    }
  });

  it("falls back to the committed snapshot (200 + meta.stale) when the configured Sheet fetch fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("GOOGLE_SHEET_ID", "fake-sheet-id");
    vi.stubEnv("GOOGLE_SHEET_GID", "0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );

    const res = await GET();
    // The Sheet being down must NOT take the site down: serve last-known figures.
    expect(res.status).toBe(200);
    const data = (await res.json()) as GraphData;
    expect(data.meta.stale).toBe(true);
    expect(data.households).toHaveLength(3);
  });
});
