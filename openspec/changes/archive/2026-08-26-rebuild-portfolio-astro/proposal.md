## Why

The current portfolio (`lancelee.framer.website`) is produced via Figma→Framer, is a single page, and pushes project detail into external Google Drive docs. Content is locked inside Framer's visual editor — no version control, no diffing, and editing means round-tripping through Framer. The goal is a markdown-sourced, Git-hosted portfolio that is cheap to maintain and lets each project be a versioned file.

## What Changes

- Rebuild the portfolio as an **Astro static site** whose content source is **markdown** (one file per project) with typed frontmatter.
- Host content in the **GitHub repo**; push to `main` → GitHub Actions builds and deploys to **GitHub Pages** (no Docker, no self-hosting).
- Introduce a **non-image "visual vocabulary"** so pure-logic engineering projects look rich without screenshots: big metric cards, before/after bars, Mermaid diagrams, code/log blocks, timelines, tag chips, and auto-generated typographic covers.
- Add **progressive animation**: CSS + IntersectionObserver by default, optional GSAP for scroll-driven effects, optional Framer Motion island — all client-side, host-agnostic.
- Reuse project write-ups from the existing résumé markdown (工程師版 / EN) as the initial content.
- Structure the site **zh-first**, with English i18n deferred to a later phase (structure ready now, en content added later).
- Each project may carry an **optional GitHub link**; only projects with a public repo show the button.

## Capabilities

### New Capabilities
- `content-model`: Markdown project collection with a typed frontmatter schema (title, role, period, tags, optional cover, optional github, metrics), i18n-ready structure, and content reused from the résumé markdown.
- `site-pages`: Home page (intro + project listing) and per-project detail pages generated from the content collection, plus navigation and the optional "View on GitHub" link.
- `presentation`: The non-image visual-vocabulary components and the progressive animation strategy (Astro islands, `client:visible` hydration).
- `build-deploy`: Astro build and automated deployment to GitHub Pages via GitHub Actions, including base-path/site config for the chosen repo name and custom-domain readiness.

### Modified Capabilities
<!-- None — this is a greenfield project. -->

## Impact

- **New project** at `E:\portfolio` (own Git repo, pushed to GitHub). No existing code affected.
- **Dependencies**: Astro, `@astrojs/mdx`, `@astrojs/sitemap`, a Mermaid integration, optional `gsap`, optional `@astrojs/react` + `framer-motion`.
- **Hosting migration**: moves off Framer; domain starts as `<account>.github.io`, custom domain (e.g. `lancelee.dev`) later.
- **Content**: sourced from `C:\Users\tw25324\Desktop\個人資料\個人簡介--李孟儒[工程師版]202607.md` and the EN résumé.
- See `E:\portfolio\PLAN.md` for the full decision record.
