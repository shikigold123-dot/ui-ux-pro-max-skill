#!/usr/bin/env bash
# Resumable Google-Drive download for files shared "anyone with the link" (the Drive MCP connector caps at ~10 MB inline,
# so big media goes through drive.usercontent with HTTP ranges). Survives "download quota exceeded" by waiting + resuming.
# Usage: bash drive_fetch.sh <fileId> <out> [expectedBytes]
#   get ids + sizes first with the Drive connector (search_files with parentId = folder id; metadata has size).
ID=$1; OUT=$2; SZ=${3:-0}
touch "$OUT"
for round in $(seq 1 200); do
  have=$(stat -c%s "$OUT")
  [ "$SZ" -gt 0 ] && [ "$have" -ge "$SZ" ] && { echo "DONE $OUT $have"; exit 0; }
  got=0
  for u in "https://drive.usercontent.google.com/download?id=$ID&export=download&confirm=t" "https://drive.google.com/uc?export=download&id=$ID&confirm=t"; do
    curl -sS -L --max-time 900 -r $have- -o "$OUT.part" "$u"
    # quota / permission errors come back as an HTML page — never append those
    if [ -s "$OUT.part" ] && ! head -c 300 "$OUT.part" | grep -qi "<html\|<!DOCTYPE"; then
      cat "$OUT.part" >> "$OUT"; got=$(stat -c%s "$OUT.part"); rm -f "$OUT.part"; echo "$(date +%T) +$got → $(stat -c%s "$OUT")"; break
    fi
  done
  rm -f "$OUT.part"
  if [ "$SZ" -eq 0 ] && [ "$got" -gt 0 ]; then echo "DONE $OUT (size unknown — verify with ffprobe)"; exit 0; fi
  [ "$got" -eq 0 ] && sleep 30
done
echo "FAILED $OUT after retries ($(stat -c%s "$OUT") bytes)"; exit 1
