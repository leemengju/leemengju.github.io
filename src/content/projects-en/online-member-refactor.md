---
title: Online Member Page Refactor & Multi-Team Requirement Integration
role: Full-Stack Engineer
period: "2026.05 - 2026.06"
tags: [Vue, Laravel, API Design, Refactoring]
metrics: "1 tangled API split into 3; main file 712 lines → ~190 lines"
order: 6
categories: [refactor, fullstack]
beforeAfter:
  label: "Front-end main file line count"
  before: 712
  after: 190
  unit: "lines"
---

## Background

The legacy version was a single page component (712 lines) with five years of accumulated patches, plus a 232-line auxiliary settings file. One tangled API returned three kinds of data — summary, game list, and player list — all mixed together, so a problem in any one block broke the whole page, and none of them could be paged or cached independently. Worse, the summary values were not plain numbers but color-coded HTML strings (e.g. `<span style="color:red">123</span>`), and figures from different versions were joined by direct string concatenation, leaving the front end unable to do any arithmetic on them.

Four teams each raised very different pain points:

- **CEO**: to preview everything at a glance on a phone, all games' headcount and bet amounts were crammed into a single row — information density too high, hard to read.
- **Operations director**: the report used color strings (`<span style="color:red">123</span>`) to distinguish parameters, figures from different versions were concatenated as strings, and the output was unrecognizable — impossible to tell what each number meant.
- **Tech lead**: the columns were originally designed for only four multiplier (gainRate) slots, but there are now over a hundred games with up to 11 distinct multipliers, which the old framework simply could not hold; combined with five years of patches, the data structure was unreadable and badly needed a refactor.
- **Risk-control**: needs to report figures regularly, but because column meanings were unclear, often had to ask a developer to confirm what a column meant.

> [!IMPORTANT]
> The legacy tangled API returned summary, game list, and player list all in one response, and summary values came back as color-coded strings — leaving the front end unable to handle any one block independently.

## Goals

Split the "online member" page into three independent modules (summary / game detail / member live status), each with a dedicated API, independent pagination logic, and column definitions; and make the summary formula adjustable on the front end, so the back end no longer has to change on every request.

Out of scope: the auto-refresh countdown (requirement withdrawn, removed).

## Highlights

- **Four teams satisfied in one release**: the CEO's mobile-friendly row, operations' clear columns, the tech lead's structural refactor, and risk-control's explicit numbers — all shipped in the same release.
- **Batch filtering by hall category**: the game selector can batch-filter by "hall category" (multiplier / type), far better for analysis than ticking games one by one, sharply cutting the cost of filtering.
- **Front-end-adjustable summary formula**: the CEO frequently changes the definition of "total lobby headcount"; a formula-adjustment dialog lets anyone tweak the aggregation logic live in the UI, no code change needed.
- **Multi-view game detail**: added a per-hall headcount (game detail) mode where each of the hundred-plus games shows four per-hall headcount columns (`gainRate1`~`gainRate4`), padded with 0 when fewer than four, with card-and-board games excluded automatically.
- **Color coding removed**: summary values changed from color strings to pure numeric columns, so the front end does arithmetic directly and the string-concatenation corruption is gone.

## Quantified Results

| Metric | Before | After |
|------|--------|--------|
| Front-end main file lines | 712 lines (single page component) | ~190 lines (parent) + 7 sub-modules |
| Auxiliary settings file | 232 lines (mixed into one file) | 3 independent column-definition files |
| API count | 1 (all-in-one) | 3 (each with a clear responsibility) |
| Supported multiplier columns | 4 (hard-coded) | dynamic gainRate1~4 (auto-padded with 0) |
| Summary formula adjustment | change back-end code | live front-end UI adjustment |
| Color-coding dependency | yes (no arithmetic possible) | none (pure numbers) |
| Export coverage | player list only | player list + game detail |

## Solution & Architecture

### API Split (Laravel)

The legacy tangled API packed all three blocks into one response, so a problem in any one block affected the whole page and none could be paged or cached individually. After the split, each API has a single responsibility, with independent call timing, pagination logic, and error handling.

| Old API | New API | Responsibility |
|--------|--------|------|
| single tangled API (all-in-one) | summary-aggregation API | three-metric summary |
| same as above | game-detail-list API | game detail (supports headcount overview / bet amount / game detail — three views) |
| same as above | player-live-status API | player live-status list (with pagination + export) |

### Vue Component Split

The legacy version concentrated all logic in a single page component, so any change meant locating it within 700 lines; after splitting into sub-components, each module owns only its own template and columns, the parent only coordinates, and new requirements go into the relevant sub-module without affecting other tabs.

| Old structure | New structure | Responsibility |
|--------|--------|------|
| single page component (712 lines) | parent coordinator component | parent coordination |
| auxiliary settings file (232 lines) | summary-render component + summary-normalization module + column definitions | summary rendering and formula |
| same as above (game-detail part) | game-detail component + column definitions | game-detail three views |
| same as above (player-list part) | player-live-status component + column definitions | player live status |

## Difficulties & Pitfalls

**Worst pitfall — summary values were concatenated as strings**

- *Symptom*: the operations director reported that "the total game headcount is sometimes `123456`, sometimes a weird long string starting with `1234`."
- *Misdiagnosis*: assumed an intermittent API response-format anomaly; checked the server log and confirmed the numbers were correct.
- *Real root cause*: the legacy summary value was assembled directly into `"<span>123</span><span>456</span>"`, and the front-end `+` operator joined the two strings instead of adding them.
- *Fix*: the back end returns pure numbers only, and the front end does the aggregation uniformly.

```js
// Symptom: the back end returned tagged strings, not numbers
const a = '<span style="color:red">123</span>';
const b = '456';
a + b;            // "…123…456" → a weird long string on screen, not 579
Number(123) + Number(456); // 579 → fix: back end returns pure numbers, front end does the math
```

Because the back-end logs showed correct numbers, it was first misdiagnosed as an intermittent API glitch, and it took a detour to trace the real cause to a front-end type issue; that is exactly why the fix hardened the rule that summary values may only be returned as `number` and must never carry any HTML tag.

A few other pitfalls cleared along the way:

- **Removing color strings**: the legacy summary values were strings carrying `<span>` tags, so splitting them required changing the Laravel response format, the Vue display logic, and the aggregation calculation all at once — three places that had to move together.
- **Asymmetric gainRate columns**: the multiplier list length varies across games (1–11); the old version padded some with 0 and simply didn't show others, an inconsistent logic. This was unified to output `gainRate1`~`gainRate4`, always padding with 0 when fewer than four, mapped by the multiplier list's index (not by value name, since the same index maps to different multiplier values across games).
- **Excluding card-and-board games**: card-and-board games have more than four gainRate values and must be silently filtered in game-detail mode (excluded on the back end, still selectable in the UI), but the filtering must not affect the headcount-overview mode.

## Key Trade-offs

**Formula adjustment on the front end, not the back end**

- Rejected option: have the back end compute the "total headcount" and let the front end just display the result.
- Reason for rejection: the CEO frequently changes "which kinds of people count toward the total"; on the back end each change would mean a code change plus a deploy, whereas on the front end it is just a config change.
- Choice: a formula-adjustment dialog lets the user tick "which columns to sum" in the UI, with the result held in front-end state and reset on refresh (intentional design, since the CEO's adjustments are mostly ad hoc and don't need to be persisted).

**Game detail is not paginated**

- Rejected option: pagination + server-side sort (mirroring the existing headcount overview).
- Reason for rejection: the game-detail dataset is just the number of games (roughly 50–100 rows after excluding card-and-board), so a full front-end sort is more than enough; a paginated sort only sorts the current page, contrary to the user's expectation of sorting everything.
- Choice: the back end returns the full set at once and hides pagination, and the front end does the client-side sort.

## Future Plans

- The per-hall headcount column labels (named by multiplier / hall) are currently hard-coded in the column-definition file, and would need updating in sync if the gainRate order changes in the future.
- The formula-adjustment dialog's checkbox state resets on refresh, which is an intentional design (the CEO's adjustments are ad hoc and don't need to be persisted).
- Game detail currently aggregates all member types (formal + offline + trial + no-account + personal-seat); splitting them out by type would require additional columns.

## File Structure

**Before (deleted)**

```
Online Member page/
├── single page component   (712 lines, everything mixed together)
└── auxiliary settings file (232 lines)
```

**After (added)**

```
Online Member page/
├── parent coordinator component    (~190 lines, coordination only)
├── summary module/
│   ├── summary-render component
│   ├── summary-normalization module
│   └── column definitions
├── game-detail module/
│   ├── game-detail component       (three-view switching)
│   └── column definitions          (headcount overview / game detail)
├── player-live-status module/
│   ├── player-live-status component
│   └── column definitions
└── formula-adjustment dialog       (formula-adjustment UI)
```

The single refactor touched 13 files with a net change of about +928 / -1068 lines, with the new structure fully replacing the old monolithic file.
