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

- **A brand-new currency with zero foundation**: The company planned to introduce a brand-new virtual currency (Q-Coin), and the back office had no existing pages at all — everything from the DB schema to the Vue front end had to be built from scratch.
- **Nearly 50 reports, each structured differently**: The existing-currency reports had each evolved independently for years, so the Q-Coin versions could not simply be copied; each had to be assessed for feasibility and then newly built or deeply reworked.
- **Extremely vague requirements**: The product spec was undecided, requiring report-by-report priority and detail alignment with departments (management, operations, risk-control, customer service…), with requirements continuing to be appended throughout the confirmation process.
- **A two-month deadline**: The goal was to expand the potential player base within a very short two months, compressing the schedule and leaving no room for long research.
- **Compatibility with the existing-currency system**: The new system had to coexist with the original currency module — top-up, deduction, and statistics all had to support both currencies within the same back-office interface.
- **Merge conflicts against many concurrent short-lived branches**: Multiple short-lived project branches ran in parallel, requiring frequent conflict resolution at merge time.

## Objective

Paired with one teammate, deliver the Q-Coin back-office back end and front end within 2026-03-10 – 2026-05-05, prioritizing the Priority 1–2 core reports and management features, and establishing a continuously trackable work-allocation mechanism — without investing in features assessed as "not needed".

## Highlights

- **34 feature work items shipped** — spanning four major categories (reports, settings, point management, member management), with another 15+ items assessed and confirmed as not needing development, effectively narrowing scope.
- **Brand-new DB tables with a compatibility-safe design** — created Q-Coin-specific tables while keeping the shared player-asset table backward-compatible, so existing-currency logic was unaffected.
- **16 work items completed independently** — covering core features such as the free-game purchase report, coin top-up control center, passbook records, online members, and item cards, with 69 commits submitted (Laravel 32 + Vue 37).
- **A bi-weekly progress-reporting mechanism** — based on a CSV work-allocation plan (priority × feasibility × owner × completion progress), progress was synced upward every two weeks, keeping risk visible while requirements remained uncertain.
- **Cross-branch conflict decoupling** — while running in parallel with many short-lived branches, the Q-Coin branch was continuously kept mergeable into the release-candidate/production environments with no missed breaking conflicts.

## Quantified Results

| Metric | Value |
|---|---|
| Project period | 2026-03-10 – 2026-05-05 (~8 weeks) |
| Team size | 2 (paired with a teammate) |
| Total planned work items | nearly 50 |
| Work items reaching test (completed) | 34 |
| Work items assessed as not needed | 15+ (scope narrowed effectively) |
| Personal work items | 16 |
| Personal commits | 69 (Laravel 32 + Vue 37) |
| Bi-weekly reporting cycle | Yes |

## Solution & Architecture

| Module | Approach |
|---|---|
| **Requirement management** | Listed all candidate features in a CSV table (category / feature / priority / feasibility / owner / completion progress) and locked scope after aligning report by report with each department. |
| **Work allocation** | Priority 1–2 high-priority items were allocated first; Priority 3–4 and uncertain items were marked "not needed" or "not started" to avoid wasting resources. |
| **DB compatibility design** | Created Q-Coin-specific statistics tables; the shared player-asset table was extended by adding columns rather than modifying existing-currency columns, avoiding compatibility risk. |
| **Mother-card / child-card design** | The back office only needs to store the mother-card data (a single mother-card code); the client parses the corresponding images itself, so child cards need not be stored in the DB, reducing back-office complexity. |
| **Merge strategy** | Q-Coin features were developed continuously on the release-candidate branch, periodically syncing updates from the short-lived branches, with conflicts resolved on the feature branch first before pushing to the test environment. |

## Challenges

- **Unstable requirements**: New requirements (10+) kept being appended during spec confirmation, forcing rework of already-completed features.
- **Highly heterogeneous report structures**: Each existing-currency report had its own SQL logic and front-end structure; the Q-Coin versions could not be copied 1:1 and required per-report judgment of rewrite depth.
- **Cross-currency UI coexistence**: The same back-office page had to support both currencies at once (e.g., the coin top-up control center added three columns with differing max-value logic), making UI changes prone to accidentally breaking existing logic.
- **MySQL version differences**: Legacy MySQL applies an implicit `ON UPDATE CURRENT_TIMESTAMP` to the first TIMESTAMP column, so the schema had to be manually altered after table creation — something the existing-currency legacy tables never hit.
- **Frequent merges from short-lived branches**: With 8+ short-lived branches in parallel, every merge had to be verified to ensure Q-Coin logic was not overwritten.

## Worst Pitfalls

**Worst pitfall 1: legacy MySQL's implicit TIMESTAMP ON UPDATE (free-game purchase report)**

- **Symptom**: After the Q-Coin-specific statistics table was built, the first TIMESTAMP column's value was overwritten on every UPDATE, producing abnormal statistics.
- **Misdiagnosis**: Initially assumed the INSERT logic was at fault.
- **Root cause**: Legacy MySQL implicitly adds `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` to the first `TIMESTAMP` column in a table even when the DDL says nothing of the sort. The existing-currency table never triggered it — a different version or column order — so there was no precedent to follow.
- **Fix**: After creating the table, manually run `ALTER TABLE` to drop the implicit ON UPDATE behavior; from then on, any table with a TIMESTAMP column on legacy MySQL is verified with `SHOW CREATE TABLE` first, so the same issue never recurs.

```sql
-- After creating the table, always confirm whether the first TIMESTAMP
-- column got an implicit ON UPDATE
SHOW CREATE TABLE `<your_stats_table>`;
-- If an unexpected ON UPDATE CURRENT_TIMESTAMP appears, fix it manually
ALTER TABLE `<your_stats_table>`
  MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

**Worst pitfall 2: statistics ran before the async game list resolved (Q-Coin statistics report)**

- **Symptom**: The statistics query was called while the game list used for filtering had not yet resolved, so the data was empty and the statistics came out wrong.
- **Misdiagnosis**: Thought it was an arrow-function scope issue, fixing the arrow functions twice before confirming that was not the root cause.
- **Root cause**: Loading the game list in `mounted` is an async Vuex action, but the statistics query executed without waiting for it to complete.
- **Fix**: Run the statistics query only after the game list's Promise resolves, ensuring the data is ready before computing.

```js
// Wrong: both run in parallel; the list may not be ready at query time
this.getGameList()
this.searchStats()

// Fixed: run statistics only after the list resolves
this.getGameList().then(() => this.searchStats())
```

## Future Plans

- If a third currency system is ever introduced, this Q-Coin build process can serve directly as a template: first decide whether the DB extends existing tables or creates dedicated ones, use a CSV to organize candidate features and confirm feasibility department by department, and use the four-environment branch strategy to control the release cadence.
- The Q-Coin hall will keep adding games, and each new game requires syncing the corresponding report filters, game list, and statistics logic. The core maintenance question going forward is which parts are hard-coded game codes and which are fetched dynamically — a checklist is needed to avoid missed updates.

## Appendix

**Reusable takeaways**: On legacy MySQL, always run `SHOW CREATE TABLE` after creating a table with a TIMESTAMP column to confirm there is no implicit ON UPDATE; and a statistics query that depends on an async Vuex action's data must run only after that action completes.

## Closing Notes

This was a dual PM-and-engineer experience: extremely vague requirements, a large build volume, an extremely tight timeline, and heavy multi-department coordination. The project's value lay not in a single technical breakthrough but in steadily pushing forward through chaos — and in hindsight, looking back at the commits, a few things are worth recording from an engineer's perspective:

**1. Reading heterogeneous legacy code and judging how deep to extend**

The nearly 50 existing-currency reports had each evolved separately with different structures, so each had to be understood before deciding whether the Q-Coin version needed "just a new column" or a full rewrite. For example, the online-members report required understanding the existing game-list filter logic before Q-Coin bet amounts and dedicated-machine player counts could be added without breaking the existing currency; the Q-Coin passbook was built from scratch — a new controller and data model — only after understanding the existing passbook's controller structure.

**2. Debugging environment-specific bugs by reasoning from symptom back to root cause**

Spot the symptom first (wrong report numbers), then trace the root cause (schema behavior), rather than starting from the schema. The free-game purchase report's statistics time was wrong; the INSERT logic and the statistics SQL were suspected first, and only re-checking the schema revealed that legacy MySQL applies `ON UPDATE CURRENT_TIMESTAMP` to the first TIMESTAMP column, overwriting the timestamp on every UPDATE. The existing-currency legacy table never triggered it due to a different version or column order, so there was no precedent.

**3. A four-environment Git branch strategy and release flow**

The project had four main branches for four environments: test → pre-release → release-candidate → production. The actual flow in the two weeks before release:

1. Cut an integration branch off the pre-release environment.
2. Merge all of the release's feature commits into it and resolve conflicts centrally on that branch.
3. Rebase the pre-release branch, then merge the integration branch back into pre-release.
4. Only after verifying the pre-release environment did the changes merge up into production, level by level.

The value of this flow is that conflicts are resolved on the integration branch, keeping pre-release and production clean. With 8+ short-lived branches in parallel, it is hard to keep production safe without it.

**4. Understanding system side effects: a seemingly local change with global impact**

Choosing to "block off" a feature is often backed by a real dependency found during testing, not by cautious instinct. For example, the Q-Coin item card's delete button was blocked off first — during testing, actually deleting a card left the server unable to restart at all (it could not find that item card's definition), a far larger blast radius than expected. There was no way to know without blocking it; only after blocking did deletion's global side effect become clear.

**5. Managing the deploy order of code vs. DB schema**

The DB table was not yet on the test environment, but the code had to enter version control first. If the code read a nonexistent table directly, the test environment would immediately error. The approach was to add a "does the table exist?" guard in the controller so the code could merge first without erroring; the next commit, once the table was built, removed the guard and fully enabled the feature. This code-first / schema-follows deploy strategy avoids environment crashes from hard dependencies.

> [!NOTE]
> This project brought three things that were hard to gain under the previous manager-assigned development model:
> 1. **Practicing user-requirement interviews** — confirming report by report with each department to truly understand how the back-office system is actually used.
> 2. **Hands-on long-lived-branch merging** — a real multi-person, multi-branch scenario, personally handling conflict decoupling between the long-lived branch and many short-lived branches.
> 3. **Practicing scope management** — proactively confirming with departments and trimming 15+ unneeded features, rather than passively accepting every requirement.
