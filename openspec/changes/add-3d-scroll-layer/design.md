# Design — scroll-driven 3D layer

## Stack

- **Rendering**: `three` + `@react-three/fiber` (R3F) + `@react-three/drei`
  (helpers: `useGLTF`, `Environment`, `Bounds`).
- **Scroll driver**: `lenis` for smooth scroll + a scroll-progress value, OR R3F
  `ScrollControls`. Prefer Lenis (page-level, non-invasive) feeding a single
  `scrollProgress` 0–1 that the scene reads per frame.
- **Assets**: glTF 2.0 `.glb`, Draco-compressed, embedded textures, in
  `public/models/`. Loaded lazily via `useGLTF` with the Draco decoder from a
  local/CDN path.

## Island + capability gate

- `Scene3D.tsx` is `client:visible`. On mount it checks: `WebGL2` present,
  `matchMedia('(prefers-reduced-motion: reduce)')` off, and a coarse heuristic
  for low-power (deviceMemory / hardwareConcurrency / coarse pointer). If any
  fail → render nothing and let the existing 2D hero show.
- The `three` bundle is **dynamically imported** inside the effect so devices that
  fail the gate never download it.

## Choreography model

A declarative spec drives everything (the fill-in template):

```ts
// choreography.ts — user fills the angles; code interpolates between keyframes
export const SCENES = [
  { at: 0.00, model: 'chip',    cam: {pos:[0,0,6], rot:[0,0,0]},   obj: {rot:[0,0,0],     scale:1 } },
  { at: 0.25, model: 'chip',    cam: {pos:[2,1,5], rot:[0,-0.3,0]}, obj: {rot:[0,1.2,0.2], scale:1.1} },
  // ... one row per home section / scroll checkpoint
];
```

Per frame: find the two keyframes bracketing `scrollProgress`, `THREE.MathUtils.lerp`
(and quaternion slerp for rotations) between them, apply to camera + model.

## Performance budget

- Added gzip JS ≤ ~200 KB (three + R3F tree-shaken); each model ≤ ~300 KB Draco.
- Cap devicePixelRatio at 1.5; pause rAF when the canvas is offscreen
  (IntersectionObserver); single directional light + baked ambient, no heavy
  post-processing initially.

## Fallback

Keep the raining-letters hero as the non-3D path. If a static poster is wanted,
render `public/models/hero-poster.webp` instead.

## Alternatives considered

- **Pure CSS 3D / existing KineticGrid**: cheap but can't match the reference feel.
- **Spline / model-viewer embed**: faster to build but heavier runtime + less control.
- **Full-page immersive (mentaltoy-style)**: rejected — hurts LCP/clarity for
  recruiters; scope to hero + a couple of reveals.
