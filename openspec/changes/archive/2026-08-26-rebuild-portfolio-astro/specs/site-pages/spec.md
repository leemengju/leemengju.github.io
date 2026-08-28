## ADDED Requirements

### Requirement: Home page with project listing
The system SHALL provide a home page containing an introduction section and a listing of all projects generated from the content collection.

#### Scenario: Projects rendered from content
- **WHEN** the home page is built
- **THEN** it lists every project in the collection, each linking to its detail page

#### Scenario: Ordering
- **WHEN** projects define an `order` (or a grouping)
- **THEN** the listing renders them in that order rather than filesystem order

### Requirement: Per-project detail page
The system SHALL generate one detail page per project from its markdown, rendering the frontmatter header (title, role, period, tags) and the markdown body.

#### Scenario: Detail page generation
- **WHEN** a project exists in the collection
- **THEN** a static page is generated at a stable slug-based URL

#### Scenario: Optional GitHub control
- **WHEN** a project defines `github`
- **THEN** the detail page renders a "View on GitHub" link to that URL

### Requirement: Navigation
The site SHALL provide navigation letting a visitor move between the home page and any project detail page.

#### Scenario: Return to home
- **WHEN** a visitor is on a project detail page
- **THEN** a navigation control returns them to the home page
