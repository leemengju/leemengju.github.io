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

   🔴 **這條只掃 `src/content/` 與 `profile.ts`,而且是固定字串 denylist** —— 擋不住沒列進去的字,
   也掃不到根目錄與 `openspec/` 的 .md。2026-11-18 就是這樣讓 4 個檔的本機路徑過關的。
   **改到 repo 任何地方時改跑這條**(涵蓋全部 tracked 檔 + pattern 型紅線):
   ```bash
   git ls-files -z | xargs -0 grep -nIE "gmtap|vm140|cash7|gmtool|player_money_change|pmc_win_score|buyfg_|copperCoin|lance324|0939|lineRobotMember|administrator_permission_groups|PHP 7\.1|CentOS|[A-Z]:\\Users|09[0-9]{2}[- ]?[0-9]{3}[- ]?[0-9]{3}"
   ```
   `-I` 跳過二進位檔(`public/legacy/` 的 mp4/gif 會隨機命中 `E:\`,全是誤判)。
   ⚠ **預期會有 4 筆「自我命中」**:`PROCESS.md` 的兩條閘門指令與紅線清單、`WORKFLOW.md:82` 的舊指令 ——
   那是清單在描述自己,不是外洩。**真正要看的是 `src/`、`public/`、`openspec/` 底下有沒有命中。**
   要排掉自我命中:在上面那條後面接 `| grep -vE "^(PROCESS|WORKFLOW)\.md:"`。

   🔴 **絕對不要用 `-i` 配兩個以上 `-e`** —— Git Bash 的 GNU grep 3.0 會直接 **SIGABRT(exit 134)**。
   2026-11-18 實測邊界(與 `-r`、`--include`、目錄大小**都無關**,單一檔案一樣死):

   | 組合 | 結果 |
   |---|---|
   | `-i` + 2 個以上 `-e` | **abort 134** |
   | 多個 `-e`,拿掉 `-i` | 正常 |
   | `-i` + `-E "a\|b"` 交替 | 正常 |

   配上 `2>/dev/null`(吃掉 abort 訊息)與管線(`| head` 的 exit 0 蓋住真正結束碼),
   外觀就是「跑完、0 命中」—— 當天差點因此宣告 repo 已清乾淨。
   **一律用單一 `-E "a|b|c"` 交替,不要用多個 `-e`;掃描時不要加 `2>/dev/null`。**
4. **目視**:特效與版面改動,build 無法驗證外觀 → 在 `npm run preview` 目視(特別是 hero、導覽、手機版)。
5. **commit + push**:內容一類、版面/特效一類,分開 commit;push `main` 後等 Actions 部署完再看線上。

## 去識別化紅線(push 到 public 前絕不外洩)

內部主機名(gmtap-2 / vm140 / gmtool-be01)、內部網域(*.cash7.com.tw)、DB 表/欄名、commit hash、branch 名、同事本名(→「同事」)、電話。
**例外**:libcurl 版號 7.19.7 / 7.20.0 經核准可留。

🔴 **2026-11-18 新增一類紅線:本機絕對路徑、OS 帳號名、私有 repo 名。**
兩個私有 repo(履歷源、Claude memory)的**內容**本來就絕不進 public,但當時沒把「**路徑與 repo 名本身**」列為紅線,
結果 4 個 tracked 檔(含 `src/lib/profile.ts`)長期寫著含 OS 帳號的絕對路徑。已於 2026-11-18 清除。
描述這兩個來源時一律寫「私有履歷 repo」「私有 memory repo」,不寫路徑、不寫 repo 名。

---

## 進度日誌(新的寫最上面)

### 2026-11-18 — 稽核補記:2026-07-23~2026-10-02 共 33 筆 commit 的合併日誌

> 本段是**事後補記**。日誌從 2026-07-22 之後斷了近四個月,期間有 33 筆 commit
> (`80e2594`..`ead125f`)沒有脈絡可追。以下依主題合併,不逐筆列。

- **2026-07-23~07-31 — 第六輪 b 回饋、3D 圖層、環境音、履歷改版**
  - 回饋 6b:timeline 光束、gooey 分頁器、履歷鈕、拿掉「研究員」。
  - **捲動驅動的 3D 無人機圖層**(v1→v2):tune overlay 自製(放棄 leva)、S 曲線、亮度與旋轉 gating、
    分段內運動、手機獨立 keyframes。
  - **環境音 toggle**:opt-in → 預設開 → 跨頁連續播放。
  - **履歷改版多輪**:雙頁亮色 → 白底去地點 → header band/icon 鈕/點狀專案 → 色階層次。
    ⚠ `### 2026-07-22` 那段寫的「英文版待補」**已於 2026-07-24 `d30cc03` 完成**(zh + en 同批產出)。
  - header 固定一度上線又 revert(2026-07-31 `d8f7501`)。

- **2026-08 — 品牌、去識別化、achievement↔portfolio 一致性、分類系統**
  - logo 改 LANCE LEE、履歷配色加深、3D 手機 keyframes 與 contact 角度確定性調校。
  - **內部識別字全面泛化**(`161711e`)並新增兩篇專案頁。
  - **achievement↔portfolio 一致性同步 Phase 1/2**(各 4 組)+ 修正稽核發現的錯誤;
    玩家金流頁補回遺漏的專案說明;permission-multiselect 補上線策略與改版規模。
  - **依 senior 四維訊號強度重排作品集**(`3517dff`),旗艦頁補架構圖。
  - 新增後又移除 `legacy-system-onboarding`(判定「接手無文件遺留系統」是基本功、不是差異點)。
  - **分類系統定版**:filter 改成技能區的鏡射(5 分類、順序一致)、移除「全端開發」維度、
    分類內用 categories 陣列順序排強度(不新增 schema 欄位)。
  - 首頁 profile 同步到 20260824 履歷(`fff0576`,該批唯一漏掉的一層)。
  - openspec 歸檔 rebuild-portfolio-astro 與 add-3d-scroll-layer,建立主 specs。

- **2026-10-02 — 新增三頁**(`ead125f`):錯誤通知改造、登入驗證改版、報表重查詢治理;專案數 19→22。

### 2026-11-18 — achievement↔portfolio 稽核與去識別化補強

- **本機路徑與私有 repo 名清出 public repo**:`PLAN.md`、`WORKFLOW.md`、
  `openspec/.../proposal.md`、**`src/lib/profile.ts`** 四個檔含 Windows 使用者路徑、
  私有 repo 名與私有履歷檔名,全部改成不含帳號的描述。
  🔴 **`profile.ts` 一直在掃描範圍內、每次都被掃、每次都放行**——因為 denylist 沒有
  私有履歷 repo 的名字。固定字串清單只能擋想得到的字,這是閘門的結構性限制。
  `dist/` 建置產物本來就乾淨(0 命中),曝險僅限 GitHub 上的原始碼。
- **`qcoin-backoffice` 補 `categories: [reliability, data-automation]`**(zh/en 同步)。
  它是 order 1~14 區間裡唯一沒有分類的一筆,在 5 個 filter pill 下只有「全部」看得到。
  ⚠ order 15~22 共 8 篇**刻意不分類**(早期職涯專案,5 個 category 都是台版後台工程向),
  那是區塊邊界不是漏填,不要「補齊」。


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
