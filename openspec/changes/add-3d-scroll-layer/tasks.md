# Tasks — scroll-driven 3D layer

> Updated 2026-07-27 to the finalized plan (see design.md): one meshopt drone,
> theme-swapped, across 5 of 7 home sections; leva-assisted tuning.

## 0. Prerequisites (user-supplied) — DONE
- [x] Optimized `.glb` models provided: `referenceForProtfolio/3D/model/optimized/drone.{bright,dark}.glb` (~610 KB each, meshopt + WebP + quantization)
- [x] Per-section effect descriptions provided (see design.md choreography table)
- [x] Scope decided: 5 sections show the drone, 工作經歷/專案作品 fade out; fallback = keep raining-letters hero

## 1. Dependencies & assets
- [ ] Copy `drone.bright.glb` + `drone.dark.glb` → `public/models/`
- [ ] Add `three`, `@react-three/fiber`, `@react-three/drei`, `lenis`
- [ ] Loader: wire **MeshoptDecoder** (`three/examples/jsm/libs/meshopt_decoder.module.js`) — **not** Draco
- [ ] Create `src/components/effects/Scene3D.tsx` island (dynamic-imports three)

## 2. Capability gate
- [ ] Detect WebGL2 + reduced-motion + low-power heuristic; bail (render nothing) on fail
- [ ] Ensure the three bundle is NOT fetched when gated out (dynamic import inside the effect)
- [ ] Verify the ad-blocker / null-WebGL2 path falls back to the 2D hero cleanly (中文說明 §3 note)

## 3. Scene + choreography
- [ ] `choreography.ts`: 7-section keyframes with `{ pos, rot(quat), scale, opacity }` + **mobile overrides** (`max-width:768px`); lerp + slerp interpolation
- [ ] Encode the per-section intent from design.md (hero 70%-overflow worm's-eye → 關於我 turntable → 專案技能 0.3 behind cards → fade out → 學歷 fly-back → 聯絡方式 parked + shadow)
- [ ] Resolve section boundaries from real DOM offsets (not fixed `at` fractions)
- [ ] Wire Lenis scroll progress → per-frame model (+ camera) transforms + opacity channel
- [ ] Theme-swap: load `drone.bright.glb` / `drone.dark.glb` per `data-theme`; hot-swap on toggle
- [ ] 關於我 idle 360° auto-rotate; 聯絡方式 ground shadow (contact-shadow / plane)
- [ ] Single directional light + baked ambient

## 4. Performance
- [ ] Cap devicePixelRatio ≤ 1.5; pause rAF when canvas offscreen (IntersectionObserver)
- [ ] Verify added gzip JS ≤ ~200 KB; model load is the single ~610 KB drone; measure LCP before/after

## 5. Tuning (dev-only)
- [ ] leva panel + OrbitControls + "copy current camera/model values" button
- [ ] User drags each section to taste → copies live numbers → freezes into `choreography.ts`

## 6. Integration + fallback
- [ ] Mount in `HomeSections.astro` (fixed/absolute canvas behind content, z-index managed; tagline stays in front)
- [ ] Keep raining-letters hero as the non-3D fallback
- [ ] a11y: no essential info conveyed only via 3D; respects reduced-motion

## 7. Verify
- [ ] Build green; eyeball on desktop + mobile; confirm gate disables 3D on reduced-motion/low-power/no-WebGL2
- [ ] Confirm bright/dark model swap on theme toggle
- [ ] Document the choreography-editing (leva) workflow in WORKFLOW.md
