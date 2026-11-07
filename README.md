# Global Market Observatory

Static React + TypeScript + Vite app for GitHub Pages. No backend, no API keys.

## One-time setup
GitHub repository, Settings, Pages, Build and deployment, Source: **GitHub Actions**. Every push to `main` then builds and publishes the site (`.github/workflows/deploy.yml`). The Vite base path is read from `GITHUB_REPOSITORY`; routing is hash-based so direct refreshes work.

## Current state
Every figure is a synthetic DEMO fixture (`src/engine.ts`). No live provider is connected. Definitions for sources, baskets, metrics and limitations live in `src/config.ts` and drive the Methodology & Data Sources page.

## Run
`npm ci`, `npm run dev`, `npm run build`.

## Real data
`.github/workflows/data.yml` runs `scripts/fetch-data.mjs` twice a day with no secrets: USD/INR from Frankfurter and US filings from SEC EDGAR, written to `public/data/`, then it redeploys. One-time setup: add the repository variable `SEC_CONTACT_EMAIL` (Settings, Secrets and variables, Actions, Variables), then Actions, Refresh data, Run workflow. Synthetic figures exist only in builds made with `VITE_DEMO=1`.
