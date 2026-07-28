/**
 * gen-seed-snapshot — inline the committed CSV into a bundled TS module.
 *
 * Reads `data/graph-data.csv` (the committed snapshot of the Google Sheet) and
 * writes `lib/graph-data-snapshot.ts`, which exports the CSV verbatim as a string
 * constant. `lib/seed-data.ts` imports that string instead of reading the file at
 * runtime.
 *
 * Why a bundled string and not `readFileSync`: on the production build (Turbopack)
 * a `new URL("...csv", import.meta.url)` read compiles to a Turbopack *asset URL*
 * that points into `.next/server/assets/`. That path does not survive Netlify's
 * serverless-function packaging, so the read throws ENOENT at runtime and the data
 * route 502s (works locally, fails on deploy). A string that is part of the JS is
 * always in the bundle, on every host and builder, so the function never touches
 * the filesystem.
 *
 * Runs automatically after `npm run sync:data`; also runnable on its own:
 *   node scripts/gen-seed-snapshot.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const csvPath = fileURLToPath(
  new URL("../data/graph-data.csv", import.meta.url),
);
const outPath = fileURLToPath(
  new URL("../lib/graph-data-snapshot.ts", import.meta.url),
);

const csv = readFileSync(csvPath, "utf8");

const contents = `// AUTO-GENERATED from data/graph-data.csv. Do not edit by hand.
// Regenerate with \`npm run sync:data\` (or \`node scripts/gen-seed-snapshot.mjs\`).
//
// The committed CSV snapshot, inlined as a bundled string so the serverless
// function parses it in-memory and never reads it from disk at runtime. See
// scripts/gen-seed-snapshot.mjs for why the filesystem read cannot be relied on.
export const graphDataCsv = ${JSON.stringify(csv)};
`;

writeFileSync(outPath, contents, "utf8");
console.log("✓ Wrote lib/graph-data-snapshot.ts from data/graph-data.csv");
