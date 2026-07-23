# Add scroll-driven 3D visual layer (home page)

## Why

The home page is currently 2D (raining-letters hero + section reveals). Reference
sites (mentaltoy, igloo.inc, musée.barvian) use scroll-driven WebGL to feel
"technically extraordinary." For a full-stack/backend/data engineer portfolio, a
restrained 3D layer of tech-themed objects (circuit boards, chips, connectors,
server racks, wireframe data structures) that react to scroll would reinforce the
brand — *if* it stays fast and degrades cleanly.

This is exploratory and large; three.js is heavy. The intent is a **scoped**
version (one hero object or a few scroll-reveal models), not a full immersive site.

## What Changes

- Add a `client:visible` React-Three-Fiber island rendered behind/within the hero
  (and optionally 1–2 later sections), so it never blocks SSR or LCP.
- A scroll-progress driver (Lenis smooth-scroll or GSAP ScrollTrigger) maps page
  scroll to camera and/or model transforms per a **choreography spec**.
- Load low-poly glTF/`.glb` models (Draco-compressed), themed to the engineer brand.
- Capability gate: **prefers-reduced-motion**, coarse/low-power devices, and absent
  WebGL2 get the current 2D hero — no 3D loaded at all (dynamic import).
- Deliver a fill-in **choreography template** the user completes (per section:
  model, camera pos/rotation, model rotation/scale, at what scroll %).

## Impact

- Affected: `src/components/HomeSections.astro` (mount point), a new
  `src/components/effects/Scene3D.tsx` island, `astro.config` (three deps), and
  `public/models/*.glb` assets.
- New dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, a scroll lib.
- Risks: JS + model payload (LCP/TTI regression), mobile GPU cost, a11y. All
  gated behind capability checks + a hard performance budget.
- **User-supplied assets required**: `.glb` models (glTF 2.0, Draco, embedded
  textures, exported from Blender) and the filled choreography spec.

## Open Questions

- Which sections get 3D (hero only vs. multiple)?
- Payload budget ceiling (target: added gzip JS ≤ ~200 KB, each model ≤ ~300 KB)?
- Fallback: static poster image vs. keep the raining-letters hero?
