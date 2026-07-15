---
title: 投注額日表(betDaily)自動化與視覺化
role: 全端工程師
period: "2026.05 - 2026.06"
tags: [Laravel, Vue, v-charts, 自動化]
metrics: "每日人工填表 20 分鐘 → 0(6 個痛點全數解決)"
order: 3
beforeAfter:
  label: "每日人工作業時間"
  before: 20
  after: 0
  unit: "分/天"
---

## 背景

風管每天凌晨要人工查前一日各遊戲押注額,一款一款換算填入 Excel,每天耗時 20 分鐘,填完也不知道有沒有填對;數字依「上線後第幾天」人工填寫,誤填漏填完全無法察覺;Excel 欄位固定,多款遊戲無法調動順序做橫向比對。上線後又冒出新痛點:遊戲重新上架需要從當天重算、無法記憶查詢組合、匯出排序不直觀。

## 專案內容

以 Kernel 每日凌晨排程自動統計取代人工填寫,並加上折線圖 + 可拖拉表格視覺化、UI 一鍵重跑修復,以及查詢範本記憶功能。

## 專案挑戰

要一次解決 6 個痛點(人工耗時、無法驗證、查詢比較困難、重跑需求、無法記憶查詢組合、匯出排序問題),且不能中斷既有每日排程的正確性。

## 個人貢獻

- 建置每日統計 pipeline(涵蓋 40 款遊戲,單次執行約 10 秒),資料直接來自 DB 明細表,誤填問題從源頭消除。
- 前端用 v-charts 折線圖呈現 60 天趨勢,搭配 vuedraggable 讓表格欄位可任意拖拉重排,輔助橫向比對決策。
- 新增 UI 一鍵重跑(選遊戲 + 上線日期即可觸發,操作寫入後台 log 可審計)與範本管理(建立常用遊戲組合、一鍵套用)。
- 排除 Laravel `update()` 在資料無變動時回傳 0 affected rows、被誤判成「找不到資料」而導致範本編輯失敗的坑;以及 el-select 清空觸發 `onChange(null)`、把已選遊戲整個清空的坑。

## 專案結果與影響

每日人工作業由 20 分鐘降為 0(Kernel 全自動),6 個痛點全數解決,數字直接來自 DB 明細、可驗證可審計。

## 關鍵技術決策與踩坑

### 最痛的坑 1:`update()` 回傳 0 筆被誤判成「找不到資料」

範本編輯時,如果使用者送出的內容跟現有資料完全相同,API 會回傳失敗,使用者困惑「我明明沒改什麼,為什麼不能存」。

根因是原本的程式碼把 update 的 affected rows = 0 當成「找不到資料」而回報失敗。但實際上 Laravel 的 `update()` 在資料無變動時本來就回傳 0 affected rows —— 這代表「什麼都沒變」,不代表「找不到」。修法是直接移除這個判斷:update 沒拋例外就視為成功。

```php
// 錯誤:允許送同值的設定頁,不能用 affected rows 判斷成功
$affected = DB::table('bet_report_template')
    ->where('id', $id)
    ->update($data);
if ($affected === 0) {
    return $this->fail('NO_RESULTS'); // 送同值時誤判!
}

// 正確:update() 未拋例外即成功;affected=0 只代表 nothing changed
DB::table('bet_report_template')->where('id', $id)->update($data);
return $this->success();
```

教訓:ORM 的 affected rows = 0 等於「nothing changed」而非「not found」。任何允許送出同值的設定型編輯,都不該用 affected rows 判斷成敗。

### 最痛的坑 2:el-select 清空事件把已選遊戲清光

主頁的範本 el-select 加了 `clearable`,使用者點叉叉清空後,先前手動勾選的遊戲整批消失。

根因是 `@change` 在清空時也會觸發,此時傳入的 value 是 `null`,下游用它去 `find()` 範本得到 undefined,再 parse 就變成空陣列,把既有選擇覆蓋掉了。修法是在 handler 開頭對 null 直接 early return。

```js
function onTemplateChange (id) {
  if (id == null) return          // 清空事件 → 不動既有選擇
  const tpl = templateOptions.find(t => t.id === id)
  games = parseSelectGameList(tpl.selectGameList)
}
```

教訓:`clearable` + `@change` 的元件,清空會以 `null` 觸發同一個事件,handler 一定要在開頭處理 null,否則下游的 find/parse 會反過來清掉使用者既有的資料。

### 關鍵取捨

- **老遊戲用前端注入,而非改 DB schema**:有幾款早期上線的遊戲不在標準遊戲清單邏輯內。與其為這幾款去改資料表結構或污染統計 pipeline,選擇在前端以常數定義並透過遊戲選擇器的參數注入。代價是這幾個 id 硬編碼在前端、未來若要新增需改 code,但這批老遊戲沒有新增計畫,以最小侵入換取 pipeline 邏輯乾淨。
- **排程 class 命名不動,只重整 controller 命名空間**:功能長大後,原本以「60 天押注額」命名的控制器職責已擴及範本、重跑,於是把 controller 收進統一命名空間與子資料夾。但排程 job 的 class 名稱維持原樣 —— 因為 class 名稱不影響路由與使用者,改它反而有中斷既有每日排程的風險,不值得。
