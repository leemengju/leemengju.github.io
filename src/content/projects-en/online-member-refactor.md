---
title: Online Member Page Refactor & Multi-Team Requirement Integration
role: Full-Stack Engineer
period: "2026.05 - 2026.06"
tags: [Vue, Laravel, API Design, Refactoring]
metrics: "1 tangled API split into 3; main file 712 lines → ~190 lines"
order: 6
beforeAfter:
  label: "Front-end main file line count"
  before: 712
  after: 190
  unit: "lines"
---

## Background

The old `people_list.vue` (712 lines) plus its auxiliary settings file (232 lines) had accumulated five years of patches. A single API returned summary, game list and player list all mixed together, with summary values returned as color-coded strings (e.g. `<span style="color:red">123</span>`); figures from different versions were "summed" by direct string concatenation, leaving the front end unable to do any arithmetic. Four teams each had very different pain points: the CEO wanted it readable on a phone, operations wanted clear numeric columns, the tech lead needed a refactor that could sustain 116 games with up to 11 multipliers, and risk-control wanted column meanings they could understand without asking an engineer.

## Scope

Split the page into three independent modules — summary, game detail, and member live status — each with a dedicated API, independent pagination logic and column definitions, and made the summary aggregation formula adjustable on the front end in real time, so requirement changes no longer required touching the back end.

## Challenges

Had to satisfy four teams' heterogeneous needs in a single release without adding any user training cost, while also root-causing the legacy bug where "color strings added together turned into one strange long string" — it was initially assumed to be an intermittent API anomaly, but after checking the server logs and confirming the numbers were correct, the real cause turned out to be the front-end `+` operator concatenating two strings instead of adding them.

## Contributions

- On the back end, split the single tangled API into 3 APIs with clear responsibilities (summary aggregation, game detail list, player live status), each independently pageable and cacheable.
- On the front end, reduced the main file from 712 lines to a ~190-line parent + 7 sub-modules, and added `SummaryFormulaDialog` letting users check "which columns to sum" in the UI — adjusting the definition of the main-lobby headcount without any code changes.
- Dynamically supported each game's 1–11 multipliers, unifying the output as `gainRate1`–`gainRate4` padded with 0 and mapping by index rather than by value name (the same index maps to different multiplier values across games); card-and-board games are silently filtered in game-detail mode without affecting the headcount-overview mode.

## Impact

The CEO's mobile-friendly layout, operations' clear numeric columns, the tech lead's structural refactor, and risk-control's explicit column meanings all shipped in the same release, with no extra UI training required; with summary values now pure numbers, the front end can do arithmetic directly, and the string-concatenation corruption is gone.
