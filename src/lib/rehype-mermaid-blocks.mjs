import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: turns ```mermaid fenced code blocks (rendered by the markdown
 * processor as <pre><code class="language-mermaid">...</code></pre>) into
 * <pre class="mermaid">...</pre>, unwrapped and unescaped.
 *
 * This intentionally does NOT render the diagram at build time (that path,
 * rehype-mermaid + mermaid-isomorphic, hard-requires a Playwright browser
 * install even at import time, which is too heavy/fragile for this project).
 * Instead it emits the raw diagram text in the shape mermaid.js expects, so a
 * small client-side script (added with the DiagramBlock component, task 4.2)
 * can call `mermaid.run()` against `pre.mermaid` elements. No image files are
 * ever committed either way — see design.md "Mermaid at build time" decision,
 * which should be updated to reflect this client-render approach.
 */
export default function rehypeMermaidBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null) return;

      const code = node.children.find(
        (child) => child.type === 'element' && child.tagName === 'code'
      );
      if (!code) return;

      const classNames = (code.properties && code.properties.className) || [];
      const isMermaid = Array.isArray(classNames) && classNames.includes('language-mermaid');
      if (!isMermaid) return;

      const text = code.children
        .filter((child) => child.type === 'text')
        .map((child) => child.value)
        .join('');

      parent.children[index] = {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: text }]
      };
    });
  };
}
