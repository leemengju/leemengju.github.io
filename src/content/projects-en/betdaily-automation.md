---
title: Daily Bet Report (betDaily) Automation & Visualization
role: Full-Stack Engineer
period: "2026.05 - 2026.06"
tags: [Laravel, Vue, v-charts, Automation]
metrics: "Daily manual entry: 20 min → 0 (all 6 pain points solved)"
order: 3
categories: [data-automation, fullstack]
beforeAfter:
  label: "Daily manual work time"
  before: 20
  after: 0
  unit: "min/day"
---

## Background

Risk-control had to manually query the prior day's per-game bet amounts each dawn, converting and entering them into Excel game by game — ~20 min/day, with no way to tell whether the entries were even correct. Numbers were filled in by "days-since-launch" by hand, so mis-entries and omissions went completely undetected, and the fixed Excel columns meant games could not be reordered for cross-game comparison. After launch, new pain points surfaced: a re-launched game required recomputation from that day, query combinations could not be remembered, and export ordering was unintuitive.

## Scope

Replaced manual entry with a Kernel scheduled job that auto-computes the statistics each dawn, plus line-chart + draggable-table visualization, one-click UI re-run recovery, and query template memory.

## Challenges

All 6 pain points (manual time cost, no verification, difficult query comparison, re-run needs, no memory of query combinations, export ordering issues) had to be solved at once, without disrupting the correctness of the existing daily schedule.

## Contributions

- Built the daily statistics pipeline (covering 40 games, ~10 s per run) sourcing data directly from DB detail tables, eliminating mis-entry at the source.
- Front-end 60-day trends via v-charts line charts, paired with vuedraggable so table columns can be freely dragged and reordered, supporting cross-game comparison decisions.
- Added one-click UI re-run (triggered by selecting a game + launch date; operations are written to the back-office log for auditability) and template management (create common game combinations, apply with one click).
- Resolved the pitfall of Laravel `update()` returning 0 affected rows when data is unchanged, which was misread as "record not found" and made template edits fail; and the pitfall of el-select clear triggering `onChange(null)` and wiping all selected games.

## Impact

Daily manual work dropped from 20 minutes to 0 (fully automated via Kernel); all 6 pain points solved, with numbers sourced directly from DB detail tables — verifiable and auditable.

## Key Technical Decisions & Pitfalls

### Worst pitfall 1: `update()` returning 0 rows misread as "record not found"

When editing a template, if the user submitted content identical to the existing data, the API returned a failure — leaving users confused: "I didn't change anything, why can't I save?"

The root cause was that the original code treated `update()`'s affected rows = 0 as "record not found" and reported failure. But Laravel's `update()` returns 0 affected rows whenever the data is unchanged — that means "nothing changed," not "not found." The fix was to drop that check entirely: if `update()` doesn't throw, it succeeded.

```php
// Wrong: a settings page that allows submitting the same value
// must NOT judge success by affected rows
$affected = DB::table('bet_report_template')
    ->where('id', $id)
    ->update($data);
if ($affected === 0) {
    return $this->fail('NO_RESULTS'); // false failure on identical submit!
}

// Right: no exception from update() means success;
// affected=0 only means nothing changed
DB::table('bet_report_template')->where('id', $id)->update($data);
return $this->success();
```

Lesson: an ORM's affected rows = 0 means "nothing changed," not "not found." Any settings-style edit that allows resubmitting the same value must never gauge success by affected rows.

### Worst pitfall 2: el-select clear event wiping all selected games

The template el-select on the main page had `clearable`; after the user clicked the clear (×) icon, the entire set of manually selected games vanished.

The root cause: `@change` also fires on clear, passing a value of `null`; downstream code used it to `find()` the template, got `undefined`, then parsed that into an empty array — overwriting the existing selection. The fix was to early-return on `null` at the top of the handler.

```js
function onTemplateChange (id) {
  if (id == null) return          // clear event → leave existing selection alone
  const tpl = templateOptions.find(t => t.id === id)
  games = parseSelectGameList(tpl.selectGameList)
}
```

Lesson: with a `clearable` + `@change` component, clearing fires the same event with `null`, so the handler must handle `null` up front — otherwise the downstream find/parse turns around and wipes the user's existing data.

### Key trade-offs

- **Inject legacy games from the front-end rather than change the DB schema**: a few early-launched games fell outside the standard game-list logic. Rather than alter the table structure or pollute the statistics pipeline for those few, they were defined as a front-end constant and injected via the game selector's parameter. The cost is that these ids are hard-coded in the front-end and adding more would require a code change — but there's no plan to add to this legacy batch, so this trades minimal intrusion for a clean pipeline.
- **Keep the scheduled-job class names, only reorganize controller namespaces**: as the feature grew, the controller originally named after "60-day bet amounts" had taken on template and re-run responsibilities, so it was folded into a unified namespace and subfolder. But the scheduled job's class names were left untouched — class names don't affect routing or users, and renaming them would only risk disrupting the existing daily schedule, which isn't worth it.
