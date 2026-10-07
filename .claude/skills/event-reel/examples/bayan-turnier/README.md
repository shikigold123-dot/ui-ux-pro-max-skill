# Reference implementation — Bayan Turnier reel (v12, 1:39)

The real project files the skill was distilled from. They depend on the original footage and on each other
(main6 → main7 → main8 → chat8 are layered patches on an older base.js), so they don't run standalone — read them for
patterns, then rebuild with `templates/renderer/` (core.js / kinetic.js / fx.js expose the same functions, cleaned up).

| file | what to look at |
|---|---|
| `main8.js` | final film: timeline constants, hero blocks, tactics board, "ein TEAM." on the turf, clock with arc words, goals list, ball→Earth (`earth8`, `lensFrame` analytic re-framing), chase waves, music-less climax (`climax8`), portal through SPIEL, prayer with الله, LaOla colour glow (`laolaWow`), hands-only handshake (`o2Cam`), `draw8` dispatch, shot overrides in `setup` |
| `main6.js` | intro wordmark, arrival, winners photo pan (`winners`, `winnerCam`), person cut-outs |
| `main7.js` | speech chapter with lip-synced speaker shots, match montage on the beat grid |
| `chat8.js` | chat cold open (→ templates/renderer/chat.js) |
| `vo8.py` | voice plan with the manual overrides that fixed clipped words (→ scripts/vo_plan.py) |
| `audio8.py` | full mix: phrase repeat, hard stop + hall tail + resume, voice hall in the climax, frame-log bed, every SFX cue, chat sounds (→ scripts/mix_template.py) |
