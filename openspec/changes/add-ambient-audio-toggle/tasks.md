# Tasks — opt-in ambient audio

## 0. Prerequisites (user-supplied)
- [ ] User provides 3 loopable ~1-min tracks → `public/audio/track{1,2,3}.mp3`
      (royalty-free: Pixabay Music / Uppbeat / FMA, or AI-generated via Suno/Udio)
- [ ] Decide icon placement (header actions cluster vs. floating corner) and whether to show track names

## 1. Component
- [ ] `src/components/AudioToggle.astro`: `<audio loop preload="none">` + sound icon button + track cycler
- [ ] Mount in `BaseLayout` header actions

## 2. Behaviour
- [ ] Default OFF; no fetch until first click (preload="none")
- [ ] Fade in/out (~600ms) to a low target volume (~0.25); loop
- [ ] Track cycle: fade out → swap src → fade in
- [ ] Persist `{on, track}` in localStorage; on return, do NOT autostart (show ready state)
- [ ] a11y: `aria-pressed` + `aria-label`; never autostart

## 3. Verify
- [ ] Build green; confirm no audio request on load; toggle works; choice persists
- [ ] Confirm it does not autostart on return visits
