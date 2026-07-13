---
title: Shared-Settings Modularization Refactor
role: Full-Stack Engineer
period: "2025.11 - 2026.04"
tags: [Vue, Refactoring, Architecture]
metrics: "Monolithic Vue file split into 10 files over three passes; main file reduced by 54%"
order: 7
beforeAfter:
  label: "Main-file line count"
  before: 4221
  after: 1963
  unit: "lines"
timeline:
  - date: "2025-11-06"
    label: "Pass 1: extracted virtual-goods trading as a trial, validating that the split pattern works"
  - date: "2026-03-03"
    label: "Pass 2: extracted advanced settings + the first standalone dialog component"
  - date: "2026-03-12"
    label: "Pass 3: extracted game-currency and deposit management"
  - date: "2026-04-24"
    label: "New framework directly reused by the subsequent Q-Coin feature, validating the split strategy"
---

## Background

`game_commonSet.vue` had long been the "junk drawer" for site-wide shared settings — any cross-game setting got stuffed into it, until it ballooned to 4,221 lines. Advanced settings, game-currency and deposit management, and every dialog were all mixed into the same file, so changing any feature meant hunting through 4,000+ lines. The high coupling also caused frequent merge conflicts when multiple people modified it concurrently, and dialog logic embedded in the main file could not be tested or reused independently.

## Scope

Split `game_commonSet.vue` by functional responsibility over three progressive passes into 10 files (4 main modules + 5 dialog components + 1 shared-logic js), with each functional block getting its own route and becoming independently maintainable.

```mermaid
graph TD
  A[game_commonSet.vue 4221 lines] -->|2025-11 Pass 1| B[Virtual-Goods Trading]
  A -->|2026-03 Pass 2| C[Advanced Settings + MSG_LOGIN Dialog]
  A -->|2026-03 Pass 3| D[Game-Currency and Deposit Management]
  B --> E[Standalone Routes]
  C --> E
  D --> E
  E -->|2026-04 Validation| F[Q-Coin Newcomer Mechanism Reuses the Same Framework]
```

## Challenges

The original 4,221 lines were highly coupled — functions, data and computed properties cross-referenced one another, so straight cut-and-paste easily broke things. Dialogs originally accessed the parent's data directly via `this.xxx`; once extracted into standalone components, `this` broke entirely. At first a plain `import` seemed sufficient, but data passing failed completely — revealing that every access had to be converted one by one to props in + emit out. At the same time, existing routes had to stay intact, and splitting everything at once was too risky — the work had to be split, shipped and verified incrementally.

## Contributions

- First extracted "virtual-goods trading" in November 2025 as a proof of concept; only after confirming the split pattern worked did the large-scale extraction of "advanced settings" and "game-currency and deposit management" follow in March 2026.
- Split by functional responsibility rather than code structure — functional boundaries map to real business needs, and permissions can later be granted per feature; splitting by code structure (separating methods/computed) has only engineering meaning and is invisible to the business.
- Established a reusable directory structure and dialog-componentization convention (auditing every `this.xxx` and converting it to props/emit), giving every component later extracted from the main file a clear template to follow.

## Impact

The main file shrank from 4,221 to 1,963 lines (−54%) — a reduction achieved while the business kept expanding, so the bloat actually avoided is even larger. The new framework was directly reused by the Q-Coin newcomer mechanism in April 2026 (adding a dialog no longer requires changing the main file's structure), proving the split strategy correct — a staged milestone in an effort that is still moving forward.
