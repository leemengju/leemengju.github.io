## ADDED Requirements

### Requirement: Static build
The system SHALL build to static HTML/CSS/JS via Astro, shipping zero JavaScript on pages that use no islands.

#### Scenario: Static output
- **WHEN** the project is built
- **THEN** it produces a static output directory servable by any static host with no server runtime

### Requirement: Automated GitHub Pages deploy
The system SHALL deploy to GitHub Pages via a GitHub Actions workflow triggered on push to the default branch.

#### Scenario: Push to main deploys
- **WHEN** a commit is pushed to the default branch
- **THEN** the workflow builds the site and publishes it to GitHub Pages

#### Scenario: Build failure blocks deploy
- **WHEN** the build fails (e.g. content schema error)
- **THEN** the workflow fails and the previously published site is left unchanged

### Requirement: Base path and domain configuration
The site config SHALL set `site` and, when the repository is a project page rather than `<account>.github.io`, a `base` path, and SHALL be ready to switch to a custom domain later.

#### Scenario: Project-page base path
- **WHEN** the repository name is not `<account>.github.io`
- **THEN** internal links and assets resolve correctly under the project sub-path

#### Scenario: Custom domain readiness
- **WHEN** a custom domain is later configured
- **THEN** switching requires only configuration/CNAME changes, not content restructuring
