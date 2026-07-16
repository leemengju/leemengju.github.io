/**
 * Generative abstract cover art (SVG string) for projects with no `cover`
 * image — used by src/pages/covers/[slug].svg.ts (and the /en/ variant).
 *
 * Design intent (see WORKFLOW.md): the card BODY already shows title, role,
 * metrics and tags, so the cover deliberately carries NO text — repeating the
 * title there was redundant. Instead each project gets a unique, deterministic
 * gradient composition seeded from its slug (landing.love-style color art):
 * a dark base, two hue-paired glow blobs, a sweeping arc ring, and a fine
 * grain pass for texture. Colors are hardcoded (not CSS variables) because
 * the SVG is served standalone (also used as og:image).
 */

const WIDTH = 1200;
const HEIGHT = 630;

/** Deterministic 32-bit hash so a slug always renders the same artwork. */
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cheap seeded PRNG (mulberry32) — deterministic per slug. */
function prng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CoverInput {
  /** Slug string that seeds the artwork. */
  seed: string;
}

export function renderCoverSvg({ seed }: CoverInput): string {
  const rand = prng(hashSlug(seed));

  // Two paired hues 40–140° apart, medium-high saturation on a dark ground.
  const h1 = Math.floor(rand() * 360);
  const h2 = (h1 + 40 + Math.floor(rand() * 100)) % 360;
  const h3 = (h1 + 180 + Math.floor(rand() * 40)) % 360;

  const blobA = {
    cx: 250 + rand() * 350,
    cy: 120 + rand() * 260,
    r: 260 + rand() * 140
  };
  const blobB = {
    cx: 650 + rand() * 400,
    cy: 220 + rand() * 300,
    r: 220 + rand() * 160
  };
  const ringR = 150 + rand() * 110;
  const ringCx = 300 + rand() * 600;
  const ringCy = 150 + rand() * 330;
  const ringRot = Math.floor(rand() * 360);
  const dash = Math.floor(ringR * 2 * Math.PI * (0.55 + rand() * 0.25));
  const gap = Math.floor(ringR * 2 * Math.PI) - dash;

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ga" cx="35%" cy="35%" r="75%">
      <stop offset="0%" stop-color="hsl(${h1} 85% 62%)" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="hsl(${h1} 85% 62%)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gb" cx="60%" cy="45%" r="75%">
      <stop offset="0%" stop-color="hsl(${h2} 80% 58%)" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="hsl(${h2} 80% 58%)" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h1} 40% 10%)"/>
      <stop offset="100%" stop-color="hsl(${h2} 45% 14%)"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h3} 90% 72%)"/>
      <stop offset="100%" stop-color="hsl(${h2} 90% 68%)"/>
    </linearGradient>
    <filter id="blur1"><feGaussianBlur stdDeviation="55"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <g filter="url(#blur1)">
    <circle cx="${blobA.cx.toFixed(0)}" cy="${blobA.cy.toFixed(0)}" r="${blobA.r.toFixed(0)}" fill="url(#ga)"/>
    <circle cx="${blobB.cx.toFixed(0)}" cy="${blobB.cy.toFixed(0)}" r="${blobB.r.toFixed(0)}" fill="url(#gb)"/>
  </g>

  <g transform="rotate(${ringRot} ${ringCx.toFixed(0)} ${ringCy.toFixed(0)})">
    <circle cx="${ringCx.toFixed(0)}" cy="${ringCy.toFixed(0)}" r="${ringR.toFixed(0)}"
      fill="none" stroke="url(#ring)" stroke-width="3.5" stroke-linecap="round"
      stroke-dasharray="${dash} ${gap}" opacity="0.85"/>
  </g>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="hsl(${h1} 30% 8%)" filter="url(#grain)" opacity="0.5"/>
</svg>`;
}
