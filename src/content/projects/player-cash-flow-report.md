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

新增玩家金流報表頁,以玩家為主軸整合 5 支資料源,支援單筆查詢、批量查詢(最多 20 筆),以及網咖排行頁「Top20 一鍵匯出」跨頁查詢——點一下自動導頁、自動批量查詢、自動下載當月 CSV。

## 專案挑戰

批量查詢正式機序列跑完需要 4~5 分鐘,一開始評估用 `pcntl_fork` 並行化,實測 CLI 下 19.6 倍加速,但部署後才發現正式機 PHP-FPM 的 web SAPI 完全不載入 `pcntl` 擴充,`function_exists('pcntl_fork')` 恆回 false,完全沒有加速——這不是 `disable_functions` 能控制的,是 SAPI 層級限制,只能用「真的觸發一次 HTTP request」才驗證得出來,CLI 測試看到的結果會誤導判斷。

## 個人貢獻

- 單列彙整儲值點數、C 幣、遊戲總輸贏(含各遊戲明細)、轉入轉出合計與明細等多維度資料。
- 放棄 `pcntl_fork` 後,把三個 Phase 全部改為批量 IN-clause:`get_members_batch`(1 次 JOIN 取代 N 次序列查詢)、`buildTransferBatch`(2 次 IN-clause 取代 N×4 次)、`buildWinOrLoseBatch`(統計表 batch + 即時缺口序列 fallback)。
- 排除多個資料正確性坑:`cash_point_log` 的 `playerId`/`openId` 欄位在不同情境下會是 null,只有 `accountId` 兩種情境都可靠;CSV 多行欄位被共用匯出工具誤判成「公式強制文字」而被 Excel 截斷,改用標準雙引號跳脫解決;CSV 匯入編碼偵測改成「先試嚴格的 UTF-8,冒出替代字元再退回寬鬆的 Big5」,而不是相反順序。

## 專案結果與影響

查詢 Top20 玩家金流,從「逐頁手查 5 頁 × 20 人 ≈ 100 次操作」變成「點一下,自動下載 CSV」;20 人批量查詢正式機耗時由 4~5 分鐘降至 15~20 秒,QA 環境實測批量化後提速約 3.2 倍(5.9s → 1.8s)。
