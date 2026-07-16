import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

/** Either locale's project entry — the two collections share one schema. */
export type ProjectEntry = CollectionEntry<'projects'> | CollectionEntry<'projects-en'>;

/**
 * Ordering convention (see src/content.config.ts): explicit `order` ascending
 * first, then most-recent-first by the period's start date, then title.
 */
function periodStartKey(period: string): string {
  const match = period.match(/\d{4}\.\d{2}/);
  return match ? match[0] : '';
}

export function sortProjects<T extends ProjectEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;

    const periodA = periodStartKey(a.data.period);
    const periodB = periodStartKey(b.data.period);
    if (periodA !== periodB) return periodB.localeCompare(periodA); // most recent first

    return a.data.title.localeCompare(b.data.title, 'zh-Hant');
  });
}

export async function getSortedProjects(locale: Locale = 'zh'): Promise<ProjectEntry[]> {
  const entries =
    locale === 'en' ? await getCollection('projects-en') : await getCollection('projects');
  return sortProjects(entries);
}

/** Cover image URL: the project's own `cover`, or its generated fallback
 * (src/pages/covers/[slug].svg.ts). The generated artwork is abstract and
 * text-free, seeded purely by slug, so one URL serves both locales — this
 * also fixes the earlier bug where en pages pointed at a /covers/en/ route
 * that was never implemented. */
export function coverUrl(project: ProjectEntry, _locale: Locale = 'zh'): string {
  return project.data.cover ?? `/covers/${project.id}.svg`;
}
