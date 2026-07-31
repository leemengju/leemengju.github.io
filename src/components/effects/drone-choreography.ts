/**
 * Scroll choreography for the hero drone (item 4). One reused model; each home
 * section has a full keyframe (position / euler rotation / uniform scale /
 * opacity) for BOTH desktop and mobile — independently authored/tuned.
 *
 * A section may also declare an `exit` (partial) keyframe: the state the drone
 * eases toward while LEAVING that section, before the next section's keyframe —
 * this is how a single section can change opacity/position mid-scroll (e.g.
 * about fades 0.85 → 0.1; skills slides out to the right).
 *
 * Position is interpolated along a Catmull-Rom spline through all the resulting
 * points (an S-curve); rotation/scale/opacity ease (smoothstep) between points.
 *
 * Tune live via the ?tune overlay (desktop values on a desktop viewport, mobile
 * values on a mobile viewport) → "Copy all" → paste back here.
 *
 * Camera is fixed (looking at origin); the MODEL moves. +x right, +y up,
 * +z toward viewer. Rotation in radians.
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
  selector: string;
  /** Turntable auto-rotation. Only hero + about spin; the rest hold a fixed angle. */
  spin?: boolean;
  desktop: Keyframe;
  desktopExit?: Partial<Keyframe>;
  mobile: Keyframe;
  mobileExit?: Partial<Keyframe>;
}

export const deg = (d: number): number => (d * Math.PI) / 180;

/** Fixed camera. */
export const CAMERA = { pos: [0, 0, 9] as Vec3, fov: 35 };

export const SECTIONS: SectionDef[] = [
  {
    key: 'hero',
    selector: '.hero',
    spin: true,
    desktop: { pos: [2.3, 1.85, -1.15], rot: [deg(40), deg(-21), deg(-9)], scale: 3, opacity: 1 },
    mobile: { pos: [0, 2.6, -2], rot: [deg(30), deg(-16), deg(-6)], scale: 2.4, opacity: 1 }
  },
  {
    key: 'about',
    selector: '#about',
    spin: true,
    // Arrives at 0.85, then fades to 0.1 while leaving (over the intro text).
    desktop: { pos: [-1.85, 0.2, -0.85], rot: [0, 0, 0], scale: 1.3, opacity: 0.85 },
    desktopExit: { opacity: 0.1 },
    mobile: { pos: [0, 1.8, -1], rot: [0, 0, 0], scale: 1.2, opacity: 0.85 },
    mobileExit: { opacity: 0.1 }
  },
  {
    key: 'skills',
    selector: '#skills',
    // Enters behind the cards, then slides out to the right as it leaves.
    desktop: { pos: [0, 0.1, -1.4], rot: [deg(-6), 0, deg(20)], scale: 1.7, opacity: 0.3 },
    desktopExit: { pos: [3.8, 0.1, -1.4] },
    mobile: { pos: [0, 0, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.25, opacity: 0.3 },
    mobileExit: { pos: [1.6, 0, -1.6] }
  },
  {
    key: 'experience',
    selector: '#experience',
    desktop: { pos: [3.9, 0.05, -1.5], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 },
    mobile: { pos: [1.7, 0, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.3, opacity: 0 }
  },
  {
    key: 'projects',
    selector: '#projects',
    desktop: { pos: [0.8, -0.7, -1.5], rot: [deg(-6), 0, deg(20)], scale: 1.5, opacity: 0 },
    mobile: { pos: [0, -0.7, -1.6], rot: [deg(-6), 0, deg(20)], scale: 1.3, opacity: 0 }
  },
  {
    key: 'education',
    selector: '#education',
    desktop: { pos: [3.2, 0.7, 0.2], rot: [deg(-4), deg(20), 0], scale: 1.05, opacity: 1 },
    mobile: { pos: [1.1, 1.9, -0.5], rot: [deg(-4), deg(20), 0], scale: 0.85, opacity: 1 },
    // Mobile fades to 0.1 once over the "北亞利桑那大學…" text.
    mobileExit: { opacity: 0.1 }
  },
  {
    key: 'contact',
    selector: '#contact',
    desktop: { pos: [2.6, -1.6, 0.5], rot: [deg(18), deg(-135), 0], scale: 1.75, opacity: 1 },
    mobile: { pos: [0, -1.0, 0], rot: [deg(12), deg(-120), 0], scale: 1.15, opacity: 1 }
  }
];

/** Full keyframe for a section at the given breakpoint. */
export function effectiveKeyframe(s: SectionDef, mobile: boolean): Keyframe {
  return mobile ? s.mobile : s.desktop;
}

/** The partial exit override for a section at the given breakpoint (or undefined). */
export function exitPartial(s: SectionDef, mobile: boolean): Partial<Keyframe> | undefined {
  return mobile ? s.mobileExit : s.desktopExit;
}

/** Apply an exit partial on top of a base keyframe → a full keyframe. */
export function mergeExit(base: Keyframe, exit: Partial<Keyframe>): Keyframe {
  return {
    pos: (exit.pos ?? base.pos) as Vec3,
    rot: (exit.rot ?? base.rot) as Vec3,
    scale: exit.scale ?? base.scale,
    opacity: exit.opacity ?? base.opacity
  };
}
