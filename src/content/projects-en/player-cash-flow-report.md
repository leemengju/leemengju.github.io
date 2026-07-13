---
title: Player Cash-Flow Report
role: Full-Stack Engineer
period: "2026.06 - 2026.07"
tags: [Laravel, MySQL, ClickHouse, Performance]
metrics: "20-player batch query 4–5 min → 15–20 s (QA-measured 3.2×)"
order: 1
beforeAfter:
  label: "Batch query time (QA-measured)"
  before: 5.9
  after: 1.8
  unit: "s"
---

## Background

To review a net-café's top-20 players' full-month cash flow, risk-control originally had to open five pages — account passbook, character win/loss, transfer center, mail center, and member lookup — and manually query and consolidate them one by one, at least 100 operations for 20 players. The APIs mixed OpenID / GUID / accountId as primary keys, making it easy to match the wrong player during manual lookups, and batch export was entirely impossible.

## Scope

Built a new player cash-flow report page that integrates 5 data sources around the player as the central axis, supporting single lookups, batch queries (up to 20 players), and a cross-page "Top-20 one-click export" from the net-café ranking page — one click automatically navigates, runs the batch query, and downloads the current month's CSV.

## Challenges

A sequential batch run took 4–5 minutes on production. The initial plan was to parallelize with `pcntl_fork`, which measured a 19.6× speed-up under CLI — but only after deployment did it turn out that the production PHP-FPM web SAPI does not load the `pcntl` extension at all: `function_exists('pcntl_fork')` always returns false, yielding zero speed-up. This is not something `disable_functions` can control — it is a SAPI-level restriction that can only be verified by actually firing a real HTTP request; CLI test results are misleading.

## Contributions

- Consolidated multi-dimensional data — deposit points, C-coin, total game win/loss (with per-game detail), and transfer-in/out totals and detail — into a single row.
- After abandoning `pcntl_fork`, converted all three phases to batched IN-clause queries: `get_members_batch` (1 JOIN replacing N sequential queries), `buildTransferBatch` (2 IN-clause queries replacing N×4), and `buildWinOrLoseBatch` (statistics-table batch plus a sequential fallback for real-time gaps).
- Resolved several data-correctness pitfalls: the `playerId`/`openId` columns in `cash_point_log` can be null depending on the scenario — only `accountId` is reliable in both; multi-line CSV cells were misjudged by the shared export utility as "formulas needing forced-text" and truncated by Excel, fixed by switching to standard double-quote escaping; and CSV-import encoding detection was reordered to "try strict UTF-8 first, fall back to lenient Big5 when replacement characters appear" rather than the other way around.

## Impact

Looking up the top-20 players' cash flow went from "manually checking 5 pages × 20 players ≈ 100 operations" to "one click, CSV downloads automatically"; a 20-player batch query on production dropped from 4–5 minutes to 15–20 seconds, and QA measured a ~3.2× speed-up after batching (5.9s → 1.8s).
