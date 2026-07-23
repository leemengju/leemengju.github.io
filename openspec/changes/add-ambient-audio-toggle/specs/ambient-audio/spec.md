# Ambient audio

## ADDED Requirements

### Requirement: Opt-in ambient audio
The site SHALL offer optional background audio that is OFF by default and only
starts on an explicit user gesture.

#### Scenario: Default load
- **WHEN** any visitor loads a page
- **THEN** no audio plays and no audio file is fetched (the control shows a muted icon)

#### Scenario: User enables audio
- **WHEN** the visitor clicks the sound icon
- **THEN** the selected track loads and fades in at low volume, looping, and the choice persists in localStorage

#### Scenario: Return visit
- **WHEN** a visitor who previously enabled audio returns
- **THEN** audio does NOT autostart; the control shows a ready state and a click resumes it

### Requirement: Track switching
The control SHALL let the visitor cycle between 3 tracks while audio is on.

#### Scenario: Cycle track
- **WHEN** audio is playing and the visitor selects a different track
- **THEN** the current track fades out, the new track loads and fades in, and the selection persists
