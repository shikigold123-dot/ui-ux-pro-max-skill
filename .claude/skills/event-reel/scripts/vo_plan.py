# Voice-over plan: which spoken lines go where in the film, cut so that NO word is ever clipped.
# Usage: venv/bin/python vo_plan.py plan.json      (writes vo.json; prints each line for review)
# plan.json: {
#   "words": "speech/full.json",            # transcribe.py output for the long recording
#   "audio": "speech/full_clean.wav",       # voice_clean.py output (cut points are measured on THIS)
#   "lines": [ {"id":"Q1", "chunks":[[144.84,146.76]], "at":17.22},                    # at = where the FIRST WORD lands
#              {"id":"Q6", "chunks":[[308.32,309.54],[312.62,313.60]], "at":[52.66,54.04]},   # list: one 'at' per chunk
#              {"id":"C2", "chunks":[[586.58,588.06],[588.70,589.68]], "at":67.60, "gap":0.16}, # joined with a pause
#              {"id":"Q10","chunks":[[386.88,389.16]], "at":77.10, "override":{"0":[386.80,null]}, # manual in/out (null = auto)
#               "fix":{"Allah":"Allah ﷻ"}, "first_upper":true} ] }
# chunk = [first word start, last word end] in recording time (read them off the transcript).
# How cuts are found: in = quietest 10 ms in the gap before the first word, out = quietest 10 ms after the last word.
# Where words are tightly joined (gap < 0.12 s) Whisper's edges are unreliable → search the energy dip around the edge.
# Word times are onset-corrected (Whisper starts ~40–80 ms early → captions would run ahead of the voice).
import json, subprocess, sys, numpy as np
P = json.load(open(sys.argv[1]))
F = json.load(open(P['words'])); WORDS = [[w[0].strip(), w[1], w[2]] for s in F for w in s['w']]
SR = 48000
X = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', P['audio'], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
def rms(t): i = max(0, int(t * SR)); return float(np.sqrt(np.mean(X[i:i + 480] ** 2) + 1e-12))
def quiet(a, b): ts = np.arange(a, max(a + 0.011, b), 0.005); return float(ts[np.argmin([rms(t) for t in ts])])
def cut(a, b):
    prev = max([w[2] for w in WORDS if w[2] <= a + 0.01] or [a - 0.5]); nxt = min([w[1] for w in WORDS if w[1] >= b - 0.01] or [b + 0.5])
    i = quiet(max(prev, a - 0.22), a - 0.015) if a - prev >= 0.12 else quiet(a - 0.12, a + 0.05)
    o = quiet(b + 0.03, min(nxt, b + 0.35)) if nxt - b >= 0.12 else quiet(b - 0.03, b + 0.12)
    return round(i, 3), round(o, 3)
def onset(w0, w1):
    peak = max(rms(t) for t in np.arange(w0, max(w0 + 0.02, w1), 0.01)); thr = max(peak * 10 ** (-16 / 20), 10 ** (-38 / 20))
    for t in np.arange(w0, min(w1, w0 + 0.6), 0.005):
        if rms(t) >= thr: return round(float(t), 3)
    return w0
def words_in(a, b): return [[w[0], onset(w[1], w[2]), w[2]] for w in WORDS if a - 0.02 <= w[1] <= b - 0.01]
out = []
for L in P['lines']:
    segs, words = [], []
    ats = L['at'] if isinstance(L['at'], list) else None
    for k, (a, b) in enumerate(L['chunks']):
        i, o = cut(a, b)
        ov = L.get('override', {}).get(str(k))
        if ov: i, o = ov[0] if ov[0] is not None else i, ov[1] if ov[1] is not None else o
        if ats: at = ats[k] - (a - i)
        elif k == 0: at = L['at'] - (a - i)
        else: at = segs[-1]['at'] + (segs[-1]['out'] - segs[-1]['in']) + L.get('gap', 0.0) - (a - i)
        segs.append({'in': i, 'out': o, 'at': round(at, 3)})
        for w in words_in(a, b): words.append([w[0], round(at + w[1] - i, 3), round(at + w[2] - i, 3), k])
    for k, v in L.get('fix', {}).items():
        for w in words:
            if w[0] == k: w[0] = v
    if L.get('first_upper') and words: words[0][0] = words[0][0][:1].upper() + words[0][0][1:]
    out.append({'id': L['id'], 'segs': segs, 'words': words})
    e = segs[-1]['at'] + segs[-1]['out'] - segs[-1]['in']
    print(f"{L['id']:5s} {segs[0]['at']:7.2f} → {e:7.2f}  " + ' '.join(w[0] for w in words))
json.dump(out, open('vo.json', 'w'), ensure_ascii=False, indent=0)
