/**
 * sync-data — refresh the committed snapshot `data/graph-data.csv` from the
 * Google Sheet (the single source of truth for the numbers).
 *
 * This is what makes "single source of truth" real: humans edit the SHEET, then
 * run `npm run sync:data` to regenerate the committed CSV fallback and commit it.
 * The CSV is never hand-authored.
 *
 * Reads GOOGLE_SHEET_ID / GOOGLE_SHEET_GID from the environment. The npm script
 * loads them from `.env.local` if present (`--env-file-if-exists`); you can also
 * pass them inline: `GOOGLE_SHEET_ID=... GOOGLE_SHEET_GID=... npm run sync:data`.
 *
 * No dependencies (Node 18+ global fetch). Refuses to overwrite the snapshot
 * unless the response is a well-formed CSV, so a private/mis-shared sheet (which
 * returns an HTML login page) can never clobber good data.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TIMEOUT_MS = 15000;
const EXPECTED_HEADER = "household,section,key,label,amount";

const id = process.env.GOOGLE_SHEET_ID;
const gid = process.env.GOOGLE_SHEET_GID;

function fail(message) {
  console.error(`\n✗ sync-data: ${message}\n`);
  process.exit(1);
}

if (!id || !gid) {
  fail(
    "GOOGLE_SHEET_ID and GOOGLE_SHEET_GID must both be set.\n" +
      "  Add them to .env.local, or run:\n" +
      "  GOOGLE_SHEET_ID=<id> GOOGLE_SHEET_GID=<gid> npm run sync:data",
  );
}
// Same format validation as the loader (defense-in-depth: keep the fetch target
// a well-formed docs.google.com export URL).
if (!/^[A-Za-z0-9_-]+$/.test(id)) fail(`Malformed GOOGLE_SHEET_ID: "${id}"`);
if (!/^[0-9]+$/.test(gid)) fail(`Malformed GOOGLE_SHEET_GID: "${gid}"`);

const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
const outPath = fileURLToPath(
  new URL("../data/graph-data.csv", import.meta.url),
);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

try {
  console.log(`\n→ Fetching Sheet CSV (id ${id}, gid ${gid})…`);
  const res = await fetch(url, { signal: controller.signal });
  if (!res.ok) fail(`Google returned HTTP ${res.status}.`);

  const body = await res.text();

  // A private / not-link-shared sheet returns HTTP 200 with an HTML sign-in page,
  // not CSV. Detect that so we never overwrite the good snapshot with markup.
  const contentType = res.headers.get("content-type") ?? "";
  const looksHtml =
    contentType.includes("text/html") || /^\s*<(!doctype|html)/i.test(body);
  if (looksHtml) {
    fail(
      "Response was an HTML page, not CSV — the sheet is probably not shared.\n" +
        '  In Google Sheets: Share → General access → "Anyone with the link" → Viewer.',
    );
  }
  if (!body.replace(/^﻿/, "").trimStart().startsWith(EXPECTED_HEADER)) {
    fail(
      `CSV header does not start with "${EXPECTED_HEADER}".\n` +
        "  Check the tab layout matches the README.",
    );
  }

  writeFileSync(outPath, body, "utf8");
  const rows = body.trim().split(/\r?\n/).length - 1; // minus the header
  console.log(`✓ Wrote ${rows} data rows to data/graph-data.csv`);
  console.log(
    "  Review the diff, run `npm test`, then commit the refreshed snapshot.\n",
  );
} catch (err) {
  if (err?.name === "AbortError") fail(`Timed out after ${TIMEOUT_MS}ms.`);
  fail(err instanceof Error ? err.message : String(err));
} finally {
  clearTimeout(timer);
}
