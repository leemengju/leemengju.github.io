---
title: Q-Coin Back-Office System
role: Full-Stack Engineer (paired with a teammate)
period: "2026.03 - 2026.05"
tags: [Laravel, Vue, MySQL, Project Management]
metrics: "Delivered from zero in 8 weeks, 34 work items shipped, 69 personal commits"
order: 4
categories: [fullstack, pm]
timeline:
  - date: "2026-03-10"
    label: "Built the Q-Coin passbook from scratch (first commit)"
  - date: "2026-03-17"
    label: "Fixed statistics-timestamp errors caused by legacy MySQL's implicit TIMESTAMP ON UPDATE"
  - date: "2026-04-20"
    label: "Fixed an async Promise ordering issue in the Q-Coin statistics report"
  - date: "2026-04-22"
    label: "Cut an integration branch to centralize merge conflicts across 8+ concurrent short-lived branches"
  - date: "2026-05-05"
    label: "All features shipped and delivered (final commit)"
---

## Background

The company planned to introduce a brand-new virtual currency (Q-Coin), but the back office had no existing pages at all — no DB schema, no front-end screens; everything had to be built from zero. The existing legacy-currency reports numbered nearly 50 and had each evolved independently for years, so Q-Coin versions could not simply be copied: each report's original logic had to be understood first before judging whether "just adding a column" was enough or a full rewrite was needed. On top of that, the product spec was undecided, requiring report-by-report priority alignment with management, operations, risk-control, customer service and other departments, with requirements continuing to grow throughout the confirmation process.

## Scope

Paired with a teammate to deliver the brand-new currency-system back office from zero in 8 weeks, covering four major categories — reports, settings, point management, and member management — with 34 work items shipped; another 15+ work items were evaluated and confirmed as not needing development, effectively converging the scope.

## Challenges

The old and new currencies had to coexist in the same back-office interface: coin top-up, coin deduction, statistics and other features all had to support both sets of logic simultaneously, without affecting existing legacy-currency logic and data safety. Meanwhile, the company had multiple short-lived project branches (8+) in parallel development, and every merge had to be verified to ensure Q-Coin logic had not been overwritten. Requirements themselves were also unstable — new requirements kept being appended during spec confirmation, so completed features frequently needed rework; and the nearly 50 legacy reports were highly heterogeneous, each with its own SQL and front-end structure, impossible to copy 1:1 and requiring per-report judgment of rewrite depth.

## Contributions

- Led requirement confirmation and work-item allocation: aligned with each department report by report using a CSV work-allocation plan (priority × feasibility × owner × completion progress), and reported progress upward bi-weekly, keeping risk visible while requirements remained uncertain.
- Independently completed 16 work items (core features including the free-game purchase report, coin top-up control center, passbook records, online members, and item cards), submitting 69 commits (Laravel 32 + Vue 37).
- Designed a four-environment branch strategy (test → pre-release → release-candidate → production): before release, cut an integration branch off pre-release, resolved all conflicts for the release centrally there, and merged up level by level only after verification passed — keeping production clean and always deployable despite multiple concurrent short-lived branches.
- Established a code-first / schema-follows deploy ordering: while a DB table was not yet on the test environment, added a "does the table exist?" guard in the controller so code could merge first without erroring, then removed the guard in the next commit once the table was built to fully enable the feature — avoiding environment crashes from hard dependencies.
- Resolved the pitfall of legacy MySQL implicitly adding `ON UPDATE CURRENT_TIMESTAMP` to the first TIMESTAMP column, which caused statistics timestamps to be overwritten; and a Promise ordering issue where the Q-Coin statistics report ran its statistics before the async game list had resolved, producing empty results.

## Impact

Delivered the brand-new currency-system back office on time within 8 weeks, with all 34 work items fully shipped. Through the branch strategy and bi-weekly reporting mechanism, delivery quality and progress visibility were maintained even under the high-pressure environment of multiple concurrent short-lived branches and ambiguous requirements.

## Key Technical Decisions & Pitfalls

**Worst pitfall 1: legacy MySQL's implicit TIMESTAMP ON UPDATE**

After the Q-Coin-specific statistics table was built, a time-based report kept producing wrong stats — the first TIMESTAMP column's value was being reset to the current time on every UPDATE. The INSERT logic was suspected first, and hours were spent there with no result; only `SHOW CREATE TABLE` revealed the truth: legacy MySQL implicitly adds `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` to the first `TIMESTAMP` column in a table, even when the DDL says nothing of the sort. The legacy-currency table never hit this because its column order differed, so there was no precedent to learn from. Lesson: on legacy MySQL, always verify the schema right after creating a table with a TIMESTAMP column.

```sql
-- After creating the table, always confirm whether the first TIMESTAMP
-- column got an implicit ON UPDATE
SHOW CREATE TABLE `<your_stats_table>`;
-- If an unexpected ON UPDATE CURRENT_TIMESTAMP appears, fix it manually
ALTER TABLE `<your_stats_table>`
  MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

**Worst pitfall 2: statistics ran before the async game list resolved**

In `mounted`, the Q-Coin statistics report fired "load game list" and "run statistics query" at the same time, but the game list was an async action and the statistics query did not wait for it — so the filter's game list was empty and the stats came out wrong. It was first misdiagnosed as an arrow-function scope issue, fixed twice before confirming that was not the root cause. The correct fix was to chain the statistics query after the list Promise resolved.

```js
// Wrong: both run in parallel; the list may not be ready at query time
this.getGameList()
this.searchStats()

// Fixed: run statistics only after the list resolves
this.getGameList().then(() => this.searchStats())
```

**Engineering practices worth keeping**

- Four-environment branch strategy (test → pre-release → release-candidate → production): conflicts are resolved centrally on the integration branch, so pre-release and production stay clean. With 8+ short-lived branches in parallel, this flow is what keeps production from breaking.
- Code-first / schema-follows: a "does the table exist?" guard decouples the code and DB rollout cadence, letting a feature deploy safely in two steps.
