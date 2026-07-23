# Tasks — scroll-driven 3D layer

## 0. Prerequisites (user-supplied)
- [ ] User exports `.glb` models from Blender (glTF 2.0, Draco, embedded textures) → `public/models/`
- [ ] User fills the choreography spec (per section: model, camera pos/rotation, model rotation/scale, scroll %)
- [ ] Decide scope (hero only vs. + later sections) and fallback (raining-letters vs. static poster)

## 1. Dependencies & scaffolding
- [ ] Add `three`, `@react-three/fiber`, `@react-three/drei`, `lenis` (or GSAP ScrollTrigger)
- [ ] Add Draco decoder assets (local under `public/draco/`)
- [ ] Create `src/components/effects/Scene3D.tsx` island (dynamic-imports three)

## 2. Capability gate
- [ ] Detect WebGL2 + reduced-motion + low-power heuristic; bail (render nothing) on fail
- [ ] Ensure the three bundle is NOT fetched when gated out (dynamic import inside the effect)

## 3. Scene + choreography
- [ ] `choreography.ts` keyframe array (the fill-in template) + lerp/slerp interpolation
- [ ] Wire Lenis/ScrollTrigger scroll progress → per-frame camera/model transforms
- [ ] Load model(s) via `useGLTF` + Draco; single light + baked ambient

## 4. Performance
- [ ] Cap devicePixelRatio ≤ 1.5; pause rAF when canvas offscreen (IntersectionObserver)
- [ ] Verify added gzip JS ≤ ~200 KB and each model ≤ ~300 KB; measure LCP before/after

## 5. Integration + fallback
- [ ] Mount in `HomeSections.astro` hero (behind content, z-index managed)
- [ ] Keep raining-letters hero as the non-3D fallback (or static poster)
- [ ] a11y: no essential info conveyed only via 3D; respects reduced-motion

## 6. Verify
- [ ] Build green; eyeball on desktop + mobile; confirm gate disables 3D on reduced-motion/low-power
- [ ] Document the choreography-editing workflow in WORKFLOW.md
