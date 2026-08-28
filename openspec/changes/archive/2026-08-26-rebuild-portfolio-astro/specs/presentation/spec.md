## ADDED Requirements

### Requirement: Non-image visual vocabulary
The system SHALL provide reusable presentation components so pure-logic projects can be shown richly without photographs: a metric card, a before/after comparison, a Mermaid diagram block, a code block, a log/terminal block, a timeline, and tag chips.

#### Scenario: Metric card
- **WHEN** a project supplies a headline metric (e.g. `104s → 5s`, `~21×`)
- **THEN** it renders as a prominent metric card

#### Scenario: Mermaid diagram from text
- **WHEN** a project's markdown contains a Mermaid code block
- **THEN** it renders as a vector diagram at build time with no image file committed

#### Scenario: Project without images
- **WHEN** a project has no `cover` and no screenshots
- **THEN** its page still renders as a complete, visually structured page using the vocabulary components

### Requirement: Auto-generated cover
The system SHALL be able to generate a typographic cover (from title, metric, and tags) for projects that lack a supplied `cover` image.

#### Scenario: Fallback cover
- **WHEN** a project defines no `cover`
- **THEN** a generated typographic cover is used in listings and social/OG previews

### Requirement: Progressive animation
The site SHALL apply animation progressively: CSS plus IntersectionObserver by default, with optional GSAP for scroll-driven effects and an optional Framer Motion island, all loaded client-side and only where needed.

#### Scenario: Default reveal without heavy JS
- **WHEN** a section scrolls into view on a page that uses only the default tier
- **THEN** its reveal animation plays without loading any animation framework

#### Scenario: Island hydration
- **WHEN** a component requires interactive animation
- **THEN** it is an island hydrated via `client:visible` so the rest of the page ships as static HTML
