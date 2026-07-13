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
    introText: '全端工程師。這裡收錄我的專案紀錄 —— 內容以 Markdown 維護、版本控制在 GitHub。',
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
    statProjects: '篇專案作品',
    statClickhouse: 'ClickHouse 查詢提速',
    statAutomation: '小時/年 自動化節省',
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
    introText:
      'Full-stack engineer. A record of my projects — content maintained in Markdown, version-controlled on GitHub.',
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
    statProjects: 'projects',
    statClickhouse: 'ClickHouse query speed-up',
    statAutomation: 'hrs/yr saved via automation',
    switcherLabel: '中文',
    switcherAria: '切換為中文'
  }
} as const;

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
