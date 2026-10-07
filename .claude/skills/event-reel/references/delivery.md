# Delivery

`bash deliver.sh master_vN.mp4 <name>_vN` produces:
| file | codec | size (≈95 s) | for |
|---|---|---|---|
| `<name>_vN.mp4` | H.264 High, 2-pass, veryslow, tune film, ~2250k + AAC 160k | ≈ 29 MB | sending in chat (limit 30 MiB), universal |
| `<name>_vN_HEVC.mp4` | HEVC 2-pass, ~2250k, `-tag:v hvc1` | ≈ 29 MB | better quality at the same size; iPhone/WhatsApp play it |
| `<name>_vN_FULL.mp4` | H.264 CRF 16 | ≈ 2.5 MB/s | archive, YouTube, Drive |
Bitrate auto-scales to the length: `kbps ≈ 28 MiB·8 / seconds − 170` (noisy footage lands near 29 MiB — always check the size).

- **SendUserFile limit**: 30 MiB per file. A 35 MB file fails → re-encode with deliver.sh, don't split the video.
- **Drive**: the Drive connector uploads only small inline (base64) files — the full master can't go up that way.
  Tell the user to upload `_FULL.mp4` themselves; if they insist, offer parts < 30 MiB (`ffmpeg -ss/-t -c copy`).
- **WhatsApp**: video messages are always re-encoded (even with "HD", ~720p–1080p at a low bitrate). For the best
  quality send it **as a document** (no recompression). Instagram: upload the FULL or H.264 file; 1080×1920, 30 fps.
- Check before sending: `ffprobe` (1080×1920, 30 fps, duration), loudness (`ebur128` I ≈ −14 LUFS), storyboard sheet.
- Name files with the version; keep every delivered version in `output/` so the user's timestamps can be checked.
