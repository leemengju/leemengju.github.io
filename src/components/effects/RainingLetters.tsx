import { useEffect, useRef, useState } from 'react';

/**
 * RainingLetters (item 5) — the hero: a field of faint characters drifting
 * downward with a few flickering to the accent color, behind a headline that
 * decodes out of scrambled glyphs into the given text. Ported from the
 * "modern animation hero" reference, with adaptations:
 *   • Rain is drawn by mutating span styles directly in rAF (not React state
 *     per frame), so 100+ glyphs stay cheap.
 *   • Colors come from CSS vars (--text / --accent), so it follows the
 *     Bright/Dark theme with no hardcoded black background.
 *   • The headline is a real <h1> (SEO/a11y); under prefers-reduced-motion or
 *     on coarse pointers the rain is skipped and the <h1> shows the text plainly.
 *
 * `text` is the hero line (the tagline). Latin scramble glyphs stand in for
 * each target character while it "decodes", including CJK targets.
 */
const RAIN_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
const SCRAMBLE_GLYPHS = '!<>-_\\/[]{}—=+*^?#';

export default function RainingLetters({ text }: { text: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // run on mobile too (item 2) — it's the hero's signature motion; only
    // reduced-motion opts out
    setAnimated(!reduced);
  }, []);

  // ---- Rain layer ----
  useEffect(() => {
    if (!animated) return;
    const layer = layerRef.current;
    if (!layer) return;
    // fewer glyphs on small screens to keep the rAF cheap on phones
    const COUNT = window.innerWidth < 640 ? 70 : 130;
    type Drop = { el: HTMLSpanElement; x: number; y: number; speed: number };
    const drops: Drop[] = [];
    const rnd = (s: string) => s[Math.floor(Math.random() * s.length)];
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('span');
      el.className = 'rain__glyph';
      el.textContent = rnd(RAIN_GLYPHS);
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      el.style.left = x + '%';
      el.style.top = y + '%';
      layer.appendChild(el);
      drops.push({ el, x, y, speed: 0.04 + Math.random() * 0.12 });
    }

    let raf = 0;
    const move = () => {
      for (const d of drops) {
        d.y += d.speed;
        if (d.y >= 102) {
          d.y = -3;
          d.x = Math.random() * 100;
          d.el.style.left = d.x + '%';
          d.el.textContent = rnd(RAIN_GLYPHS);
        }
        d.el.style.top = d.y + '%';
      }
      raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);

    // flicker a few glyphs to the accent
    const flicker = window.setInterval(() => {
      layer.querySelectorAll('.rain__glyph.is-lit').forEach((e) => e.classList.remove('is-lit'));
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) drops[Math.floor(Math.random() * drops.length)]?.el.classList.add('is-lit');
    }, 90);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(flicker);
      layer.replaceChildren();
    };
  }, [animated]);

  // ---- Scramble headline ----
  useEffect(() => {
    if (!animated) return;
    const el = titleRef.current;
    if (!el) return;
    const target = text;
    let frame = 0;
    let raf = 0;
    let queue: { from: string; to: string; start: number; end: number; char?: string }[] = [];

    const setText = () => {
      const old = el.innerText;
      const len = Math.max(old.length, target.length);
      queue = [];
      for (let i = 0; i < len; i++) {
        const from = old[i] || '';
        const to = target[i] || '';
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        queue.push({ from, to, start, end });
      }
      frame = 0;
      update();
    };
    const update = () => {
      let out = '';
      let done = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frame >= q.end) {
          done++;
          out += q.to;
        } else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.28) q.char = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
          out += `<span class="rain-title__dud">${q.char}</span>`;
        } else {
          out += q.from;
        }
      }
      el.innerHTML = out;
      if (done < queue.length) {
        raf = requestAnimationFrame(update);
        frame++;
      }
    };

    setText();
    // re-scramble every so often for life
    const loop = window.setInterval(setText, 7000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(loop);
    };
  }, [animated, text]);

  return (
    <>
      {animated && <div ref={layerRef} className="rain-layer" aria-hidden="true" />}
      <h1 ref={titleRef} className="rain-title">
        {text}
      </h1>
    </>
  );
}
