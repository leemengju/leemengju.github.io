---
title: 玩家金流異動統計報表
role: 全端工程師
period: "2026.06 - 2026.07"
tags: [Laravel, MySQL, ClickHouse, 效能優化]
metrics: "20 人批量查詢 4~5 分鐘 → 15~20 秒(QA 實測 3.2×)"
order: 1
categories: [db-performance, data-automation]
beforeAfter:
  label: "批量查詢耗時(QA 實測)"
  before: 5.9
  after: 1.8
  unit: "s"
---

## 背景

> [!IMPORTANT]
> **核心痛點:風管要查網咖 Top20 玩家的整月金流,但資料分散在 5 個頁面,且格式不一。**

- **查詢步驟繁瑣**:每位玩家都要開「帳號存摺」「角色輸贏」「轉帳中心」「信件中心」「會員查詢」五個頁面,各自手查再彙整。
- **Top20 = 至少 20 輪手工操作**:網咖排行榜一次要查 20 位玩家,每人至少 5 個頁面,風管人工成本極高。
- **資料欄位定義不一致**:各支 API 主鍵混用 OpenID / GUID / accountId,手查時容易對錯人。
- **無法批量匯出**:現有頁面皆不支援多玩家一次 CSV 匯出。

## 目標

新增一支以玩家為主軸的金流報表頁,整合多支資料源,支援單筆查詢、批量查詢(最多 20 筆),以及網咖排行頁「Top20 一鍵匯出」跨頁查詢;所有結果可一次下載 CSV。

## 成果亮點

1. **單列彙整 5 個維度**:OpenID、GUID、角色名稱、儲值點數、儲值兌換後獲得的 C 幣、遊戲總輸贏(含各遊戲明細)、轉入合計與明細、轉出合計與明細,全在同一頁同一列。
2. **批量查詢**:貼上或匯入 GUID / 角色名稱清單(最多 20 筆),一次查詢所有玩家並產出多列 CSV。
3. **網咖 Top20 一鍵匯出**:排行頁點擊按鈕 → sessionStorage 傳參 → 自動導頁 → 自動批量查詢 → 自動下載上月 CSV;全程無需手動操作。
4. **後端重用既有邏輯**:輸贏彙整直接呼叫既有的遊戲輸贏 Controller,轉帳彙整直接呼叫既有的轉帳查詢邏輯,不重複實作。
5. **多行欄位 CSV 不截斷**:遊戲明細、轉入/轉出明細以 `\n` 串接後用標準雙引號跳脫(非 `="..."` Excel 公式格式),Excel 開啟後儲存格內可正常換行顯示。
6. **批量查詢效能優化(三個 Phase 全部 batch 化)**:`pcntl_fork` 在正式機 web SAPI 無效後(詳見最痛的坑 2),三個 Phase 改為批量 IN-clause:Phase 1 會員身份批量查詢(1 次 JOIN)、Phase 2.5 轉帳批量彙整(2 次 IN-clause 取代 N×4 次)、Phase 3 輸贏批量查詢(統計表 batch + 即時缺口序列 fallback)。正式機 20 人批量從 4~5 分鐘降至 **15~20 秒**。

## 量化成效

| 指標 | 改善前 | 改善後 |
|------|--------|--------|
| 查 Top20 玩家金流 | 手查 5 頁 × 20 人 ≈ 100 次操作 | 點 1 下,等待後自動下載 CSV |
| 批量上限 | 無(只能單筆) | 前端 20 筆、後端安全閥 100 筆 |
| 資料源整合 | 5 個分散頁面 | 1 份 CSV,1 列 = 1 位玩家 |
| 20 人批量查詢耗時(正式機) | 序列 foreach:**4~5 分鐘** | 三 Phase batch:**15~20 秒**(正式機)/ **1.8 秒**(QA) |

> [!NOTE]
> 實測依據:最終採用的 IN-clause batch 方案,QA 環境序列 5.9s → batch 1.8s(**3.2×**)。早期否決的 `pcntl_fork` 方案佐證:20 人 × 3 支 DB 查詢,每人 I/O ≈ 10,500ms,序列環境約 210,000ms、fork 環境約 10,700ms;但正式機 web SAPI 無法 fork,未採用(詳見坑 2)。

## 解法與架構

### 前端(Vue 2)

| 元件 | 職責 |
|------|------|
| 金流報表主頁 | `activated()` 讀取 sessionStorage 跨頁觸發、資料彙整與 CSV 匯出 |
| 批量查詢對話框 | 持有 type / text 狀態、CSV 解析、20 筆上限 UI |

**單筆查詢流程**:

1. 查會員身份(Type=2 GUID / Type=3 角色名稱)→ 取得 GUID、OpenID、帳號 ID(accountId)
2. `Promise.all` 並行:儲值彙整 / 遊戲輸贏 / 轉帳彙整

**跨頁觸發(網咖排行頁 → 金流報表頁)**:

```mermaid
flowchart LR
    A["網咖排行頁<br/>點 Top20 匯出"] -->|"寫入 sessionStorage<br/>type / list / 起訖時間"| B["路由導頁"]
    B --> C["報表頁 activated()<br/>立即 removeItem 防重複"]
    C --> D["自動批量查詢"]
    D -->|"$nextTick"| E["自動下載 CSV"]
```

- 排行頁把 `{type, list, startTime, endTime}` 寫入 sessionStorage 後路由導頁。
- 報表頁 `activated()` 讀到後**立即移除**(防止 keep-alive 重激時重複觸發),再執行批量查詢,完成後 `$nextTick` 自動觸發匯出。

### 後端(Laravel)

| 元件 | 職責 |
|------|------|
| 金流報表 Controller | 儲值彙整、轉帳彙整、批量彙整三支端點 |
| 儲值明細 Model | 查儲值明細表(月分表),WHERE 帳號 ID(儲值與系統手動補點都有值) |
| 金流異動 Model | 查金流明細表(日分表),WHERE 玩家 ID(= GUID) |

**批量處理**(已移除 `pcntl_fork`,改為全 batch IN-clause):

- **Phase 1 會員身份批量**:1 次「帳號表 JOIN 角色表 WHERE name / guid IN (...)」取代 N 次序列查詢。
- **Phase 2 ClickHouse**:`curl_multi` 批次並行送出所有玩家的儲值點數與兌幣 SQL。
- **Phase 2.5 轉帳批量彙整**:2 次 IN-clause(轉帳紀錄表 + 系統信件表)取代 N×4 次序列查詢。
- **Phase 3 輸贏批量查詢**:統計表 2 次 IN-clause batch + 即時缺口序列 fallback。
- `set_time_limit(480)` / `ini_set('max_execution_time','480')`。
- 去空白、去重後後端安全閥 100 筆;前端 dialog 限制 20 筆(按鈕 disabled + 字色變紅)。

**輸贏統計排程**:

- 每小時 :40 分統計**上一小時**資料(14:40 跑 → 統計 13:xx)。
- 即時缺口 = 最後統計小時的 :59:59 到現在,最大約 **1h40m**。
- 批量查詢分段邏輯:先查統計表取得最後統計時間,得到統計邊界;邊界內 → batch IN-clause;邊界後的缺口 → 序列補算(只補缺口段,不重算統計表);查上個月資料時缺口為 null,純 batch。

**轉帳合併**:依對方 GUID(無則角色名稱)合併加總金額,並篩掉未完成的轉帳。

## 最痛的坑

### 坑 1:批量查詢序列太慢

**症狀**:20 人批量查詢上個月資料,後端序列 `foreach` 跑完需要 **4~5 分鐘**。

**根因**:每位玩家需跑多支 DB 查詢(transfer + winOrLose + deposit),正式機約 10~15s / 人;20 人序列合計 200~300 秒。PHP 是單程序,`foreach` 只能等一人跑完再跑下一人。

**誤判 1**:以為 `set_time_limit(480)` 解決 timeout 就夠了,但 timeout 只是讓它「跑完」,等待體驗依然無法接受。

**誤判 2**:以為 `pcntl_fork` 可以並行化 → 實際上正式機 PHP-FPM web SAPI 無法 fork(見坑 2),部署後 log 顯示 `fork=no`,並沒有加速。

**真正的解法**:把 N 人各自查 transfer 改成 1 次 IN-clause 批量查詢(2 次 DB 代替 N×4 次),配合 ClickHouse 模式的輸贏查詢(約 250ms / 人 × 20 ≈ 5s),總耗時降至 **15~20 秒**。若未來想真正並行化,需改用 Laravel Queue + job dispatch 或 `parallel` 擴充,而不是 `pcntl_fork`。

### 坑 2:pcntl_fork 在正式機 web 環境完全無效

**症狀**:加了 `pcntl_fork` fan-out,部署後 log 顯示 `fork=no`,完全走序列 fallback,毫無加速。

**根因**:`pcntl` 擴充在 PHP 設計上只對 CLI SAPI 有效。PHP-FPM 啟動時根本不把 pcntl 放進 function table,`function_exists('pcntl_fork')` 直接回傳 false。這不是 `disable_functions` 能控制的,是 SAPI 層級的限制。

**為什麼會誤判可行**:

| 測試 | 結果 | 問題 |
|---|---|---|
| `php -r "var_dump(function_exists('pcntl_fork'));"` | `bool(true)` | 這是 CLI SAPI,不是 FPM |
| 檢查 `disable_functions` 為空 | 看起來沒禁用 | disable_functions 擋不到本來就沒載入的函式 |

**正確驗證方式**:在 controller 裡加一行 log 並觸發真實 HTTP request,不能用 CLI 測:

```php
Log::info('pcntl=' . (function_exists('pcntl_fork') ? 'yes' : 'no'));
```

### 坑 3:`parameters() on null` crash(手動建立 Request)

**症狀**:在後端呼叫既有的遊戲輸贏 Controller 時用 `new Request()` 手動建立請求,`isset($req['player'])` 觸發 `Request::offsetExists()` → `$this->route()->parameters()`,但手動建立的 Request 無路由解析器,`route()` 回 null → fatal error。

**誤判**:以為是 `$req->merge()` 的鍵值問題,調整了 merge 順序和鍵名,問題依舊。

**根因**:`offsetExists()` 會呼叫 `route()->parameters()`,手動 `new Request()` 沒有 `routeResolver`,所以 `route()` 是 null。

**解法**:Laravel 手動建立 Request 物件時,若後續程式碼用 `isset($req['key'])` 取值,必須補上路由解析器:

```php
$req->setRouteResolver(function () {
    return new class {
        public function parameters() { return []; }
    };
});
```

### 坑 4:儲值明細表用玩家 ID 查到空值

**症狀**:某些玩家的「儲值點數」一直回 0,但後台帳號存摺明明有資料。

**根因**:儲值明細表的玩家 ID 欄位在一般儲值時不記錄、為 null;系統手動補點時 OpenID 為 null;只有帳號 ID(accountId)欄位在兩種情境都有值。

**誤判過程**:第一版改用 OpenID,發現系統手動補點的資料仍查不到,才確認要改用帳號 ID。

**解法**:儲值點數加總改以帳號 ID 為 WHERE 條件,帳號 ID 從會員查詢 API 取得。

### 坑 5:共用 `toCsvCell` 遇多行值自動套 `="..."`,被 Excel 截斷

**症狀**:CSV 匯出後,「遊戲明細輸贏」欄位在 Excel 只顯示第一行,其餘被截斷。

**根因**:共用工具的 `toCsvCell()` 平常用標準雙引號跳脫 `"..."`(十多個報表都靠它,本身沒問題)。但它有個 `needForceText` 判斷 `/[,\r\n]/.test(str)` —— **含換行 `\n` 的值會被歸類成需強制文字,套上 `="..."` Excel 公式格式**。而 `="..."` 公式不支援儲存格內換行,於是多行內容只剩第一行。等於「多行」這個特徵本身觸發了截斷分支。

**背景:`needForceText` 各條原本在防什麼**(都是防 Excel 開 CSV 時自作聰明轉型 / 破壞結構):

| 判斷 | 防的問題 |
|---|---|
| `/^\d+:\d+$/`(數字:數字) | Excel 把 `1:100`(賠率)當**時間**解析 |
| `/^0\d+/`(開頭 0) | Excel **吃掉前導 0**(電話 `0912…`→`912…`) |
| `/^\d{11,}$/`(長數字) | Excel 轉**科學記號**(訂單號→`1.23E+13`) |
| `/^=/`(等號開頭) | Excel 當**公式**求值(`=1+1`→`2`) |
| `/[,\r\n]/`(逗號、換行) | CSV **結構字元**:逗號=欄位分隔、換行=列分隔,不包起來會拆散欄位 / 列 |

**解法**:本頁多行欄位不走共用 `toCsvCell`,自訂 `csvCell()` 只做標準雙引號跳脫(`"..."` 包裹、內部 `"` 加倍、不加 `=`),`\n` 在雙引號內被 Excel 正確識別為儲存格內換行。不動共用工具,因為要同時確認其餘十多個報表沒有依賴 `="..."` 的強制文字效果。純值可以放心交給 `toCsvCell`,但欄位可能含 `\n`(多行明細)時必須改用不帶 `=` 的標準跳脫。

### 坑 6:CSV 匯入編碼偵測靠 try/catch 失效 —— Big5 解錯不 throw

**症狀**:匯入 Big5 編碼的角色名單正常,但匯入 UTF-8 編碼的 CSV 時,中文角色名稱全變亂碼。

**誤判**:舊版寫 `try { TextDecoder('big5') } catch { TextDecoder('utf-8') }`,以為是「先試 Big5,失敗自動退回 UTF-8」的智慧 fallback。實際上這個 catch 幾乎永遠不會觸發。

**根因**:`TextDecoder('big5').decode()` 遇到讀不懂的 byte **不會 throw**,只會靜默輸出替換字元 `�`(U+FFFD)。catch 只有在「瀏覽器根本不支援 Big5 解碼器」時才觸發,主流瀏覽器都支援 → catch 永不觸發 → 等於不管什麼檔案都硬用 Big5 解,UTF-8 的多 byte 中文被誤讀成 Big5 就亂碼。

**關鍵不對稱性**:

| 解碼器 | 解對 | 解錯 |
|---|---|---|
| UTF-8 | 正常 | 冒出 `�`(byte 規則嚴格,非法序列 → 替換字元,可偵測) |
| Big5 | 正常 | 靜默亂碼,**不冒 `�`**(幾乎任何 byte 都能硬讀出字) |

只有 UTF-8 這個「嚴格的」解碼器解錯時會誠實冒 `�`,所以偵測順序必須是「先 UTF-8」。

**解法**:反過來 —— 先 UTF-8 解,檢查有沒有 `�`,有才改 Big5:

```js
text = new TextDecoder("utf-8").decode(bytes);
if (text.indexOf("�") !== -1) {          // 非有效 UTF-8
  text = new TextDecoder("big5").decode(bytes);
}
```

驗證 UTF-8、UTF-8+BOM(BOM 自動去掉)、Big5 三種來源皆正確。偵測文字編碼不能靠 `try/catch`(解碼器多半不 throw),要靠「解出來的內容合不合理」:先試嚴格的 UTF-8,冒 `�` 再退回寬鬆的 Big5,不能反過來 —— 寬鬆的編碼解錯不吭聲,抓不到。

## 關鍵取捨

### 取捨 1:存摺加總走新後端 Controller,其餘走現有 API

**選擇**:儲值彙整用新後端加總,輸贏 / 轉帳仍呼叫現有 API。

**否決方案**:全部前端直接呼叫原始 API。

**否決理由**:現有儲值紀錄 API 的回傳值與資料結構過度繁雜,前端處理成本高且容易出錯;化繁為簡,重新設計儲值彙整端點直接回傳兩個加總值,結構清晰、批量查詢可直接重用同一個 model method。

### 取捨 2:批量改 IN-clause batch,而非 pcntl_fork / curl_multi

**問題**:序列處理 20 人、上個月資料實測 **約 210 秒(3 分 30 秒)**,使用者等待時間無法接受。

**否決方案 A(curl_multi)**:輸贏與轉帳都是直接 PHP / DB 呼叫,不是 HTTP 請求;`curl_multi` 只能並行 HTTP,無法並行 DB 呼叫。

**否決方案 B(pcntl_fork)**:CLI 實測約 10.7 秒(19.6×),但正式機 PHP-FPM 的 web SAPI 根本不載入 pcntl,`function_exists('pcntl_fork')` 回傳 false,部署後 log 顯示 `fork=no`,完全未生效(詳見坑 2)。

**現行做法**:三 Phase 全改 IN-clause batch —— 會員身份批量(1 次 JOIN)、轉帳批量(2 次 IN-clause 取代 N×4)、輸贏批量(統計表 batch + 缺口 fallback);正式機 **15~20 秒**,QA 實測 **1.8 秒(3.2×)**。

### 取捨 3:跨頁傳參用 sessionStorage,不用 Vuex / query params

**選擇**:`sessionStorage`。

**否決方案 A(Vuex)**:需要 store 設定,現有專案 Vuex 不一定有對應 module。

**否決方案 B(query params)**:20 個 GUID 拼到 URL 會污染 address bar,且有長度限制風險。

**否決理由**:sessionStorage 無需額外 store 設定、導頁後仍有效、one-shot 移除簡單實作防重複觸發。

## 工程心法

> [!TIP]
> **把 DB round-trip 的次數壓低,PHP 層的迴圈隨意。** for 迴圈本身幾乎 free;慢的是每次迭代都發一次 DB 請求。看到效能問題先數 DB 查詢次數,不是迴圈次數。for 迴圈只有在「每次迭代都發 DB 請求」時才需要改批量;純 PHP 陣列運算的迴圈不必動。

## 注意事項

- **較舊 PHP 版本限制**:無箭頭函式 `fn =>`、無型別屬性、無 `??=`;匿名類別需手寫完整語法(坑 3 的 `setRouteResolver` 修正就用到)。
- **分月 / 分日表**:儲值明細表依年月、金流明細表依日,各自要先確認表存在再查(`hasTable` / `SHOW TABLES LIKE`)。
- **Vue 2 多行欄位**:slot 需用 `slot` + `slot-scope` 屬性語法(不能用 `v-slot` / `#`),多行 div 在 CSV 匯出時需特別處理換行。
- **CSV 匯入編碼自動偵測**:先 UTF-8 解、偵測到 `�` 再改 Big5(詳見坑 6)。

## 附錄

### API 對照表

| 功能 | 主鍵 | 備註 |
|------|------|------|
| 查玩家身份 | GUID 或角色名稱 | 取 GUID、accountId、OpenID |
| 儲值點數 + C 幣 | GUID + accountId | 新後端,查儲值明細表 + 金流明細表 |
| 批量彙整 | GUID list | 三 Phase batch,8 分鐘 timeout |
| 遊戲輸贏 | GUID | coinType=GOLD |
| 轉帳(轉出) | GUID | PlayerType=senderID |
| 轉帳(轉入) | GUID | PlayerType=targetID |

### 關鍵欄位說明(儲值明細表)

| 欄位 | 一般儲值 | 系統手動補點 | 結論 |
|------|--------|-----------|------|
| 玩家 ID | null | 有值 | **不可靠** |
| OpenID | 有值 | null | **不可靠** |
| 帳號 ID(accountId) | 有值 | 有值 | **唯一可靠** |

### 檔案結構

- 後端:金流報表 Controller + 兩支 Model(儲值明細、金流異動)。
- 前端:金流報表主頁 + 批量查詢對話框 + 網咖排行頁(觸發跨頁匯出的入口)。
- 規格:openspec change 的 design / tasks 文件。
