#!/usr/bin/env bash
# Self-test of the toolchain with synthetic footage: builds a demo project, renders QC stills + a short full render.
# Usage: bash demo_project.sh <dir>   → <dir>/peek/demo_sheet.jpg (look at it) and <dir>/master_demo.mp4
set -e
P=$1; SKILL=$(dirname "$(readlink -f "$0")")
bash "$SKILL/new_project.sh" "$P" > /dev/null
cd "$P"
mk() { ffmpeg -nostdin -v error -y -f lavfi -i "$2=size=1080x1920:rate=30:duration=$3" -vf "drawtext=fontfile=fonts/Anton-Regular.ttf:text='$1':x=(w-tw)/2:y=h*0.18:fontsize=120:fontcolor=white@0.8" -c:v libx264 -pix_fmt yuv420p raw/$1.mp4; }
for s in arr1 arr2 talk1 act1 act2 act3 act4 act5 act6 end1; do mk $s testsrc2 8; done
python3 - <<'PY'
import json
BEAT = 0.6; M0 = 14.0; bt = lambda k: M0 + k * BEAT
ed = [("arr1", 3.2, 5.6), ("arr2", 5.6, 8.0), ("talk1", 8.0, M0)]
beats = [2, 4, 1, 1, 1, 1, 2, 4]   # mixed tempo
k = 0; ids = ["act1", "act2", "act3", "act4", "act5", "act6", "act1", "act2"]
for i, n in enumerate(beats):
    ed.append((ids[i] + ("" if i < 6 else "b"), bt(k), bt(k + n))); k += n
ed.append(("end1", bt(16) + 6.0, bt(16) + 11.0))
shots = [{"id": i, "src": f"raw/{i[:4] if i.endswith('b') else i}.mp4", "in": 0.5, "a": round(a, 3), "b": round(b, 3)} for i, a, b in ed]
json.dump({"grade": "G2", "shots": shots}, open("edl.json", "w"), indent=1)
vo = [{"id": "V1", "segs": [], "words": [["Das", 8.6, 8.8, 0], ["Leben", 8.85, 9.2, 0], ["ist", 9.25, 9.4, 0], ["Fußball", 9.5, 10.1, 0], ["genau", 10.3, 10.6, 0], ["wie", 10.65, 10.8, 0], ["hier.", 10.85, 11.3, 0]]},
      {"id": "V2", "segs": [], "words": [["Wir", 15.0, 15.2, 0], ["rennen", 15.25, 15.6, 0], ["der", 15.65, 15.8, 0], ["Dunya", 15.85, 16.4, 0], ["hinterher.", 16.5, 17.3, 0]]}]
json.dump(vo, open("vo.json", "w"), ensure_ascii=False)
PY
sed -i 's/const BEAT = 60 \/ 100;/const BEAT = 0.6;/' render/main.js
python3 extract.py edl.json > /dev/null
python3 - <<'PY'
import json; s = json.load(open('shots.json'))
# the 'b' shots reuse frames of their base clip
json.dump(s, open('shots.json', 'w'))
PY
(nohup python3 -m http.server 8765 --bind 127.0.0.1 > /dev/null 2>&1 &); sleep 1
FRAMES=20,60,110,150,200,260,300,330,430,470,520,560,600,640,700,725,745,775,800,830 node render/drive.js 0 0 peek/demo stills | grep -iE "error|shots" || true
ffmpeg -nostdin -v error -y -pattern_type glob -i 'peek/demo/*.jpg' -vf "scale=216:384,tile=10x2" -frames:v 1 peek/demo_sheet.jpg
echo "sheet: $P/peek/demo_sheet.jpg"
