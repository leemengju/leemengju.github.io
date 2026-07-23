# 3D scroll layer

## ADDED Requirements

### Requirement: Scroll-driven 3D hero
The home page SHALL render an optional WebGL scene whose camera and/or model
transforms are driven by page scroll progress, themed to tech objects.

#### Scenario: Capable device
- **WHEN** a visitor with WebGL2, a fine/high-power device, and reduced-motion off loads the home page
- **THEN** the 3D scene mounts (three deps dynamically imported) and animates model/camera between choreography keyframes as the page scrolls

#### Scenario: Reduced motion or low power
- **WHEN** the visitor has `prefers-reduced-motion: reduce`, lacks WebGL2, or is on a low-power/coarse-pointer device
- **THEN** the 3D bundle is NOT downloaded and the existing 2D hero is shown instead

### Requirement: Performance budget
The 3D layer SHALL NOT regress home-page load beyond a defined budget.

#### Scenario: Payload ceiling
- **WHEN** the 3D layer ships
- **THEN** added gzip JS is ≤ ~200 KB and each `.glb` model is ≤ ~300 KB (Draco), devicePixelRatio is capped at 1.5, and rAF pauses when the canvas is offscreen

### Requirement: Declarative choreography
The scene SHALL be driven by a declarative, user-editable choreography spec.

#### Scenario: Editing angles
- **WHEN** the user edits the choreography keyframes (model, camera pos/rotation, model rotation/scale, scroll %)
- **THEN** the scene interpolates (lerp/slerp) between adjacent keyframes without code changes to the renderer
