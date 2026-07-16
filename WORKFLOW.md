# 作品集維護工作流(WORKFLOW)

> 本檔是這個 repo 的維護 SOP。內容管線一律走:
> **(personalInfo + achievement)→ projects.md → html → 排版邏輯與特效分類**。
> 任何新專案、改版、改特效,都照本檔對號入座,不要繞過管線直接改產出。

```mermaid
graph LR
  A[E:\personalInfo 履歷<br/>私有 repo] --> C
  B[~/.claude/memory achievement<br/>私有 repo,含機密] -->|achievement-to-portfolio skill<br/>整篇複製 → 去識別化| C[src/content/projects{,-en}/*.md]
  C -->|astro build,schema 驗證| D[dist/ 靜態 html]
  D -->|push main → Actions| E[leemengju.github.io]
```

---

## 1. 內容來源(私有層,絕不直接引用)

| 來源 | 位置 | 用途 |
|---|---|---|
| 履歷(中/英) | `E:\personalInfo\`(private repo `personal-info`) | 首頁 About/Skills/Experience/Education 的內容底稿 → 人工複製進 `src/lib/profile.ts` |
| Achievement 完整記錄 | `C:\Users\tw25324\.claude\memory\achievement-*.md`(private repo `claude_compexity`) | 專案頁內容 → 走 `achievement-to-portfolio` skill |
| 敘事原則 | `E:\personalInfo\履歷維護原則.md` | 所有文案的風格規範(禁防禦框架/比較句/「教訓:」標籤等) |

**安全邊界**:私有 → 公開必須經過人工去識別化(skill 裡有過濾清單:主機名、內網域、DB 表名、commit hash、人名、電話…)。libcurl 版本號經使用者核准可保留。**絕不用 submodule/symlink/build script 自動連動私有內容。**

## 2. 內容層:`src/content/projects{,-en}/*.md`

- 一案一檔,slug = 檔名(kebab-case),中英兩個 collection **同名同 slug**。
- Frontmatter schema 見 `src/content.config.ts`;跨語系必須 byte-identical 的欄位:`period`、`order`、`categories`、`beforeAfter` 數字、`timeline` 日期。
- `categories` 放**語系無關的 key**(refactor / db-performance / data-automation / integration / fullstack / pm / uiux),顯示標籤在 `src/lib/i18n.ts` 的 `categoryLabels`。
- Body 結構跟著 achievement 原文走(不硬套模板);新增/擴寫一律用 skill:「把 XX achievement 擴寫進 portfolio」。
- 首頁個人資料(非專案)在 `src/lib/profile.ts`,stats 數字必須可回溯到 achievement。

## 3. 建置層:md → html

- `npx astro build` → `dist/`(純靜態;36+ 頁 = 首頁×2 + 專案×34 + 封面 SVG)。
- Markdown 管線(`astro.config.mjs`):`remarkAlert`(`[!NOTE]` 等警示框)→ Shiki 程式碼高亮 → `rehype-mermaid-blocks`(```mermaid → 前端渲染)。
- Frontmatter 錯誤會讓 build 失敗 —— 這是故意的守門。
- 封面:無 `cover` 的專案由 `src/lib/cover.ts` 依 slug 生成抽象漸層 SVG(無文字,卡片本體已有標題/數據,封面不重複資訊)。

## 4. 排版邏輯與特效分類(誰負責什麼)

### 版型元件
| 元件 | 職責 |
|---|---|
| `BaseLayout.astro` | 骨架:header、語言切換、hreflang、全域樣式、BackToTop、CursorArc |
| `HomeSections.astro` | 首頁全部 section(Hero/About/Skills/Experience/Projects/Education/Contact)+ 分類篩選 |
| `ProjectArticle.astro` | 專案詳情(header 元資訊 + markdown body + 文內 TOC)+ 表格/警示框樣式 |
| `ProjectCard.astro` | 清單卡片(封面、標題、metrics、tags、`data-categories`) |
| `FloatingNav.astro` | 章節導覽:≥1160px 右側圓點軌(hover 飛出標籤);<1160px 頂部 sticky chip bar |

### 視覺語彙(內容驅動)
| 元件/機制 | 由什麼觸發 |
|---|---|
| `MetricCard` | frontmatter `metrics` |
| `BeforeAfterBar`(css/gsap 兩檔動效) | `beforeAfter` + `beforeAfterMotion` |
| `Timeline` | `timeline` |
| Mermaid 圖 | body 內 ```mermaid |
| 程式碼/console 區塊 | body 內 ```lang(樣式在 `styles/code-blocks.css`) |
| 警示框 | body 內 `> [!NOTE]` 等 |

### 特效分層(動效預算,由低到高)
| 層 | 技術 | 用在哪 |
|---|---|---|
| L0 | CSS + IntersectionObserver(`[data-reveal]`) | 進場顯示、經歷時間軸、卡片 hover 浮起 |
| L0+ | 純 CSS 動畫 | Hero 漸層 blobs、stats 跑馬燈、游標 arc 自轉、封面 hover 縮放 |
| L0+ | 小型 vanilla script | 卡片 3D tilt、scrollspy、篩選 pills、BackToTop、CursorArc lerp |
| L1 | GSAP + ScrollTrigger | 旗艦專案的 BeforeAfterBar(`beforeAfterMotion: gsap`) |
| L2 | Framer Motion island(唯一一顆) | `StatsBand`(About 數據輪播,`client:visible`) |

**原則**:預設 L0;要往上加層,先問「這個效果值不值一顆 island / 一包函式庫」。所有動效都要顧 `prefers-reduced-motion`。

### 設計 token
全站顏色/陰影/圓角集中在 `src/styles/tokens.css`(`light-dark()` 雙主題)。改配色只動這裡,不要在元件內硬編色碼。

## 5. 驗證 → 上線

1. `npx astro build` 綠燈(schema + mermaid 守門)。
2. **洩漏掃描**(public repo 必做):
   ```bash
   grep -rniE "gmtap|vm140|cash7|PHP 7\.1\.33|CentOS|player_money_change|pmc_win_score|buyfg_|lance324|0939" src/content/ src/lib/profile.ts
   ```
   必須零命中(libcurl 7.19.7/7.20.0 為核准保留項)。
3. 本機看:`npm run preview` → http://localhost:4321/。
4. `git push origin main` → GitHub Actions 自動部署 → https://leemengju.github.io/。

## 6. 常見任務速查

| 想做什麼 | 動哪裡 |
|---|---|
| 新增一個專案頁 | 跑 skill「把 XX achievement 擴寫進 portfolio」→ 產出 zh/en 兩檔 + `categories` |
| 改自介/技能/經歷 | 先改 `E:\personalInfo` 履歷(source of truth)→ 人工同步到 `src/lib/profile.ts` |
| 加/改篩選分類 | `i18n.ts` 的 `categoryLabels` + 各專案 frontmatter `categories` |
| 換配色 | `styles/tokens.css` 的 `--accent` 等 |
| 加新特效 | 先對照上面的特效分層表選層級,再決定放哪個元件 |
| 履歷 PDF / LinkedIn 按鈕 | `profile.ts` 的 `contact.resume` / `contact.linkedin`(檔案放 `public/resume.pdf`) |
