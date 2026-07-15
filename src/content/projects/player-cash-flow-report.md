---
title: 玩家金流異動統計報表
role: 全端工程師
period: "2026.06 - 2026.07"
tags: [Laravel, MySQL, ClickHouse, 效能優化]
metrics: "20 人批量查詢 4~5 分鐘 → 15~20 秒(QA 實測 3.2×)"
order: 1
beforeAfter:
  label: "批量查詢耗時(QA 實測)"
  before: 5.9
  after: 1.8
  unit: "s"
---

## 背景

風管查詢網咖 Top20 玩家的整月金流,原本要開「帳號存摺」「角色輸贏」「轉帳中心」「信件中心」「會員查詢」五個頁面逐一手查再彙整,20 人至少要 100 次操作;各支 API 主鍵混用 OpenID / GUID / accountId,手查時容易對錯人,且完全無法批量匯出。

## 專案內容

新增玩家金流報表頁,以玩家為主軸整合 5 支資料源,支援單筆查詢、批量查詢(最多 20 筆),以及網咖排行頁「Top20 一鍵匯出」跨頁查詢——點一下自動導頁、自動批量查詢、自動下載當月 CSV。跨頁傳參選用 sessionStorage(而非 Vuex 或塞進 URL query),導頁後仍有效、無需額外 store 設定,並在讀取後立即移除,避免頁面被 keep-alive 重複激活時重跑查詢。

## 專案挑戰

批量查詢正式機序列跑完需要 4~5 分鐘,一開始評估用 `pcntl_fork` 並行化,實測 CLI 下 19.6 倍加速,但部署後才發現正式機 web(PHP-FPM)的執行環境根本不載入 `pcntl` 擴充,`function_exists('pcntl_fork')` 恆回 false,完全沒有加速——這不是 `disable_functions` 能控制的,是 SAPI 層級限制,只能靠「真的觸發一次 HTTP request、看實際 log」才驗證得出來,用 CLI 測試看到的結果會嚴重誤導判斷。

## 個人貢獻

- 單列彙整儲值點數、C 幣、遊戲總輸贏(含各遊戲明細)、轉入轉出合計與明細等多維度資料;後端重用既有輸贏/轉帳邏輯,不重複實作。
- 放棄 `pcntl_fork` 後,把三個 Phase 全部改為批量 IN-clause:會員身份批量查詢(1 次 JOIN 取代 N 次序列查詢)、轉帳批量彙整(2 次 IN-clause 取代 N×4 次)、輸贏批量查詢(統計表 batch + 即時缺口序列 fallback)。
- 排除多個資料正確性坑:儲值明細表的兩個候選主鍵在不同情境下各自會是 null,只有帳號 ID 兩種情境都可靠;CSV 多行欄位被共用匯出工具誤判成「公式強制文字」而被 Excel 截斷,改用標準雙引號跳脫解決;CSV 匯入編碼偵測改成「先試嚴格的 UTF-8,冒出替代字元再退回寬鬆的 Big5」,而不是相反順序。

## 專案結果與影響

查詢 Top20 玩家金流,從「逐頁手查 5 頁 × 20 人 ≈ 100 次操作」變成「點一下,自動下載 CSV」;20 人批量查詢正式機耗時由 4~5 分鐘降至 15~20 秒,QA 環境實測批量化後提速約 3.2 倍(5.9s → 1.8s)。

## 關鍵技術決策與踩坑

**最痛的坑:`pcntl_fork` 在正式機 web 環境是「靜默 no-op」。** CLI 下 `function_exists('pcntl_fork')` 回 true、實測近 19 倍加速,看起來完全可行;但 `pcntl` 擴充在設計上只對 CLI 有效,正式機的 web(PHP-FPM)執行環境啟動時根本不把它放進 function table,`function_exists` 直接回 false。這無法用 `disable_functions` 控制,也騙不過本機測試。唯一可靠的驗證方式是在真實 HTTP 請求裡印一行 log:

```php
// 只有真的用瀏覽器觸發、看伺服器 log,才知道 web 環境到底能不能 fork
Log::info('pcntl_fork available: ' . (function_exists('pcntl_fork') ? 'yes' : 'no'));
```

真正的解法不是並行 fork,而是把「每人一次 DB round-trip」改成三階段 IN-clause 批量查詢——效能瓶頸從來不是 PHP 迴圈次數,而是 DB 往返次數。

**關鍵取捨:IN-clause batch 而非 `curl_multi`。** 也評估過用 `curl_multi` 並行,但輸贏與轉帳都是直接的 DB 呼叫、不是 HTTP 請求,`curl_multi` 只能並行 HTTP,對直接 DB 查詢無效,因此改走 IN-clause 批量。

**其他值得記的坑:**

- **儲值明細表主鍵不可靠:** 一般儲值與系統手動補點兩種情境下,兩個候選主鍵欄位各自會在其中一種情境是 null,只有帳號 ID 在兩種情境都有值,查詢一律以它為準。
- **多行 CSV 欄位被截斷:** 共用匯出工具對含換行的值會自動包成 `="..."` 的 Excel 公式文字,而公式格式不支援儲存格內換行,導致多行明細只剩第一行。改用不帶 `=` 的標準雙引號跳脫即可正確換行。
- **匯入編碼偵測順序:** 必須先用嚴格的 UTF-8 解碼、檢查有無替代字元 `�`,有才退回 Big5——不能反過來,因為寬鬆的編碼解錯時不會報錯、只會靜默輸出亂碼,抓不到。

```js
// 先試嚴格的 UTF-8;非法序列會冒出替代字元,才退回寬鬆的 Big5
let text = new TextDecoder("utf-8").decode(bytes);
if (text.indexOf("�") !== -1) {
  text = new TextDecoder("big5").decode(bytes);
}
```
