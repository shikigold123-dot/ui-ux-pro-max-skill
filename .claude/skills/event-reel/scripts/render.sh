#!/usr/bin/env bash
# Full render: 4 parallel Chromium workers → concat → mix → master (loudnorm) → deliverables.
# Usage (from the project root): NAME=bayan bash render.sh <version>
# Reads film length from the page (window.DURATION in main.js, window.PRE from chat.js if loaded).
# Speed: ~25–40 ms/frame per worker for plain scenes, 150+ ms with masks/blur — a 95 s film ≈ 6–12 min.
set -e
V=${1:-v1}; SKILL=$(dirname "$(readlink -f "$0")")
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/render/index.html | grep -q 200 || { (nohup python3 -m http.server 8765 --bind 127.0.0.1 > /dev/null 2>&1 &); sleep 1; }
read DUR PRE < <(node render/drive.js 0 0 - info | tail -1)
PREF=$(python3 -c "print(round($PRE*30))"); N=$(python3 -c "print(round(($DUR+$PRE)*30))")
mkdir -p seg; Q=$(( (N + 3) / 4 ))
echo "rendering $N frames (film ${DUR}s + opener ${PRE}s) → $V"
for k in 0 1 2 3; do a=$((k*Q)); b=$(( (k+1)*Q )); [ $b -gt $N ] && b=$N; node render/drive.js $a $b seg/s$k.mp4 > seg/s$k.log 2>&1 & done; wait
grep -h "pageerror" seg/s*.log | sort | uniq -c | head -5 || true
printf "file 's0.mp4'\nfile 's1.mp4'\nfile 's2.mp4'\nfile 's3.mp4'\n" > seg/list.txt     # fixed list written AFTER wait (no concat race)
ffmpeg -nostdin -v error -y -f concat -safe 0 -i seg/list.txt -c copy seg/video.mp4 && echo RENDERED
DUR=$DUR PRE_FRAMES=$PREF ./venv/bin/python mix.py seg/s0.mp4.log.json seg/s1.mp4.log.json seg/s2.mp4.log.json seg/s3.mp4.log.json | tee mix.log
ffmpeg -nostdin -v error -y -i seg/video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.0:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest master_$V.mp4
echo MASTERED master_$V.mp4
[ -n "$NODELIVER" ] || bash "$SKILL/deliver.sh" master_$V.mp4 "${NAME:-reel}_$V"
