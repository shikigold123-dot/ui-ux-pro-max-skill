# v8 voice plan. Chunks are [first_word_start, last_word_end] in mic time; cut points are found in the
# quietest 10 ms inside the gap to the neighbouring words (never inside a word), so nothing gets clipped.
import json, subprocess, numpy as np
F = json.load(open('../speech/full.json')); WORDS = [[w[0].strip(), w[1], w[2]] for s in F for w in s['w']]
SR = 48000
X = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', '../speech/full_clean.wav', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
def rms(t): i = int(t * SR); return float(np.sqrt(np.mean(X[i:i + 480] ** 2) + 1e-12))
def quiet(a, b):  # time of quietest 10 ms frame in [a, b]
    ts = np.arange(a, max(a + 0.011, b), 0.005); return float(ts[np.argmin([rms(t) for t in ts])])
def cut(a, b):
    prev = max([w[2] for w in WORDS if w[2] <= a + 0.01] or [a - 0.5]); nxt = min([w[1] for w in WORDS if w[1] >= b - 0.01] or [b + 0.5])
    # Whisper's word edges drift 40–80 ms on tightly spoken joins: there, trust the energy dip, not the timestamp
    i = quiet(max(prev, a - 0.22), a - 0.015) if a - prev >= 0.12 else quiet(a - 0.12, a + 0.05)
    o = quiet(b + 0.03, min(nxt, b + 0.35)) if nxt - b >= 0.12 else quiet(b - 0.03, b + 0.12)
    return round(i, 3), round(o, 3)
def onset(w0, w1):
    peak = max(rms(t) for t in np.arange(w0, max(w0 + 0.02, w1), 0.01))
    thr = max(peak * 10 ** (-16 / 20), 10 ** (-38 / 20))
    for t in np.arange(w0, min(w1, w0 + 0.6), 0.005):
        if rms(t) >= thr: return round(float(t), 3)
    return w0
def W(a, b): return [[w[0], onset(w[1], w[2]), w[2]] for w in WORDS if a - 0.02 <= w[1] <= b - 0.01]
LIP = 21.95 - 169.24   # c3 starts at 21.80 on clip 0018 so that '…dass' (mic 169.24) lands at 21.95 — lips stay in sync
# id, layout, [chunks], placement of first word (v8 time), gap between chunks
PLAN = [
 ('Q1', 'hero', [(144.84, 146.76)], 17.22, 0),
 ('Q1b', 'hero', [(238.00, 240.26)], 19.40, 0),
 ('Q2', 'board', [(169.24, 177.14)], 169.24 + LIP, 0),
 ('K', 'kick', [(598.70, 599.96)], 30.50, 0),
 ('Q4', 'ring', [(184.14, 187.52)], 35.40, 0),
 ('Q5', 'abpfiff', [(266.66, 269.22)], 46.49, 0),
 ('Q6', 'list', [(308.32, 309.54), (312.62, 313.60), (321.06, 321.80), (323.68, 324.44)], 52.66, None),
 ('Q8', 'ball', [(533.34, 535.12)], 57.11, 0),
 ('Q9', 'earth', [(538.72, 539.84)], 59.59, 0),
 ('QD', 'chase', [(543.60, 546.58)], 61.95, 0),
 ('C1', 'climax', [(584.92, 586.48)], 65.80, 0),
 ('C2', 'score', [(586.58, 588.06), (588.70, 589.68)], 67.60, 0.16),
 ('C3', 'climax', [(590.10, 591.52)], 70.85, 0),
 ('C4', 'falsch', [(591.60, 594.60)], 72.55, 0),
 ('Q10', 'allah', [(386.88, 389.16)], 77.10, 0),
]
LIST_AT = [52.66, 54.04, 55.20, 56.10]
out = []
for vid, lay, chunks, at0, gap in PLAN:
    segs, words = [], []
    for k, (a, b) in enumerate(chunks):
        i, o = cut(a, b)
        # hand-checked against a 10 ms energy envelope where Whisper's edges sit inside a word
        i, o = {('Q6', 1): (312.655, o), ('Q6', 2): (321.10, o), ('C2', 0): (i, 588.32), ('C2', 1): (588.705, o), ('Q4', 0): (184.05, o), ('Q10', 0): (386.80, o)}.get((vid, k), (i, o))
        if k == 0: at = at0
        elif gap is None: at = LIST_AT[k]
        else: at = segs[-1]['at'] + (segs[-1]['out'] - segs[-1]['in']) + gap - (a - i)
        if k == 0: at = at0 - (a - i)  # first word lands on at0
        if gap is None and k > 0: at = LIST_AT[k] - (a - i)
        segs.append(dict(**{'in': i, 'out': o}, at=round(at, 3)))
        for w in W(a, b): words.append([w[0], round(at + w[1] - i, 3), round(at + w[2] - i, 3), k])
    FIX = {'dass': '…dass', 'auch': 'Auch', 'sobald': 'Sobald', 'ich': 'Ich', 'welche': 'Welche', 'Ein': 'ein'}
    if words and words[0][0] in FIX: words[0][0] = FIX[words[0][0]]
    for k in range(len(words) - 1, 0, -1):
        if words[k][0].startswith('-0'): words[k - 1][0] += ':0' + words[k][0][2:]; words[k - 1][2] = words[k][2]; del words[k]
    if vid == 'Q10':  # he says "Allah subhanahu wa ta'ala" — one token with the honorific; timings from a focused re-transcription
        a = segs[0]['at'] - segs[0]['in']
        words = [[t, round(a + onset(s0, s1), 3), round(a + s1, 3), 0] for t, s0, s1 in [('Welche', 386.80, 387.12), ('Rolle', 387.12, 387.24), ('hat', 387.24, 387.48), ('Allah ﷻ', 387.48, 388.40), ('in', 388.42, 388.70), ('deinem', 388.70, 388.90), ('Leben?', 388.90, 389.16)]]
    out.append(dict(id=vid, layout=lay, segs=segs, words=words))
    print(f"{vid:4s} {lay:8s} {segs[0]['at']:6.2f}→{segs[-1]['at'] + segs[-1]['out'] - segs[-1]['in']:6.2f}  " + ' '.join(w[0] for w in words))
json.dump(out, open('vo8.json', 'w'), ensure_ascii=False, indent=0)
