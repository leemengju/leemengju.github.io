---
title: Win-Score Report Database Migration (MySQL → ClickHouse)
role: Full-Stack Engineer
period: "2026.05 - 2026.06"
tags: [ClickHouse, MySQL, Laravel, Performance]
metrics: "Full-month query ~104s → ~5s (~21×)"
order: 5
categories: [db-performance]
beforeAfter:
  label: "Full-month player query time"
  before: 104
  after: 5
  unit: "s"
beforeAfterMotion: gsap
---

## Background

> [!IMPORTANT]
> **Core pain: both "slow" queries and "untrustworthy" numbers.**

- **Numbers often didn't match reality**: the old report's figures came from back-office statistics tables, which dropped log entries and needed manual reruns.
- **Multiple teams repeatedly reported "the numbers are wrong"** — each time requiring manual chasing, recomputation, and patching.
- **A whole set of workaround statistics tables emerged**: because scanning MySQL detail data directly was too slow, pre-computed statistics tables were built to stand in; migrating to ClickHouse with real-time aggregation made these unnecessary.
  - ⚠️ To be clear: statistics that exist for their own business reasons (needing a reset, or a scheduled snapshot) are **not** in scope for elimination — only the ones that existed purely to work around slow queries.
- **Cross-month queries were slow** — tens of seconds to scan detail data across months.

## Goal

- Make the report's numbers come directly from source data via real-time aggregation, fixing "wrong numbers" and "slow report" at the root.

## Highlights

1. **Numbers are trustworthy, no longer repeatedly questioned** — switched to real-time aggregation directly over source (detail/raw) data; cross-team "the numbers are wrong" reports disappeared at the source.
2. **Real-time data is queryable** — previously only pre-written statistics could be queried; now today reads raw data while past complete days read the aggregate table.
3. **Query time cut sharply** — full month **~104s → ~5s** (same-range measurement, ~21×).
4. **Maintenance cost dropped significantly** — no longer maintaining the whole set of "write-the-stats" scheduled jobs and their patch-up logic (reruns, backfills, dropped-log handling).
5. **Code consolidated, easier to hand off** — player / dedicated-machine / per-game sharded sub-reports moved from one scattered monolithic file and multiple controllers into a domain layer, one query object per data source (see [File Structure](#file-structure)).

## Solution & Architecture

Split by the source shape of each sub-report:

| Sub-report | Source | Pattern | Key concept |
|---|---|---|---|
| Win-score (player) | One large detail table | **MV + aggregate table** | Materialized View (real-time aggregation on insert) → AggregatingMergeTree aggregate table (served to the report) |
| Per-game sharded sub-reports | Dozens of same-schema tables | **Merge view + aggregate table + scheduled pull** | A merge view (auto-includes new games by naming convention) → scheduled incremental sync (every minute, watermark-based) → aggregate table |

- **Scoring always runs through aggregate state** — sum / distinct-merge functions, with each batch's partial state merging automatically.
- **"Today" always reads raw** — the aggregate table only extends to the last sync watermark and may be incomplete; past complete days read the aggregate table, and a query spanning today merges "past-day aggregate state ∪ today's raw state" (keeping cross-boundary player-count dedup correct).

## Rollout Strategy

- **Dual-track parallel run** — MySQL stayed live during the ClickHouse switch; both systems served data, and the report source was only switched once the new numbers were confirmed correct, achieving zero downtime.
- **Fixed maintenance window** — rolled out during a fixed weekly maintenance window to minimize user impact.
- **Rollback** — a code-level commit revert returns to the MySQL path, no extra mechanism needed.

## Data Validation

- **Method**: took one full past day and compared, game-by-game, across three sources for each metric (bet amount / win-loss / jackpot / rounds / players): **MySQL detail**, **ClickHouse detail** (with an exact distinct-count cross-check for players), and **ClickHouse aggregate table** (what the report actually reads).
- **Results (37 games × 5 metrics = 185 cells measured)**:
  - Row counts: MySQL = ClickHouse detail, **0 discrepancy**.
  - **ClickHouse detail vs. MySQL: every metric matched exactly** (including exact player counts) — confirming clean ETL ingestion.
  - **ClickHouse aggregate vs. MySQL: amounts and round counts matched exactly**; player counts (approximate distinct count) showed **0% error** that day (HLL is exact at small cardinalities, tolerance ~0.1%) — confirming the MV/aggregate logic.
- **Process**: production was only cut over after the dual-track comparison passed in QA.

## Error Handling & Operations

- **Sync-state table**: every scheduled run records a watermark and status, queryable directly to confirm sync progress and last success time.
- **Error alerting**: a scheduling failure (e.g. production unable to reach ClickHouse) triggers an automatic error notification to engineering rather than failing silently.
- **Knowledge transfer**: architecture and operating logic are documented internally and accessible to the whole team.

## Challenges

1. **Aggregate-state columns can't be queried directly** — fields like amounts and player counts are aggregate states; a plain SELECT errors out, and must go through the corresponding merge function.
2. **Distinct player counts can't simply be summed across segments** — naive summation breaks deduplication. The fix was generating the daily table's distinct-count state with exactly the same filter conditions as the detail query, so it merges correctly across days and sources without breaking dedup. After optimizing to "daily-table state + scan only today's remainder," two machine categories dropped from 24s/9s to 2.4s/sub-second, with zero value discrepancy.
3. **Time zone** — the ClickHouse server's underlying clock is UTC, handled by carrying the correct time zone at the connection layer. Date fields are zone-agnostic; time-field comparisons need conversion to local time.
4. **New games auto-included** — per-game sharded sources keep growing new tables; the goal was to avoid manually patching the MV/redeploying every time a new game launched.

## The Worst Pitfall

**`curl_multi` + libcurl < 7.20.0 (intermittent all-zero on production)**

- **Symptom**: production intermittently showed "report all-zero / missing games," while local and QA hitting the same ClickHouse were fine. Logs showed batch-query items returning empty responses (`http=0, errno=0, body=""`), a few games at a time, at various times of day.
- **Ruled-out directions**: time zone, connecting to a different node / lagging replica, missing data — all wrong. The clue that pinned it down was the program semantics of "a failed call returns null and gets skipped ≠ actually zero," combined with the empty-response signature in the logs, pointing to the **connection layer**.
- **Root cause**: the concurrent-query (curl_multi) driver loop's condition was written as `while ($running && $status === CURLM_OK)`, which breaks on **libcurl < 7.20.0**.
  - **Behavior on libcurl < 7.20.0**: whenever an internal step can proceed immediately without waiting on I/O (e.g. a connection just established, an internal state transition), `curl_multi_exec` returns `CURLM_CALL_MULTI_PERFORM` (value **-1**, not 0), meaning "call me again right away, don't go wait on select." It does **not** mean something succeeded or finished — it just means keep exec-ing through the steps that can proceed immediately, until a step needs to wait on a socket, at which point it returns `CURLM_OK`.
  - **Behavior on libcurl ≥ 7.20.0**: the internal state machine was rewritten so the library itself runs through all the "can proceed immediately" steps in one go, and externally **never returns** `CURLM_CALL_MULTI_PERFORM` again — only ever `CURLM_OK` (or an error).
  - **Where it broke**: on the older version, if the first `exec` call returned `-1`, `$status === CURLM_OK` (0) evaluated false, so the outer `while` never entered even once and exited early — the transfer hadn't finished, so the still-in-flight handle returned an empty response. (Note: `CURLM_OK` ≠ done; completion is judged by `$running` reaching 0 / `curl_multi_info_read` returning `CURLMSG_DONE`.)
- **Why only production**: the boundary is exactly **libcurl 7.20.0**. Production ran libcurl **7.19.7** (< 7.20, triggering the bug), while local and QA ran libcurl ≥ 7.20 — so it tested clean everywhere else.
- **Fix**: drain the intermediate steps first with `do { curl_multi_exec } while ($status === CURLM_CALL_MULTI_PERFORM)`; when the outer `curl_multi_select` returns -1, add `usleep(1000)` to prevent a busy-loop; and read the real CURLcode via `curl_multi_info_read` (`curl_errno` under the multi interface often unreliably returns 0). Also added "throw if the whole batch fails" to avoid silently returning a pile of nulls, and made the code robust to the older libcurl version rather than touching the production system library.

```php
// Problematic: only recognizes one "keep going" status, misses the intermediate one
while ($running && $status === CURLM_OK) {
    $status = curl_multi_exec($mh, $running);
}
// Fixed: drain the "call me again right away" steps first, then wait on I/O
do {
    $status = curl_multi_exec($mh, $running);
} while ($status === CURLM_CALL_MULTI_PERFORM);
```

## Key Trade-offs

1. **Why a merge view + aggregate table + scheduled job for per-game sharded sub-reports, instead of an MV like the player report?**
   - The player source is a **single table** → an MV can attach directly, aggregating in real time on insert.
   - Per-game sharded sub-reports span **many** per-game tables: (a) an MV **can't attach to a merge view**; (b) attaching a per-table MV to every shard **doesn't auto-include new games** and creates heavy maintenance overhead.
   - So instead: a self-built merge view (auto-includes new games by naming convention) + a scheduled job that actively reads and does incremental INSERTs over a watermark-based half-open range (each row processed exactly once, no duplicates, no gaps, late data still gets backfilled).
   - **Cost**: not real-time (data lags to the last sync, so "today" always reads raw) and requires maintaining a schedule. **Benefit**: a new game launches with zero code changes and is included automatically, and every row is guaranteed to be processed exactly once (exactly-once).

2. **Why parallelize (batch) for further speed-up, instead of adding a finer-grained intermediate table?**
   - An hourly-scoped intermediate table (scanning only the current hour) was evaluated. But the measured bottleneck was **the fixed cost of opening each table × N sequential round-trips per game, independent of scan volume** (scanning one hour was about as slow as scanning a full day) — a finer-grained table barely helped, and was dropped.
   - Switched to sending N per-game queries **concurrently**, letting the fixed costs overlap → **~6.5x** (sequential 3347ms → parallel 515ms), with values matching the sequential version.
   - Also evaluated and rejected: merging N games into one big UNION ALL query — a single pipeline parallelizes worse internally, and one missing table fails the whole batch.

3. **Why an approximate distinct-count algorithm instead of an exact one for player counts?**
   - An exact distinct count gives precise unique players, but requires building a full hash set — high memory, large state, slow full-range scans, and large state doesn't merge well across days/sources.
   - The approximate algorithm is HLL-based, with **~0.1% error** — operations statistics tolerate this, in exchange for **small, mergeable aggregate state and a large query speed-up** — exactly what makes it possible for the daily table to store player-count state and merge dedup across segments.
   - Evidence: player-count computation dropped from **~24.2s** scanning full raw data to **~0.1s** once merged from daily-table state.

## Quantified Impact

| Metric | Before | After |
|---|---|---|
| Full-month player query (same-range measurement) | Scanning detail (no aggregate table): **104.3s** | Reading aggregate table: **5.0s** (~21×) |
| Detail-level aggregation job | ~47s | Reads the daily table |
| Player-count dedup (two machine categories) | 24s / 9s | 2.4s / sub-second |
| Per-game sharded query (30 games) | 3347ms sequential | 515ms parallel (~6.5×) |

## Future Plans

- Extend the same aggregate-table pattern to the remaining reports / currencies still scanning MySQL directly.
- The number and size of raw per-game tables keep growing; the merge view itself is 0 bytes, with actual size in the underlying tables. A retention policy would need per-table TTLs or monthly partition drops, with a retention window well beyond the longest plausible sync-job outage — otherwise the aggregate table would develop a permanent gap.
- Evaluate connection reuse / pooling for the ClickHouse HTTP client, and tune concurrency.
- Keep monitoring sync-watermark health (existing error alerting + a status table already support this; could add "notify if stalled for more than N minutes").

> [!WARNING]
> **Stack retirement**: parts of the production stack's system libraries are older and end-of-life; the right move is migrating those machines to a supported version, not swapping system libraries in place on a live machine (large blast radius, high risk).

## Appendix

**Reusable lessons**:

- Speeding up a new report: first judge whether the source is "a single detail table" (→ MV) or "many per-game tables" (→ merge view + scheduled pull).
- Measure whether a performance bottleneck is "scan volume" or "fixed per-table-open cost" before choosing a fix (see [Key Trade-offs](#key-trade-offs)).

**Benchmark evidence** — main query comparison. Both runs execute the **same report query over the same date range**; the only difference is whether the aggregate table is read: one forces the old path (scan raw detail and aggregate per-row, equivalent to pre-migration), the other uses the post-migration aggregate table — giving a clean before/after:

| Measurement | Main query time |
|---|---|
| Scanning raw detail, no aggregate table (pre-migration path) | **104292.8ms (≈104.3s)** |
| Reading the aggregate table (post-migration path) | **4992.51ms (≈5.0s)** |

Sub-segment: looking only at the "distinct player count" step, the before/after of switching from "scan the full raw detail every time" to "read the daily table's pre-stored dedup state and merge" (same day, player-count segment only, not a full month):

| Measurement | Main query | Of which, player-count |
|---|---|---|
| Before optimization | 26490.83ms (≈26.5s) | 24171.28ms (≈24.2s) |
| After optimization | 4929.68ms (≈4.9s) | 107.86ms |

> [!NOTE]
> The main comparison is a direct measurement over "the same full month, only toggling the aggregate table," so **104s → 5s** is a clean before/after.

## File Structure

The win-score report had accumulated many generations of patches with scattered data, plus varied developer conventions and short development windows — the original architecture was disorganized. One representative restructuring pulled win-score logic out of a **monolithic single file** and **scattered controllers**, into a **domain layer** + **one file per query domain**.

**Before (scattered)**

```
app/
├─ Model/Game.php                    # Monolithic file, win-score logic tangled in
├─ Http/Controllers/WinScore/
│  ├─ WinScoreController.php         # Main controller
│  ├─ WinScoreStat.php
│  └─ CCoin/
│     ├─ CheckDuplicateData.php
│     └─ DeleteWinScoreDayData.php
└─ Model/ClickHouse/WinScore/
   ├─ WinScorePlayer.php              # Player (existing)
   └─ WinScoreBuyFG.php               # Buy-free-game (existing)
   (other sub-reports not yet split out)
```

**After (domain layer + one file per domain)**

```
app/
├─ Model/Game.php                    # Substantially slimmed down
├─ Domain/WinScore/                  # New domain layer, centralizes win-score business logic
│  ├─ TotalWinReport.php             # Report
│  ├─ TotalWinStatistic.php          # ← formerly WinScore/WinScoreStat.php
│  ├─ CheckDuplicateData.php         # ← formerly WinScore/CCoin/
│  └─ DeleteWinScoreDayData.php      # ← formerly WinScore/CCoin/
├─ Http/Controllers/WinScoreController.php  # Slimmed to a thin entry point
└─ Model/ClickHouse/WinScore/        # ClickHouse queries: one file per domain
   ├─ WinScorePlayer.php             # Player
   ├─ WinScoreBuyFG.php              # Buy-free-game
   └─ WinScorePersonalSeat.php       # Dedicated machines
```
