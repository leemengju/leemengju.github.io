/**
 * Renders a self-contained typographic cover as an SVG string. Used for
 * projects with no `cover` image (see src/pages/covers/[slug].svg.ts).
 *
 * Colors are hardcoded (not CSS custom properties) because this SVG is served
 * as a standalone file — referenced from <img> and <meta property="og:image">
 * — with no access to the page's stylesheet.
 *
 * Trade-off: most social-media link-preview crawlers (Facebook, Twitter/X,
 * LinkedIn) don't reliably rasterize SVG og:image files. This keeps the whole
 * pipeline dependency-free (no satori/resvg native binaries); if broad OG
 * preview support is needed later, swap this for a satori+resvg (or
 * @vercel/og-style) PNG render at the same call site.
 */

const WIDTH = 1200;
const HEIGHT = 630;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** CJK glyphs render roughly twice as wide as ASCII at the same font size. */
function isCjk(ch: string): boolean {
  // CJK radicals/ideographs (U+2E80-U+9FFF), compatibility ideographs (U+F900-U+FAFF),
  // fullwidth forms & CJK punctuation (U+FF00-U+FF60, U+FE30-U+FE4F, U+3000-U+303F),
  // Hangul syllables/jamo (U+AC00-U+D7A3, U+1100-U+115F).
  return /[ᄀ-ᅟ⺀-鿿　-〿가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch);
}

function visualWidth(text: string): number {
  let width = 0;
  for (const ch of text) width += isCjk(ch) ? 2 : 1;
  return width;
}

/**
 * Wraps text to a max VISUAL width per line, counting CJK glyphs as 2 units
 * and ASCII as 1 — a zh title and an en title of similar rendered width both
 * fit the same number of lines. Whole-word wrapping for spaced (ASCII) text;
 * an unspaced run (CJK) longer than a line is broken character-by-character.
 * Adjacent CJK fragments re-join without an inserted space.
 */
function wrapText(text: string, maxUnits: number): string[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  const words: string[] = [];
  for (const raw of rawWords) {
    if (visualWidth(raw) <= maxUnits) {
      words.push(raw);
      continue;
    }
    let chunk = '';
    for (const ch of raw) {
      if (chunk && visualWidth(chunk + ch) > maxUnits) {
        words.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    if (chunk) words.push(chunk);
  }

  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const joiner = line && isCjk(line[line.length - 1]) && isCjk(word[0]) ? '' : ' ';
    const candidate = line ? line + joiner + word : word;
    if (line && visualWidth(candidate) > maxUnits) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface CoverInput {
  title: string;
  metric?: string;
  tags: string[];
}

export function renderCoverSvg({ title, metric, tags }: CoverInput): string {
  // 32 units ≈ 16 full-width CJK glyphs ≈ 32 ASCII chars — conservative at
  // this font size for either script (see wrapText's width model).
  const titleLines = wrapText(title, 32).slice(0, 3);
  const titleY = HEIGHT / 2 - ((titleLines.length - 1) * 34) - (metric ? 20 : 0);

  const titleTspans = titleLines
    .map((line, i) => `<tspan x="80" y="${titleY + i * 68}">${escapeXml(line)}</tspan>`)
    .join('');

  const metricText = metric
    ? `<text x="80" y="${titleY + titleLines.length * 68 + 40}" font-size="32" font-weight="700" fill="#6ea8fe" font-family="system-ui, sans-serif">${escapeXml(metric)}</text>`
    : '';

  const tagChips = tags
    .slice(0, 4)
    .map((tag, i) => {
      const x = 80 + i * 150;
      return `
        <rect x="${x}" y="${HEIGHT - 120}" width="${Math.min(140, 20 + tag.length * 14)}" height="36" rx="18" fill="#2a2f3a" />
        <text x="${x + 14}" y="${HEIGHT - 96}" font-size="16" fill="#c9d1d9" font-family="system-ui, sans-serif">${escapeXml(tag)}</text>
      `;
    })
    .join('');

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#12151c" />
  <rect width="${WIDTH}" height="8" fill="#3a6df0" />
  <text x="80" y="72" font-size="22" fill="#8b949e" font-family="system-ui, sans-serif">李孟儒 Lance Lee</text>
  <text font-size="56" font-weight="700" fill="#f0f2f5" font-family="system-ui, 'PingFang TC', 'Microsoft JhengHei', sans-serif">${titleTspans}</text>
  ${metricText}
  ${tagChips}
</svg>`;
}
