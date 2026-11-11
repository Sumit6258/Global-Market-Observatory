# Global Market Observatory

A static financial-research site (React, TypeScript, Vite) on GitHub Pages, refreshed by GitHub Actions. No backend, no database, no credentials in the browser.

## What is real today
| Area | Status |
|---|---|
| USD/INR daily reference rate and five-year history (Frankfurter) | Implemented, data verified in the repository |
| US filings for 21 companies: 8-K, 10-Q, 10-K and their amendments (SEC EDGAR) | Implemented, data verified in the repository |
| Freshness ledger, STALE status, validation before publishing | Implemented |
| Indian index and equity prices (NSE, BSE) | Not implemented, blocked by licensing |
| US annual fundamentals and ratios from SEC XBRL company facts | Implemented, tested on fixtures only, needs its first real run to verify |
| US prices, baskets, sector landscape | Not implemented, need a licensed price source |

Nothing synthetic ships to production. Synthetic figures exist only in development builds made with `VITE_DEMO=1`.

## Data refresh
`.github/workflows/data.yml` runs twice a day and on demand. It runs the tests, fetches Frankfurter and SEC EDGAR, validates everything, writes `public/data/`, commits and then starts the deploy workflow explicitly (commits made with the default token do not trigger it). A failed or invalid source keeps its last good file and is reported in `public/data/meta/status.json`, which the Methodology page shows. Data is delayed or end-of-day, never real-time.

## Setup
1. Settings, Pages, Source: GitHub Actions.
2. Settings, Secrets and variables, Actions, Variables: add `SEC_CONTACT_EMAIL` (SEC requires a contact in the User-Agent). No secrets are needed yet.
3. Actions, Refresh data, Run workflow.

## Develop
`npm ci`, `npm test`, `npm run dev`, `npm run build`. Add `VITE_DEMO=1` only for local development.

## Licensing
Exchange data is licensed. TrueData states that its data is for personal or internal use and that public display needs written approval from the exchanges and the vendor, with delayed data only. Until such a licence exists, Indian prices stay unavailable. Frankfurter blended rates are free to use. SEC filings are public and the SEC fair-access limit applies.

## Known limitations and roadmap
See the Methodology page. Next: SEC fundamentals with strict period validation, an Indian price source once licensed, and company pages.
