# NL Eats

"NL Eats", a data-visualization site for the [Newfoundland & Labrador Anti-Poverty Coalition](https://www.nlantipoverty.ca/) comparing household income support against the cost of healthy eating through an interactive, user-adjustable graph. Every figure on the page traces to a cited primary source, and every estimate is labelled with its method.

Live: [nlapcpovertyinfo.netlify.app](https://nlapcpovertyinfo.netlify.app/).

## What it is

The site makes one truth visible and adjustable: even counting every available support, a Newfoundland & Labrador household on income support lands below the Market Basket Measure poverty line, and healthy food alone takes a punishing share of the cheque. A visitor picks a household (single adult, couple, or family of four), adjusts the monthly food budget, and watches the gap respond. The chart is the argument; the numbers carry the persuasion.

The three households are **standardized model households built from official rates**, not real people's budgets: every income figure is a published government or benefit amount, which is exactly why every number can be cited. The only visitor input is the food-budget slider, a private "what if?" on their own screen that is never saved.

A second audience matters to the product's shape: the Food First NL staff who keep the figures current. They are not engineers, so the numbers live in a Google Sheet, editable in the browser with no code and no deploy. See [Updating the numbers](#updating-the-numbers-the-google-sheet).

## Quick start

Prerequisites: Node.js (a current LTS; this repo is developed on Node 22) and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page auto-updates as you edit files.

No environment variables are needed to run locally: with none set, the site reads the bundled snapshot `data/graph-data.csv`, the copy comes from `lib/site-copy.ts`, and the shared-password gate stays off, so the site is fully open.

## Local development

1. **Install and run** as above. That is the whole happy path, no configuration required.
2. **Optional: point at a real data source or turn on the gate.** Copy `.env.example` to `.env.local` and fill in only the pairs you want. Each variable pair is an independent on/off switch, and the file is gitignored.

   ```bash
   cp .env.example .env.local
   ```

   | Feature you want to test      | Set these in `.env.local`              |
   | ----------------------------- | -------------------------------------- |
   | Live data from a Google Sheet | `GOOGLE_SHEET_ID` + `GOOGLE_SHEET_GID` |
   | The shared-password wall      | `SITE_PASSWORD` + `AUTH_SECRET`        |

   Leave a pair unset (or commented) to keep that feature off and fall back to the committed defaults. See [Environment variables](#environment-variables) for what each one is.

3. **Verify your change.** Before opening a pull request:

   ```bash
   npm test            # Vitest suites
   npm run lint        # ESLint
   npm run build       # production build + type-check
   npm run format      # Prettier write (or format:check to verify only)
   ```

## Tech stack

- **Next.js 16.2.10, App Router.** This version has breaking changes from older Next.js: Middleware is renamed **Proxy** (the root [`proxy.ts`](proxy.ts)), and there are other API and convention shifts. The App Router guides live under `node_modules/next/dist/docs/01-app/`.
- **React 19.2.4**, **TypeScript** in strict mode.
- **Tailwind CSS v4, configured in CSS** (there is no `tailwind.config.*`): `@import "tailwindcss"` plus an `@theme inline` token block in `app/globals.css`; PostCSS uses `@tailwindcss/postcss`.
- **Recharts 3** for the chart, **PapaParse** for CSV parsing.
- **Vitest** with Testing Library for the test suites.
- **Fonts:** Geist and Geist Mono (body/UI and code) plus Lato (the NLAPC brand face, headings and the readout figure) via `next/font/google`.
- **Path alias:** `@/*` resolves to the repo root (`tsconfig.json`).
- **Deploys to Netlify.**

## Scripts

| Script                 | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the dev server (http://localhost:3000).                        |
| `npm run build`        | Production build.                                                    |
| `npm run start`        | Serve the production build.                                          |
| `npm run lint`         | ESLint (flat config, `eslint.config.mjs`).                           |
| `npm run lint:fix`     | ESLint with autofix.                                                 |
| `npm test`             | Run the Vitest suites once.                                          |
| `npm run test:watch`   | Vitest in watch mode.                                                |
| `npm run format`       | Prettier write across the repo.                                      |
| `npm run format:check` | Prettier check (no writes).                                          |
| `npm run sync:data`    | Refresh the committed `data/graph-data.csv` snapshot from the Sheet. |

## Architecture

### Data pipeline: one source of truth, one shape

The **Google Sheet is the single source of truth** for the numbers. Food First NL edits it in the browser. `data/graph-data.csv` is a **committed snapshot** of that Sheet (regenerated by `npm run sync:data`, never hand-edited) that serves as the offline fallback. The chart reads a single fixed-shape payload, so its source can change without the UI knowing.

The path: `GET /api/graph-data` ([`app/api/graph-data/route.ts`](app/api/graph-data/route.ts), cached hourly via `revalidate = 3600`) calls `loadGraphDataWithFallback()` ([`lib/load-graph-data.ts`](lib/load-graph-data.ts)), which reads **exactly one active source**:

- **`GOOGLE_SHEET_ID` + `GOOGLE_SHEET_GID` set** → fetch the Google Sheet's free published-CSV export. **This is production.**
- **neither set** → read the committed `data/graph-data.csv` via [`lib/seed-data.ts`](lib/seed-data.ts). **This is local development.**

Both paths run the same parser ([`lib/parse-sheet-csv.ts`](lib/parse-sheet-csv.ts)), which validates every row and produces the fixed `GraphData` shape from [`lib/graph-data.ts`](lib/graph-data.ts). The Sheet and the CSV both work, but never both at once.

**Resilience:** if the Sheet is configured but unreachable, empty, or invalid, the route serves the committed snapshot with `meta.stale = true` (HTTP 200) and the client shows a non-blocking "last-known figures" notice, never an error wall. HTTP 502 is reserved for a genuine unrecoverable failure (the committed snapshot itself cannot parse), and even then no internal detail leaks to the client. The `GOOGLE_SHEET_*` values are format-validated and the fetch has a timeout, so a malformed env or a hung request can never wedge the route.

### Editable copy

The site's editable **prose** (the hero headline and intro, the sources lead paragraph) lives in code, in [`lib/site-copy.ts`](lib/site-copy.ts), next to the citation registry. It is a small, low-churn set, so editing it is a normal code change. See [Editing the copy](#editing-the-copy).

### Auth gate (inert unless configured)

A free, app-level "soft gate" for keeping the preview private. It is entirely off unless both `SITE_PASSWORD` and `AUTH_SECRET` are set, so dev, CI, and Netlify previews stay open by default.

The perimeter is [`proxy.ts`](proxy.ts) (Next 16's renamed Middleware), which redirects un-authenticated requests to `/gate`. The real guard is [`lib/auth.ts`](lib/auth.ts): a constant-time password compare plus an HMAC-signed, httpOnly, Secure, SameSite=Lax session cookie. The login screen is [`app/gate/page.tsx`](app/gate/page.tsx); the password check and sign-out live in [`app/api/gate/route.ts`](app/api/gate/route.ts) and [`app/api/gate/logout/route.ts`](app/api/gate/logout/route.ts). All secrets are server-only (never `NEXT_PUBLIC_`).

### Design system

Colour and type tokens are defined once in [`app/globals.css`](app/globals.css) as an `@theme inline` block authored in OKLCH, with a validated light and dark theme (deep navy, not pure black). Components consume tokens by role (`text-ink`, `bg-surface`, `var(--chart-income)`), never raw hex. The theme is resolved to a `data-theme` attribute before first paint by a no-flash script in `app/layout.tsx` and toggled at runtime by `ThemeToggle`. The chart's SVG marks mirror the same palette as concrete hex, since CSS `var()` does not resolve in SVG presentation attributes.

## The three kinds of content (don't mix them)

Three things people confuse for one. They have three different homes and three different jobs, and only one holds the numbers.

| Content                                         | Home                                              | Editable without a deploy? |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------- |
| **The numbers** (amounts, poverty lines)        | the Google Sheet → `data/graph-data.csv` snapshot | Yes, in the Sheet          |
| **The references** (each source's link + label) | `lib/sources.ts` (code)                           | No, added during research  |
| **The prose** (headline, intro, sources lead)   | `lib/site-copy.ts` (code)                         | No, a small code change    |

**Numbers vs. references.** Each row in the Sheet cites a `source` _key_ (e.g. `foodfirst-nfb-2024`). That key resolves, in code via [`lib/sources.ts`](lib/sources.ts), to the actual link and label shown on the page. The chart is drawn only from the numbers; the references are attribution, the proof behind each number, not chart inputs. Keeping the reference list in code also makes it the **safety allowlist**: the parser rejects any row whose `source` is not a known key, and the citation link always comes from code, never from the Sheet, so a mistaken or malicious Sheet edit can never inject an arbitrary link. There is therefore never an uncited number on the page, and adding a brand-new source is a (rare) code change that happens during the research step anyway.

**Everything on screen is derived.** Every figure, date, and year comes from one of these sources, never typed a second time into a component. The years and the "as of" date come from `graphMeta` in `lib/graph-data.ts`. The only hand-written text is qualitative methodology narrative (for example "61 minimally-processed foods"), which describes the fixed method itself, not the per-refresh figures.

## Updating the numbers (the Google Sheet)

**In production you edit exactly one thing: the Google Sheet.**

### Sheet layout

One tab, one header row, one row per line item. Columns:

| Column                 | Example                     | Meaning                                                |
| ---------------------- | --------------------------- | ------------------------------------------------------ |
| `household`            | `family4`                   | `single` \| `couple` \| `family4`                      |
| `section`              | `income`                    | `income` \| `cost` \| `poverty`                        |
| `key`                  | `food`                      | stable id (the food cost row must use `food`)          |
| `label`                | `Healthy food (NFB)`        | display label                                          |
| `amount`               | `1455`                      | monthly CAD                                            |
| `estimate`             | `TRUE`                      | `TRUE`/`FALSE` (estimates render an "estimate" marker) |
| `source`               | `foodfirst-nfb-2024`        | a citation key that must exist in `lib/sources.ts`     |
| `poverty_line_monthly` | `4495`                      | on the household's `poverty` row                       |
| `notes`                | `2024 provincial avg ×4.33` | free text / method (shown for estimates)               |

Each household needs its income rows, a `cost` row keyed `food`, and one `poverty` row. The benefit years and the "as of" date are not Sheet columns; they live in `graphMeta` in `lib/graph-data.ts` and are bumped on a refresh.

### The edit loop

1. Edit the amounts / sources / notes in the **Google Sheet**.
2. If you referenced a brand-new source, a developer first adds its key and link to `lib/sources.ts` (otherwise the row is rejected).
3. Run `npm run sync:data` to pull the Sheet into `data/graph-data.csv`. Set `GOOGLE_SHEET_ID` / `GOOGLE_SHEET_GID` in `.env.local` first, or pass them inline. The script refuses to overwrite the snapshot if the sheet is not shared (Google returns an HTML login page instead of CSV).
4. Run `npm test` (a test asserts the CSV parses to a well-formed payload), review the diff, and commit the refreshed CSV.

### "I need to change X, where?"

- **A benefit amount, or flip an estimate flag** → edit the **Sheet**, then `npm run sync:data`.
- **Add a new line item that cites a source not used yet** → add the row _and_ add that source's entry to `lib/sources.ts`.
- **A source's link changed** → `lib/sources.ts`.
- **New benefit year / new "verified on" date** → bump `graphMeta` in `lib/graph-data.ts`.

### Refresh checklist (yearly-ish)

1. New Nutritious Food Basket published by Food First NL? Update the food rows.
2. Income Support rate change? Update the income rows.
3. New Maytree "Welfare in Canada" edition? Update the poverty-line rows.
4. Re-check any benefit that started or ended (e.g. the Canada Carbon Rebate ended April 2025).
5. Bump `graphMeta` (`incomeYear` / `federalYear` / `foodYear` / `povertyYear` / `lastUpdated`) in `lib/graph-data.ts`.
6. Re-verify each changed figure against its `source` link before publishing.

## Editing the copy

The site's editable prose (the hero headline and intro, the sources lead paragraph) lives in code, in [`lib/site-copy.ts`](lib/site-copy.ts), next to the citation registry. It is a small, low-churn set, so editing it is a normal code change: update the string in the `siteCopy` object, run the checks, and deploy. To add a new editable string, add a field to the `SiteCopy` interface and its value to `siteCopy`, then render it where you need it.

## Environment variables

All are **server-only**: never prefix any with `NEXT_PUBLIC_`, which would inline the value into the client bundle. Copy [`.env.example`](.env.example) to `.env.local` to set them locally. Each pair is an on/off switch; leave a pair unset to keep that feature off.

| Variable           | Purpose                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `GOOGLE_SHEET_ID`  | The Sheet document id (in its URL). Set with `GOOGLE_SHEET_GID` to read from the Sheet.     |
| `GOOGLE_SHEET_GID` | The specific tab's `gid`. With `GOOGLE_SHEET_ID`, switches the data source to the Sheet.    |
| `SITE_PASSWORD`    | Shared access password, checked server-side in constant time. Enables the gate.             |
| `AUTH_SECRET`      | Random key used to HMAC-sign the auth cookie (not the password). `openssl rand -base64 32`. |

With the Google Sheet vars unset, the app reads `data/graph-data.csv`. With the auth vars unset, the gate is inert and the site is open.

## Project structure

An annotated map of the source. (Generated build output and local tooling are omitted.)

```
.
├── app/                          # Next.js App Router (multi-page: one route per nav tab)
│   ├── layout.tsx                # Root layout: fonts, metadata, no-flash theme script
│   ├── globals.css               # Tailwind v4 import + @theme inline OKLCH design tokens (light + dark)
│   ├── icon.png                  # App icon (Next.js metadata icon)
│   ├── (site)/                   # Route group: shared shell for every public page
│   │   ├── layout.tsx            # Nav + <main> container + footer + HouseholdProvider (selection persists across pages)
│   │   ├── page.tsx              # "The gap" (home): the interactive bar-chart instrument
│   │   ├── below-the-line/page.tsx  # Cross-household waffle unit-grids
│   │   ├── income/page.tsx          # Income breakdown treemap
│   │   └── sources/page.tsx         # Sources & methodology (server-loads data + copy)
│   ├── gate/page.tsx             # Shared-password wall (outside (site), so no nav); redirects when the gate is off
│   ├── api/
│   │   ├── graph-data/route.ts   # GET the graph payload (resilient fallback; hourly revalidate)
│   │   └── gate/                 # POST password check -> signed cookie; logout clears it
│   └── components/
│       ├── IncomeCostChart.tsx      # Primary Recharts stacked bars on one $/month axis + dashed MBM line
│       ├── PovertyLineComparison.tsx # Waffle unit-grids: income as % of each household's poverty line (hand-rolled SVG)
│       ├── IncomeComposition.tsx    # Treemap: income by program, tile area = dollars (Recharts Treemap)
│       ├── DataTable.tsx            # The charts' accessible twin: every figure sourced, reachable without colour or mouse
│       ├── IncomeCostExplorer.tsx / BelowTheLineView.tsx / IncomeMakeupExplorer.tsx  # Per-page client bodies
│       ├── chart-theme.ts           # One validated scheme-aware palette + useColorScheme + shadeFor (shared by all charts)
│       ├── use-graph-data.ts        # Shared client fetch hook for the graph payload
│       ├── HouseholdProvider.tsx    # useHousehold context (selection shared across pages)
│       ├── HouseholdSelector.tsx / PageHeader.tsx / site-links.ts  # Shared UI + the header/footer page list
│       ├── SourcesMethodology.tsx   # "Sources & methodology" section; citations grouped by what they back
│       ├── SiteNav.tsx / SiteFooter.tsx  # Route-based header + footer
│       ├── ThemeToggle.tsx          # Cycles Light -> Dark -> System, persisted; writes data-theme
│       └── CitationLink.tsx         # Source link with a hover/focus preview card built from lib/sources.ts
├── lib/
│   ├── graph-data.ts             # Fixed GraphData types, graphMeta, and pure helpers (sumLineItems, computeShortfall, povertyStats, povertyLineShare)
│   ├── seed-data.ts              # Server-only: parse the committed data/graph-data.csv snapshot (the fallback + test fixture)
│   ├── load-graph-data.ts        # Env-gated loader: Google Sheet vs. committed snapshot, with resilient fallback
│   ├── parse-sheet-csv.ts        # CSV -> GraphData parser; validates households, sources, food + poverty rows
│   ├── sources.ts                # Citation registry (SOURCES, isSourceKey, getSource); the source-key allowlist
│   ├── site-copy.ts              # The site's editable prose (hero headline + intro, sources lead), in code
│   ├── auth.ts                   # Auth-gate helpers: constant-time password compare + HMAC-signed cookie
│   └── format.ts                 # Pure formatters (formatCAD, formatSignedCAD)
├── data/
│   └── graph-data.csv            # Committed snapshot of the Google Sheet (generated by `npm run sync:data`)
├── scripts/
│   └── sync-data.mjs             # Refresh data/graph-data.csv from the Sheet (the source of truth)
├── public/                       # Static assets: nl-eats-logo.png (the brand mark)
├── proxy.ts                      # Next 16 Proxy (renamed Middleware): the auth perimeter
├── next.config.ts                # Next config (currently empty)
├── tsconfig.json                 # TypeScript config; @/* -> repo root
├── vitest.config.ts              # Vitest config; resolves @/*; node env with a React plugin for component tests
├── eslint.config.mjs             # ESLint flat config
├── postcss.config.mjs            # PostCSS: @tailwindcss/postcss
├── .env.example                  # Documented, empty template for the server-only env vars
└── package.json                  # Scripts and dependencies
```

Tests sit next to the code they cover as `*.test.ts` / `*.test.tsx` (see [Testing](#testing)).

## Testing

Tests run on [Vitest](https://vitest.dev/) and live next to the code they cover. The default `node` environment suits the Route Handlers and pure library functions (they are called directly, no HTTP server), and a React plugin plus jsdom back the component tests.

```bash
npm test          # run once
npm run test:watch
```

Suites cover the data model and helpers (`lib/graph-data`, `lib/format`), the CSV parser (`lib/parse-sheet-csv`), the loader's source switch and resilient fallback (`lib/load-graph-data`), the citation registry (`lib/sources`), the auth helpers (`lib/auth`), the API routes (`app/api/graph-data`, `app/api/gate`), and several components (`CitationLink`, `DataTable`, `SourcesMethodology`, `ThemeToggle`). The Recharts chart is covered by manual/browser checks, since jsdom renders it at zero size.

## Deployment (Netlify)

The site deploys to Netlify: [nlapcpovertyinfo.netlify.app](https://nlapcpovertyinfo.netlify.app/).

1. **Connect the repo** to a Netlify site (the free tier is sufficient). Build command `npm run build`; Netlify's Next.js runtime handles the App Router, the Route Handlers, and the hourly revalidation automatically.
2. **Share the Google Sheet:** in Google Sheets, **Share → General access → "Anyone with the link" → Viewer.**
3. **Set the production environment variables** in the Netlify site settings (Site configuration → Environment variables), all server-only:
   - `GOOGLE_SHEET_ID` + `GOOGLE_SHEET_GID` → the live data source. Without these, the deploy serves the committed `data/graph-data.csv`.
   - `SITE_PASSWORD` + `AUTH_SECRET` → optional shared-password wall for a private preview. Generate the secret with `openssl rand -base64 32`. Without these, the site is public.
4. **Deploy.** After the numbers change in the Sheet, no redeploy is needed: the route re-fetches within the hourly revalidate window. Redeploy for code changes (copy edits included) or a refreshed committed snapshot.
