# 3D scroll layer

## ADDED Requirements

### Requirement: Scroll-driven 3D drone
The home page SHALL render an optional WebGL scene containing a single reused
drone model whose position, orientation, scale and opacity are driven by page
scroll progress across the home sections.

#### Scenario: Capable device
- **WHEN** a visitor with WebGL2, a fine/high-power device, and reduced-motion off loads the home page
- **THEN** the 3D scene mounts (three deps dynamically imported) and the drone animates between choreography keyframes as the page scrolls

#### Scenario: Reduced motion, no WebGL2, or low power
- **WHEN** the visitor has `prefers-reduced-motion: reduce`, lacks WebGL2 (incl. ad-blockers that null `getContext('webgl2')`), or is on a low-power/coarse-pointer device
- **THEN** the 3D bundle is NOT downloaded and the existing 2D raining-letters hero is shown instead

#### Scenario: Section distribution
- **WHEN** the visitor scrolls through the 7 home sections (hero → 關於我 → 專案技能 → 工作經歷 → 專案作品 → 學歷 → 聯絡方式)
- **THEN** the drone is visible in hero / 關於我 / 專案技能 / 學歷 / 聯絡方式 and fades to opacity 0 across 工作經歷 + 專案作品

### Requirement: Theme-swapped model
The scene SHALL load the bright or dark drone to match the active theme.

#### Scenario: Theme toggle
- **WHEN** the theme is bright vs. dark (or toggled at runtime)
- **THEN** the scene loads `/models/drone.bright.glb` vs. `/models/drone.dark.glb` respectively, decoded via MeshoptDecoder (the `.glb` is meshopt/WebP/quantization compressed, not Draco)

### Requirement: Performance budget
The 3D layer SHALL NOT regress home-page load beyond a defined budget.

#### Scenario: Payload ceiling
- **WHEN** the 3D layer ships
- **THEN** added gzip JS is ≤ ~200 KB, the model payload is the single ~610 KB drone (reused across sections), devicePixelRatio is capped at 1.5, and rAF pauses when the canvas is offscreen

### Requirement: Declarative, RWD-aware choreography
The scene SHALL be driven by a declarative choreography spec with per-breakpoint overrides, tuned via an in-scene panel.

#### Scenario: Interpolating keyframes
- **WHEN** scroll progress falls between two keyframes
- **THEN** the scene interpolates position/scale/opacity (lerp) and rotation (slerp) between them, applying desktop values or the `max-width:768px` mobile overrides as appropriate

#### Scenario: Tuning by dragging
- **WHEN** the user (in dev) drags the drone/camera via the leva panel + OrbitControls and copies the live values
- **THEN** those numbers can be frozen into `choreography.ts` without renderer code changes
