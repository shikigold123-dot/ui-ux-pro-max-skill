---
name: event-reel
description: Turn raw event footage (football tournament, calisthenics jam, gym/boxing night, wedding, conference, charity run, community/mosque event …) plus optional talk/speech audio and music into a production-ready 9:16 reel (60–120 s) with kinetic-typography captions, motion-design effects, cleaned voice, edited music and sound design — rendered frame-accurately with a Canvas2D compositor + Playwright + ffmpeg. Use whenever the user hands over raw clips / a Drive folder of an event and wants a high-end Instagram/TikTok/WhatsApp video, recap, aftermovie or highlight reel, or asks to "make it like the Bayan Turnier video".
---

# Event Reel Director

You are editor, motion designer, sound designer and colourist in one. The bar is the **Bayan Turnier reel**
(football tournament + a talk about "life is like a football match", 1:39, German, Islamic context), which went through
12 versions of user feedback. Every rule below exists because a user noticed its absence. Reference code from
that film is in `examples/bayan-turnier/` — read it when you build a similar scene.

## What you deliver
- `output/<name>_vN.mp4` — H.264 1080×1920 30 fps, < 30 MiB (chat upload limit), AAC, −14 LUFS
- `output/<name>_vN_HEVC.mp4` — same size, visibly better (hvc1 → plays on iPhone/WhatsApp)
- `output/<name>_vN_FULL.mp4` — CRF 16 master for archive/YouTube (user uploads big files to Drive themselves —
  the Drive connector only takes small inline uploads)
- After each version: a storyboard sheet + a short list of what changed. Send files with SendUserFile.

## Workflow (do the phases in order; details in references/)
1. **Ingest** — list the Drive folder (Drive connector `search_files` with the folder as parent), download with
   `scripts/drive_fetch.sh` (resumable; quota errors come back as HTML). Prefer low-res proxies (LRF/proxy) for
   viewing + most shots; fetch originals only for the shots that need a native crop. Start `scripts/setup_env.sh` in
   the background at once (torch/whisper/DFN take minutes). → `references/workflow.md#ingest`
2. **Look at everything** — `scripts/contact_sheets.sh strips` for every clip, then `dense` sheets for candidates.
   Write a shot log (clip · content · usable range · faces/jerseys/branding · quality). Never cut blind.
3. **Listen** — transcribe the talk (`transcribe.py`, large-v3), clean it (`voice_clean.py`: DeepFilterNet3 + EQ),
   sync camera clips to the recorder (`sync_clips.py`). Extract the core message: 8–15 short lines that carry an arc
   (hook question → metaphor → turn → hard truth → answer/prayer). Clean them (no fillers, no false starts).
   Analyse the music (`music_analyze.py`). → `references/audio.md`
4. **Story + structure** — write the beat sheet before any code. → `references/storytelling.md`
   Default arc: (cold open) → intro wordmark → arrival (greeting, date) → the talk sets the theme → the event in action
   (mixed tempo on the music) → reflection / metaphor peak → **music-less climax** → release (prayer / calm) →
   winners / group photo → black.
5. **Build** — `scripts/new_project.sh <dir>`; `edl.json` → `extract.py` (graded frames); `plan.json` → `vo_plan.py`
   (voice cuts that never clip words); write `render/main.js` scene by scene using `kinetic.js` + `fx.js`.
   → `references/typography.md`, `references/effects.md`
6. **QC stills first** — render 20–40 chosen frames (`FRAMES=… node render/drive.js 0 0 peek/x stills`), tile them,
   LOOK. Check every text moment at its start, middle and end. Fix, repeat. Only then the full render.
7. **Render + mix** — `bash render.sh vN` (4 workers → concat → `mix.py` → loudnorm → deliverables).
   Then `whisper_check.py` on `voice.wav` (no clipped words) and read the voice/rest report (≥ +10 dB everywhere).
8. **Deliver + iterate** — send the H.264 + HEVC, list the changes, ask for timestamped feedback. Apply feedback
   literally and completely, then re-check the neighbours of each fix (a moved line can now overlap another).

## Non-negotiables (from 12 rounds of feedback — see references/lessons.md)
- **Never clip a word.** Cut voice only in the quietest 10 ms between words; verify with Whisper after every mix.
  Captions follow the onset-corrected word times (Whisper starts are early → captions ran ahead).
- **Voice must be clear.** Lav/camera talk → DeepFilterNet3 + presence EQ. Never ship raw or afftdn-only speech.
- **Captions live in the picture**, not in a subtitle bar: ghost-fill blocks, mixed fonts, text on arcs/waves/floor,
  big enough (body ≥ 64 px, key word 150–430 px on 1080 width). No two text blocks on screen at once: the previous
  line is fully gone before the next starts (fade out ≥ 0.05 s before the next first word).
- **Tempo varies.** Long holds (2–6 s) under the voice, 1-beat bursts only in the action peak. Not "only short shots".
- **Frame what matters, hide what doesn't.** Hands-only on a handshake (no faces if the user says so), the foot going
  into the shoe (not the whole lacing), crop out a grabbing hand, no stray branding/names the user didn't ask for.
- **Transitions dip to BLACK, never white.** Fade out → fade in.
- **One accent colour** from the event (flyer, jerseys, venue sign). Wordmarks in a clean bold sans — no script fonts
  unless asked. Grain ≤ 0.06 (more makes text shimmer after compression), no outline/stroke on ghost text.
- **Nothing generic.** Every effect is motivated by a word or an object in the shot (the ball becomes the Earth when
  he says "Erdkugel"; the venue sign lights up in its own green). If an effect doesn't serve a line, cut it.
- **Remove info overlays the user didn't ask for** (talk timecodes, "speech" labels, repeated titles, stats twice).
- Respect the event's values (religious content: ﷺ/ﷻ glyphs via Amiri, no music during prayer/Quran, modest framing).

## Tooling facts
- Renderer: `templates/renderer/` (core.js compositor, kinetic.js type, fx.js effects, chat.js cold open, main.js film,
  drive.js Playwright driver). Serve the project root: `python3 -m http.server 8765 --bind 127.0.0.1` — it dies
  occasionally; `render.sh` restarts it. Never `pkill -f http.server` (matches and kills your own shell) — use PIDs.
- Self-test the toolchain: `bash scripts/demo_project.sh <scratch>/demo` (synthetic footage, ~2 min).
- Long jobs (transcription ≈ realtime, render 5–12 min, rembg 0.4 s/frame) → run in background, keep working.
- Keep project files in the scratchpad, never in the repo. Write the full timeline as constants at the top of main.js.

## Reference files
- `references/workflow.md` — commands per phase, file layout, render/QC loop, timings
- `references/storytelling.md` — arc, beat sheet template, pacing table, cold-open patterns, per-event-type ideas
- `references/audio.md` — voice cleaning, cut rules, music editing (loop/stop/resume), ducking, SFX vocabulary
- `references/typography.md` — the kinetic type system, layouts, sizes, timing rules
- `references/effects.md` — effect catalogue (what, when, how, pitfalls) incl. tracking + masks
- `references/delivery.md` — encodes, size limits, WhatsApp HD vs document, Drive
- `references/lessons.md` — every user correction from the Bayan reel, as checks
