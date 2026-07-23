# Design — opt-in ambient audio

## Component

- `AudioToggle.astro` rendered in `BaseLayout` header actions. Contains:
  - a single `<audio loop preload="none">` element (src set on first play),
  - a sound icon button (muted ↔ playing states),
  - a small track cycler shown only while playing (● ● ● dots or "1/3").
- Vanilla inline `<script>` (no framework needed).

## Behaviour

- **Default off.** No audio element network request until the user clicks (preload="none").
- First click → set `audio.volume = 0`, `audio.src = tracks[i]`, `play()`, then fade
  volume up to a low target (~0.25) over ~600ms.
- Toggle off → fade to 0 then `pause()`.
- Track cycle → fade current out, swap `src`, fade in.
- Persist `{ on: boolean, track: number }` in `localStorage['audio']`. On load, if
  `on` was true, DO NOT autostart (autoplay policy + courtesy) — show the icon in a
  "ready/paused" state; a click resumes.
- Icon reflects state; `aria-pressed` + `aria-label` for a11y.

## Assets

`public/audio/track{1,2,3}.mp3` — user-supplied, royalty-free/AI-generated, ~1 min
loopable, low bitrate (≤ ~96 kbps mono is fine for ambience) to keep size small.

## Alternatives considered

- **WebAudio-generated ambience** (no files): possible but low quality and complex;
  user prefers real tracks.
- **Autoplay on load**: rejected — violates UX norms + browser autoplay policy.
