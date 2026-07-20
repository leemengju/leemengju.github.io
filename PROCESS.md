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
