import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';

type Phase = 'hidden' | 'appearing' | 'visible';

/**
 * Build the two smoke-in keyframe sets (a/b variants alternate per glyph).
 * intensity 1 = crisp quick puff, 20 = heavy diffuse smoke. Ported from the
 * Originkit "Smoky Text" buildKF, keeping only the bottomLeft drift variants
 * used for the sign-off. The color must be a concrete value — the visible
 * glyph is drawn by `text-shadow` while the element's own color is transparent.
 */
function buildKF(id: string, color: string, intensity: number): string {
  const n = (Math.max(1, Math.min(20, intensity)) - 1) / 19; // 0–1
  const r = (v: number) => +v.toFixed(2);
  const peakB = Math.round(6 + n * 200); // 6px → 206px
  const initB = Math.round(2 + n * 70); // 2px → 72px
  const layers = 1 + Math.round(n * 3); // 1 → 4 shadow layers = more "mass"
  const stack = (blur: number) =>
    Array.from(
      { length: layers },
      (_, i) => `0 0 ${Math.round((blur * (i + 1)) / layers)}px ${color}`
    ).join(',');
  const peak = stack(peakB);
  const init = stack(initB);
  const d = 0.7 + n * 0.8; // drift distance mult 0.7 → 1.5
  return `
@keyframes ${id}-a{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-15 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(-70deg) scale(0.7)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes ${id}-b{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-18 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(70deg) scale(0.5)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
`;
}

/**
 * SmokyText (item 15) — text that materialises out of drifting smoke the first
 * time it scrolls into view, used for the contact-area sign-off ("footer
 * smoky"). Ported from the Originkit "Smoky Text" component, trimmed to the
 * single-line, scroll-triggered case.
 *
 * Each glyph is a transparent character whose visible form is painted by a
 * `text-shadow` of the resolved color, so the sign-off stays real, selectable
 * text (an aria-label carries it for assistive tech since the glyph spans are
 * aria-hidden). `colorVar` is resolved to a concrete rgb through a throwaway
 * probe — the keyframes need a real color, not `currentColor`, because the
 * element's own color is transparent. Theme-adaptive at load, like KineticGrid.
 *
 * Degrades to plain static text under prefers-reduced-motion.
 */
export default function SmokyText({
  text,
  colorVar = 'var(--text)',
  intensity = 13,
  stagger = 0.08,
  className,
  style,
}: {
  text: string;
  colorVar?: string;
  intensity?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const rawId = useId();
  const kfId = 'smt' + rawId.replace(/[^a-zA-Z0-9]/g, '');
  const chars = useMemo(() => Array.from(text), [text]);
  // Start 'visible' so SSR / no-JS renders the sign-off as plain visible text —
  // if hydration never runs, the name is still shown (never a blank footer).
  // On mount we drop to 'hidden' and smoke it in when it scrolls into view.
  const [phase, setPhase] = useState<Phase>('visible');
  const [motion, setMotion] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const colorRef = useRef('#888');

  // Inject an (empty) keyframes <style>, then arm the scroll-triggered smoke-in.
  // The smoke color is resolved from the ELEMENT at play-time (not a mount-time
  // probe), so it always matches the current Bright/Dark theme — no more black
  // smoke before it settles to white in Dark (item 6). Reduced motion → plain text.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setMotion(false);
      setPhase('visible');
      return;
    }
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);

    // Hide, then smoke-in whenever the text scrolls into view — and reset to
    // hidden when it leaves, so it replays every time you scroll back (item 16).
    setPhase('hidden');
    const el = ref.current;
    let io: IntersectionObserver | null = null;
    let timer = 0;
    if (el) {
      io = new IntersectionObserver(
        (entries) => {
          const inView = entries.some((e) => e.isIntersecting);
          window.clearTimeout(timer);
          if (inView) {
            // read the live inherited color (element is 'hidden'/'inherit' here,
            // so this is the real theme text color) and (re)build the keyframes
            const color = getComputedStyle(el).color || '#888';
            colorRef.current = color;
            styleEl.textContent = buildKF(kfId, color, intensity);
            setPhase('appearing');
            const settle = 1100 + chars.length * stagger * 1000 + 900;
            timer = window.setTimeout(() => setPhase('visible'), settle);
          } else {
            setPhase('hidden');
          }
        },
        { threshold: 0.35 }
      );
      io.observe(el);
    }
    return () => {
      styleEl.remove();
      io?.disconnect();
      window.clearTimeout(timer);
    };
  }, [kfId, colorVar, intensity, chars.length, stagger]);

  // Static / reduced-motion: plain text, no shadow trick.
  if (!motion) {
    return (
      <span className={className} style={{ display: 'inline-block', ...style }}>
        {text}
      </span>
    );
  }

  const color = colorRef.current;
  // Only the (transient) smoke animation paints via the resolved color + shadow;
  // the resting 'visible' text is real text in the inherited color, so it stays
  // crisp and follows the current Bright/Dark theme instead of looking faint.
  const containerColor = phase === 'appearing' ? 'transparent' : 'inherit';
  return (
    <span
      ref={ref}
      aria-label={text}
      className={className}
      style={{ display: 'inline-block', color: containerColor, ...style }}
    >
      {chars.map((c, i) => {
        if (c === ' ')
          return (
            <span key={i} aria-hidden style={{ whiteSpace: 'pre' }}>
              {' '}
            </span>
          );
        if (phase === 'visible')
          return (
            <span key={i} aria-hidden style={{ display: 'inline-block' }}>
              {c}
            </span>
          );
        if (phase === 'hidden')
          return (
            <span key={i} aria-hidden style={{ display: 'inline-block', opacity: 0 }}>
              {c}
            </span>
          );
        // appearing: alternate the two smoke variants, sequential left→right stagger
        const variant = i % 2 === 0 ? 'a' : 'b';
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              textShadow: `0 0 0 ${color}`,
              animation: `${kfId}-${variant} 1.1s ${i * stagger}s cubic-bezier(0,0,0.58,1) both`,
            }}
          >
            {c}
          </span>
        );
      })}
    </span>
  );
}
