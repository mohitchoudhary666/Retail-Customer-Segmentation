# Retail Customer Segmentation (RFM Demo)

An interactive RFM segmentation demo built with React, TypeScript, and an Express service. It aggregates transaction rows by customer, scores recency, frequency, and monetary value into rank-based quartiles, and assigns customer segments.

## What runs

- `server.ts` contains the executable RFM calculation and the `POST /api/segmentation/process` endpoint.
- The React app in `src/App.tsx` sends transaction rows to that endpoint and displays the returned scores and segment summaries.
- The service starts with a hand-authored sample of 39 transactions across 20 customers. The UI also supports adding transactions manually.
- `src/data.ts` contains Python, PostgreSQL, and DAX code examples for reference. The application does not execute these snippets.

The repository also contains `retail_transactions.csv`; the app does not load that file automatically. The dashboard's default results come from the sample in `server.ts`.

## Revenue share calculation

The UI calculates Core High Value revenue by summing the segment's `Monetary` values, divides it by total `Monetary` across all scored customers, and displays the percentage. This is a live calculation over the current app data, not a fixed benchmark.

The earlier ~48% statement was not reproducible from the default sample in the current code, so this README does not present it as a verified result.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use the sample data or add transaction rows in the UI to see the segmentation update.

## Project layout

- `server.ts`: sample records, RFM scoring, and API
- `src/App.tsx`: dashboard, input flow, and revenue-share display
- `src/data.ts`: star-schema examples and reference code snippets
- `retail_transactions.csv`: included transaction data file

## Scope

This is a portfolio demo, not a deployed AWS or PostgreSQL data pipeline. The included Python, PostgreSQL, and DAX snippets are illustrative templates; only the TypeScript service powers the interactive RFM results.
