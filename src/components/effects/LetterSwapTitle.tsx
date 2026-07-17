import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, useAnimate } from 'framer-motion';

/**
 * LetterSwapTitle (item 11) — section-heading text whose glyphs swap
 * vertically in a shuffled order on hover. Ported from the Originkit
 * "Random Letter Swap" (pingpong mode) to an Astro island for the home
 * page's <h2> titles. Adaptations for heading use:
 *   • Inherits color / font / size from the host <h2>, so it keeps the
 *     accent-colored heading look with no font control of its own.
 *   • Degrades to plain static text under prefers-reduced-motion or on
 *     coarse (touch) pointers — the primary glyphs sit at rest, so the
 *     text is always readable with zero animation registered.
 *   • A visually-hidden full-text span carries the semantics; the per-glyph
 *     spans are aria-hidden.
 *
 * The `.ls-a-N` / `.ls-b-N` class names are load-bearing — each glyph is
 * animated separately by selector so the swap order can be shuffled at
 * run-time. Don't rename them.
 */
export default function LetterSwapTitle({
  text,
  stagger = 0.045,
}: {
  text: string;
  stagger?: number;
}) {
  const [scope, animate] = useAnimate();
  const [animated, setAnimated] = useState(false);
  // pingpong-with-guard: while a run is in flight we still allow the
  // opposite direction to interrupt, but ignore same-direction re-triggers.
  const dir = useRef<'in' | 'out' | null>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAnimated(fine && !reduced);
  }, []);

  const glyphs = useMemo(() => Array.from(text), [text]);
  // Non-space glyph indices only — spaces get no stagger slot so delays
  // stay gap-free.
  const idxs = useMemo(
    () => glyphs.map((g, i) => (g === ' ' ? -1 : i)).filter((i) => i >= 0),
    [glyphs]
  );

  const shuffle = (arr: number[]): number[] => {
    const a = [...arr];
    // match the source's sort-based shuffle (not Fisher-Yates)
    a.sort(() => Math.random() - 0.5);
    return a;
  };

  const play = (to: 'in' | 'out') => {
    if (dir.current === to) return;
    dir.current = to;
    const transition = { type: 'spring' as const, duration: 0.7 };
    const order = shuffle(idxs);
    order.forEach((idx, i) => {
      const t = { ...transition, delay: i * stagger };
      if (to === 'in') {
        animate(`.ls-a-${idx}`, { y: '-100%' }, t);
        animate(`.ls-b-${idx}`, { top: '0%' }, t);
      } else {
        animate(`.ls-a-${idx}`, { y: '0%' }, t);
        animate(`.ls-b-${idx}`, { top: '100%' }, t);
      }
    });
  };

  // Static / touch / reduced-motion: plain heading text, no islands of motion.
  if (!animated) return <span>{text}</span>;

  return (
    <span
      ref={scope}
      onMouseEnter={() => play('in')}
      onMouseLeave={() => play('out')}
      style={{
        display: 'inline-flex',
        position: 'relative',
        overflow: 'hidden',
        // a hair of vertical breathing room so glyph descenders aren't clipped
        // by the overflow:hidden that hides the off-screen halves
        paddingBottom: '0.12em',
        cursor: 'default',
      }}
    >
      <span style={srOnly}>{text}</span>
      {glyphs.map((g, i) => (
        <span
          key={i}
          aria-hidden
          style={{ position: 'relative', display: 'flex', whiteSpace: 'pre' }}
        >
          <motion.span className={`ls-a-${i}`} style={{ position: 'relative', top: 0 }}>
            {g}
          </motion.span>
          <motion.span
            className={`ls-b-${i}`}
            style={{ position: 'absolute', left: 0, right: 0, top: '100%' }}
          >
            {g}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};
