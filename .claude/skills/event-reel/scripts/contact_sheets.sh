#!/usr/bin/env bash
# Look at ALL footage before deciding anything.
#   bash contact_sheets.sh strips <dir_with_clips> <outdir>   → one 8-frame strip per clip (evenly spaced), labelled with the name
#   bash contact_sheets.sh dense <clip> <start> <step> <out.jpg>  → 10 frames from <start> every <step> s, labelled with time×10
#   bash contact_sheets.sh stack <out.jpg> a.jpg b.jpg …      → stack strips vertically into one sheet (8 per sheet reads well)
# Then Read the JPGs (they are images) and write a shot log: clip · what · usable range · quality · faces? · jersey/branding?
FONT=$(fc-match -f '%{file}' 'Liberation Sans:bold' 2>/dev/null || echo /usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf)
case "$1" in
strips) mkdir -p "$3"; for f in "$2"/*.{mp4,MP4,mov,MOV,LRF,lrf}; do [ -f "$f" ] || continue; n=$(basename "${f%.*}")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); r=$(python3 -c "print(f'{8/max(float(\"$d\"),0.5):.6f}')")
  ffmpeg -nostdin -v error -y -i "$f" -vf "fps=$r,scale=150:266:force_original_aspect_ratio=increase,crop=150:266,tile=8x1,drawtext=fontfile=$FONT:text='$n ${d%.*}s':x=6:y=6:fontsize=24:fontcolor=yellow:box=1:boxcolor=black@0.7" -frames:v 1 "$3/$n.jpg"; done ;;
dense) n=$(basename "${2%.*}")
  ffmpeg -nostdin -v error -y -ss $3 -i "$2" -vf "fps=1/$4,scale=144:256:force_original_aspect_ratio=increase,crop=144:256,drawtext=fontfile=$FONT:text='$n %{eif\:(t+$3)*10\:d}':x=4:y=228:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=10x1" -frames:v 1 "$5" ;;
stack) out=$2; shift 2; args=""; c=0; for f in "$@"; do args="$args -i $f"; c=$((c+1)); done
  ffmpeg -nostdin -v error -y $args -filter_complex vstack=inputs=$c "$out" ;;
*) echo "usage: strips|dense|stack"; exit 1 ;;
esac
