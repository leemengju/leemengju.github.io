---
title: Daily Bet Report (betDaily) Automation & Visualization
role: Full-Stack Engineer
period: "2026.05 - 2026.06"
tags: [Laravel, Vue, v-charts, Automation]
metrics: "Daily manual entry: 20 min → 0 (all 6 pain points solved)"
order: 3
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
