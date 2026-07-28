import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { graphDataCsv } from "@/lib/graph-data-snapshot";
import { getSeedGraphData } from "@/lib/seed-data";

/**
 * Drift guard. `lib/graph-data-snapshot.ts` is generated from `data/graph-data.csv`
 * (by `scripts/gen-seed-snapshot.mjs`) and is what the app actually parses at
 * runtime, so it must stay byte-identical to the CSV. If this fails after editing
 * the data, regenerate the snapshot: `npm run sync:data` (or
 * `node scripts/gen-seed-snapshot.mjs`), then commit both files.
 */
const CSV_ON_DISK = readFileSync(
  fileURLToPath(new URL("../data/graph-data.csv", import.meta.url)),
  "utf8",
);

describe("seed snapshot", () => {
  it("the bundled snapshot matches data/graph-data.csv", () => {
    expect(graphDataCsv).toBe(CSV_ON_DISK);
  });

  it("parses into a well-formed GraphData payload", () => {
    const data = getSeedGraphData();
    expect(data.households.length).toBeGreaterThan(0);
    expect(data.meta.currency).toBe("CAD");
  });
});
