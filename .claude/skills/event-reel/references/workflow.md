# Workflow — commands per phase

`SK=<path to this skill>` · `P=<scratchpad>/<event>` (project root, served over http) · run Python via `$P/venv/bin/python`
(create with `bash $SK/scripts/setup_env.sh $P`; or symlink an existing venv).

## 0 · Scaffold
```bash
bash $SK/scripts/new_project.sh $P            # render/ fonts/ land.json mix.py atoms.py + symlinked scripts
(bash $SK/scripts/setup_env.sh $P > $P/setup.log 2>&1 &)   # background: venv + DFN weights
```
Layout: `raw/` downloads · `frames/<shot>/00001.jpg` · `fmasks/<shot>/` · `speech/` · `music/` · `assets/` (poster.jpg =
winners/group photo, logo.png) · `peek/` QC stills · `seg/` render segments · `output/` deliverables.

## 1 · Ingest {#ingest}
- Drive folder → `search_files` (query `'<folderId>' in parents`) gives ids, names, sizes, mimeTypes. Save a list.
- `bash drive_fetch.sh <id> raw/<name> <size>` per file; run 3–4 in parallel in the background. Quota errors = HTML
  body → script waits and resumes with HTTP ranges. Check each with `ffprobe` (`file x | grep ISO`).
- Prefer proxies (DJI `.LRF`, GoPro `.LRV`, phone exports) for viewing and most shots. Originals only where a native
  crop is needed (hands, a foot, a detail) — a 4K frame cropped to 1080×1920 beats an upscaled proxy.
- Music the user uploads (mp3) → `ffmpeg -i x.mp3 -ac 2 -ar 48000 music/track.wav`.
- Photos (group/winners) → `assets/poster.jpg` (also the chat video thumbnail).

## 2 · Look
```bash
bash contact_sheets.sh strips raw peek/strips          # 8 frames per clip
bash contact_sheets.sh stack peek/sheet1.jpg peek/strips/{0001..0008}.jpg
bash contact_sheets.sh dense raw/0024.mp4 10 1 peek/d_0024.jpg     # 10 frames from 10 s, every 1 s (label = t×10)
```
Read every sheet. Shot log columns: clip · what happens · best range (s) · motion · faces? · jersey names/branding? ·
quality (focus, shake, exposure) · candidate role (hook, arrival, talk cover, action, emotion, ending).
Find: the strongest single moment (goal, trick, hug), a shot that matches each talk metaphor, a calm closing image.

## 3 · Listen
```bash
venv/bin/python transcribe.py speech/full.wav speech/full.json de        # background, ≈ realtime
venv/bin/python voice_clean.py speech/full.wav speech/full_clean.wav     # DFN3 + EQ (needs dfm/)
venv/bin/python sync_clips.py speech/full.wav speech/sync.json raw/0017.mp4 raw/0018.mp4 …   # camera ↔ recorder
venv/bin/python music_analyze.py music/track.wav
```
- If there is no separate recorder, extract the camera audio of the talk clips and clean that.
- Read the whole transcript. Pick lines, write them clean (what will be displayed) next to their recorder times.
- Sync score < 0.3 → wrong match; re-run with `clip=<expected seconds>` (from creation_time differences).
- Lip-sync shots (speaker on screen while his voice plays): set the shot's `in` so the clip's time = recorder time −
  sync offset; i.e. `in = (mic_word_time − clip_offset) − (film_word_time − shot.a)`.

## 4 · Story → `references/storytelling.md`. Write the beat sheet (time · picture · voice line · type · sound) first.

## 5 · Build
- `edl.json` → `python3 extract.py edl.json` (graded G2 frames + shots.json). Native crops: `"crop":[x,y]` on the
  original's pixel grid. Proxies: `"proxy":true`. Slow motion only if the user wants it (Bayan: no slow-mo in match).
- `plan.json` → `venv/bin/python vo_plan.py plan.json` → vo.json (+ printed lines). Read the printout: first/last
  words complete? capitalisation? numbers merged (`10`, `-0` → `10:0`)?
- `render/main.js`: timeline constants at top (`const T = {...}`, `BEAT`, `M0`, `DUR`), one async function per chapter,
  `draw(t,f)` dispatch, overlays that cross cuts (e.g. a word riding into the next shot) drawn after the scene.
  `window.DURATION = DUR`. Enable `chat.js` in index.html if there is a chat cold open (edit `CHAT`).
- Masks/tracking only where an effect needs them: `person_masks.py`, `color_mask.py`, `ball_track.py`.

## 6 · QC stills (every iteration)
```bash
(cd $P && nohup python3 -m http.server 8765 --bind 127.0.0.1 > /dev/null 2>&1 &)
FRAMES=$(python3 -c "print(','.join(str(int(t*30)) for t in [6.4,21.7,30.6,37.6]))") node render/drive.js 0 0 peek/v3 stills
ffmpeg -v error -y -pattern_type glob -i 'peek/v3/*.jpg' -vf "scale=216:384,tile=10x4" -frames:v 1 peek/v3.jpg
```
Frame numbers include the chat opener (f = (PRE + t)·30). Check: text overlap, text leaving frame, spacing between
words of different fonts, legibility on bright footage, faces/hands, black dips, grain.

## 7 · Render + mix
`NAME=<event> bash render.sh v3` → seg/ → master_v3.mp4 → output/. Then:
```bash
venv/bin/python whisper_check.py vo.json voice.wav de      # every line: plan vs heard
ffmpeg -v error -y -i output/<n>_v3.mp4 -vf "fps=0.55,scale=200:-1,tile=9x6:padding=4" -frames:v 1 output/storyboard_v3.jpg
```
Timings: render ≈ 1.5–6 min per 30 s of film on 4 workers; mix < 1 min; deliver 3–5 min (veryslow + x265 2-pass).

## 8 · Iterate
- Keep `vN` backups of main.js/mix.py/plan.json before big edits (`cp main.js main.js.v8bak`).
- User timestamps refer to the delivered file (including the chat opener). Convert: film t = user t − PRE.
- After each fix, re-render stills around the fix ±2 s, then full render. Don't ship a version you haven't watched
  as stills + read the Whisper check.
