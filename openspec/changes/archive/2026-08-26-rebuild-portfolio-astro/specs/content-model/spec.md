## ADDED Requirements

### Requirement: Project content collection
The system SHALL store each project as a single markdown file in a typed Astro content collection, so projects are version-controlled and editable as plain text.

#### Scenario: Adding a project
- **WHEN** a new markdown file is added under the projects content directory with valid frontmatter
- **THEN** the build includes it as a project without any other code change

#### Scenario: Invalid frontmatter
- **WHEN** a project file is missing a required frontmatter field or uses a wrong type
- **THEN** the build fails with a schema validation error identifying the file and field

### Requirement: Frontmatter schema
Each project SHALL declare frontmatter with required fields `title`, `role`, `period`, `tags` and optional fields `cover`, `github`, `metrics`, `order`. The `github` field SHALL be optional so projects without a public repository omit it.

#### Scenario: Optional GitHub link absent
- **WHEN** a project file has no `github` field
- **THEN** the rendered page shows no "View on GitHub" control and does not error

#### Scenario: Metric highlight present
- **WHEN** a project defines `metrics`
- **THEN** that value is available to the page for a headline metric display

### Requirement: Content reuse and i18n-ready structure
The content model SHALL allow project write-ups to be seeded from the existing résumé markdown, and SHALL organize content so an English locale can be added later without restructuring existing files.

#### Scenario: zh-first with en deferred
- **WHEN** only Traditional Chinese content exists
- **THEN** the site builds and serves the zh content, and the structure permits adding an `en` variant later without moving existing files
