// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeMermaidBlocks from './src/lib/rehype-mermaid-blocks.mjs';

// TODO: replace with the real GitHub Pages URL once the repo name is decided
// (e.g. "https://<account>.github.io" for a root site, or the project-page URL).
// If the repo is NOT named "<account>.github.io", also set `base: "/<repo-name>/"`.
const SITE_URL = 'https://example.github.io';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [mdx(), sitemap()],
  markdown: {
    // Turns ```mermaid fences into <pre class="mermaid"> for client-side rendering
    // by mermaid.js (added alongside DiagramBlock, task 4.2). No committed image
    // files, no build-time headless-browser dependency — see the plugin's own
    // docstring for why rehype-mermaid (playwright-based) was dropped.
    rehypePlugins: [rehypeMermaidBlocks]
  }
});