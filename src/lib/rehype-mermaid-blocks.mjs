import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: turns ```mermaid fenced code blocks into <pre class="mermaid">
 * (raw text, unwrapped) for client-side rendering by mermaid.js.
 *
 * Astro's built-in Shiki step runs BEFORE user `markdown.rehypePlugins`, so by
 * the time this plugin sees the tree, a ```mermaid fence is already rendered as
 * `<pre class="astro-code ..." data-language="mermaid" ...><code>` with the
 * diagram text broken into per-token <span> elements (there is no
 * `language-mermaid` class on <code> — that was a wrong assumption in an
 * earlier version of this file, verified against real build output). Matching
 * is therefore done on `data-language="mermaid"`, and the raw diagram source is
 * reconstructed by concatenating every descendant text node in document order
 * (Shiki only wraps characters in spans, it never adds/removes any).
 *
 * This intentionally does NOT render the diagram at build time (that path,
 * rehype-mermaid + mermaid-isomorphic, hard-requires a Playwright browser
 * install even at import time, which is too heavy/fragile for this project).
 * No image files are ever committed either way — see design.md's "Mermaid via
 * client-side render" decision.
 */
export default function rehypeMermaidBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null) return;
      if (!node.properties || node.properties.dataLanguage !== 'mermaid') return;

      parent.children[index] = {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: collectText(node) }]
      };
    });
  };
}

function collectText(node) {
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(collectText).join('');
}
