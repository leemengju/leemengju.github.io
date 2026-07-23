# Add opt-in ambient audio toggle

## Why

The user wants to try background audio: 3 ambient tracks (~1 min each) switchable
from the nav, with a sound on/off icon. Background audio on a résumé portfolio is
risky — recruiters often browse in quiet/shared spaces, and autoplay is intrusive
and an accessibility concern. So the only acceptable form is **opt-in, OFF by
default**, with an obvious control and persistence.

Note: audio files must be **user-supplied** — Claude cannot synthesize audio.

## What Changes

- Add a small audio control in the header/nav: a **mute/unmute (sound) icon** and,
  when on, a way to cycle the 3 tracks.
- Playback is **off by default**; a first user gesture (click) is required to start
  (browser autoplay policy). Choice + selected track persist in `localStorage`.
- Tracks loop (~1 min each), low volume, fade in/out on toggle.
- Respect a "reduce" preference: never autostart; keep it purely manual.

## Impact

- Affected: `BaseLayout.astro` (header control) + a new
  `src/components/AudioToggle.astro` (or a tiny island) with an `<audio>` element.
- New assets: `public/audio/track1.mp3`, `track2.mp3`, `track3.mp3`
  (**user-supplied**; royalty-free from Pixabay Music / Uppbeat / FMA, or
  AI-generated via Suno/Udio). MP3 ~1 min, small bitrate.
- Risk: UX/accessibility — mitigated by off-by-default + explicit control.

## Open Questions

- Icon placement: in the header actions cluster (next to lang/theme) or a floating
  corner button?
- Show track names, or just "1 / 2 / 3" cycling?
- Per-page or site-wide playback continuity?
