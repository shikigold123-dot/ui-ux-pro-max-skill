# Effect catalogue (fx.js + core.js) — what, when, pitfalls

Use 4–6 signature effects per film, each tied to a line or object. Everything else: clean cuts, camera push (`cam`),
vignette, light grain.

| effect | function | use when | pitfalls |
|---|---|---|---|
| Camera push + cut punch | `cam(sid,t,push,punch)` | every shot | punch ≤ 0.1 under voice |
| Focus tracking | `trackCam(sid,t,KEYS,s,ax,ay)` | handshake hands, a foot, a trophy | 2–3 keyframes + glide; per-frame tracking of pumping hands jitters. Pick the calm part of the action (the clasp, not the shake) |
| Native crop | edl `"crop":[x,y]` | detail from a 4K original | needs the original file (Drive quota) |
| Push-in re-frame | `pushFrame` + `zoomAbout` | hide something at a frame edge (a grabbing hand) | anything tracked must be transformed analytically `x' = px+(x−px)·z`; zoom back out before an overlay that needs the full frame |
| Colour glow | `colorGlow(t,sid,sc,k,col,sweep)` | venue sign, logo, jerseys, a shirt print light up while the world goes grey | needs `color_mask.py` masks; look at peek_<sid>.jpg; use the object's own colour (not the film accent) |
| Text behind person | `behindPerson` / `cutout` | big word behind the speaker | `person_masks.py` per frame (0.4 s/frame) |
| Greeting script wipe | `scriptWipe` | Salam / welcome / names | Arabic rtl wipe, Latin after |
| Odometer | `odometer(t,'03.10.2026',t0,y,o,{sub,over})` | dates, scores, reps, € | placed AFTER the greeting, not as the first thing |
| Ring timer | `ringTimer` | match clock, round, set | words can orbit it with `arcWords` |
| Struck list | `strikeList` | "the goals of this world" lists | fade before the next question starts |
| Ball → Earth | `earthOn(t,track,...)` + `LAND` | "Erdkugel / the world" with any round object | track with `ball_track.py` on UN-overlaid stills (`NOEARTH=1`); whole globe fades in (no growing disc); keep a little dark surround; orbit text on top |
| Dust dissolve | `dustText` | a score/number that stops mattering | only one big number on screen (the duplicate "10:0" was a bug) |
| Portal | `portal(t,word,y,size,letterIdx,t0,next,nextAt)` | transition into the answer/prayer/ending | the word fills with the next scene, fly through a tall letter (I); needs ~0.9 s |
| Light line | `dawnLine(t,t0)` | opening a scene out of black | after a silent climax |
| Chat cold open | `chat.js` + mix PRE_FRAMES | recap for someone who missed it | video bubble below the last message with a gap; fade to BLACK into the film; NBSP before emoji |
| Climax treatment | black(), grayscale filter, `shake`, grain 0.1 | the hard line | no music, voice hall, drone, heartbeat |
| Flash | `flash(a)` | 1-beat action bursts only, ≤ 0.35, 2 frames | never as a scene transition (use black) |
| Zoom/dir blur | `zoomBlur`, `dirBlur` | whip-ins, photo pans | subtle |
| HUD | `hud()` | whole film, one label | no "ANSPRACHE ▸ 04:12" readouts |

## Tracking a round object
```bash
NOEARTH=1 FRAMES=$(seq -s, 1798 1856) node render/drive.js 0 0 trk stills
venv/bin/python ball_track.py trk balltrack.json 90 260
```
Then `BALLTRK = await (await fetch('../balltrack.json')).json()` in `projectSetup`, `earthOn(t, BALLTRK, …)`.

## Colour mask example (green sign)
`venv/bin/python color_mask.py n1 30,90,70 90,255,255 2500 1100` → `fmasks/n1/` + `peek_n1.jpg`.

## Winners photo pan
Pan across the group photo (each player ~1.2 s, a whoosh + click per step, slight dirBlur on the move), then the
whole photo with logo/title above, stats row below, place · date band. Info only on the full photo — not during the pan.
See `examples/bayan-turnier/main6.js` (`winners`, `winnerCam`).
