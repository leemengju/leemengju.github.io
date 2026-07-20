# 作品集檔案框架(ARCHITECTURE)

> 這份是「**東西放哪**」的地圖(靜態結構)。搭配另外兩份:
> - 「**現在做到哪、怎麼維護**」看 [PROCESS.md](PROCESS.md)(維護流程 + 進度日誌)
> - 「**內容怎麼產**」的細節 SOP 看 [WORKFLOW.md](WORKFLOW.md)
>
> 一句話:內容是 Markdown、版型是 `.astro` 元件、樣式集中在 tokens、特效各自獨立成島,build 出純靜態 → GitHub Pages。

```
E:\portfolio\
├─ PROCESS.md             ← 維護流程 + 進度日誌(斷線後先看這份接回)
├─ WORKFLOW.md            ← 內容產製 SOP(內容管線、驗證/上線閘門)
├─ ARCHITECTURE.md        ← 本檔:檔案地圖
├─ astro.config.mjs       ← 站台設定 + markdown 管線(remarkAlert / mermaid / shiki)
├─ effectsForProtfolio\   ← 【原料,不上站】你提供的特效參考檔(.txt)、logo、CV 版型 SVG
│
├─ public\                ← 【原樣輸出】不經 build 處理的靜態資產
│  ├─ logo.svg            ·  網站 logo(header 用)
│  ├─ resume.pdf          ·  (待放)履歷 PDF,放了再開 profile.ts 的 resume
│  └─ legacy\projectN\    ·  5 個舊設計案的圖/GIF/影片(從 Framer 搬來)
│
├─ src\
│  ├─ content\            ← 【內容源｜一案一 md】
│  │  ├─ projects\*.md         ·  中文專案介紹(17 篇)
│  │  ├─ projects-en\*.md      ·  英文專案介紹(17 篇,slug 同名)
│  │  └─ ../content.config.ts  ·  frontmatter schema(title/role/period/tags/
│  │                               metrics/order/categories/beforeAfter/timeline)
│  │
│  ├─ lib\                ← 【資料與邏輯】
│  │  ├─ profile.ts            ·  首頁個人資料(自介/技能/經歷/學歷/聯絡)zh+en
│  │  │                           ★ 首頁「內容」改這裡(非專案的部分)
│  │  ├─ i18n.ts               ·  UI 字串、語系判斷、分類標籤 categoryLabels
│  │  ├─ projects.ts           ·  專案排序、封面 URL
│  │  └─ cover.ts              ·  生成式封面 SVG(目前僅供 og:image)
│  │
│  ├─ pages\              ← 【路由｜產出頁面】
│  │  ├─ index.astro           ·  中文首頁(/)      薄殼 → HomeSections
│  │  ├─ en\index.astro        ·  英文首頁(/en/)   薄殼 → HomeSections
│  │  ├─ projects\[slug].astro ·  中文專案頁         薄殼 → ProjectArticle
│  │  ├─ en\projects\[slug].astro · 英文專案頁
│  │  └─ covers\[slug].svg.ts  ·  每案生成封面端點
│  │
│  ├─ layouts\
│  │  └─ BaseLayout.astro      ·  全站骨架:header(logo+名字+語言切換)、
│  │                              全域樣式、載入 Oi 字型、掛載 BackToTop / 特效島
│  │
│  ├─ components\         ← 【版型與視覺元件】
│  │  ├─ HomeSections.astro    ·  首頁全部區塊(Hero/About/Skills/Experience/
│  │  │                           Projects+篩選/Education/Contact)
│  │  ├─ ProjectArticle.astro  ·  專案詳情(header 元資訊 + md 內文 + 文內 TOC)
│  │  ├─ ProjectCard.astro     ·  專案清單卡(純文字:標題/小標/metric/tags)
│  │  ├─ FloatingNav.astro     ·  章節導覽(桌機放大鏡章節軌 ChapterRail / 手機 hamburger 下拉)
│  │  ├─ MetricCard / BeforeAfterBar / Timeline / TagRow / DiagramBlock
│  │  │                        ·  內容驅動的視覺語彙(由 frontmatter / md 觸發)
│  │  ├─ StatsBand.tsx         ·  About 數據輪播 React 島
│  │  ├─ BackToTop / RevealScript
│  │  └─ effects\             ← 【特效島】從 effectsForProtfolio 移植的互動特效
│  │        │                    (React 島,client:visible;各自獨立、可單獨關閉、
│  │        │                     都顧 prefers-reduced-motion + 觸控降級)
│  │        ├─ KineticGrid.tsx      ·  Hero 背景滑鼠磁力點陣(底部漸層淡出)
│  │        ├─ MeshTextHeading.tsx  ·  Hero 名字 WebGL 拖曳網格(mesh hover)
│  │        ├─ LetterSwapTitle.tsx  ·  各 section h2 hover 逐字翻轉
│  │        ├─ SmokyText.tsx        ·  Contact 署名捲入視窗煙霧浮現
│  │        └─ ChapterRail.tsx      ·  桌機右側放大鏡章節導覽軌
│  │
│  └─ styles\             ← 【樣式集中地】
│     ├─ tokens.css            ·  設計 token:顏色(light-dark 雙主題)、陰影、
│     │                           圓角、字級、z-index、easing;★ 改配色只動這裡
│     ├─ code-blocks.css       ·  程式碼區塊 + 警示框(admonition)
│     └─ stats-band.css        ·  StatsBand 島的樣式(.tsx 無 scoped style)
│
└─ dist\                  ← 【build 產物,git 忽略】GitHub Pages 服務的就是這個
```

## 三個「改東西去哪」速查

| 要改什麼 | 檔案 |
|---|---|
| 某個專案的介紹內容 | `src/content/projects{,-en}/<slug>.md`(用 achievement-to-portfolio skill 產) |
| 首頁自介/技能/經歷/學歷/聯絡 | `src/lib/profile.ts`(zh+en) |
| 介面文字、分類標籤、語系 | `src/lib/i18n.ts` |
| 配色/陰影/字級/圓角 | `src/styles/tokens.css` |
| 某個區塊的排版 | `src/components/HomeSections.astro`(首頁)或 `ProjectArticle.astro`(專案頁) |
| 章節導覽行為 | `src/components/FloatingNav.astro` |
| 新增/調整互動特效 | `src/components/effects/`,在 `BaseLayout` 或對應區塊掛載 |
| 站台/建置設定 | `astro.config.mjs` |

## 內容 vs 版型 vs 特效 的分界原則

- **內容**(md / profile.ts):文字、數字、專案事實。改這裡不需要懂 CSS。
- **版型**(.astro + tokens.css):結構與樣式。用 token,不硬編色碼。
- **特效**(effects/ 島):錦上添花,每個都獨立可關、都要顧 `prefers-reduced-motion` 與觸控裝置降級。壞掉不該影響內容可讀性。
