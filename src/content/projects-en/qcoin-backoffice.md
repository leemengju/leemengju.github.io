---
title: Q-Coin Back-Office System
role: Full-Stack Engineer (paired with a teammate)
period: "2026.03 - 2026.05"
tags: [Laravel, Vue, MySQL, Project Management]
metrics: "Delivered from zero in 8 weeks, 34 work items shipped, 69 personal commits"
order: 4
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

The company planned to introduce a brand-new virtual currency (Q-Coin), but the back office had no existing pages at all — no DB schema, no front-end screens; everything had to be built from zero. The existing C-coin reports numbered nearly 50 and had each evolved independently for years, so Q-Coin versions could not simply be copied: each report's original logic had to be understood first before judging whether "just adding a column" was enough or a full rewrite was needed. On top of that, the product spec was undecided, requiring report-by-report priority alignment with management, operations, risk-control, customer service and other departments, with requirements continuing to grow throughout the confirmation process.

## Scope

Paired with a teammate to deliver the brand-new currency-system back office from zero in 8 weeks, covering four major categories — reports, settings, point management, and member management — with 34 work items shipped; another 15+ work items were evaluated and confirmed as not needing development, effectively converging the scope.

## Challenges

The old and new currencies had to coexist in the same back-office interface: coin top-up, coin deduction, statistics and other features all had to support both sets of logic simultaneously, without affecting existing C-coin logic and data safety. Meanwhile, the company had 8+ short-lived project branches in parallel development (GODSWAR, betDaily, arpu-main, etc.), and every merge had to be verified to ensure Q-Coin logic had not been overwritten.

## Contributions

- Led requirement confirmation and work-item allocation: aligned with each department report by report using a CSV work-allocation plan (priority × feasibility × owner × completion progress), and reported progress upward bi-weekly, keeping risk visible while requirements remained uncertain.
- Independently completed 16 work items (core features including the free-game purchase report, coin top-up control center, passbook records, online members, and item cards), submitting 69 commits (Laravel 32 + Vue 37).
- Designed a four-environment branch strategy (QA → QAPUB → RL → main): before release, conflicts were resolved centrally on a single integration branch and merged back to the main branch only after verification passed, keeping production clean and always deployable despite 8+ concurrent short-lived branches.
- Resolved the pitfall of legacy MySQL implicitly adding `ON UPDATE CURRENT_TIMESTAMP` to the first TIMESTAMP column, which caused statistics timestamps to be overwritten; and a Promise ordering issue where the Q-Coin statistics report ran its statistics before the async game list had resolved, producing empty results.

## Impact

Delivered the brand-new currency-system back office on time within 8 weeks, with all 34 work items fully shipped. Through the branch strategy and bi-weekly reporting mechanism, delivery quality and progress visibility were maintained even under the high-pressure environment of multiple concurrent short-lived branches and ambiguous requirements.
