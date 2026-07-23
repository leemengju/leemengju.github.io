/**
 * Home-page profile content (About / Skills / Experience / Education /
 * Contact) — the fuller site structure carried over from the old Framer site.
 *
 * IMPORTANT: this is a PUBLIC file in a public repo. Content is derived from
 * the résumé (E:\personalInfo, private) but curated for public display —
 * NOTABLY no phone number (the résumé has one; it must never appear here).
 * The résumé is NOT imported at build time on purpose (private→public stays a
 * manual, reviewed copy — same boundary as the achievement-to-portfolio skill).
 */
import type { Locale } from './i18n';

export interface SkillItem {
  name: string;
  desc: string;
  /** Icon key rendered by HomeSections' inline-SVG icon map. */
  icon: 'refactor' | 'database' | 'chart' | 'plug' | 'stack' | 'kanban';
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
   * traceable to an achievement record (see E:\personalInfo\履歷維護原則.md). */
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
    '我是孟儒，擁有 2 年跨產業經驗，涵蓋數位產品設計與全端工程開發，現任線上娛樂平台全端工程師，曾參與百萬預算的 SaaS、金融、政府與線上娛樂平台專案。',
    '曾主導總勝分報表由 MySQL 遷移至 ClickHouse，將玩家整月查詢時間由約 104 秒大幅降至約 5 秒（約 21 倍）；並持續推動報表與監控作業自動化，年省逾 300 小時人力，同時重構大型 Vue 模組（4221 行縮減 54%），提升系統可維護性。',
    '除了扎實的工程實作能力，設計與專案管理背景更讓我能精準掌握需求脈絡與使用者體驗，有效降低跨部門溝通的轉譯成本，讓技術決策直接對接商業目標。'
  ],
  stats: [
    { value: '~21×', label: 'ClickHouse 查詢提速' },
    { value: '300+', label: '小時/年 自動化節省' },
    { value: '−54%', label: '巨型 Vue 主檔瘦身(4221→1963 行)' },
    { value: '8wks', label: '從零交付新貨幣後台(34 項工項)' },
    { value: '17+', label: '篇專案作品' },
    { value: '3.2×', label: '批量金流查詢提速(QA 實測)' }
  ],
  skills: [
    { icon: 'refactor', name: '系統重構', desc: '主導共用設定模組化，4221 行巨型 Vue 檔分三波拆為 10 檔、主檔縮減 54%；並重構線上會員頁，將單一混亂 API 拆成 3 支職責清晰 API、前端主檔由 712 行降至約 190 行。' },
    { icon: 'database', name: '資料庫遷移與效能優化', desc: '熟悉 MySQL/MariaDB/ClickHouse 設計與操作，獨立主導 MySQL→ClickHouse 遷移（MV + AggregatingMergeTree），查詢提速約 21 倍，零停機切換、資料一致。' },
    { icon: 'chart', name: '數據可視與自動化', desc: '將重複性人工作業轉為自動化排程與資料視覺化，以 v-charts 折線圖與可拖拉表格呈現多維趨勢，並將日報表、監控回報改為 Kernel 排程，年省逾 300 小時人力。' },
    { icon: 'plug', name: '第三方串接', desc: '具備 LINE/Slack Bot SDK 串接與 cloudflared 內網穿透經驗，擅長打通防火牆內網限制，將訊息與資料即時同步推送。' },
    { icon: 'stack', name: '全端開發技術', desc: 'React、Vue 前端框架與 PHP、Laravel 後端框架開發經驗，熟悉 MVC 與前後端串接，能獨立完成從資料庫設計到前端呈現的完整開發。' },
    { icon: 'kanban', name: '專案管理', desc: '熟練使用 Notion、Trello、Redmine 進行專案管理，掌控進度與任務、提高執行效率。' }
  ],
  experience: [
    {
      role: '全端工程師',
      org: '糖蛙線上娛樂股份有限公司，台北',
      period: '2025.06 - 至今',
      summary: '隸屬技術支援課，負責遊戲營運數據報表與後台系統之全端開發與維運。',
      highlights: [
        '主導總勝分報表資料庫遷移，玩家整月查詢由約 104 秒降至約 5 秒（約 21 倍）。',
        '將投注額日表、區間賠率監控、玩家金流查詢等每日人工作業（合計每年逾 300 小時）全面自動化。',
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
    'I am Meng-Ju, with 2 years of cross-industry experience spanning digital product design and full-stack software development. Currently a full-stack engineer at an online gaming platform, with prior involvement in million-NTD-budget SaaS, finance, government and online-gaming projects.',
    "I led the migration of the platform's win-score report from MySQL to ClickHouse, cutting a player's full-month query time from ~104s to ~5s (~21×), and continuously drive report and monitoring automation that saves 300+ hours of manual work per year, alongside refactoring a large Vue module (4,221 lines cut by 54%) to improve maintainability.",
    'Beyond solid engineering execution, my design and project-management background lets me stay closely attuned to requirements and user experience, meaningfully cutting the communication overhead between teams and tying technical decisions directly to business goals.'
  ],
  stats: [
    { value: '~21×', label: 'ClickHouse query speed-up' },
    { value: '300+', label: 'hrs/yr saved via automation' },
    { value: '−54%', label: 'monolith Vue slimmed (4221→1963 lines)' },
    { value: '8wks', label: 'new-currency back office from zero (34 items)' },
    { value: '17+', label: 'project write-ups' },
    { value: '3.2×', label: 'batch cash-flow query speed-up (QA)' }
  ],
  skills: [
    { icon: 'refactor', name: 'System Refactoring', desc: 'Led the shared-settings modularization (a 4,221-line monolithic Vue file split into 10 files across three passes, main file cut 54%) and the online member page refactor (one tangled API split into 3, front-end main file from 712 to ~190 lines).' },
    { icon: 'database', name: 'Database Migration & Performance', desc: 'MySQL/MariaDB/ClickHouse design and operation; independently led a MySQL→ClickHouse migration (Materialized View + AggregatingMergeTree) for ~21× query speed-up with zero-downtime cutover and full data consistency.' },
    { icon: 'chart', name: 'Data Visualization & Automation', desc: 'Turns repetitive manual work into scheduled automation and visualized reporting — v-charts line charts with a draggable table, and daily reports / monitoring moved to Kernel-scheduled jobs, saving 300+ hours/year.' },
    { icon: 'plug', name: 'Third-Party Integration', desc: 'LINE/Slack Bot SDKs and cloudflared tunneling; routes messages and data through firewalled internal networks with real-time sync.' },
    { icon: 'stack', name: 'Full-Stack Development', desc: 'React and Vue on the front end, PHP and Laravel on the back end; comfortable with the MVC pattern and front-to-back integration, from database design through to the front end.' },
    { icon: 'kanban', name: 'Project Management', desc: 'Uses Notion, Trello, and Redmine to manage schedules and tasks and keep execution on track.' }
  ],
  experience: [
    {
      role: 'Full-Stack Engineer',
      org: 'Tonwa Online Entertainment Co., Ltd., Taipei',
      period: '2025.06 - Present',
      summary: 'Technical Support team — full-stack development and maintenance of game-operations reporting and back-office systems.',
      highlights: [
        "Led the win-score report DB migration; full-month player query cut from ~104s to ~5s (~21×).",
        'Fully automated formerly-daily manual tasks (daily bet report, interval-odds monitoring, cash-flow queries — 300+ hours/year combined).',
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
    // resume: '/resume.pdf',  // TODO: résumé PDF at public/resume.pdf once you replan the CV
    linkedin: 'https://www.linkedin.com/in/meng-ju-lee-902204231/'
  }
};

export function getProfile(locale: Locale): Profile {
  return locale === 'en' ? en : zh;
}
