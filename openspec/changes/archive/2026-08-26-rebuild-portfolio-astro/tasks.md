## 1. Scaffold & repo

- [x] 1.1 `git init` at `E:\portfolio` and add a `.gitignore` (node_modules, dist, .astro)
- [x] 1.2 Scaffold Astro (`npm create astro@latest`, minimal/empty template, TypeScript)
- [x] 1.3 Add integrations: `astro add mdx sitemap`; add a Mermaid remark/rehype integration
- [x] 1.4 Set `astro.config` `site` (and `base` only if repo name ≠ `<account>.github.io`)

## 2. Content model

- [x] 2.1 Define a `projects` content collection with a typed frontmatter schema (title, role, period, tags[], cover?, github?, metrics?, order?)
- [x] 2.2 Add one sample project `.md` and confirm invalid frontmatter fails the build
- [x] 2.3 Decide slug rule and grouping/order convention

## 3. Pages

- [x] 3.1 Build `index.astro`: intro section + project listing (ordered) from the collection
- [x] 3.2 Build `projects/[slug].astro` via `getStaticPaths`: frontmatter header + rendered md body
- [x] 3.3 Add navigation (home ↔ project) and the optional "View on GitHub" control (renders only when `github` set)

## 4. Presentation (visual vocabulary)

- [x] 4.1 MetricCard component (headline metric, e.g. `104s → 5s`, `~21×`)
- [x] 4.2 DiagramBlock: render Mermaid code blocks to vector at build (no image files)
- [x] 4.3 CodeBlock + LogBlock (syntax-highlighted snippet / terminal-style output)
- [x] 4.4 BeforeAfterBar, Timeline, TagRow components
- [x] 4.5 Auto-generated typographic cover for projects without `cover` (listing + OG)

## 5. Motion (progressive)

- [x] 5.1 L0: CSS `@keyframes` + IntersectionObserver reveal utility (no framework)
- [x] 5.2 L1 (optional): add `gsap` + ScrollTrigger in a `<script>` for scroll-driven effects
- [x] 5.3 L2 (optional): `astro add react` + `framer-motion` island, hydrated `client:visible`

## 6. Content migration

- [x] 6.1 Port 2–3 representative projects from the résumé md (工程師版) to validate the model
- [x] 6.2 Port remaining engineering projects (9), then training (HUBD, EatNow), then design cases
- [x] 6.3 Set `github` only on projects with a real public repo; leave others without

## 7. Build & deploy

- [x] 7.1 Verify `astro build` produces static output with zero JS on island-free pages
- [x] 7.2 Add GitHub Actions workflow to build and deploy to GitHub Pages on push to main
- [x] 7.3 Push repo to GitHub, enable Pages, confirm a push deploys and a build failure blocks deploy

## 8. Later phases (out of this change's critical path)

- [x] 8.1 Add English i18n locale and en content （已完成:`src/content/projects-en/` 19 頁）
- [~] 8.2 ~~Configure custom domain (CNAME) and cut DNS over from Framer~~ — **不做**（2026-08-26 裁定:不需要自訂網域,站台維持 leemengju.github.io）
- [~] 8.3 ~~Retire the Framer site once verified~~ — **不做**（2026-08-26 裁定:lancelee.framer.website 留著,不影響）
