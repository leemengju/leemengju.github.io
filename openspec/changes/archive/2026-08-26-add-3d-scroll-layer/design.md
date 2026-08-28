# Design — scroll-driven 3D layer

> Finalized 2026-07-27 from `referenceForProtfolio/3D/.../中文說明.md` §5 and the
> user's per-section effect descriptions. Where this differs from the original
> proposal (Draco, multiple models, template angles), **this file wins**.

## Stack

- **Rendering**: `three` + `@react-three/fiber` (R3F) + `@react-three/drei`
  (`useGLTF`, `Environment`).
- **Scroll driver**: `lenis` (page-level smooth scroll) feeding a single
  `scrollProgress` 0–1; the scene reads it per frame. Section boundaries are
  resolved from the real DOM elements (IntersectionObserver / measured offsets),
  **not** hard-coded `at` fractions, so layout changes don't desync it.
- **Assets**: one glTF 2.0 `.glb` in `public/models/`, **meshopt-compressed**
  (`EXT_meshopt_compression` + `EXT_texture_webp` + `KHR_mesh_quantization`),
  ~610 KB. Loaded lazily via `useGLTF`.

## Model: one drone, theme-swapped

- **A single model, reused across all five 3D sections** — only its position,
  orientation and scale change. Loaded once, cached.
- Bright theme → `/models/drone.bright.glb`; Dark theme → `/models/drone.dark.glb`.
  On theme toggle, swap the loaded URL:
  ```ts
  const theme = document.documentElement.dataset.theme
    ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const url = `/models/drone.${theme === 'dark' ? 'dark' : 'bright'}.glb`;
  ```
- **Loader uses MeshoptDecoder, NOT Draco** (the optimized `.glb` is meshopt):
  ```ts
  import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
  // gltfLoader.setMeshoptDecoder(MeshoptDecoder)   ← replaces DRACOLoader
  ```
  WebP textures + quantization are natively supported by three; no extra setup.

## Island + capability gate

- `Scene3D.tsx` is `client:visible`. On mount it checks: `WebGL2` present,
  `matchMedia('(prefers-reduced-motion: reduce)')` off, and a coarse low-power
  heuristic (`deviceMemory` / `hardwareConcurrency` / coarse pointer). Any failure
  → render nothing; the existing 2D raining-letters hero stays.
- `three` is **dynamically imported** inside the effect, so gated-out devices
  (incl. ad-blockers that null `getContext('webgl2')`) never download it.

## Home structure & 3D distribution (7 sections)

Order: **hero → 關於我 → 專案技能 → 工作經歷 → 專案作品 → 學歷 → 聯絡方式**.
The drone shows in **5**; it fades out for the two project/experience sections.

| # | Section | 3D? | Opacity |
|---|---------|:--:|---|
| 1 | Hero | ✅ | 1 |
| 2 | 關於我 (About) | ✅ | 1 |
| 3 | 專案技能 (Skills) | ✅ | 0.3 (behind cards) |
| 4 | 工作經歷 (Experience) | ❌ | fade → 0 |
| 5 | 專案作品 (Projects) | ❌ | 0 |
| 6 | 學歷 (Education) | ✅ | fade back → 1 |
| 7 | 聯絡方式 (Contact) | ✅ | 1 |

## Choreography — per-section intent (source of truth)

The user described the desired feel per section (exact numbers get dialled in via
the leva panel below). Each keyframe carries a **desktop** value + a **mobile
override** (`max-width: 768px`).

| Section | Desired effect (desktop) | Mobile override |
|---|---|---|
| **Hero** | Drone fills the **top-right**, very prominent; **nose toward top-left**; only ~**70 %** of it visible, the rest overflowing past the window edge; viewer looks **up** at it (worm's-eye). Body may overlap the tagline text; letter-rain keeps falling; the tagline "讀懂使用者…" stays **in front** (above the drone in z/paint order). | Shrink & pull toward centre-top so it doesn't bury the tagline. |
| **關於我** | Drone **lands to the LEFT** of the "我是孟儒…" paragraph; **whole** drone visible; ~**1/3** of the viewport; viewer at **eye level**; body **slowly auto-rotates 360°** like a showcase turntable. | Stack **vertically**: drone above/below the paragraph, not beside it. |
| **專案技能** | Drone **hidden behind the skill cards**, opacity **0.3**, tilted **~20° toward top-left**, **centred**. | Same, kept subtle behind content. |
| **工作經歷 / 專案作品** | **No drone** — fade to 0 before 工作經歷, stay 0 through 專案作品. | Same. |
| **學歷** | Drone to the **RIGHT of the "學歷" heading**; feels like it **flew back from far away** (small speed-streak flourish); **nose toward viewer, offset ~20° right**; reads as if it swooped down from the left of the previous section. | Keep to the right/top, scaled down. |
| **聯絡方式** | Drone **slowly enlarges into a parked state**; viewer looks **slightly down** onto its top; positioned **bottom-right but not clipping the bottom**; render a **parked-state ground shadow**; **nose toward left ~45°**; **20 px** gap from both bottom and right; ~**1/3** of viewport. | Centre-bottom, scaled to fit, shadow kept. |

Interpolation: per frame, find the two keyframes bracketing `scrollProgress`,
`lerp` positions/scale and **slerp** quaternions between them, apply to the model
(and, where useful, the camera). Opacity is its own interpolated channel so the
工作經歷/專案作品 fade is independent of transform.

## Tuning workflow — "describe it, let the tool emit the numbers"

Because filling angles blind is hopeless, ship a **dev-only leva panel +
draggable OrbitControls + a "copy current values" button**. The user drags the
drone to match each section's description, copies the live camera/model numbers,
and pastes them into `choreography.ts`. (Do **not** copy angles from Blender —
Z-up vs Y-up differs; Tripo's viewer has no numbers to copy. Only this scene's
panel is authoritative.)

## Performance budget

- Added gzip JS ≤ ~200 KB (three + R3F, tree-shaken); model load is the single
  **~610 KB** drone (re-read of the "≤300 KB per model" budget, which assumed
  several models — here there is one, reused). Tighten to ~350–400 KB by
  re-compressing textures to 512 px if needed.
- Cap `devicePixelRatio` at 1.5; pause rAF when the canvas is offscreen
  (IntersectionObserver); single directional light + baked ambient; no heavy
  post-processing initially.

## Fallback

Keep the raining-letters hero as the non-3D path (no static poster needed).

## Alternatives considered

- **Pure CSS 3D / existing KineticGrid**: cheap but can't match the reference feel.
- **Spline / model-viewer embed**: faster but heavier runtime + less control.
- **Full-page immersive (mentaltoy-style)**: rejected — hurts LCP/clarity for
  recruiters; scope is one reused drone across five sections.
