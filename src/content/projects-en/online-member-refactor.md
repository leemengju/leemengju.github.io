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

The legacy version was a single page component (712 lines) with five years of accumulated patches, plus a 232-line auxiliary settings file. One tangled API returned three kinds of data — summary, game list, and player list — all mixed together, so a problem in any one block broke the whole page, and none of them could be paged or cached independently. Worse, the summary values were not plain numbers but color-coded HTML strings (e.g. `<span style="color:red">123</span>`), and figures from different versions were joined by direct string concatenation, leaving the front end unable to do any arithmetic on them. Four teams each had very different pain points: the CEO wanted the whole thing readable at a glance on a phone, operations wanted to clearly understand what each number meant, the tech lead needed a data structure that could sustain over a hundred games with up to 11 multipliers, and risk-control wanted column meanings they could read without asking an engineer every time.

## Scope

Split the page into three independent modules — summary, game detail, and member live status — each with a dedicated API, independent pagination logic and column definitions, and made the summary aggregation formula adjustable on the front end in real time, so requirement changes no longer required touching the back end. The originally planned auto-refresh countdown was dropped.

## Challenges

The core challenge was satisfying four teams' heterogeneous needs in a single release without adding any user training cost. The thorniest part was root-causing the summary bug where "color strings added together turned into one strange long string": operations reported the total headcount was sometimes correct and sometimes a very long string that started with the right number. It was initially assumed to be an intermittent API anomaly, but after checking the back-end logs and confirming the numbers were all correct, the real cause turned out to be that the summary values were wrapped as HTML strings, so the front-end `+` operator concatenated two strings instead of adding them. A second challenge was the huge variance in multiplier columns across games (anywhere from 1 to 11), which the old four-column framework simply could not hold.

## Contributions

- On the back end, split the single tangled API into 3 APIs with clear responsibilities (summary aggregation, game detail list, player live status), each independently pageable and cacheable, with independent call timing and error handling.
- On the front end, reduced the main file from 712 lines to a ~190-line parent coordinator plus 7 sub-modules; each module owns only its own template and column definitions, so new requirements go into the relevant sub-module without affecting other tabs.
- Added a formula-adjustment dialog letting users check "which columns to sum" directly in the UI — adjusting the definition of the main-lobby headcount without any code change.
- Dynamically supported each game's 1–11 multipliers: unified the output to four multiplier columns padded with 0, and mapped by index rather than by value name (the same index maps to different multiplier values across games); card-and-board games with more than four multipliers are silently filtered in game-detail mode without affecting the headcount-overview mode.

## Impact

The CEO's mobile-friendly layout, operations' clear numeric columns, the tech lead's structural refactor, and risk-control's explicit column meanings all shipped in the same release, with no extra UI training required. With summary values now pure numbers, the front end can do arithmetic directly and the string-concatenation corruption is gone; and with the API split into 3, a problem in one block no longer drags down the whole page.

## Key Technical Decisions & Pitfalls

**Worst pitfall — the summary values were "HTML strings concatenated," not numbers added**

The summary values were originally returned as color-tagged HTML strings, with figures from different versions joined together as strings. When the front end applied `+`, the result was concatenation, not addition:

```js
// Symptom: the back end returned tagged strings, not numbers
const a = '<span style="color:red">123</span>';
const b = '456';
a + b;            // "…123…456" → a weird long string on screen, not 579
Number(123) + Number(456); // 579 → fix: back end returns pure numbers, front end does the math
```

Because the back-end logs showed correct numbers, it was first misdiagnosed as an intermittent API glitch; the real root cause was a front-end type issue. The fix was to have the back end return pure numbers and let the front end do the aggregation. The lesson is simple: summary values must be `number`, never carrying any HTML tags.

**Trade-off 1 — formula adjustment on the front end, not the back end**

The rejected option was to have the back end compute the "total headcount" and let the front end just display it. It was rejected because the CEO frequently changes the definition of "which kinds of people count toward the total" — on the back end, every change would mean a code change plus a redeploy, whereas on the front end it is just a config change the user makes in the UI. The checkbox state intentionally resets on refresh — the CEO's adjustments are mostly ad hoc and don't need to be persisted.

**Trade-off 2 — game detail is not paginated; full client-side sort instead**

The rejected option was pagination plus server-side sort (mirroring the existing headcount overview). It was rejected because the game-detail dataset is just the number of games (roughly 50–100 rows after excluding card-and-board games), so a full client-side sort is more than sufficient; whereas a paginated sort only sorts the current page, contrary to the user's expectation of sorting everything. So the back end returns the full set at once and the front end does the client-side sort.
