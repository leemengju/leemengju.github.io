/**
 * Home-page profile content (About / Skills / Experience / Education /
 * Contact) — the fuller site structure carried over from the old Framer site.
 *
 * IMPORTANT: this is a PUBLIC file in a public repo. Content is derived from
 * the résumé (a private repo) but curated for public display —
 * NOTABLY no phone number (the résumé has one; it must never appear here).
 * The résumé is NOT imported at build time on purpose (private→public stays a
 * manual, reviewed copy — same boundary as the achievement-to-portfolio skill).
 */
import type { Locale } from './i18n';

export interface SkillItem {
  name: string;
  desc: string;
  /** Icon key rendered by HomeSections' inline-SVG icon map.
   * `plug` / `stack` / `kanban` are currently unused (their skill entries were
   * retired in the 2026-08 résumé pass) but stay in the map for reuse. */
  icon: 'refactor' | 'database' | 'shield' | 'radar' | 'chart' | 'plug' | 'stack' | 'kanban';
}
export interface StatItem {
  value: string;
  label: string;
}
export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  summary?: string;
  highlights: string[];
}
export interface EducationItem {
  school: string;
  degree: string;
  period: string;
  notes: string[];
}
export interface Profile {
  about: string[];
  /** Headline numbers for the About stats carousel — every figure must be
   * traceable to an achievement record (see the private résumé guidelines). */
  stats: StatItem[];
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  contact: {
    email: string;
    github: string;
    location: string;
    /** Public résumé PDF path (under public/). Button renders only when set —
     * drop the exported PDF at public/resume.pdf then fill this in. */
    resume?: string;
    /** LinkedIn profile URL. Button renders only when set. */
    linkedin?: string;
  };
}

const zh: Profile = {
  about: [
    '我是孟儒，擁有 3 年跨產業經驗，涵蓋數位產品設計與全端工程開發，現任糖蛙線上娛樂股份有限公司全端工程師，曾參與百萬預算的 SaaS、金融、政府與線上娛樂平台專案。',
    '曾主導總勝分報表由 MySQL 遷移至 ClickHouse，將玩家整月查詢時間由約 104 秒降至約 5 秒（約 21 倍）；並以 Handler 模式重構七支千行級判斷式（最大主檔 1059 → 320 行）、將 4221 行巨型前端模組拆為 10 檔（主檔 −54%）；報表與監控自動化年省逾 300 小時人力。',
    '除了扎實的工程實作能力，設計與專案管理背景更讓我能精準掌握需求脈絡與使用者體驗，有效降低跨部門溝通的轉譯成本，讓技術決策直接對接商業目標。'
  ],
  stats: [
    { value: '~21×', label: 'ClickHouse 查詢提速' },
    { value: '300+', label: '小時/年 自動化節省' },
    { value: '−54%', label: '巨型 Vue 主檔瘦身(4221→1963 行)' },
    { value: '8wks', label: '從零交付新貨幣後台(34 項工項)' },
    { value: '24', label: '篇專案作品' },
    { value: '3.2×', label: '批量金流查詢提速(QA 實測)' }
  ],
  skills: [
    { icon: 'refactor', name: '系統架構與重構', desc: '以 Contract + Registry 單一分派點的 Handler 模式重構七支千行級判斷式（約 45 個處理器，最大主檔 1059 → 320 行），並將 4221 行巨型 Vue 分三波拆為 10 檔（主檔 −54%）；兩者都在無既有測試的程式碼上完成，以 golden-master 與實際 SQL 位元組級比對證明行為零改變。' },
    { icon: 'database', name: '資料庫與快取效能優化', desc: '主導 MySQL 遷移至 ClickHouse，物化視圖 + AggregatingMergeTree 於寫入時聚合，整月查詢約 104 秒降至約 5 秒（約 21 倍），雙軌並行零停機切換、報表零誤差；快取走 cache-aside 與游標式失效，並判斷何時不該快取——鍵值空間無界時改用單次 JOIN。' },
    { icon: 'shield', name: '交易一致性與容錯', desc: '將推播內容間歇性短少的根因定位為逐筆寫入與定時讀取之間的競態條件，以鏈式觸發 + 整批原子性寫入根治；為「上游回報成功卻未落庫」設計送出後對帳，16 次匯入攔截 1 次真實遺失；外部服務不穩時以斷路器 + 短逾時 + 即時切回人工優雅降級。' },
    { icon: 'radar', name: '可觀測性與根因定位', desc: '主動探測而非被動等報錯：「檢查全綠、前端全掛」的隱形故障改以完成 TLS 握手取證比對來監控（只查埠監聽抓不到靜默降級），偵測時點由故障後兩天提前至到期前 14 天；亦能定位僅正式環境重現的問題，如舊版 libcurl 併發介面差異造成的間歇性空回應。' },
    { icon: 'chart', name: '數據可視與自動化', desc: '將重複性人工作業轉為自動化排程與資料視覺化，以 v-charts 折線圖與可拖拉表格呈現多維趨勢，並將日報表、監控回報改為 Kernel 排程，年省逾 300 小時人力。' }
  ],
  experience: [
    {
      role: '全端工程師',
      org: '糖蛙線上娛樂股份有限公司，台北',
      period: '2025.06 - 至今',
      summary: '隸屬技術支援課，負責遊戲營運數據報表與後台系統之全端開發與維運。',
      highlights: [
        '主導總勝分報表資料庫遷移，玩家整月查詢由約 104 秒降至約 5 秒（約 21 倍）。',
        '將投注額日表、區間賠率監控等每日人工作業改為排程執行與機器人推送（年省逾 300 小時）；整月玩家金流分析則由跨 5 個後台頁面手查，整合為單頁一鍵批量匯出。',
        '將 4221 行巨型 Vue 檔模組化重構，拆為 10 檔、主檔縮減 54%，新框架為後續功能沿用驗證。',
        '與同事協作 8 週內從零交付全新貨幣機制後台（34 項工項上線、個人 69 commits）。'
      ]
    },
    {
      role: '全端開發工程師養成班受訓',
      org: '資展國際（原資策會教研所），台中',
      period: '2024.11 - 2025.04',
      highlights: [
        '帶領 5 人團隊開發 HUBD 快時尚電商 MVP，主導 React 前端、Laravel 後端整合、API 串接與 MySQL 建置。',
        '獨立從 0 到 1 打造 EatNow 外送平台原型，將單一斷點設計擴展為全載體，提升 50%+ 裝置相容性。'
      ]
    },
    {
      role: '使用者體驗設計師＋專案管理',
      org: '遊石設計有限公司，台北',
      period: '2023.09 - 2024.09',
      summary: '專注於用戶體驗與服務設計的資深軟體接案公司。',
      highlights: [
        '多案併行管理與標案提報：中華郵政 ATM 標案（決選第二）、IDDI 無障礙網站、寶藏巖體驗設計（時程準確率 95%）。',
        '高技術門檻平台介面設計與使用者需求研究：碳盤查系統 700+ 頁介面、酷課雲親師生平台、公司新官網 GUI。'
      ]
    },
    {
      role: '品牌策略經理',
      org: '一隅有限公司，新北',
      period: '2023.09 - 2024.08',
      summary: '成長快速的空間數位影像新創公司。',
      highlights: [
        '市場商業模式評估、5 大競品研究，提出 3 項市場切入策略與定價建議。',
        '依品牌策略組織執行、成效匯報與 OKR 追蹤，並管理公司專案與人力。'
      ]
    }
  ],
  education: [
    {
      school: '北亞利桑那大學',
      degree: '電腦資訊技術碩士',
      period: '2024.09 - 2025.09',
      notes: [
        '英語能力：GRE 315 / 托福 100（＝雅思 7＝多益 945+）。',
        '在經濟部 IDDI 計畫支持下，獨立以 React 與 Tailwind CSS 開發符合 WCAG 標準的無障礙推廣網站。'
      ]
    },
    {
      school: '北京大學',
      degree: '學士學位',
      period: '2017.09 - 2022.06',
      notes: [
        '東京大學與香港理工大學交換，交換期間獲得全 A 成績。',
        '連續三年獲教育部頒發臺港澳學生獎學金一等獎，2021 年度特等獎（全校前三）。'
      ]
    }
  ],
  contact: {
    email: 'emy0526@gmail.com',
    github: 'https://github.com/leemengju',
    location: '臺北市',
    resume: '/resume.pdf', // 2-page résumé; regenerate via public/resume.html → headless Chrome (see WORKFLOW.md)
    linkedin: 'https://www.linkedin.com/in/meng-ju-lee-902204231/'
  }
};

const en: Profile = {
  about: [
    'I am Meng-Ju, with 3 years of cross-industry experience spanning digital product design and full-stack software development. Currently a full-stack engineer at Tonwa Online Entertainment Co., Ltd., with prior involvement in million-NTD-budget SaaS, finance, government and online-gaming projects.',
    "I led the migration of the win-score report from MySQL to ClickHouse, cutting a player's full-month query from ~104s to ~5s (~21×); refactored seven thousand-line dispatch conditionals into the Handler pattern (largest main file 1,059 → 320 lines) and split a 4,221-line front-end module into 10 files (main file −54%); and drove report and monitoring automation saving 300+ hours per year.",
    'Beyond solid engineering execution, my design and project-management background lets me stay closely attuned to requirements and user experience, meaningfully cutting the communication overhead between teams and tying technical decisions directly to business goals.'
  ],
  stats: [
    { value: '~21×', label: 'ClickHouse query speed-up' },
    { value: '300+', label: 'hrs/yr saved via automation' },
    { value: '−54%', label: 'monolith Vue slimmed (4221→1963 lines)' },
    { value: '8wks', label: 'new-currency back office from zero (34 items)' },
    { value: '24', label: 'project write-ups' },
    { value: '3.2×', label: 'batch cash-flow query speed-up (QA)' }
  ],
  skills: [
    { icon: 'refactor', name: 'System Architecture & Refactoring', desc: 'Refactored seven thousand-line dispatch conditionals into a Handler pattern behind a Contract and a Registry as the single dispatch point (~45 handlers; largest main file 1,059 → 320 lines), and split a 4,221-line monolithic Vue file into 10 files (main file −54%) — both on code with no existing tests, behavior proven unchanged by golden-master runs and byte-level SQL comparison.' },
    { icon: 'database', name: 'Database, Cache & Performance', desc: 'Led a MySQL-to-ClickHouse migration — Materialized View + AggregatingMergeTree aggregating at insert time, full-month query ~104s → ~5s (~21×), dual-track zero-downtime cutover with zero reporting discrepancy; cache-aside reads with cursor-based invalidation, plus knowing when not to cache — an unbounded key space gets a single JOIN instead.' },
    { icon: 'shield', name: 'Transactional Consistency & Fault Tolerance', desc: 'Traced intermittently short push notifications to a race condition between row-by-row writes and scheduled reads, fixed at the root with chained triggering plus one atomic batch insert; added post-write reconciliation for silent loss (1 real loss caught across 16 imports); protected the front end from unstable third-party services with a circuit breaker, short timeouts and graceful degradation.' },
    { icon: 'radar', name: 'Observability & Root-Cause Analysis', desc: 'Probe actively rather than wait for errors: with every check green but the front end down, monitoring now completes a real TLS handshake and compares the certificate — a port check misses a silent plaintext fallback — moving detection from two days post-outage to 14 days pre-expiry; also root-causes production-only faults, such as intermittent empty responses from a legacy libcurl multi-interface state machine.' },
    { icon: 'chart', name: 'Data Visualization & Automation', desc: 'Turns repetitive manual work into scheduled automation and visualized reporting — v-charts line charts with a draggable table, and daily reports / monitoring moved to Kernel-scheduled jobs, saving 300+ hours/year.' }
  ],
  experience: [
    {
      role: 'Full-Stack Engineer',
      org: 'Tonwa Online Entertainment Co., Ltd., Taipei',
      period: '2025.06 - Present',
      summary: 'Technical Support team — full-stack development and maintenance of game-operations reporting and back-office systems.',
      highlights: [
        "Led the win-score report DB migration; full-month player query cut from ~104s to ~5s (~21×).",
        'Turned the daily bet report and interval-odds monitoring into scheduled jobs and bot pushes (300+ hours/year saved); consolidated the full-month player cash-flow analysis from a manual lookup across 5 back-office pages into one page with one-click bulk export.',
        'Refactored a 4,221-line monolithic Vue file into 10 files (main file −54%); reused and validated by later features.',
        'Delivered a brand-new currency-mechanism back office from scratch in 8 weeks with a teammate (34 items, 69 personal commits).'
      ]
    },
    {
      role: 'Full-Stack Engineer Training Program',
      org: 'iSpan International Inc., Taichung',
      period: '2024.11 - 2025.04',
      highlights: [
        'Led a 5-person team building the HUBD e-commerce MVP — React front end, Laravel back end, API integration and MySQL.',
        'Built the EatNow delivery-platform prototype from 0 to 1, extending a single breakpoint to full device coverage (50%+ compatibility gain).'
      ]
    },
    {
      role: 'UX Designer + Project Manager',
      org: 'UXI-Design, Taipei',
      period: '2023.09 - 2024.09',
      summary: 'A leading Taiwan software agency focused on user experience and service design.',
      highlights: [
        'Multi-project delivery & tenders: Chunghwa Post ATM tender (2nd place), IDDI accessibility website, Treasure Hill experience design (95% schedule accuracy).',
        'High-complexity platform UI & user research: IISI carbon-inventory system (700+ pages), CooC-Cloud education platform, corporate-site GUI.'
      ]
    },
    {
      role: 'Brand Strategy Manager',
      org: 'Yiyu Co., Ltd., New Taipei',
      period: '2023.09 - 2024.08',
      summary: 'A fast-growing spatial digital-imaging startup.',
      highlights: [
        'Market business-model assessment, research on 5 key competitors, 3 go-to-market strategies with pricing.',
        'Drove execution, performance reporting and OKR tracking around the brand strategy; managed projects and staffing.'
      ]
    }
  ],
  education: [
    {
      school: 'Northern Arizona University',
      degree: 'M.S., Computer Information Technology',
      period: '2024.09 - 2025.09',
      notes: [
        'English: GRE 315 / TOEFL 100 (= IELTS 7 = TOEIC 945+).',
        "Under the MOEA IDDI program, independently built a WCAG-compliant accessibility website with React and Tailwind CSS."
      ]
    },
    {
      school: 'Peking University',
      degree: 'B.A.',
      period: '2017.09 - 2022.06',
      notes: [
        'Exchange studies at the University of Tokyo and the Hong Kong Polytechnic University, all-A grades.',
        'First-Class Scholarship for Hong Kong, Macao, and Taiwan Students for three consecutive years (2021 Grand Prize, top 3 university-wide).'
      ]
    }
  ],
  contact: {
    email: 'emy0526@gmail.com',
    github: 'https://github.com/leemengju',
    location: 'Taipei, Taiwan',
    resume: '/resume-en.pdf', // 2-page EN résumé; regenerate via public/resume-en.html → headless Chrome (see WORKFLOW.md)
    linkedin: 'https://www.linkedin.com/in/meng-ju-lee-902204231/'
  }
};

export function getProfile(locale: Locale): Profile {
  return locale === 'en' ? en : zh;
}
