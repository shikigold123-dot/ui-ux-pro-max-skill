#!/usr/bin/env bash
# Scaffold a reel project. Usage: bash new_project.sh <projectDir>
# Layout:  raw/ (downloads)  frames/<shot>/  fmasks/<shot>/  speech/  music/  assets/ (poster.jpg, logo.png)
#          render/{index.html,core.js,kinetic.js,fx.js,main.js,chat.js,drive.js}  fonts/  land.json
#          edl.json → extract.py → shots.json · plan.json → vo_plan.py → vo.json · mix.py (+atoms.py) · output/
set -e
P=$1; SKILL=$(dirname "$(readlink -f "$0")")/..
mkdir -p "$P"/{raw,frames,fmasks,speech,music,assets,render,fonts,output,peek,seg}
cp "$SKILL"/templates/renderer/* "$P/render/"
cp "$SKILL"/assets/fonts/* "$P/fonts/"
cp "$SKILL"/assets/land-110m.json "$P/land.json"
cp "$SKILL"/scripts/atoms.py "$P/"; cp "$SKILL"/scripts/mix_template.py "$P/mix.py"
for f in extract.py vo_plan.py whisper_check.py transcribe.py voice_clean.py sync_clips.py music_analyze.py person_masks.py color_mask.py ball_track.py; do ln -sf "$SKILL/scripts/$f" "$P/$f"; done
ln -sf "$SKILL/scripts/render.sh" "$P/render.sh"; ln -sf "$SKILL/scripts/deliver.sh" "$P/deliver.sh"
[ -f "$P/shots.json" ] || echo '{}' > "$P/shots.json"; [ -f "$P/vo.json" ] || echo '[]' > "$P/vo.json"
echo "project ready: $P  (serve it: cd $P && python3 -m http.server 8765 --bind 127.0.0.1)"
