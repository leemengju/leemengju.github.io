---
title: Back-Office Permission Multi-Select Revamp
role: Full-Stack Engineer
period: "2026.03"
tags: [Laravel, MySQL, Database Schema Design]
metrics: "Single role → unlimited multi-role combinations; zero-downtime hot upgrade"
order: 9
---

## Background

In the legacy system, each back-office account could hold only one role. Composite needs (e.g., a combined planner + numbers + team-lead permission set) forced the creation of one-off roles, accumulating large numbers of redundant roles over time — people in the same position but with different feature combinations either shared one role with overly broad permissions, or incurred very high management cost when managed separately. Meanwhile, "all permissions" (groupNum=0) could not be mixed with other roles, leaving its boundary behavior ill-defined.

## Scope

Added a junction table letting one account bind multiple roles; the back end merges each role's rule string and sends the whole set to the front end, which switched to checkbox multi-select. The existing `DG` column was kept for backward compatibility, leaving the current login and permission-verification flow untouched.

## Challenges

Merging rule strings required hand-parsing the format (a character-level union over `key_suffix`), with no shortage of edge cases — especially the "all permissions" value groupNum=0, which is easily hit by friendly fire in PHP truthy checks:

```php
// Pitfall: 0 > 0 is false, so "all permissions" (groupNum=0) gets filtered out entirely
$groups = array_filter($input, fn($g) => $g > 0);

// Fix: check for null/empty string instead, letting the legitimate 0 through
$groups = array_filter($input, fn($g) => $g !== null && $g !== '');
```

The same trap surfaced in the merged output: for "all permissions", `permission_group.rule` stores `"all"` (no underscore), but the merge algorithm, parsing by the `key_suffix` format, reassembles it into `"all_"`; front-end validation expects `"all"` and fails, requiring an extra special-case branch.

## Contributions

- Created the `administrator_permission_groups` junction table (`sn`, `account`, `groupNum`, `unique(sn, groupNum)`) and implemented the `mergePermissions()` algorithm, merging multiple roles' rule strings key by key via a character-level suffix union.
- Migrated every account's existing `DG` value into the new table in one pass via a Seeder — a zero-downtime upgrade with legacy data fully preserved; the `DG` column keeps being written in sync (taking the first of the selected groups), so existing code that reads `DG` upgrades seamlessly.
- Added interception logic to the front-end multi-select UI: "all permissions" can only be selected alone — once chosen, no other group can be added.

## Impact

Accounts upgraded from mapping to a single role to unlimited multi-role combinations; composite needs no longer require creating new roles, and the front end no longer parses the rule format itself — it consumes the back end's pre-merged `ruleMerged` directly.

## Key Technical Decisions & Pitfalls

### The most painful pitfall: one `0` cost us hours

"All permissions" is not "unassigned" in this system — it is a real, meaningful value whose role-group number happens to be `0`. Early in the revamp, setting all-permissions simply would not persist: checking it did nothing. The first instinct was to look at the front end — was the checkbox failing to send the value? Only after adding logs did it become clear the value *was* reaching the back end, which was silently swallowing it.

The root cause was the `$g > 0` filter above: `0 > 0` is false, so the legitimate "all permissions" value was discarded as noise. The fix was merely changing the guard from "greater than 0" to "not null and not empty string" — but the lesson outlives the fix: **in PHP's `array_filter`, `0` is falsy; for any field where `0` carries business meaning, guard by null/empty rather than by a magnitude comparison.**

A second pitfall followed: the all-permissions rule string is itself `"all"` (no underscore), but the `key_suffix` merge algorithm dutifully splits it into a key plus an empty suffix and reassembles it as `"all_"`, which front-end validation rejects because it expects `"all"`. The fix special-cases the merged result, restoring `"all_"` back to `"all"`. Same lesson: **when a string-format algorithm meets a special value that doesn't follow the format, special-case it rather than forcing the general logic on it.**

### Key trade-offs

| Decision | Choice made | Rejected alternative | Rationale |
|----------|-------------|----------------------|-----------|
| Migrating legacy accounts | One-time Seeder migration | Lazy-init on first read | A Seeder lets you verify data integrity right after deploy; lazy-init carries a "first read is stale" race |
| Fate of the legacy role column (DG) | Kept and kept in sync | Rip it out, switch everything to the new table | Many code paths read DG directly; ripping it out has too large a blast radius. Keeping it synced means existing read paths change nothing and upgrade transparently |
| Where permissions are merged | Server-side | Front-end parsing | Front-end rule parsing carried legacy baggage and was hard to maintain; a single server-side merged output is cleaner, and the front end just consumes it |

The common thread across all three: **trade "rewrite + big change" for "compatibility + sync"**, keeping the seam between old and new systems as small as possible — which is what makes the zero-downtime hot upgrade achievable.
