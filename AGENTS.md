# AGENTS.md

This file provides guidance to Cursor when working with code in this repository.

## Project

NLAPC_Income_Data ("NL Eats") is an interactive, fully-cited data-visualization site for the Newfoundland & Labrador Anti-Poverty Coalition. It compares an NL household's total monthly income support against the cost of healthy eating (the Nutritious Food Basket), anchored to the Market Basket Measure (MBM) poverty line, through a chart whose inputs the visitor can adjust. The argument is the instrument: pick a household, change the food budget, and watch the gap move. Deploys to Netlify (`nlapcpovertyinfo.netlify.app`). `README.md` covers the setup, architecture, and data-maintenance workflow in depth.

Honesty is the product's core constraint and the one thing it cannot afford to lose: every displayed figure traces to a primary source, every estimate is labelled with its method, and the chart never uses a misleading axis (baseline pinned at 0, one shared axis, never dual or truncated). Hold that bar in any change. The audience is the NL public, advocates, journalists, and policymakers who arrive to grasp, or to cite, one defensible fact; a second audience is the non-engineer Food First NL maintainers who keep the figures current in a spreadsheet, never in code.

## Commands

- `npm run dev`: dev server (http://localhost:3000)
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: ESLint (flat config, `eslint.config.mjs`)
- `npm run lint:fix`: ESLint with autofix
- `npm test`: run the Vitest suite once
- `npm run test:watch`: Vitest in watch mode
- `npm run format`: Prettier write across the repo
- `npm run format:check`: Prettier check (no writes)

The current checks are `build`, `lint`, and `test` (Vitest is configured in `vitest.config.ts`).

## Stack & conventions

- **Next.js 16.2.10, App Router. This is NOT the Next.js you know.** This version has breaking changes; APIs, conventions, and file structure may all differ from your training data. Read the relevant guide under `node_modules/next/dist/docs/` before writing any code (App Router lives in `01-app/`), and heed deprecation notices. Note that Next 16 renamed Middleware to Proxy (see `proxy.ts`).
- **React 19.2.4**, TypeScript strict mode.
- **Recharts 3** for the chart (`app/components/IncomeCostChart.tsx`).
- **Papaparse** for CSV parsing (`lib/parse-sheet-csv.ts`).
- **Vitest 4** + **Testing Library** (`@testing-library/react`) + **jsdom** for tests.
- **Prettier** (with `prettier-plugin-tailwindcss` for class sorting); config in `.prettierrc.json`.
- **Tailwind CSS v4, configured in CSS (there is no `tailwind.config.*`)**: `@import "tailwindcss"` plus an `@theme inline` block in `app/globals.css`; PostCSS uses `@tailwindcss/postcss` (`postcss.config.mjs`).
- **Path alias** `@/*` → repo root (`tsconfig.json`).
- **Fonts:** Geist / Geist Mono and Lato (the NLAPC brand heading face) via `next/font/google`, exposed as `--font-*` CSS variables on `<html>` in `app/layout.tsx`. In `globals.css` they map to `--font-body` (Geist), `--font-heading` (Lato), and `--font-mono` (Geist Mono).

## Architecture

Request flow: `data/graph-data.csv` OR a Google Sheet → `loadGraphData()` → `parseGraphDataCsv()` → `GET /api/graph-data` → a page's client view (`useGraphData`) fetches it → the page's chart + `DataTable` render the same fixed shape.

The site is MULTI-PAGE: one route per nav tab, not one scrolling page. All the site pages live under the `app/(site)` route group so they share one layout (nav, container, footer, and the household context); the gate screen sits outside the group so it never shows the nav.

- `app/` (App Router):
  - `(site)/layout.tsx`: the shared shell. Reads the auth cookie for "Sign out", wraps the pages in `HouseholdProvider`, and renders `SiteNav` + the `<main>` container + `SiteFooter`. The provider stays mounted across client-side navigation, so the selected household follows the visitor between pages.
  - `(site)/page.tsx`: "The gap" (home). The interactive instrument (`IncomeCostChart`, the bar chart, + readout + food control + `DataTable`).
  - `(site)/below-the-line/page.tsx`: the cross-household view (`PovertyLineComparison`, waffle unit-grids).
  - `(site)/income/page.tsx`: the income breakdown (`IncomeComposition`, a treemap).
  - `(site)/sources/page.tsx`: server-loads the dataset + copy and renders `SourcesMethodology` (with `showHeading={false}`; the page supplies the `<h1>`).
  - `layout.tsx`: root layout, wires the fonts and injects the no-flash theme script only.
  - `globals.css`: the design tokens (OKLCH), light/dark themes, and base styles.
  - `gate/page.tsx`: the shared-password wall UI (server component; posts to the gate route; outside `(site)`).
  - `api/graph-data/route.ts`: the single data endpoint the charts read.
  - `api/gate/route.ts` and `api/gate/logout/route.ts`: the auth gate's sign-in and sign-out handlers.
  - `components/`:
    - Charts: `IncomeCostChart` (the primary Recharts bar chart), `PovertyLineComparison` (waffle unit-grids, hand-rolled SVG), `IncomeComposition` (Recharts treemap), `DataTable` (the charts' accessible twin).
    - Page bodies (client): `IncomeCostExplorer` (the gap instrument), `BelowTheLineView`, `IncomeMakeupExplorer`.
    - Shared: `chart-theme.ts` (the one validated scheme-aware palette + `useColorScheme` + `shadeFor`, used by every chart), `use-graph-data.ts` (the shared client fetch hook), `HouseholdProvider` (`useHousehold` context), `HouseholdSelector`, `PageHeader`, `SiteNav`, `SiteFooter`, `site-links.ts` (the page list shared by header + footer), `SourcesMethodology`, `CitationLink`, `ThemeToggle`.
- `lib/`:
  - `graph-data.ts`: the fixed `GraphData` contract and types, `graphMeta` (benefit years + "as of" date), and the pure helpers `sumLineItems`, `computeShortfall`, `povertyStats`, `povertyLineShare` (income ÷ its own MBM line, the waffle's metric).
  - `load-graph-data.ts`: picks the data source from env (Google Sheet vs. local CSV).
  - `parse-sheet-csv.ts`: transforms a CSV string into `GraphData`, validating every row.
  - `sources.ts`: the citation registry, plus `isSourceKey` and `getSource`.
  - `auth.ts`: the HMAC gate helpers (`isGateEnabled`, `verifyPassword`, `signToken`, `verifyToken`, `AUTH_COOKIE`).
  - `format.ts`: `formatCAD` and `formatSignedCAD`.
- `data/graph-data.csv`: the local seed data (same column layout as the Google Sheet). See the "Updating the data" section of `README.md` for the maintainer's edit workflow.
- `proxy.ts` (repo root): Next 16's renamed Middleware; the auth perimeter. It runs on the Node.js runtime so `lib/auth.ts` (`node:crypto`) works here.

## Data pipeline

One shape (`GraphData`), two sources, one parser. `loadGraphData()` fetches the Google Sheet's free published-CSV export when `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_GID` are both set, and otherwise reads the bundled `data/graph-data.csv`. Both paths feed the same `parseGraphDataCsv()`, so the chart cannot tell which source produced the data and the eventual Sheet swap is invisible.

On any load or parse failure the route returns HTTP 502, and the client falls back to the bundled `mockGraphData` while showing a non-blocking "showing last-known figures" notice. Every figure, year, and date a visitor sees derives from the API payload, `lib/sources.ts`, or `graphMeta`; nothing is hardcoded a second time in a component. The only hand-written text is qualitative methodology narrative that describes the fixed method itself.

## Environment

Copy `.env.example` to `.env.local`. All variables are SERVER-ONLY; never prefix any with `NEXT_PUBLIC_` (that would inline the value into the client bundle).

- `GOOGLE_SHEET_ID` + `GOOGLE_SHEET_GID`: set both to read the live Google Sheet; leave both unset to read the local CSV.
- `SITE_PASSWORD` + `AUTH_SECRET`: set both to raise the auth gate. Generate the secret with `openssl rand -base64 32`.

## Auth gate

An optional shared-password "soft gate", inert unless both `SITE_PASSWORD` and `AUTH_SECRET` are set (so dev, CI, and Netlify previews stay open). `proxy.ts` redirects unauthenticated requests to `/gate`; per Next's docs this proxy check is optimistic, not real security. The real guard is the HMAC verification in `lib/auth.ts`: a constant-time password compare and an HMAC-SHA256 signed, httpOnly, Secure, SameSite=Lax cookie. `/gate` and `/api/gate` are excluded from the proxy matcher so the login screen is always reachable. This is a shared secret, not per-user auth.

## Testing

Vitest (`vitest.config.ts`, `environment: 'node'`, `@/*` alias resolved via `vite-tsconfig-paths`, React plugin for jsdom component tests). Tests are colocated as `*.test.ts(x)` next to the code: `lib/*.test.ts`, `app/api/**/route.test.ts`, `app/components/*.test.tsx`, and root-level `*.test.ts` (for `proxy.ts`). Route Handlers are tested by importing and calling the exported `GET` / `POST` directly, with no HTTP server. Pure helpers live outside components specifically so they are unit-testable. `lib/parse-sheet-csv.test.ts` asserts the CSV and `mockGraphData` stay identical, a drift guard. Run with `npm test`.

## Code style

Prettier: semicolons, double quotes, trailing commas everywhere, 2-space indent, `printWidth` 80, Tailwind class sorting. Consume design tokens by role (`text-ink`, `bg-surface`, `var(--chart-income)`), never raw hex in components.

## Gotchas

- Env is server-only: never prefix a secret or the Sheet id with `NEXT_PUBLIC_`.
- If you edit `data/graph-data.csv` locally, update `mockGraphData` in `lib/graph-data.ts` to match, or the parity test fails.
- In the chart's SVG marks, CSS `var()` does not resolve; `IncomeCostChart` uses concrete hex ramps switched by the resolved theme, while the surrounding HTML chrome uses the CSS tokens.
- Theme is one signal: `data-theme` on `<html>`, set by the no-flash script in `layout.tsx` and kept in sync by `ThemeToggle`; the chart reads the same attribute.
- Honesty constraints: the bar baseline is pinned at 0, there is one shared axis (never a dual or truncated axis), every figure cites a `source` in `lib/sources.ts` (the parser rejects a row whose source is not in the registry), estimates render an "estimate" affordance with their method, and the shortfall is framed as "left after healthy food" (income includes a rent-earmarked line), never a bare "money left".
- CRA figures (the `cra-*` sources) rest on secondary sources because canada.ca blocks automated fetchers; re-check them in a browser before a public release.
- A `route.ts` and a `page.tsx` cannot share the same route segment.

## Editing docs (Markdown)

- **Don't hard-wrap prose.** Keep each paragraph and bullet on a single source line and let the editor soft-wrap it. Add a newline in the source only where you intend an actual line break or new list item, never to hit a column limit. (Prettier's `proseWrap` is left at its `preserve` default, so it won't reflow prose either way.)

## Writing style

- **Never use em-dashes (the `—` character, U+2014) anywhere in this project**: not in UI copy, code comments, docs, or commit messages. Use commas, colons, parentheses, or separate sentences instead. En-dashes (`–`) in numeric ranges like `6–17` and the minus sign (`−`, used in the shortfall figure) are fine.
