# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NLAPC_Income_Data ("NL Eats") — a data-visualization site for the Newfoundland & Labrador Anti-Poverty Coalition comparing household income support against the cost of healthy eating via interactive, user-adjustable graphs. Deploys to Netlify. Currently a fresh `create-next-app` scaffold.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

No test framework is configured yet; `build` and `lint` are the current checks.

## Stack & conventions

- **Next.js 16.2.10, App Router — this is NOT the Next.js you know.** This version has breaking changes; APIs, conventions, and file structure may all differ from your training data. Read the relevant guide under `node_modules/next/dist/docs/` before writing any code (App Router lives in `01-app/`), and heed deprecation notices.
- **React 19.2.4**, TypeScript strict mode.
- **Tailwind CSS v4, configured in CSS (there is no `tailwind.config.*`)**: `@import "tailwindcss"` plus an `@theme inline` block in `app/globals.css`; PostCSS uses `@tailwindcss/postcss` (`postcss.config.mjs`).
- **Path alias** `@/*` → repo root (`tsconfig.json`).
- **Fonts:** Geist / Geist Mono via `next/font/google`, exposed as `--font-sans` / `--font-mono` CSS variables on `<html>` in `app/layout.tsx`.

## Editing docs (Markdown)

- **Don't hard-wrap prose.** Keep each paragraph and bullet on a single source line and let the editor soft-wrap it. Add a newline in the source only where you intend an actual line break or new list item — never to hit a column limit. (Prettier's `proseWrap` is left at its `preserve` default, so it won't reflow prose either way.)
