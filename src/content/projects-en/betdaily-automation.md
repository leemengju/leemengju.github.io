---
title: Daily Bet Report (betDaily) Automation & Visualization
role: Full-Stack Engineer
period: "2026.05 - 2026.07"
tags: [Laravel, Vue, v-charts, Automation]
metrics: "Daily manual entry: 20 min → 0 (all 7 pain points solved)"
order: 8
categories: [data-automation, fullstack]
beforeAfter:
  label: "Daily manual work time"
  before: 20
  after: 0
  unit: "min/day"
---

## Background

> [!IMPORTANT]
> **Core pain point: 20 minutes a day filling in Excel — and no way to know whether the entries were even correct.**

The report touched three tiers of users:

- **Risk-control (execution layer)**: each dawn had to manually query the prior day's per-game bet amounts, fill Excel, and convert game by game — 20 minutes of repetitive labor. After automation they moved from "data mover" back to their actual job of analysis and reporting.
- **Head of operations (strategy layer)**: relied on risk-control's Excel to set strategy, but the fixed Excel columns meant games could not be compared or reordered, and the numbers could not be verified. After the rework they can read line charts directly for cross-game trend comparison, with export order aligned to launch date.
- **Chief executive (review layer)**: periodically reviews the report and previously had to accept numbers that "might or might not be right." Once the data came straight from a system tally against the DB, mis-entry was eliminated at the source and the reviewed numbers are trustworthy.

Original pain points:

- **Daily repetitive labor**: each dawn, manually query the prior day's per-game bet amounts and enter them into Excel, converting one game at a time — 20 minutes a day.
- **No verification**: numbers were filled in by "days-since-launch" by hand, so mis-entries and omissions went undetected and confidence was low.
- **Hard to query and compare**: fixed Excel columns meant games could not be reordered, making game-anchored cross-comparison a chore.

New pain points surfaced after launch:

- **Re-run need**: a game was re-launched and management wanted the count restarted from that day, but the report still queried from the old launch date and couldn't be corrected.
- **No memory of query combinations**: every time the page opened, games had to be re-selected from scratch; common combinations couldn't be saved.
- **Export ordering**: exported columns weren't intuitively ordered — the oldest game should be on the left, the newest on the right.
- **Lifecycle view only**: the 60-day table is axed on "day N since launch," which says nothing about how a game performed *in the last few days* — especially games past 60 days that had stopped accumulating, whose recent numbers still had to be looked up by hand in Excel.

## Goals

- Replace manual entry with a Kernel scheduled job, solving the daily labor and the lack of verification.
- Use v-charts line charts + a vuedraggable draggable table, solving the query/compare difficulty and export ordering.
- Add a re-run feature (UI + CLI) for recomputation after a re-launch.
- Add template management to remember query combinations.
- Add a recent-5-day calendar-view table (a separate new table + column-order linkage across both tables) to supply the absolute-date recent view.

## Key Highlights

1. **Daily manual work zeroed out**: a Kernel job runs the statistics pipeline automatically at 01:00, accumulating 60 days of bet amounts from launch date with no human involvement.
2. **Verifiable numbers**: data comes straight from the game detail database — a DB tally replaces manual Excel entry, eliminating mis-entry at the source.
3. **Multi-game visual analysis**: v-charts line charts show each game's 60-day trend, and vuedraggable lets table columns be dragged and reordered at will, supporting cross-game comparison decisions.
4. **Re-run recovery for any game**: selecting a game + launch date in the UI triggers a re-run; the operation is written to the back-office operation log so history is auditable.
5. **Template-remembered query combinations**: users can create game templates (a template name + a game list) and apply one from the main page via el-select with a single click, with no re-selecting.
6. **Recent-5-day calendar view, linked to the 60-day table**: below the 60-day table sits a recent-5-day date table (X axis = absolute dates); one row of draggable chips controls the column order of *both* tables, a single query updates both in parallel via `Promise.all`, and the CSV export merges both tables (separated by a blank row). A re-run also backfills that game's last 14 days automatically.

## Solution & Architecture

### Back-end pipeline (Kernel, daily at 01:00)

```mermaid
flowchart LR
  K["Kernel schedule<br/>daily 01:00"] --> A["Add newly launched games"]
  A --> B["Confirm each game's launch date"]
  B --> C["Tally yesterday's bets"]
  C --> D["shift 60-day array<br/>write to lifecycle record table"]
  D --> E["Write to recent-day table (incl. 0)<br/>purge rows older than 14 days"]
```

| Step | Description |
|------|-------------|
| 1 Add new games | Add games not yet recorded from the master game list into the launch-date marker table |
| 2 Confirm launch date | Query the game database (open=1) + each game's first created-time to confirm the launch date |
| 3 Tally bets | For games in `finished` state, tally yesterday's bets and shift them into the 60-day array |
| 4 Write recent-day rows | Write every game's bet amount for yesterday (including 0) into the recent-day table, and purge rows older than 14 days |
| 5 Chain | Chain 1 → 2 → 3 → 4 into a single pipeline |

The recent-day table also has one shared backfill routine: recompute N days backwards from yesterday. The initial fill when the table was created (all games) and a re-run (a single game) both call it, and step 4 of the daily schedule is literally "that backfill with N=1" plus the purge — one backfill implementation serving three call sites, so the schedule and the re-run never carry two copies of the arithmetic that can quietly drift apart.

> [!NOTE]
> Currently covers 40 games; a single pipeline run takes ~10 s. A Slack alert fires on Kernel failure; if data looks off, a one-click UI re-run (a CLI command also exists) recomputes it. The recent-day table deliberately keeps 14 days while queries read only the last 5 — that margin is the backfill buffer for the occasional missed scheduled run.

### Data tables

| Table | Purpose |
|-------|---------|
| Bet-record table | One row per game, storing a 60-day array of bet-amount floats as JSON (unit: 100M, floored to 1 decimal) |
| Launch-date marker table | Records each game's launch date and tally state (notYet / finished) |
| Template-settings table | Template name + a comma-separated list of game ids |
| Recent-day table | One row per (game, date) pair with the bet amount as `DECIMAL(10,1)`; normalized rows rather than JSON, keeping 14 days while queries read the last 5 |

### Front-end components & visualization

- **Main page**: game selector + template el-select + line chart (v-charts) + draggable table (vuedraggable) + 2× el-table (60-day table + recent-5-day table) + export. The line chart auto-renders 60-day trends, and when comparing a few games the tooltip shows each game's bet amount for a given day precisely; in the table the day column is pinned on the left while game columns drag freely, with a chip row showing the current column order.
- **How the two tables stay in sync**: only the "game column list" is draggable state; the 60-day table's columns are the day column + that list, the recent-5-day table's are the date column + the same list, and both are computed. So one chip drag reorders both tables while each keeps its own fixed column pinned left — the linkage comes from two views sharing one piece of state, not from events notifying each other.
- **Re-run**: game el-select + launch-date el-date-picker + a confirmation dialog + an operation-log table.
- **Templates**: a template-list management dialog + an add/edit template dialog (filtering out discontinued and non-listed games).

Multi-version log compatibility: the re-run operation log spanned a column change, so the read side displays with a fallback like "game name, else game id" to keep old records from showing blanks.

## Worst Pitfalls

### Pitfall 1: `update()` returning 0 rows misread as "record not found"

When editing a template, if the user submitted content identical to the existing data, the API returned a failure — leaving users confused: "I didn't change anything, why can't I save?" The root cause was that the original code treated `update()`'s affected rows = 0 as "record not found" and reported failure. But Laravel's `update()` returns 0 affected rows whenever the data is unchanged — that means "nothing changed," not "not found." The fix drops that check entirely: if `update()` doesn't throw, it succeeded. And precisely because affected rows = 0 means nothing changed rather than not found, any settings-style edit that allows resubmitting the same value must never gauge success by affected rows.

```php
// Wrong: a settings page that allows submitting the same value
// must NOT judge success by affected rows
$affected = DB::table('<template_table>')
    ->where('id', $id)
    ->update($data);
if ($affected === 0) {
    return $this->fail('NO_RESULTS'); // false failure on identical submit!
}

// Right: no exception from update() means success;
// affected=0 only means nothing changed
DB::table('<template_table>')->where('id', $id)->update($data);
return $this->success();
```

### Pitfall 2: el-select clear event wiping all selected games

The template el-select on the main page had `clearable`; after the user clicked the clear (×) icon, the entire set of manually selected games vanished. The root cause: `@change` also fires on clear, passing a value of `null`; downstream code used it to `find()` the template, got `undefined`, then parsed that into an empty array — overwriting the existing selection. The fix is to early-return on `null` at the top of the handler — with a `clearable` + `@change` component, clearing fires the same event with `null`, so the handler must handle `null` up front, or the downstream find/parse turns around and wipes the user's existing data.

```js
function onTemplateChange (id) {
  if (id == null) return          // clear event → leave existing selection alone
  const tpl = templateOptions.find(t => t.id === id)
  games = parseGameList(tpl.gameList)
}
```

## Key Trade-offs

1. **Inject legacy games from the front-end rather than change the DB schema**: a few early-launched games fell outside the standard game-list logic. Rather than alter the table structure or pollute the statistics pipeline for those few, they were defined as a front-end constant and injected via the game selector's parameter. The cost is that these ids are hard-coded in the front-end and adding more would require a code change — but there's no plan to add to this legacy batch, so this trades minimal intrusion for a clean pipeline.
2. **Keep the scheduled-job class names, only reorganize controller namespaces**: as the feature grew, the controller originally named after "60-day bet amounts" had taken on template and re-run responsibilities, so it was folded into a unified namespace and subfolder. But the scheduled job's class names were left untouched — class names don't affect routing or users, and renaming them would only risk disrupting the existing daily schedule, which isn't worth it.
3. **Give the recent view a normalized new table instead of extending the existing JSON array**: the 60-day table is a fixed-start lifecycle array (index 0 = launch date), a fundamentally different view from calendar absolute dates; forcing both into one data structure would only have them contaminate each other. The new table is one row per (game, date), so any date range is a plain WHERE and purging old data is a plain DELETE. The cost is inconsistency with the existing JSON style, but the table is tiny (40 games × 14 days ≈ 560 rows) — a little stylistic inconsistency bought a clean query and maintenance story, which was worth it.
4. **Call two query APIs separately rather than merging them into one**: the existing 60-day endpoint was left completely untouched (zero regression risk) and the new view got its own endpoint, each with a single responsibility and its own loading state, fired in parallel from the front end via `Promise.all`. CSV export, however, had to drop the previously shared table-export helper because the two tables' first columns mean different things (day count vs absolute date); it now assembles two sections in-page, separated by a blank row — a shared helper presupposes a shared data shape, and forcing one on tables that don't even agree on their first column only couples both sides for the sake of reuse.

## Quantified Results

| Item | Before | After |
|------|--------|-------|
| Daily manual work time | ~20 hours accumulated over a game's 60-day cycle | 0 hours (fully automated via Kernel) |
| Verifiability | Manual entry; mis-entry undetectable | Tallied straight from DB detail; auditable |
| Reorderable games | Fixed Excel columns | Freely draggable via vuedraggable |
| Re-run / launch-date fix | Not possible | One-click UI re-run + back-office operation log audit |
| Remembered query combinations | Re-selected every time | Applied from a template in one click |
| Export ordering | No rule | Ordered by launch time (oldest on the left) |
| Recent-performance view | Looked up by hand in a separate Excel | Recent-5-day date table on the same page, with query / export / column order all linked to the 60-day table |
| Game coverage | — | 40+ games, ~10 s per pipeline run |
| Pain points solved | 0/7 | 7/7 |

## Future Plans

- **Games beyond 60 days**: the bet-record table is a fixed-start array (index 0 = launch date) that marks state `finished` and stops accumulating once 60 days are full — it is not a sliding window. The "recent performance" need is now covered by the recent-5-day table, but a genuine "query all history" requirement would still mean moving to a partitioned table or a separate history table.
- **Configurable window for the recent table**: queries are currently fixed at 5 days (with 14 days retained in the DB); if operations wants the last 7 or 14, only one query-window constant on the back end changes and the front end needs no edit.
- **Paginated re-run operation log**: each dialog open currently loads the first page; if re-runs become frequent the history could grow long, so a date filter can be added later.

## Code Structure Reorganization

Illustrated by one reorganization done as the feature grew: what began as a single controller + a flat page was folded into a module namespace with subfolders.

**Before (flat)**

```
controllers/
  report-controller.php          # named after "60-day bet amounts", single responsibility

page/report/
  report-main-page.vue           # flat page, no sub-component separation
```

**After (module namespace + subfolders)**

```
controllers/bet-amount-report-module/
  report-controller.php              # all original methods + re-run / back-office log read
  template-settings-controller.php   # template CRUD

page/report/bet-amount-report-module/
  report-main-page.vue           # main page (split toolbar, template selection)
  rerun/
    rerun-dialog.vue             # re-run dialog + confirmation
    operation-log-table.vue      # paginated back-office operation log table
  template/
    template-manager-dialog.vue  # template list management
    template-editor-dialog.vue   # add / edit template
    template-api-module.js       # template API + parsing
```

> [!NOTE]
> Any module spanning more than one Vue/JS file is wrapped in its own subfolder (rerun/ has 2, template/ has 3), so the page directory doesn't flatten into something hard to maintain.
