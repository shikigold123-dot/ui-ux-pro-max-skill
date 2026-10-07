# Word-level transcription with faster-whisper large-v3 (CPU int8; ~1× realtime on 4 cores — start it early, in the background).
# Usage: venv/bin/python transcribe.py <audio> <out.json> [lang=de] [model=large-v3]
# out: [{s, e, t, w: [[word, start, end], ...]}]   NOTE: Whisper word starts are ~40–80 ms EARLY → vo_plan.py corrects with onsets.
import sys, json
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'de'
m = WhisperModel(sys.argv[4] if len(sys.argv) > 4 else 'large-v3', device='cpu', compute_type='int8', cpu_threads=4)
segs, info = m.transcribe(src, beam_size=5, language=lang, word_timestamps=True, vad_filter=True)
res = []
for s in segs:
    print(f'[{s.start:7.2f}-{s.end:7.2f}] {s.text}', flush=True)
    res.append({'s': s.start, 'e': s.end, 't': s.text, 'w': [[w.word, w.start, w.end] for w in s.words]})
json.dump(res, open(out, 'w'), ensure_ascii=False)
