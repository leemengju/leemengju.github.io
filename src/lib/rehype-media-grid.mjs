import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: groups runs of ≥2 consecutive image-only paragraphs into a
 * single <div class="media-grid" data-count="N">, so the legacy design-project
 * pages (which embed many screenshots) get a real responsive gallery layout
 * instead of a tall single column. A lone image stays a normal block (full
 * width). Runs on the rendered HTML tree, after Shiki/markdown.
 *
 * "image-only paragraph" = a <p> whose only meaningful child is one <img>
 * (whitespace text nodes ignored). Responsive columns are defined in
 * ProjectArticle.astro's `.media-grid` rules (mobile 1-col / desktop 2-col /
 * large 2-col wider), per the three breakpoints requested.
 */
export default function rehypeMediaGrid() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!node.children || node.children.length === 0) return;

      const kids = node.children;
      let i = 0;
      const out = [];
      while (i < kids.length) {
        const child = kids[i];
        if (isImageParagraph(child)) {
          // collect the maximal run of image paragraphs (skipping whitespace)
          const run = [child];
          let j = i + 1;
          while (j < kids.length) {
            if (isWhitespace(kids[j])) {
              j++;
              continue;
            }
            if (isImageParagraph(kids[j])) {
              run.push(kids[j]);
              j++;
            } else break;
          }
          if (run.length >= 2) {
            out.push({
              type: 'element',
              tagName: 'div',
              properties: { className: ['media-grid'], 'data-count': String(run.length) },
              children: run.map((p) => p.children.find((c) => c.type === 'element' && c.tagName === 'img'))
            });
            i = j;
            continue;
          }
        }
        out.push(child);
        i++;
      }
      node.children = out;
    });
  };
}

function isWhitespace(n) {
  return n.type === 'text' && n.value.trim() === '';
}

function isImageParagraph(n) {
  if (!n || n.type !== 'element' || n.tagName !== 'p' || !n.children) return false;
  const meaningful = n.children.filter((c) => !isWhitespace(c));
  return meaningful.length === 1 && meaningful[0].type === 'element' && meaningful[0].tagName === 'img';
}
