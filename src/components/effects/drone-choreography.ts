/**
 * Scroll choreography for the hero drone (item 4). One reused model; each home
 * section gets a keyframe (position / euler rotation / uniform scale / opacity).
 * The scene interpolates between adjacent sections' keyframes as the viewport
 * centre passes from one section to the next.
 *
 * These are BEST-GUESS starting values derived from the user's per-section
 * descriptions — they are meant to be fine-tuned live via the ?tune overlay
 * (drag sliders → "Copy choreography" → paste back here). See design.md.
 *
 * Camera is fixed (looking at the origin); the MODEL moves. "Look up / down"
 * feel is faked via model position + tilt rather than moving the camera.
 * Coordinates: +x right, +y up, +z toward viewer. Rotation in radians.
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
  /** Slowly auto-rotates (turntable) while this section is dominant. */
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
    // Hero: fills the top-right, prominent, nose toward top-left, only ~70%
    // visible (rest overflows), worm's-eye feel (tilted up). Behind the tagline.
    key: 'hero',
    selector: '.hero',
    desktop: { pos: [3.5, 2.5, 0.5], rot: [deg(18), deg(-38), deg(26)], scale: 2.4, opacity: 1 },
    mobile: { pos: [1.4, 3.2, -1], rot: [deg(14), deg(-30), deg(22)], scale: 1.15 }
  },
  {
    // About: lands to the LEFT of the intro paragraph, whole model, ~1/3 screen,
    // eye level, slow 360° turntable.
    key: 'about',
    selector: '#about',
    spin: true,
    desktop: { pos: [-3.3, -0.2, 1], rot: [0, 0, 0], scale: 1.35, opacity: 1 },
    mobile: { pos: [0, 2.3, -1], scale: 1.0 }
  },
  {
    // Skills: hidden behind the cards, opacity 0.3, tilted ~20° toward top-left,
    // centred.
    key: 'skills',
    selector: '#skills',
    desktop: { pos: [0, 0, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.75, opacity: 0.3 },
    mobile: { scale: 1.25 }
  },
  {
    // Experience: no drone — fade out.
    key: 'experience',
    selector: '#experience',
    desktop: { pos: [0, -0.6, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 }
  },
  {
    // Projects: stay hidden.
    key: 'projects',
    selector: '#projects',
    desktop: { pos: [0, -0.6, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 }
  },
  {
    // Education: to the RIGHT of the "學歷" heading, flown back from afar, nose
    // toward viewer offset ~20° right.
    key: 'education',
    selector: '#education',
    desktop: { pos: [3.2, 0.7, 0.2], rot: [deg(-4), deg(20), 0], scale: 1.05, opacity: 1 },
    mobile: { pos: [1.3, 2.1, -0.5], scale: 0.85 }
  },
  {
    // Contact: enlarges into a parked state, slight top-down view, bottom-right
    // (not clipping bottom), ground shadow, nose toward left ~45°.
    key: 'contact',
    selector: '#contact',
    desktop: { pos: [2.6, -1.7, 0.5], rot: [deg(26), deg(-45), 0], scale: 1.75, opacity: 1 },
    mobile: { pos: [0, -1.6, 0], scale: 1.2 }
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
