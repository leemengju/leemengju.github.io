# 維護流程與進度日誌(PROCESS)

> 斷線 / 換手 / 隔一陣子回來,**先看這份**就知道「怎麼維護」和「現在做到哪」。
> 搭配:檔案地圖看 [ARCHITECTURE.md](ARCHITECTURE.md)、內容產製細節看 [WORKFLOW.md](WORKFLOW.md)。

## 三份文件分工

| 文件 | 回答的問題 |
|---|---|
| **PROCESS.md**(本檔) | 怎麼維護?現在做到哪?下一步? |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 東西放哪?(檔案地圖) |
| [WORKFLOW.md](WORKFLOW.md) | 專案內容怎麼從私有 memory 去識別化產出? |

## 專案基本資料

- **站台**:`leemengju.github.io`(GitHub Pages,**public repo**)
- **技術**:Astro 7 SSG + React 島 + framer-motion;雙語(zh 在 `/`、en 在 `/en/`)
- **部署**:push 到 `main` → GitHub Actions 自動 build + 部署(`.github/workflows/deploy.yml`)
- **本機預覽**:`npm run preview` → http://localhost:4321(build 後的產物)/ `npm run dev`(開發)

## 標準維護流程(每次改動)

1. **改**:內容改 `src/content` 或 `src/lib/profile.ts`;版型改 `src/components`;配色改 `src/styles/tokens.css`;特效在 `src/components/effects/`。
2. **建**:`npx astro build` 要綠燈。
3. **安全閘門**(改到專案內容 / profile 時**必做**,因為是 public repo):
   ```bash
   grep -rniE "gmtap|vm140|cash7|gmtool|PHP 7\.1|CentOS|player_money_change|pmc_win_score|buyfg_|copperCoin|lance324|0939|lineRobotMember|administrator_permission_groups" src/content/ src/lib/profile.ts
   ```
   須 **0 命中**(libcurl 7.19.7 / 7.20.0 為使用者核准保留的例外)。
4. **目視**:特效與版面改動,build 無法驗證外觀 → 在 `npm run preview` 目視(特別是 hero、導覽、手機版)。
5. **commit + push**:內容一類、版面/特效一類,分開 commit;push `main` 後等 Actions 部署完再看線上。

## 去識別化紅線(push 到 public 前絕不外洩)

內部主機名(gmtap-2 / vm140 / gmtool-be01)、內部網域(*.cash7.com.tw)、DB 表/欄名、commit hash、branch 名、同事本名(→「同事」)、電話。**例外**:libcurl 版號 7.19.7 / 7.20.0 經核准可留。`E:\personalInfo` 與 `~/.claude` 兩個私有 repo 的內容絕不進 public。

---

## 進度日誌(新的寫最上面)

### 2026-07-22 — 第六輪回饋(8 項,含履歷 PDF)
- **根因:island/JS 產生的元素拿不到 Astro scoped CSS**。字母雨 hero(1)glyph 變成一行亂碼、分頁鈕(4)沒套色——都是因為 CSS 被 scope 到元件、但元素是 island/JS 建的。改用 `:global()` 後修好。**教訓已內化**:island 或 `document.createElement` 產生的節點,樣式要 `:global`。
- 技能卡 hover(2):改大而柔的**輔色**光暈(box-shadow),非硬邊。
- admonition icon(3):Dark 太深 → `fill: currentColor` = alert 標題色。
- github/linkedin(5):`btn--expand` 展開式膠囊(icon 縮出、標籤展入、accent 漸層+光暈)。
- smoky(6):顏色改**播放當下**從元素 `getComputedStyle().color` 取,Dark 直接冒白煙貼白字(不再黑煙→白字)。
- backToTop(7):加 accent 陰影浮起感。版權(8):去掉年份。
- **履歷 PDF(item 8)** ✅:`public/resume.html`(2 頁深色版型,仿 cv 模板,經歷/專案無 icon)→ headless Chrome 產 `public/resume.pdf`。**來源是 `profile.ts`(已去識別化的公開版),不引私有履歷,不放電話**(使用者確認)。hero「查看履歷」鈕已開。產製步驟寫進 WORKFLOW.md §7。**英文版待補**(同模板換 en 內容)。PDF 1.28MB 偏大,日後可壓。
- **待目視**:字母雨(現在應該真的下雨了)、分頁輔色、展開鈕、smoky 白煙、履歷 PDF 版面。

### 2026-07-21 — 第四輪回饋(8 項)
- **logo/品牌色(1、3)**:logo 改「遮罩剪影 + `background-color:currentColor`」(logo.svg 是 raster-in-SVG 但有 alpha,遮罩可精準上色);品牌色 Dark=白、Bright=主色,logo+名字一起變。
- **header 動效(2)**:brand + 語言鈕淡入下滑進場(不動手機固定的變體鈕,避免 transform 破壞 fixed)。
- **手機標題動效(3)**:LetterSwapTitle 拿掉 `fine` 限制(改捲入觸發,觸控也吃)。
- **8 weeks 折行(4)**:Oi 太寬會折行(實測 84px 兩行)→ 改 `8wks`。
- **技能卡 hover(5)**:改**主色柔光暈**(box-shadow),不是硬邊線。
- **banner 壓縮(6)**:5 張 1920px PNG(~6MB)→ WebP 1600px(~0.5MB 總),md 引用改 `.webp`。
- **時間軸無限捲動(7)**:**無法重現**(實測桌機 5074px / 手機 7300px、各 section 高度正常)。保險起見把光束從動 `height`(影響版面)改成 `transform:scaleY`(只走合成層、絕不影響頁高)。若仍發生需使用者提供:桌機/手機、哪個 section。
- **版權(8)**:拿掉年份 → `© LanceLee Portfolio. All rights reserved.`

### 2026-07-21 — 第三輪回饋(18 項)
主題色系重構 + 專案清單化 + 新特效。分兩筆 push:
- **主題**:變體改 **Bright / Dark**(移除 impeccable)、預設 Dark、放進 header 於**全站**(專案頁也有);新色票在 `tokens.css`(Bright #4A5989/#AEB2BD/#F3F4F8、Dark #FD853A/#A8866B/#1D2939)+ 新增 `--secondary`;Dark 下 logo 濾成白色;語言鈕與變體鈕在 header 固定 20px 間距(手機變體鈕落左下)。
- **hero(item 5)**:改成 `RainingLetters.tsx`(字母雨背景 + 標語 scramble 解碼);移除 KineticGrid + MeshTextHeading(兩檔已無引用、留著沒刪)。h1 保留標語文字給 SEO。
- **專案(item 9/13)**:移除卡片/清單切換,只留**清單**+分頁(每頁 6);分頁改**輔色**;list 列右側留 3rem 給 arrow,不再貼日期。
- **特效修正**:標題 letter-swap 改**捲入觸發**(item 6);footer smoky **每次捲入重播 + 靜止用真文字**不再變淡(item 16);Oi 數字改**空心 2px 描邊**(item 7)。
- **時間軸(item 15)**:工作經歷/學歷沿用既有 rail,加**捲動進度光束**(`.tl-beam`,vanilla JS)。
- **舊 5 專案 banner(item 12)**:換成 `public/banners/<slug>.png` 橫幅(**注意:1–1.4MB/張,偏大,日後可壓**)。
- **RWD(item 10)**:專案頁手機不再左右滾動——寬表格內部捲動、長行內 code 可斷行。
- **其他**:技能卡 hover 邊框亮主色(8)、學士→學士學位(14)、聯絡 CTA 加揮手動畫(17)、頁尾版權(18)、`8週`→`8 weeks`(2)。
- **踩雷**:`referenceForProtfolio/`(banner/CV SVG/effect 原碼)一度被 `git add -A` 誤加進 public repo → 已加入 .gitignore + `git rm --cached` 移出 HEAD(仍在 history,非機密故未改寫)。**教訓已內化**:新原料資料夾要先 gitignore。
- **待目視**:字母雨 hero、時間軸光束、清單/分頁、smoky 重播、暗色橘藍——瀏覽器無法 paint,需使用者確認。

### 2026-07-20 — 17 項改版清單 + 13 項回饋
- **17 項清單**:2–16 版面/內容項 + item 17(8 個工程專案去識別化搬遷)已完成並 push(內容 commit)。
- **4 個特效**已移植成島:KineticGrid(hero 背景)、MeshTextHeading(hero 名字 mesh)、LetterSwapTitle(標題逐字翻)、SmokyText(footer 署名煙霧)、ChapterRail(桌機章節軌)。
- **13 項回饋修正**(本批):
  - [x] 1 手機 nav 收不起來 → `.floating-nav__menu[hidden]{display:none}`(display:grid 蓋過 UA 的 [hidden])
  - [x] 2 hero 特效硬邊 → KineticGrid 底部漸層遮罩 + 移除 hero border-bottom
  - [x] 3 移除 CursorArc
  - [x] 4 hero 名字粗體 + mesh(effect 之前沒 push,故線上看不到;本批 push)
  - [x] 5/6 數據卡片數字用 Oi 字型(只有 value,label 不動);head 載入 Oi webfont
  - [x] 7 標題 letter_down(同上,本批 push 才會出現)
  - [x] 8 專案卡重疊 → 移除 3D tilt(preserve-3d 造成投影重疊),改單純上浮 + 加大 gap
  - [x] 9 篩選 btn 手機版跑版 → ≤700px 改回鬆散 chip、灰色 active/press
  - [x] 10 footer smoky(同上,本批 push 才會出現);另修 SSR 隱形 bug(改成先可見再煙霧)
  - [x] 11 檔案框架文件 → ARCHITECTURE.md(已更新)
  - [x] 12 維護 process → 本檔 PROCESS.md
  - [x] 13 主題切換(原版/impeccable/暗色)→ `ThemeVariantSwitch.astro`(首頁專用、右上角、存 localStorage);impeccable 建議寫進 `plan.md`。已確認 build 後只有首頁有、專案頁 0 命中。
- **待使用者目視**:mesh(hero)、chapter rail(桌機導覽)、letter_down、smoky、三變體切換 — 我無法目視驗證,push 後請 hard-refresh 確認。
- **部署插曲**:當天遇 **GitHub Actions 全平台部分中斷**(runner 派不出來,build job 一直 `queued`),今日各次部署卡住、線上一度看不到新版。臨時走 **gh-pages 分支繞道**(本機 build → 推 gh-pages → Pages 切 `build_type=legacy`)先上線;稍後 Actions 恢復、`main` 的 workflow run 成功,即**切回 `workflow`/`main` 並刪除 gh-pages 分支**,回到正常流程。全部改動已在 `main`(HEAD `324b1f6`),線上已確認含全部項目。
  - 繞道 SOP(下次再遇 Actions 當機可重用):`npx astro build` → `touch dist/.nojekyll` → 在 `dist/` 建 orphan `gh-pages` 分支 force-push → `gh api -X PUT repos/<owner>/<repo>/pages` 設 `build_type=legacy, source.branch=gh-pages`。**還原**:同 API 設回 `build_type=workflow, source.branch=main`(一個呼叫、完全可逆)。
- **跨 session 記憶**:已在 Claude memory 建 3 檔(`portfolio-project` / `portfolio-deidentification` / `feedback-portfolio-maintenance`)+ `MEMORY.md` 索引,重點是去識別化紅線與「本檔是 living log」的指向,斷線後可快速接回。
