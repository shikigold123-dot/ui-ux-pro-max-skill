#!/usr/bin/env bash
# Deliverables from a master. Usage: bash deliver.sh master.mp4 <basename> [outdir=output]
#  1. <base>_FULL.mp4      H.264 CRF 16 (≈ 2.5 MB/s) — archive / YouTube / Drive (user uploads it; the Drive connector can't)
#  2. <base>.mp4           H.264 2-pass 2250k, veryslow, tune film → < 30 MiB for ~95 s (chat upload limit 30 MiB)
#  3. <base>_HEVC.mp4      HEVC 2-pass 2250k, hvc1 tag (plays on iPhone/WhatsApp) — visibly better at the same size
# For a different length: bitrate_k ≈ (28 MiB × 8 / seconds) − 170  (keep a margin, check the size).
# WhatsApp: send as "HD" (still re-encodes) or as DOCUMENT (no recompression — best quality).
set -e
M=$1; B=$2; O=${3:-output}; mkdir -p $O
SEC=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$M")
BR=$(python3 -c "print(min(6000, int(28*1024*1024*8/float('$SEC')/1000) - 170))")
ffmpeg -nostdin -v error -y -i "$M" -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "$O/${B}_FULL.mp4"
ffmpeg -nostdin -v error -y -i "$M" -c:v libx264 -preset veryslow -tune film -b:v ${BR}k -pass 1 -passlogfile /tmp/p264 -an -f mp4 /dev/null
ffmpeg -nostdin -v error -y -i "$M" -c:v libx264 -preset veryslow -tune film -b:v ${BR}k -pass 2 -passlogfile /tmp/p264 -c:a aac -b:a 160k -movflags +faststart "$O/${B}.mp4"
ffmpeg -nostdin -v error -y -i "$M" -c:v libx265 -preset slow -b:v ${BR}k -x265-params pass=1:stats=/tmp/p265.log:log-level=error -an -f mp4 /dev/null
ffmpeg -nostdin -v error -y -i "$M" -c:v libx265 -preset slow -b:v ${BR}k -x265-params pass=2:stats=/tmp/p265.log:log-level=error -tag:v hvc1 -c:a aac -b:a 160k -movflags +faststart "$O/${B}_HEVC.mp4"
ls -la "$O/${B}"*.mp4
ffmpeg -nostdin -i "$O/${B}.mp4" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+I:|Peak:" | head -2
