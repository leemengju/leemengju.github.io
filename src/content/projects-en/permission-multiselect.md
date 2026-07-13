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
