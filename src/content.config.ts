import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One markdown file = one project. Frontmatter is schema-validated at build time
// (see openspec/changes/rebuild-portfolio-astro/specs/content-model/spec.md).
//
// Slug convention: the entry id (and page slug) is the filename without extension,
// e.g. src/content/projects/clickhouse-migration.md -> /projects/clickhouse-migration.
// Name files in kebab-case; do not nest subfolders (keeps slugs flat and stable).
//
// Ordering convention: listing sorts by `order` ascending when present, then by
// `period` (most recent first) as a fallback, then by title. Leave `order` unset
// unless you need to force a specific position (e.g. pin a flagship project first).
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    role: z.string(),
    period: z.string(),
    tags: z.array(z.string()),
    // Optional: only projects with a real public repo set this.
    github: z.string().url().optional(),
    // Optional headline metric shown as a MetricCard, e.g. "104s → 5s (~21x)".
    metrics: z.string().optional(),
    // Optional cover image; falls back to an auto-generated typographic cover.
    cover: z.string().optional(),
    // Optional explicit sort position (ascending); undefined sorts last.
    order: z.number().optional(),
    // Optional to-scale numeric comparison, rendered as a BeforeAfterBar.
    // Keep this separate from `metrics` (free text) since a bar needs real numbers.
    beforeAfter: z
      .object({
        label: z.string().optional(),
        before: z.number(),
        after: z.number(),
        unit: z.string().optional()
      })
      .optional(),
    // Optional dated milestones, rendered as a Timeline.
    timeline: z
      .array(
        z.object({
          date: z.string(),
          label: z.string()
        })
      )
      .optional()
  })
});

export const collections = { projects };
