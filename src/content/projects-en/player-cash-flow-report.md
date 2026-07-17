---
title: Player Cash-Flow Report
role: Full-Stack Engineer
period: "2026.06 - 2026.07"
tags: [Laravel, MySQL, ClickHouse, Performance]
metrics: "20-player batch query 4–5 min → 15–20 s (QA-measured 3.2×)"
order: 1
categories: [db-performance, data-automation]
beforeAfter:
  label: "Batch query time (QA-measured)"
  before: 5.9
  after: 1.8
  unit: "s"
---

## Background

> [!IMPORTANT]
> **Core pain point: risk-control needs a net-café's top-20 players' full-month cash flow, but the data is scattered across 5 pages in inconsistent formats.**

- **Tedious lookup steps**: every player required opening five pages — account passbook, character win/loss, transfer center, mail center, and member lookup — each queried and consolidated by hand.
- **Top-20 = at least 20 rounds of manual work**: the net-café ranking lists 20 players at a time, each needing at least 5 pages, making the manual cost for risk-control extremely high.
- **Inconsistent field definitions**: the APIs mixed OpenID / GUID / accountId as primary keys, making it easy to match the wrong player.
- **No batch export**: none of the existing pages supported exporting multiple players to CSV at once.

## Objective

Build a player-centric cash-flow report page that integrates several data sources, supporting single lookups, batch queries (up to 20 players), and a cross-page "Top-20 one-click export" from the net-café ranking page; every result downloads as one CSV.

## Highlights

1. **One row consolidates 5 dimensions**: OpenID, GUID, character name, deposit points, C-coin obtained after deposit conversion, total game win/loss (with per-game detail), transfer-in total and detail, and transfer-out total and detail — all on the same page in the same row.
2. **Batch query**: paste or import a list of GUIDs / character names (up to 20), query all players at once, and produce a multi-row CSV.
3. **Net-café Top-20 one-click export**: click the button on the ranking page → pass parameters via sessionStorage → auto-navigate → auto batch query → auto-download last month's CSV; fully hands-off.
4. **Backend reuses existing logic**: win/loss consolidation calls the existing game win/loss Controller and transfer consolidation calls the existing transfer-query logic, with no reimplementation.
5. **Multi-line CSV cells don't get truncated**: per-game detail and transfer-in/out detail are joined with `\n` and escaped with standard double quotes (not the `="..."` Excel-formula format), so cells render line breaks correctly in Excel.
6. **Batch-query performance tuning (all three phases batched)**: after `pcntl_fork` proved useless under the production web SAPI (see Pitfall 2), all three phases moved to batched IN-clause queries: Phase 1 batched member lookup (1 JOIN), Phase 2.5 batched transfer summary (2 IN-clause queries replacing N×4), Phase 3 batched win/loss (statistics-table batch + sequential fallback for real-time gaps). A 20-player batch on production dropped from 4–5 minutes to **15–20 seconds**.

## Quantified Results

| Metric | Before | After |
|------|--------|--------|
| Look up top-20 players' cash flow | 5 pages × 20 players ≈ 100 manual operations | 1 click, CSV downloads after a short wait |
| Batch cap | none (single lookup only) | 20 on the frontend, 100 backend safety valve |
| Data-source integration | 5 scattered pages | 1 CSV, 1 row = 1 player |
| 20-player batch time (production) | sequential foreach: **4–5 min** | three-phase batch: **15–20 s** (production) / **1.8 s** (QA) |

> [!NOTE]
> Measurement basis: the adopted IN-clause batch approach measured QA sequential 5.9s → batch 1.8s (**3.2×**). Evidence for the rejected `pcntl_fork` approach: 20 players × 3 DB queries, ≈ 10,500ms I/O per player, ~210,000ms sequential vs ~10,700ms forked; but the production web SAPI cannot fork, so it was not adopted (see Pitfall 2).

## Solution & Architecture

### Frontend (Vue 2)

| Component | Responsibility |
|------|------|
| Cash-flow report main page | `activated()` reads sessionStorage for cross-page triggering, consolidation, and CSV export |
| Batch-query dialog | holds type / text state, CSV parsing, 20-item cap UI |

**Single-lookup flow:**

1. Look up member identity (Type=2 GUID / Type=3 character name) → obtain GUID, OpenID, and account ID (accountId).
2. `Promise.all` in parallel: deposit summary / game win-loss / transfer summary.

**Cross-page trigger (net-café ranking page → cash-flow report page):**

```mermaid
flowchart LR
    A["Net-café ranking page<br/>click Top-20 export"] -->|"write sessionStorage<br/>type / list / time range"| B["route navigation"]
    B --> C["report page activated()<br/>removeItem immediately"]
    C --> D["auto batch query"]
    D -->|"$nextTick"| E["auto-download CSV"]
```

- The ranking page writes `{type, list, startTime, endTime}` to sessionStorage, then navigates.
- On read, the report page's `activated()` **removes the item immediately** (to prevent a keep-alive re-activation from re-triggering), runs the batch query, and calls export automatically on `$nextTick`.

### Backend (Laravel)

| Component | Responsibility |
|------|------|
| Cash-flow report Controller | deposit summary, transfer summary, and batch summary endpoints |
| Recharge-log Model | queries the recharge-log table (monthly partition), WHERE account ID (populated for both recharges and system manual top-ups) |
| Money-change Model | queries the cash-flow detail table (daily partition), WHERE player ID (= GUID) |

**Batch processing** (`pcntl_fork` removed, everything now batched IN-clause):

- **Phase 1 batched member lookup**: 1 "account table JOIN player table WHERE name / guid IN (...)" replaces N sequential queries.
- **Phase 2 ClickHouse**: `curl_multi` sends every player's deposit-points and coin-exchange SQL in parallel batches.
- **Phase 2.5 batched transfer summary**: 2 IN-clause queries (transfer-record table + system-letter table) replace N×4 sequential queries.
- **Phase 3 batched win/loss**: statistics-table 2× IN-clause batch + sequential fallback for the real-time gap.
- `set_time_limit(480)` / `ini_set('max_execution_time','480')`.
- After trimming and de-duplication, a 100-item backend safety valve; the frontend dialog caps at 20 (button disabled + text turns red).

**Win/loss statistics schedule:**

- Statistics run at :40 each hour over the **previous hour** (a 14:40 run tallies 13:xx).
- The real-time gap = from the last tallied hour's :59:59 to now, at most about **1h40m**.
- Batch segmentation logic: query the statistics table once for the last tallied time to get the statistics boundary; within the boundary → batch IN-clause; the gap beyond it → sequential top-up (only the gap segment, without re-tallying the statistics table); for last-month data the gap is null, so it's pure batch.

**Transfer merge**: sum amounts by the counterparty's GUID (falling back to character name) and filter out incomplete transfers.

## Most Painful Pitfalls

### Pitfall 1: sequential batch query too slow

**Symptom**: a 20-player batch over last month's data took **4–5 minutes** with the backend's sequential `foreach`.

**Root cause**: each player runs multiple DB queries (transfer + winOrLose + deposit), ~10–15s/player on production; 20 players sequentially totals 200–300s. PHP is single-process, so `foreach` can only run one player after another.

**Misjudgment 1**: assuming `set_time_limit(480)` was enough by solving the timeout — but the timeout only lets it "finish"; the wait was still unacceptable.

**Misjudgment 2**: assuming `pcntl_fork` could parallelize it → in reality the production PHP-FPM web SAPI cannot fork (see Pitfall 2); after deploy the log showed `fork=no` with no speed-up.

**The real fix**: turn "each of N players queries transfer separately" into 1 IN-clause batch query (2 DB calls instead of N×4), combined with the ClickHouse-mode win/loss query (~250ms/player × 20 ≈ 5s), bringing total time down to **15–20 seconds**. Truly parallelizing in the future would require Laravel Queue + job dispatch or the `parallel` extension, not `pcntl_fork`.

### Pitfall 2: pcntl_fork is completely inert under the production web runtime

**Symptom**: added a `pcntl_fork` fan-out; after deploy the log showed `fork=no`, it fell entirely to the sequential fallback, and there was no speed-up.

**Root cause**: by design the `pcntl` extension is CLI-SAPI-only. PHP-FPM never puts pcntl into the function table at startup, so `function_exists('pcntl_fork')` returns false. This is not something `disable_functions` controls — it is a SAPI-level restriction.

**Why it looked viable**:

| Test | Result | Problem |
|---|---|---|
| `php -r "var_dump(function_exists('pcntl_fork'));"` | `bool(true)` | this is CLI SAPI, not FPM |
| checking that `disable_functions` is empty | looks un-disabled | disable_functions can't block a function that was never loaded |

**The reliable check**: log a line inside the controller and fire a real HTTP request — you cannot test this from CLI:

```php
Log::info('pcntl=' . (function_exists('pcntl_fork') ? 'yes' : 'no'));
```

### Pitfall 3: `parameters() on null` crash (manually built Request)

**Symptom**: when the backend calls the existing game win/loss Controller with a manually built `new Request()`, `isset($req['player'])` triggers `Request::offsetExists()` → `$this->route()->parameters()`, but a hand-built Request has no route resolver, so `route()` returns null → fatal error.

**Misjudgment**: assumed it was a `$req->merge()` key issue and adjusted the merge order and key names; the problem persisted.

**Root cause**: `offsetExists()` calls `route()->parameters()`, and a manual `new Request()` has no `routeResolver`, so `route()` is null.

**Fix**: when manually building a Laravel Request object, if downstream code reads values via `isset($req['key'])`, you must supply a route resolver:

```php
$req->setRouteResolver(function () {
    return new class {
        public function parameters() { return []; }
    };
});
```

### Pitfall 4: the recharge-log table returns empty when keyed by player ID

**Symptom**: some players' "deposit points" kept returning 0 even though the backend account passbook clearly had data.

**Root cause**: the recharge-log table's player-ID column is not recorded (null) for ordinary recharges; OpenID is null for system manual top-ups; only the account-ID (accountId) column is populated in both scenarios.

**Misjudgment path**: the first revision switched to OpenID, found that system manual top-up data still couldn't be found, and only then confirmed it had to key off account ID.

**Fix**: the deposit-points sum keys off account ID in its WHERE clause, with account ID taken from the member-lookup API.

### Pitfall 5: the shared `toCsvCell` auto-wraps multi-line values as `="..."`, which Excel truncates

**Symptom**: after CSV export, the "per-game win/loss detail" cell showed only its first line in Excel; the rest was truncated.

**Root cause**: the shared `toCsvCell()` normally escapes with standard double quotes `"..."` (a dozen-plus reports rely on it, and it's fine as-is). But it has a `needForceText` check `/[,\r\n]/.test(str)` — **any value containing a newline `\n` is classified as needing forced text and wrapped in the `="..."` Excel-formula format**. That `="..."` formula doesn't support in-cell line breaks, so multi-line content collapses to its first line. The very trait of "being multi-line" triggered the truncation branch.

**Background: what each `needForceText` rule was originally guarding against** (all guarding against Excel over-interpreting / structurally breaking CSV):

| Rule | Problem it prevents |
|---|---|
| `/^\d+:\d+$/` (digit:digit) | Excel parses `1:100` (odds) as **time** |
| `/^0\d+/` (leading 0) | Excel **eats the leading 0** (phone `0912…`→`912…`) |
| `/^\d{11,}$/` (long number) | Excel converts to **scientific notation** (order no.→`1.23E+13`) |
| `/^=/` (leading =) | Excel evaluates it as a **formula** (`=1+1`→`2`) |
| `/[,\r\n]/` (comma, newline) | CSV **structural chars**: comma = field separator, newline = row separator; unquoted, they split fields / rows |

**Fix**: this page's multi-line cells bypass the shared `toCsvCell` and use a custom `csvCell()` that only does standard double-quote escaping (`"..."` wrapping, doubling inner `"`, no `=`), so `\n` inside the quotes is correctly recognized by Excel as an in-cell line break. The shared utility is left untouched, since doing so requires confirming the other dozen-plus reports don't depend on the `="..."` forced-text effect. Plain values are safe to hand to `toCsvCell`, but any cell that may contain `\n` (multi-line detail) must use the `=`-free standard escape.

### Pitfall 6: try/catch-based CSV-import encoding detection fails — Big5 doesn't throw on garbage

**Symptom**: importing a Big5-encoded character list worked, but importing a UTF-8 CSV turned all the Chinese character names into garbage.

**Misjudgment**: the old code wrote `try { TextDecoder('big5') } catch { TextDecoder('utf-8') }`, assuming a "try Big5 first, auto-fall-back to UTF-8 on failure" smart fallback. In reality that catch almost never fires.

**Root cause**: `TextDecoder('big5').decode()` **does not throw** on bytes it can't read — it silently emits the replacement character `�` (U+FFFD). The catch only fires when "the browser doesn't support the Big5 decoder at all," and mainstream browsers do → the catch never fires → it always force-decodes everything as Big5, so UTF-8 multi-byte Chinese gets misread as Big5 and comes out garbled.

**The key asymmetry**:

| Decoder | Correct decode | Wrong decode |
|---|---|---|
| UTF-8 | fine | surfaces `�` (strict byte rules; illegal sequence → replacement char, detectable) |
| Big5 | fine | silently garbled, **no `�`** (almost any byte can be forced into a character) |

Only the "strict" UTF-8 decoder honestly surfaces `�` when it decodes wrong, so the detection order must be "UTF-8 first."

**Fix**: reverse it — decode UTF-8 first, check for `�`, and only switch to Big5 if present:

```js
text = new TextDecoder("utf-8").decode(bytes);
if (text.indexOf("�") !== -1) {          // not valid UTF-8
  text = new TextDecoder("big5").decode(bytes);
}
```

Verified correct for all three sources: UTF-8, UTF-8+BOM (BOM stripped automatically), and Big5. Text-encoding detection can't rely on `try/catch` (most decoders don't throw); it has to rely on "whether the decoded content is sensible": try the strict encoding (UTF-8) first, fall back to the lenient one (Big5) when `�` appears — never the reverse, because a lenient encoding fails silently and gives you nothing to catch.

## Key Trade-offs

### Trade-off 1: passbook totals go through a new backend Controller, everything else uses existing APIs

**Choice**: deposit consolidation is summed in a new backend endpoint; win/loss and transfers still call existing APIs.

**Rejected option**: have the frontend call all the raw APIs directly.

**Reason for rejection**: the existing recharge-record API's return value and data structure are overly complex, costly and error-prone to handle on the frontend; simplifying it, the redesigned deposit-summary endpoint returns just two summed values — a clean structure that the batch query can reuse via the same model method.

### Trade-off 2: IN-clause batching rather than pcntl_fork / curl_multi

**Problem**: processing 20 players sequentially over last month's data measured **~210 seconds (3m30s)**, an unacceptable wait.

**Rejected option A (curl_multi)**: win/loss and transfers are direct PHP/DB calls, not HTTP requests; `curl_multi` can only parallelize HTTP, not DB calls.

**Rejected option B (pcntl_fork)**: measured ~10.7s under CLI (19.6×), but the production PHP-FPM web SAPI never loads pcntl, so `function_exists('pcntl_fork')` returns false and after deploy the log shows `fork=no` — entirely inert (see Pitfall 2).

**Current approach**: all three phases batched IN-clause — member lookup (1 JOIN), transfers (2 IN-clause replacing N×4), win/loss (statistics-table batch + gap fallback); **15–20s** on production, **1.8s** measured on QA (3.2×).

### Trade-off 3: cross-page parameters via sessionStorage, not Vuex / query params

**Choice**: `sessionStorage`.

**Rejected option A (Vuex)**: requires store wiring, and the existing project's Vuex may not have a matching module.

**Rejected option B (query params)**: stuffing 20 GUIDs into the URL pollutes the address bar and risks length limits.

**Reason for rejection**: sessionStorage needs no extra store wiring, survives navigation, and makes a one-shot removal a simple way to prevent re-triggering.

## Engineering Principle

> [!TIP]
> **Drive down the number of DB round-trips; loop freely in the PHP layer.** A for-loop is essentially free; what's slow is firing a DB request every iteration. When you see a performance problem, count DB queries first, not loop iterations. A for-loop only needs batching when "every iteration fires a DB request"; pure PHP array loops don't need touching.

## Notes

- **Older PHP version constraints**: no arrow functions `fn =>`, no typed properties, no `??=`; anonymous classes must be written out in full (the Pitfall 3 `setRouteResolver` fix uses this).
- **Monthly / daily partition tables**: the recharge-log table partitions by year-month and the cash-flow detail table by day; each must confirm the table exists before querying (`hasTable` / `SHOW TABLES LIKE`).
- **Vue 2 multi-line cells**: slots need the `slot` + `slot-scope` attribute syntax (not `v-slot` / `#`), and multi-line divs need special newline handling on CSV export.
- **CSV-import encoding auto-detection**: decode UTF-8 first, then switch to Big5 if `�` is detected (see Pitfall 6).

## Appendix

### API Reference

| Function | Primary key | Notes |
|------|------|------|
| Player identity lookup | GUID or character name | obtains GUID, accountId, OpenID |
| Deposit points + C-coin | GUID + accountId | new backend, queries recharge-log table + cash-flow detail table |
| Batch consolidation | GUID list | three-phase batch, 8-minute timeout |
| Game win/loss | GUID | coinType=GOLD |
| Transfer (out) | GUID | PlayerType=senderID |
| Transfer (in) | GUID | PlayerType=targetID |

### Key Field Notes (recharge-log table)

| Column | Ordinary recharge | System manual top-up | Conclusion |
|------|--------|-----------|------|
| Player ID | null | populated | **unreliable** |
| OpenID | populated | null | **unreliable** |
| Account ID (accountId) | populated | populated | **the only reliable one** |

### File Structure

- Backend: cash-flow report Controller + two Models (recharge-log, cash-flow detail).
- Frontend: cash-flow report main page + batch-query dialog + net-café ranking page (the entry point that triggers the cross-page export).
- Spec: the openspec change's design / tasks documents.
