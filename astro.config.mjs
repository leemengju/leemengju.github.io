// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeMermaidBlocks from './src/lib/rehype-mermaid-blocks.mjs';

import react from '@astrojs/react';

// Repo is "leemengju.github.io" (a root user site), so no `base` is needed —
// internal links resolve at the domain root.
const SITE_URL = 'https://leemengju.github.io';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [mdx(), sitemap(), react()],
  markdown: {
    // Turns ```mermaid fences into <pre class="mermaid"> for client-side rendering
    // by mermaid.js (added alongside DiagramBlock, task 4.2). No committed image
    // files, no build-time headless-browser dependency — see the plugin's own
    // docstring for why rehype-mermaid (playwright-based) was dropped.
    rehypePlugins: [rehypeMermaidBlocks]
  }
});