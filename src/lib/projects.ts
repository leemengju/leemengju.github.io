import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Ordering convention (see src/content.config.ts): explicit `order` ascending
 * first, then most-recent-first by the period's start date, then title.
 */
function periodStartKey(period: string): string {
  const match = period.match(/\d{4}\.\d{2}/);
  return match ? match[0] : '';
}

export function sortProjects(
  entries: CollectionEntry<'projects'>[]
): CollectionEntry<'projects'>[] {
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

export async function getSortedProjects(): Promise<CollectionEntry<'projects'>[]> {
  const entries = await getCollection('projects');
  return sortProjects(entries);
}

/** Cover image URL: the project's own `cover`, or its generated fallback (see
 * src/pages/covers/[slug].svg.ts). */
export function coverUrl(project: CollectionEntry<'projects'>): string {
  return project.data.cover ?? `/covers/${project.id}.svg`;
}
