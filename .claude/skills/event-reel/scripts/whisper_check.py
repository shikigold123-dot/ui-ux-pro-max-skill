# QC: re-transcribe every placed VO segment from the rendered voice track — catches clipped word starts/ends
# ("…piel" instead of "Spiel", a stray "da" before a line). Run after every mix.
# Usage: venv/bin/python whisper_check.py <vo.json> <voice.wav> [lang=de] [ids...]
import sys, json, subprocess, os, tempfile
from faster_whisper import WhisperModel
vo, voice = json.load(open(sys.argv[1])), sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'de'; only = set(sys.argv[4:])
m = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=4)
q = os.path.join(tempfile.gettempdir(), 'wchk.wav')
for v in vo:
    if only and v['id'] not in only: continue
    for s in v['segs']:
        a = s['at'] - 0.25; b = s['at'] + s['out'] - s['in'] + 0.25
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, a)), '-t', str(b - a), '-i', voice, '-ar', '16000', q])
        segs, _ = m.transcribe(q, language=lang, beam_size=5, word_timestamps=True)
        heard = ' '.join(w.word.strip() for sg in segs for w in sg.words)
        planned = ' '.join(w[0] for w in v['words'] if w[3] == v['segs'].index(s))
        print(f"{v['id']:5s} [{s['in']:.2f}-{s['out']:.2f}]\n   plan : {planned}\n   heard: {heard}")
