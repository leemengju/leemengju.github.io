## Context

The current portfolio is a Framer site (Figma→Framer), single-page, with project detail in Google Drive. Content is locked in Framer's editor with no version control. The owner is a full-stack engineer (Vue/Laravel background) who already maintains their résumé as markdown and wants the portfolio on the same md-sourced, Git-hosted footing. Most engineering projects are "pure logic" with no screenshots, and many have no public repository. Full decision record: `E:\portfolio\PLAN.md`.

## Goals / Non-Goals

**Goals:**
- Markdown as the single content source; add a project = add one `.md`.
- Content hosted in GitHub; push → auto-build → GitHub Pages (no Docker, no server runtime).
- Rich presentation for image-less projects via a reusable visual vocabulary (metrics, Mermaid, code/log, timeline, chips, generated covers).
- Framer-grade motion where wanted, client-side, host-agnostic.
- zh-first, en-ready structure.

**Non-Goals:**
- No backend/dynamic features (comments, view counts, runtime GitHub API). Defer to a serverless function only if ever needed.
- No Docker/self-hosting (dropped after establishing that animation is client-side and independent of host).
- English content is not delivered in this change (structure only).
- Pulling README content from GitHub at build time is out of scope; `github` is a link only.

## Decisions

- **Astro over 11ty/Hugo/Next**: first-class markdown content collections with typed frontmatter (schema validation at build), zero-JS-by-default output, image optimization, built-in i18n, and islands for opt-in interactivity. Best fit for a content site by a JS-comfortable author. 11ty (less batteries-included) and Hugo (Go templating) considered; Next.js is overkill (SPA/SSR framework for an app, not a static content site).
- **GitHub Pages over Docker self-host**: content already lives in GitHub; Pages gives free hosting + CI in one place. Docker was in the original ask but was justified by a misconception that static hosts can't do Framer animations — animations run in the browser regardless of host, so Docker added cost without benefit here.
- **Content collections + `getStaticPaths`** for `projects/[slug]`: one detail page per md, stable slugs, schema-enforced frontmatter.
- **Visual vocabulary as `.astro` components** (MetricCard, BeforeAfterBar, DiagramBlock, CodeBlock, LogBlock, Timeline, TagRow): static by default; only animated ones become islands.
- **Mermaid via client-side render, not build-time SVG**: `rehype-mermaid`'s `mermaid-isomorphic` dependency hard-requires a Playwright browser install even at import time, breaking the build with no diagram present. Replaced with a small custom rehype plugin (`src/lib/rehype-mermaid-blocks.mjs`) that unwraps ` ```mermaid ` fences into `<pre class="mermaid">`; `mermaid.js` renders it client-side when DiagramBlock (task 4.2) loads it. Still text-sourced, version-controlled, no committed image files — only the *when* of rendering moved from build to first paint.
- **Generated covers** via satori/`@vercel/og`-style typographic rendering at build for projects lacking `cover`.
- **Progressive motion tiers**: (L0) CSS `@keyframes` + IntersectionObserver — covers ~80%; (L1) GSAP + ScrollTrigger in a `<script>` for scroll-driven effects, no framework; (L2) Framer Motion only inside a React island (`astro add react`) if declarative spring physics is wanted. Reach up a tier only when needed.
- **`client:visible` hydration** so islands load JS lazily and the rest of the page ships as static HTML.
- **Config**: set `site`; add `base` only if repo name ≠ `<account>.github.io`; keep a CNAME switch ready for a future custom domain (e.g. `lancelee.dev`).

## Risks / Trade-offs

- **Static-only limits** → acceptable for a portfolio; if dynamic ever needed, add a serverless function without changing the static core.
- **Sparse public repos** → `github` is optional per project; only real repos show the button; no fake links.
- **Image-less projects reading flat** → mitigated by the visual-vocabulary components + generated covers; metrics/diagrams carry the visual weight.
- **Mermaid/generated-cover build tooling adds dependencies** → isolate as integrations; if a tool is troublesome, degrade gracefully (plain `<pre>` for diagrams, solid-color cover).
- **Project-page base path breaking links** → mitigated by naming the repo `<account>.github.io` (root path) or setting `base` and using Astro's link/asset helpers.
- **GSAP/Framer Motion scope creep** → enforce the tier ladder; default tier first, escalate only per-effect.

## Migration Plan

1. `git init` at `E:\portfolio`; scaffold Astro; add integrations (mdx, sitemap, mermaid; react only if L2 used).
2. Define content schema; build home + `[slug]` templates + core components (start MetricCard + DiagramBlock).
3. Migrate 2–3 representative projects from the résumé md to validate the model.
4. Add the GitHub Actions Pages workflow; verify a push deploys.
5. Migrate remaining projects; layer motion progressively.
6. Later phases: en i18n, custom domain, retire the Framer site.

Rollback: the Framer site stays live until the new site is verified; DNS/domain cutover is the final, reversible step.

## Open Questions

- Repo name: `<account>.github.io` (root) vs a named repo (needs `base`)?
- Custom domain now or later (affects only config/CNAME)?
- How light should the portfolio project write-ups be vs the detailed résumé versions?
