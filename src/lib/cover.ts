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

/** Wraps text to a max character width per line (rough, monospace-agnostic estimate). */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface CoverInput {
  title: string;
  metric?: string;
  tags: string[];
}

export function renderCoverSvg({ title, metric, tags }: CoverInput): string {
  // 16 chars/line is conservative for a title that's mostly full-width CJK
  // glyphs at this font-size (each renders roughly as wide as the font-size
  // itself); mixed CJK/ASCII titles will wrap with extra room to spare.
  const titleLines = wrapText(title, 16).slice(0, 3);
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
