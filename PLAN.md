# Portfolio 重build 規劃（決策紀錄）

> 目的：把 lancelee.framer.website（Figma→Framer 產出、單頁、專案細節塞在 Google Drive）
> 改成「md 為內容源、GitHub 託管、可版控」的作品集。此檔為決策紀錄，供後續（可用全新對話）直接接續實作。

## 已定案

- **技術棧**：Astro（SSG，靜態網站產生器）+ Markdown content collections（frontmatter 有 schema）。
- **託管**：GitHub Pages，push main → GitHub Actions 自動 `astro build` → 上線。**不用 Docker**（動效是 client-side，靜態託管照樣能跑，Docker 對作品集非必要）。
- **內容託管**：專案介紹一律 md，放本 repo，改 md→push→自動上線；舊 Framer 專案頁自然淘汰。
- **專案路徑**：`E:\portfolio`（獨立 git repo，之後 push 上 GitHub）。
- **語言**：先繁中，英文之後補（Astro i18n）。內容可沿用兩份履歷 md（`C:\Users\tw25324\Desktop\個人資料\個人簡介--李孟儒[工程師版]202607.md`、`CV--Lee MengJu[EN]202607.md`）。

## 內容模型

```
E:\portfolio/
├─ src/content/projects/*.md      # 一案一檔（內容源）
├─ src/pages/index.astro          # 首頁：自我介紹 + 專案清單
├─ src/pages/projects/[slug].astro# 專案詳情樣板
├─ public/assets/                 # 封面/截圖（多數工程案無圖，見下）
└─ .github/workflows/deploy.yml   # build + 部署 Pages
```

project frontmatter：`title, role, period, tags[], cover?, github?(選填), metrics`
body：沿用履歷那套「背景 / 挑戰 / 貢獻 / 結果」。

## 視覺語彙（解決「純邏輯、沒圖」的專案）

不靠照片，改用一套元件（其實 achievement md 已在用 badge/表格/ASCII 圖）：
- **MetricCard** 大數字（104s→5s、~21×、−54%、304hr/年）
- **Before/After 長條**（捲動時播放）
- **Mermaid** 架構/流程圖（純文字→向量圖，零圖檔、可版控）← 標配
- **code / log 區塊**（秀關鍵演算法、benchmark 輸出）
- **Timeline**（Q幣 8 週）、**技能 chips**、**自動生成打字排版封面**（給真的沒素材的案）

## 動效（漸進，先簡後繁）

- L0：純 CSS `@keyframes` + `IntersectionObserver`（淡入/上滑/捲到才出現）← 約 8 成夠用
- L1：**GSAP**（`npm i gsap`，純 JS、不綁框架，寫在 `<script>`）→ 視差/捲動連動才上
- L2：Framer Motion（需 `astro add react` 開 React 島）→ 通常不需要
- Astro「島」：整頁靜態 HTML，只在需要的小塊標 `client:visible` 才載 JS。

## 之後才決定（不擋）

- 網域：先 `<帳號>.github.io` 頂著，之後可買 lancelee.dev 之類。
- repo 命名：取 `<帳號>.github.io`→掛根目錄；取別名→Astro 設 `base` 一行。

## 首波內容候選（工程 9 案 + 訓練 2 案 + 設計案，見履歷）

工程：玩家金流 / 區間賠率機器人 / betDaily / Q幣後台 / ClickHouse / 線上會員重構 / 共用設定模組化 / CDN三段驗證 / 權限複選 → HUBD、EatNow → 設計案。
> 有公開 GitHub 的大概只有 HUBD/EatNow/無障礙網站類；`github` 欄位設選填。

## 下一步（新對話接續即可）

1. `cd E:\portfolio && git init`；`openspec init`（可選，要正式流程再做）。
2. `npm create astro@latest` 建骨架 + `astro add mdx sitemap`（需要圖時再加 react）。
3. 定 content schema → 建 index / [slug] 樣板 → 做視覺元件（先 MetricCard + Mermaid）。
4. 從履歷 md 搬 2~3 個代表案試水 → 設 Actions 部署 Pages。
5. 之後補 i18n、自訂網域。

> 或直接跑 `/opsx:propose` 把本檔內容展開成正式 proposal/design/specs/tasks。
