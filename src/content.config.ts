import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One markdown file = one project. Frontmatter is schema-validated at build time
// (see openspec/changes/rebuild-portfolio-astro/specs/content-model/spec.md).
//
// i18n: two parallel collections share one schema — `projects` (zh-Hant, the
// default locale, served at /projects/<slug>/) and `projects-en` (English,
// served at /en/projects/<slug>/). A translated project uses the SAME filename
// as its zh counterpart so the language switcher can map pages 1:1.
//
// Slug convention: the entry id (and page slug) is the filename without extension,
// e.g. src/content/projects/clickhouse-migration.md -> /projects/clickhouse-migration.
// Name files in kebab-case; keep each collection folder flat (no subfolders).
//
// Ordering convention: listing sorts by `order` ascending when present, then by
// `period` (most recent first) as a fallback, then by title. Leave `order` unset
// unless you need to force a specific position (e.g. pin a flagship project first).
// Locale-independent frontmatter (period, order, beforeAfter numbers, timeline
// dates) must stay identical across the zh/en versions of a project.
const projectSchema = z.object({
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
  // Filter-category KEYS for the home-page Projects filter (locale-independent,
  // byte-identical across zh/en; labels live in src/lib/i18n.ts categoryLabels).
  categories: z.array(z.string()).optional(),
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
  // Motion tier for the BeforeAfterBar (see design.md "Progressive motion
  // tiers"). Defaults to 'css' (L0); set 'gsap' to opt one flagship project
  // into the L1 ScrollTrigger-driven variant instead.
  beforeAfterMotion: z.enum(['css', 'gsap']).optional(),
  // Optional dated milestones, rendered as a Timeline.
  timeline: z
    .array(
      z.object({
        date: z.string(),
        label: z.string()
      })
    )
    .optional()
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema
});

const projectsEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects-en' }),
  schema: projectSchema
});

export const collections = { projects, 'projects-en': projectsEn };
