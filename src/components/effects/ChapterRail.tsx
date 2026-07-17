import * as React from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/**
 * ChapterRail (item 5) — the desktop section navigation, a vertical rail of
 * ticks with a raised-cosine magnification wave that tracks the cursor, plus a
 * preview card naming the active section. Ported from the Originkit / ruixen
 * "Chapter Scrubber", de-Tailwind'd (the shadcn `cn` + utility classes and
 * design-token class names are replaced with inline styles driven by this
 * site's CSS custom properties) and wired for navigation:
 *   • an internal IntersectionObserver scrollspy drives `currentIndex` from the
 *     section actually in view;
 *   • selecting a tick (click / Enter / Space) smooth-scrolls to that section.
 *
 * Fixed to the right edge; the preview card auto-flips to open leftward over
 * the content. Keyboard: roving tabindex, arrows / Home / End. Honors
 * prefers-reduced-motion (keeps the spatial wave, drops the temporal spring).
 * This island is the desktop layer only — FloatingNav keeps its own mobile
 * hamburger for narrow viewports.
 */

export interface NavItem {
  id: string;
  label: string;
}

interface Props {
  items: NavItem[];
  label?: string;
}

const CARD_WIDTH = 260;
const GAP = 20;
const PEAK_LENGTH = 46;
const REST_LENGTH = 14;
const ROW_HEIGHT = 22;
const RADIUS = 4;
const POINTER_SPRING = { stiffness: 700, damping: 52, mass: 0.5 };
const STRENGTH_SPRING = { stiffness: 260, damping: 30, mass: 0.6 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Raised-cosine bump: 1 at the crest, 0 beyond the radius, zero slope at both
// ends so the wave has no seams.
function bump(distance: number, radius: number) {
  if (distance >= radius) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * (distance / radius)));
}

interface TickProps {
  index: number;
  pointer: MotionValue<number>;
  strength: MotionValue<number>;
  isCurrent: boolean;
}

const Tick = React.memo(function Tick({ index, pointer, strength, isCurrent }: TickProps) {
  const width = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), RADIUS);
    return REST_LENGTH + rise * (PEAK_LENGTH - REST_LENGTH);
  });
  const opacity = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), RADIUS);
    const base = isCurrent ? 0.6 : 0.24;
    return base + rise * (1 - base);
  });
  const scaleY = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), RADIUS);
    return 1 + rise * 0.5;
  });

  return (
    <motion.span
      aria-hidden="true"
      style={{
        width,
        opacity,
        scaleY,
        display: 'block',
        height: 2,
        borderRadius: 999,
        background: isCurrent ? 'var(--accent)' : 'currentColor',
      }}
    />
  );
});

export default function ChapterRail({ items, label = 'Sections' }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = React.useId();
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const rawPointer = useMotionValue(0);
  const rawStrength = useMotionValue(0);
  const springPointer = useSpring(rawPointer, POINTER_SPRING);
  const springStrength = useSpring(rawStrength, STRENGTH_SPRING);
  const pointer = prefersReducedMotion ? rawPointer : springPointer;
  const strength = prefersReducedMotion ? rawStrength : springStrength;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [engaged, setEngaged] = React.useState(false);
  const [cardHeight, setCardHeight] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const hoveringRef = React.useRef(false);
  const focusedRef = React.useRef<number | null>(null);
  const activeRef = React.useRef(0);

  const commitActive = React.useCallback((index: number) => {
    if (index !== activeRef.current) {
      activeRef.current = index;
      setActiveIndex(index);
    }
  }, []);

  const last = items.length - 1;

  // Scrollspy: mirror the section in view into `currentIndex` (the persistent
  // "you are here" marker on the rail). Same rootMargin band as the old rail.
  React.useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const indexOfId = new Map(items.map((it, i) => [it.id, i]));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) {
          const i = indexOfId.get(vis.target.id);
          if (typeof i === 'number') setCurrentIndex(i);
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  // Measure the card so its vertical travel can be clamped to the rail.
  React.useEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [activeIndex]);

  // The rail is pinned to the right edge, so the card always opens leftward
  // over the content and the ticks always sit against the right edge — no flip
  // (flipping would make the ticks jump sides on hover).
  const totalHeight = items.length * ROW_HEIGHT;
  const rovingIndex = engaged ? activeIndex : currentIndex;

  const cardTop = useTransform(pointer, (p) => {
    const half = cardHeight / 2;
    const center = clamp((p + 0.5) * ROW_HEIGHT, half, Math.max(half, totalHeight - half));
    return center - half;
  });
  const cardScale = useTransform(strength, [0, 1], [0.97, 1]);
  // card opens leftward → slides in from a small +x offset
  const cardX = useTransform(strength, [0, 1], [6, 0]);

  const engageAt = (pointerRow: number, activeAt: number) => {
    rawPointer.set(pointerRow);
    rawStrength.set(1);
    commitActive(clamp(activeAt, 0, last));
    if (!engaged) setEngaged(true);
  };

  const scrollToItem = (index: number) => {
    const it = items[index];
    if (!it) return;
    const el = document.getElementById(it.id);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const row = (event.clientY - rect.top) / ROW_HEIGHT - 0.5;
    hoveringRef.current = true;
    engageAt(clamp(row, -0.5, last + 0.5), Math.round(row));
  };

  const handlePointerLeave = () => {
    hoveringRef.current = false;
    if (focusedRef.current != null) {
      rawPointer.set(focusedRef.current);
    } else {
      rawStrength.set(0);
      setEngaged(false);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      focusedRef.current = null;
      if (!hoveringRef.current) {
        rawStrength.set(0);
        setEngaged(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next = focusedRef.current ?? activeRef.current;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(last, next + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(0, next - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    buttonsRef.current[next]?.focus();
  };

  const activeItem = items[activeIndex];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: PEAK_LENGTH }}>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        aria-orientation="vertical"
        aria-activedescendant={engaged ? optionId(activeIndex) : undefined}
        style={{ display: 'flex', width: '100%', flexDirection: 'column' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          return (
            <button
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              key={item.id}
              id={optionId(index)}
              type="button"
              role="option"
              aria-selected={isCurrent}
              aria-label={item.label}
              tabIndex={index === rovingIndex ? 0 : -1}
              onFocus={() => {
                focusedRef.current = index;
                engageAt(index, index);
              }}
              onClick={() => scrollToItem(index)}
              style={{
                display: 'flex',
                width: '100%',
                height: ROW_HEIGHT,
                alignItems: 'center',
                // ticks always anchor to the right edge (grow leftward when magnified)
                justifyContent: 'flex-end',
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                color: 'inherit',
                outline: 'none',
                borderRadius: 3,
              }}
            >
              <Tick index={index} pointer={pointer} strength={strength} isCurrent={isCurrent} />
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <motion.div
          ref={cardRef}
          aria-hidden="true"
          style={{
            top: cardTop,
            x: cardX,
            scale: cardScale,
            opacity: strength,
            position: 'absolute',
            zIndex: 10,
            width: CARD_WIDTH,
            pointerEvents: 'none',
            borderRadius: '1rem',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '0.7rem 0.9rem',
            boxShadow: 'var(--shadow-hover)',
            transformOrigin: 'right center',
            right: PEAK_LENGTH + GAP,
          }}
        >
          <div
            style={{
              marginBottom: 2,
              fontSize: '0.7rem',
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-muted)',
            }}
          >
            {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeItem.label}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
