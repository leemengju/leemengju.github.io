/**
 * UI strings and locale helpers. zh-Hant is the default locale (unprefixed
 * URLs, unchanged from the original launch); English lives under /en/.
 * Project slugs are identical across locales, so the language switcher is a
 * pure path transform (see BaseLayout).
 */
export type Locale = 'zh' | 'en';

export const strings = {
  zh: {
    langAttr: 'zh-Hant',
    brand: '李孟儒 Lance Lee',
    siteTitle: '李孟儒 Lance Lee ｜ 作品集',
    titleSuffix: ' ｜ 李孟儒 Lance Lee',
    introHeading: '李孟儒 Lance Lee',
    introText: '讀懂使用者，讓每個細節都成為體驗的最佳註腳。',
    resumeButton: '查看履歷',
    aboutHeading: '關於我',
    skillsHeading: '專業技能',
    experienceHeading: '工作經歷',
    educationHeading: '學歷',
    projectsHeading: '專案作品',
    contactHeading: '聯絡方式',
    contactEmail: 'Email',
    contactGitHub: 'GitHub',
    contactLocation: '所在地',
    navProjects: '專案',
    backToHome: '← 回首頁',
    viewOnGitHub: 'View on GitHub',
    filterAll: '全部',
    // Label shown on the switcher = the language you would switch TO.
    switcherLabel: 'EN',
    switcherAria: 'Switch to English'
  },
  en: {
    langAttr: 'en',
    brand: 'Meng-Ju Lee (Lance)',
    siteTitle: 'Meng-Ju Lee (Lance) | Portfolio',
    titleSuffix: ' | Meng-Ju Lee (Lance)',
    introHeading: 'Meng-Ju Lee (Lance)',
    introText: 'Understand the users and make every detail the best footnote of the experience.',
    resumeButton: 'View Résumé',
    aboutHeading: 'About',
    skillsHeading: 'Skills',
    experienceHeading: 'Experience',
    educationHeading: 'Education',
    projectsHeading: 'Projects',
    contactHeading: 'Contact',
    contactEmail: 'Email',
    contactGitHub: 'GitHub',
    contactLocation: 'Location',
    navProjects: 'Projects',
    backToHome: '← Back to home',
    viewOnGitHub: 'View on GitHub',
    filterAll: 'All',
    switcherLabel: '中文',
    switcherAria: '切換為中文'
  }
} as const;

/**
 * Project category filter (home-page Projects section). Frontmatter stores
 * locale-independent KEYS (`categories: [db-performance, ...]`, byte-identical
 * across zh/en files); labels are looked up here per locale. Keys mirror the
 * six skill areas plus PM and UI/UX.
 */
export const categoryLabels: Record<string, { zh: string; en: string }> = {
  refactor: { zh: '系統重構', en: 'System Refactoring' },
  'db-performance': { zh: '資料庫與效能', en: 'DB & Performance' },
  'data-automation': { zh: '數據可視與自動化', en: 'Data Viz & Automation' },
  integration: { zh: '第三方串接', en: 'Integration' },
  fullstack: { zh: '全端開發', en: 'Full-Stack' },
  pm: { zh: '專案管理', en: 'Project Management' },
  uiux: { zh: 'UI/UX', en: 'UI/UX' }
};

export function homePath(locale: Locale): string {
  return locale === 'en' ? '/en/' : '/';
}

export function projectPath(id: string, locale: Locale): string {
  return locale === 'en' ? `/en/projects/${id}/` : `/projects/${id}/`;
}

/** Locale of a page derived from its URL path (en pages live under /en/). */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh';
}

/** The same page's path in the other locale (slugs are identical across locales). */
export function alternatePath(pathname: string): string {
  if (localeFromPath(pathname) === 'en') {
    const stripped = pathname.replace(/^\/en\/?/, '/');
    return stripped === '' ? '/' : stripped;
  }
  return pathname === '/' ? '/en/' : `/en${pathname}`;
}
