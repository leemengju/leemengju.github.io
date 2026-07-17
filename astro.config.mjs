// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeMermaidBlocks from './src/lib/rehype-mermaid-blocks.mjs';
import rehypeMediaGrid from './src/lib/rehype-media-grid.mjs';
import { remarkAlert } from 'remark-github-blockquote-alert';

import react from '@astrojs/react';

// Repo is "leemengju.github.io" (a root user site), so no `base` is needed —
// internal links resolve at the domain root.
const SITE_URL = 'https://leemengju.github.io';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // zh-Hant is the default locale at unprefixed URLs (unchanged from launch);
  // English pages live under /en/ (src/pages/en/**). The sitemap i18n option
  // emits hreflang alternates for URL pairs that exist in both locales.
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en'],
    routing: { prefixDefaultLocale: false }
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'zh-Hant',
        locales: { 'zh-Hant': 'zh-Hant', en: 'en' }
      }
    }),
    react()
  ],
  markdown: {
    // remarkAlert renders GitHub-style callouts (> [!NOTE] / [!WARNING] /
    // [!IMPORTANT] ...) into <div class="markdown-alert ..."> — styled in
    // src/styles/code-blocks.css. Astro's default markdown leaves them as
    // plain blockquotes with literal "[!NOTE]" text, which is why they
    // weren't rendering.
    remarkPlugins: [remarkAlert],
    // Turns ```mermaid fences into <pre class="mermaid"> for client-side rendering
    // by mermaid.js (added alongside DiagramBlock, task 4.2). No committed image
    // files, no build-time headless-browser dependency — see the plugin's own
    // docstring for why rehype-mermaid (playwright-based) was dropped.
    rehypePlugins: [rehypeMermaidBlocks, rehypeMediaGrid]
  }
});