---
title: Player Cash-Flow Report
role: Full-Stack Engineer
period: "2026.06 - 2026.07"
tags: [Laravel, MySQL, ClickHouse, Performance]
metrics: "20-player batch query 4–5 min → 15–20 s (QA-measured 3.2×)"
order: 1
categories: [db-performance, data-automation]
beforeAfter:
  label: "Batch query time (QA-measured)"
  before: 5.9
  after: 1.8
  unit: "s"
---

## Background

To review a net-café's top-20 players' full-month cash flow, risk-control originally had to open five pages — account passbook, character win/loss, transfer center, mail center, and member lookup — and manually query and consolidate them one by one, at least 100 operations for 20 players. The APIs mixed OpenID / GUID / accountId as primary keys, making it easy to match the wrong player during manual lookups, and batch export was entirely impossible.

## Scope

Built a new player cash-flow report page that integrates 5 data sources around the player as the central axis, supporting single lookups, batch queries (up to 20 players), and a cross-page "Top-20 one-click export" from the net-café ranking page — one click automatically navigates, runs the batch query, and downloads the current month's CSV. Cross-page parameters travel through sessionStorage (rather than Vuex or the URL query): it survives navigation, needs no extra store wiring, and is removed immediately on read so a keep-alive re-activation can't re-trigger the query.

## Challenges

A sequential batch run took 4–5 minutes on production. The initial plan was to parallelize with `pcntl_fork`, which measured a 19.6× speed-up under CLI — but only after deployment did it turn out that the production web (PHP-FPM) runtime does not load the `pcntl` extension at all: `function_exists('pcntl_fork')` always returns false, yielding zero speed-up. This is not something `disable_functions` can control — it is a SAPI-level restriction that can only be verified by firing a real HTTP request and reading the actual log; CLI test results are badly misleading.

## Contributions

- Consolidated multi-dimensional data — deposit points, C-coin, total game win/loss (with per-game detail), and transfer-in/out totals and detail — into a single row, reusing existing win/loss and transfer logic on the backend rather than reimplementing it.
- After abandoning `pcntl_fork`, converted all three phases to batched IN-clause queries: a batched member lookup (1 JOIN replacing N sequential queries), a batched transfer summary (2 IN-clause queries replacing N×4), and a batched win/loss query (statistics-table batch plus a sequential fallback for real-time gaps).
- Resolved several data-correctness pitfalls: the two candidate primary-key columns of the recharge-log table are each null in one scenario or the other — only the account ID is reliable in both; multi-line CSV cells were misjudged by the shared export utility as "formulas needing forced-text" and truncated by Excel, fixed by switching to standard double-quote escaping; and CSV-import encoding detection was reordered to "try strict UTF-8 first, fall back to lenient Big5 when replacement characters appear" rather than the other way around.

## Impact

Looking up the top-20 players' cash flow went from "manually checking 5 pages × 20 players ≈ 100 operations" to "one click, CSV downloads automatically"; a 20-player batch query on production dropped from 4–5 minutes to 15–20 seconds, and QA measured a ~3.2× speed-up after batching (5.9s → 1.8s).

## Key Technical Decisions & Pitfalls

**The most painful pitfall: `pcntl_fork` is a silent no-op under the production web runtime.** Under CLI, `function_exists('pcntl_fork')` returns true and I measured nearly a 19× speed-up, so it looked entirely viable. But the `pcntl` extension is by design CLI-only — the production web (PHP-FPM) runtime never puts it in the function table at startup, so `function_exists` returns false. This can't be controlled via `disable_functions`, and local testing can't reveal it. The only reliable check is to log a line inside a real HTTP request:

```php
// Only firing this from a real browser request and reading the server log
// tells you whether the web runtime can actually fork
Log::info('pcntl_fork available: ' . (function_exists('pcntl_fork') ? 'yes' : 'no'));
```

The real fix wasn't parallel forking but turning "one DB round-trip per player" into a three-phase IN-clause batch — the bottleneck was never the number of PHP loop iterations, it was the number of DB round-trips.

**Key trade-off: IN-clause batching over `curl_multi`.** I also considered `curl_multi` for concurrency, but win/loss and transfers are direct DB calls, not HTTP requests, and `curl_multi` can only parallelize HTTP — useless for direct DB queries — so IN-clause batching won out.

**Other pitfalls worth noting:**

- **Unreliable recharge-log primary key:** across ordinary recharges and system manual top-ups, each of the two candidate key columns is null in one of the two scenarios; only the account ID is populated in both, so every query keys off it.
- **Truncated multi-line CSV cells:** the shared export utility auto-wraps any value containing a newline as `="..."` Excel-formula text, and that formula format doesn't support in-cell line breaks, so multi-line detail collapsed to its first line. Switching to standard double-quote escaping without the `=` restored correct line breaks.
- **Import encoding-detection order:** you must decode with strict UTF-8 first and check for the replacement character `�`, only falling back to Big5 if present — not the reverse, because the lenient encoding fails silently with garbled output instead of erroring, so you can't detect the failure.

```js
// Try strict UTF-8 first; illegal sequences surface a replacement char,
// then fall back to the lenient Big5
let text = new TextDecoder("utf-8").decode(bytes);
if (text.indexOf("�") !== -1) {
  text = new TextDecoder("big5").decode(bytes);
}
```
