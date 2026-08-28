# Add scroll-driven 3D visual layer (home page)

## Why

The home page is currently 2D (raining-letters hero + section reveals). Reference
sites (mentaltoy, igloo.inc, musée.barvian) use scroll-driven WebGL to feel
"technically extraordinary." For a full-stack/backend/data engineer portfolio, a
restrained 3D layer of tech-themed objects (circuit boards, chips, connectors,
server racks, wireframe data structures) that react to scroll would reinforce the
brand — *if* it stays fast and degrades cleanly.

This is exploratory and large; three.js is heavy. The scoped version (finalized
2026-07-27): **one reused drone model** across five home sections, not a full
immersive site. See design.md/tasks.md for the finalized plan.

## What Changes

- Add a `client:visible` React-Three-Fiber island rendered behind the home
  content, so it never blocks SSR or LCP.
- A scroll-progress driver (Lenis) maps page scroll to model (+ camera)
  transforms per a **choreography spec** keyed to real section DOM boundaries.
- Load one low-poly `.glb` drone (**meshopt-compressed + WebP + quantization**,
  ~610 KB), theme-swapped bright/dark; decoded with MeshoptDecoder (not Draco).
- Capability gate: **prefers-reduced-motion**, coarse/low-power devices, and absent
  WebGL2 get the current 2D hero — no 3D loaded at all (dynamic import).
- A dev-only **leva tuning panel** lets the user drag each section to taste and
  copy the live numbers into `choreography.ts` (numbers can't be filled blind).

## Impact

- Affected: `src/components/HomeSections.astro` (mount point), a new
  `src/components/effects/Scene3D.tsx` island + `choreography.ts`, `astro.config`
  (three deps), and `public/models/drone.{bright,dark}.glb` assets.
- New dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `lenis`.
- Risks: JS + model payload (LCP/TTI regression), mobile GPU cost, a11y. All
  gated behind capability checks + a hard performance budget.

## Resolved (was Open Questions)

- **Which sections get 3D** → hero / 關於我 / 專案技能 / 學歷 / 聯絡方式 (5 of 7);
  工作經歷 + 專案作品 fade the drone out.
- **Payload budget** → added gzip JS ≤ ~200 KB; a single ~610 KB drone (reused),
  reducible to ~350–400 KB via 512 px textures if needed.
- **Fallback** → keep the raining-letters hero (no static poster).
