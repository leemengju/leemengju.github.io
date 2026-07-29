/**
 * Scroll choreography for the hero drone (item 4). One reused model; each home
 * section gets a keyframe (position / euler rotation / uniform scale / opacity).
 * Position is interpolated along a Catmull-Rom spline through the section points
 * (an S-curve, never a straight vertical drop); rotation/scale/opacity ease
 * (smoothstep) between adjacent sections.
 *
 * Starting values are best-guess from the user's per-section descriptions — dial
 * them in live via the ?tune overlay (drag → "Copy all" → paste back here).
 * The overlay edits the DESKTOP keyframes; mobile overrides are authored here.
 *
 * Camera is fixed (looking at the origin); the MODEL moves. Coords: +x right,
 * +y up, +z toward viewer. Rotation in radians.
 */
export type Vec3 = [number, number, number];
export interface Keyframe {
  pos: Vec3;
  rot: Vec3; // euler radians
  scale: number;
  opacity: number;
}
export type SectionKey =
  | 'hero'
  | 'about'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'contact';

export interface SectionDef {
  key: SectionKey;
  /** DOM selector used to locate the section's vertical centre. */
  selector: string;
  /** Slowly auto-rotates (turntable) while dominant. Only hero + about spin;
   *  every other section holds a fixed angle. */
  spin?: boolean;
  desktop: Keyframe;
  /** Partial overrides applied at <= 768px. */
  mobile?: Partial<Keyframe>;
}

export const deg = (d: number): number => (d * Math.PI) / 180;

/** Fixed camera. */
export const CAMERA = { pos: [0, 0, 9] as Vec3, fov: 35 };

export const SECTIONS: SectionDef[] = [
  {
    // Hero: faces the viewer head-on, large, fully visible, near the top edge.
    // Spins slowly. Mobile: 2–3× bigger, may exceed the viewport width.
    key: 'hero',
    selector: '.hero',
    spin: true,
    desktop: { pos: [0.3, 1.7, 0], rot: [0, 0, 0], scale: 2.6, opacity: 1 },
    mobile: { pos: [0, 1.1, -0.5], scale: 4.2 }
  },
  {
    // About: flies to the LEFT of the intro paragraph and, once over the text,
    // drops to opacity 0.1. Still spinning (hero + about only). Mobile 1.5× bigger.
    key: 'about',
    selector: '#about',
    spin: true,
    desktop: { pos: [-3.1, -0.2, 0.5], rot: [0, 0, 0], scale: 1.3, opacity: 0.1 },
    mobile: { pos: [0, 1.9, -1], scale: 1.95, opacity: 0.1 }
  },
  {
    // Skills: behind the cards, tilted ~20°, opacity fading 0.3 → 0 into the next
    // section. No spin.
    key: 'skills',
    selector: '#skills',
    desktop: { pos: [0, 0.1, -1.4], rot: [deg(-6), 0, deg(20)], scale: 1.7, opacity: 0.3 },
    mobile: { scale: 1.3 }
  },
  {
    // Experience: no drone — faded out (offset x for the S-curve).
    key: 'experience',
    selector: '#experience',
    desktop: { pos: [-0.8, -0.6, -1.4], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 }
  },
  {
    // Projects: stay hidden (offset the other way for the S-curve).
    key: 'projects',
    selector: '#projects',
    desktop: { pos: [0.8, -0.7, -1.5], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 }
  },
  {
    // Education: flies back in to the RIGHT of the 學歷 heading. No spin.
    // Mobile: fades to 0.1 once over the "北亞利桑那大學…" text.
    key: 'education',
    selector: '#education',
    desktop: { pos: [3.2, 0.7, 0.2], rot: [deg(-4), deg(20), 0], scale: 1.05, opacity: 1 },
    mobile: { pos: [1.2, 2.0, -0.5], scale: 0.9, opacity: 0.1 }
  },
  {
    // Contact: parks bottom-right, nose turned back toward the 聯絡方式 heading,
    // settled ~20px lower. No spin. Mobile: stops at 聯絡方式, doesn't drop onto
    // the "一起打造好體驗…" line.
    key: 'contact',
    selector: '#contact',
    desktop: { pos: [2.6, -1.95, 0.5], rot: [deg(18), deg(-135), 0], scale: 1.75, opacity: 1 },
    mobile: { pos: [0, -1.1, 0], scale: 1.15 }
  }
];

/** Merge a section's desktop keyframe with its mobile overrides. */
export function effectiveKeyframe(s: SectionDef, mobile: boolean): Keyframe {
  if (!mobile || !s.mobile) return s.desktop;
  return {
    pos: (s.mobile.pos ?? s.desktop.pos) as Vec3,
    rot: (s.mobile.rot ?? s.desktop.rot) as Vec3,
    scale: s.mobile.scale ?? s.desktop.scale,
    opacity: s.mobile.opacity ?? s.desktop.opacity
  };
}
