# mix.py — the soundtrack. Copy into the project as mix.py and edit the CONFIG + CUES sections.
# Usage: PRE_FRAMES=180 venv/bin/python mix.py seg/s0.mp4.log.json seg/s1.mp4.log.json ...   (logs written by drive.js)
#   PRE_FRAMES = frames of the chat cold open in front of the film (0 = none). Writes mix.wav + voice.wav, prints voice/rest.
# Buses: music (edited nasheed/track) · voice (cleaned talk, placed from vo.json) · bed (location sound rebuilt from the
# frame log, so every shot carries its own room tone) · sfx · low (subs) · amb.
# Targets: voice ≥ +10 dB over everything else on every line (report below), music ducked −14 dB under voice,
# sfx/low ducked −7 dB, final loudnorm −14 LUFS / −1 dBTP in the master step (render.sh).
import json, sys, os, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from atoms import *

# ------------------------------------------------------------------ CONFIG
FPS = 30
DUR = float(os.environ.get('DUR', '0')) or 30.0          # film length in seconds (without the chat opener) — set it
MUSIC = 'music/track.wav'                                # stereo 48k wav (ffmpeg -i in.mp3 -ac 2 -ar 48000 music/track.wav)
VOICE = 'speech/full_clean.wav'                          # voice_clean.py output, or None
VOJSON = 'vo.json'
MUTE_BED = set()                                         # clips whose own sound must not play (speech shots, climax plates)
CLIPS = {}                                               # clip name → media file with its audio (default: shots.json 'src')
BEAT = 60 / 100                                          # from music_analyze.py
CLIMAX = None                                            # (stop_t, resume_t, resume_src_t) — music stops dead, resumes later
CHAPTER_DIP = []                                         # [(a, b, dB)] extra music dips (e.g. under a long talk chapter)
VOICE_GAIN = {}                                          # per-line dB trims {'Q9': 3.5}
VOICE_HALL = set()                                       # line ids that get the cold hall (climax)

N = int(SR * DUR)
music = np.zeros((N, 2)); bus = {k: np.zeros((N, 2)) for k in ['sfx', 'low', 'amb']}
def put(b, t, x, gain_db=0.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(x)); s = max(0, -i); bus[b][max(i, 0):j] += x[s:j - i] * db(gain_db)

# ------------------------------------------------------------------ frame log (what is on screen each frame)
PREF = int(os.environ.get('PRE_FRAMES', '0')); NF = int(DUR * FPS); fl = [None] * NF
for p in sys.argv[1:]:
    for i, v in enumerate(json.load(open(p))):
        j = i - PREF
        if v is not None and 0 <= j < NF: fl[j] = v
SHOTS = json.load(open('shots.json')) if os.path.exists('shots.json') else {}
for s in SHOTS.values(): CLIPS.setdefault(s['clip'], s.get('src'))

# ------------------------------------------------------------------ music layout
# lay(film_a, film_b, src_a): place src music [src_a, src_a + (b-a)] at film [a, b]. Splice only at phrase starts and keep
# lengths in whole beats (repeat a phrase: lay the same src twice). Short fades (12 ms) avoid clicks at splices.
if MUSIC and os.path.exists(MUSIC):
    M = load(MUSIC)
    def lay(a, b, src_a, fi=0.012, fo=0.012):
        x = fade(M[int(src_a * SR):int((src_a + b - a) * SR)].copy(), fi, fo); i = int(a * SR); music[i:i + len(x)] += x[:N - i]
    lay(0, DUR, 0.0)                                                     # EDIT: the real layout
    if CLIMAX:   # cut dead on the frame, only the hall rings out into the dark; resume later where it stopped
        st, rs, rsrc = CLIMAX; ts0 = int(st * SR); tail = music[ts0 - int(0.45 * SR):ts0].copy()
        music[ts0 - int(0.008 * SR):ts0] *= np.linspace(1, 0, int(0.008 * SR))[:, None]; music[ts0:] = 0
        ht = long_verb(tail)[int(0.45 * SR):]; music[ts0:ts0 + len(ht)] += ht[:N - ts0] * db(-5)
        lay(rs, DUR, rsrc, fi=1.2)
    music[-int(2.0 * SR):] *= np.linspace(1, 0, int(2.0 * SR))[:, None] ** 1.5

# ------------------------------------------------------------------ voice
voice = np.zeros(N); duck = np.zeros(N); vh = np.zeros(N)
VO = [v for v in json.load(open(VOJSON)) if v['segs']] if VOICE and os.path.exists(VOICE) and os.path.exists(VOJSON) else []
if VO:
    clean = load(VOICE, 1)
    for v in VO:
        for s in v['segs']:
            x = fade(clean[int(s['in'] * SR):int(s['out'] * SR)].copy(), 0.012, 0.025) * db(VOICE_GAIN.get(v['id'], 0))
            i = int(s['at'] * SR); voice[i:i + len(x)] += x[:N - i]
            if v['id'] in VOICE_HALL: vh[i:i + len(x)] += x[:N - i]
            duck[max(0, int((s['at'] - 0.1) * SR)):int((s['at'] + s['out'] - s['in'] + 0.12) * SR)] = 1
    r = np.sqrt(np.mean(voice[duck > 0] ** 2)); voice *= 0.17 / (r + 1e-9); vh *= 0.17 / (r + 1e-9)
    if VOICE_HALL: voice += voice_hall(vh) * db(-9)
D = smooth(duck, 0.12, 0.45)
dip = np.zeros(N)
for a, b, g in CHAPTER_DIP: c = np.zeros(N); c[int(a * SR):int(b * SR)] = 1; dip += smooth(c, 0.8, 0.5) * g
music *= (db(-14) ** D * db(1) ** dip)[:, None]

# ------------------------------------------------------------------ location bed from the frame log (Hann-windowed grains per frame)
hop = SR // FPS; win = np.hanning(2 * hop + 1)[:-1][:, None]; bed = np.zeros((N + 4 * hop, 2)); cache = {}
for f, v in enumerate(fl):
    if v is None or v[0] in MUTE_BED or not CLIPS.get(v[0]): continue
    clip, st = v
    if clip not in cache:
        try: cache[clip] = load(CLIPS[clip])
        except Exception: cache[clip] = np.zeros((1, 2))
    a = cache[clip]; i0 = int(st * SR) - hop // 2; o = f * hop - hop // 2
    if i0 < 0 or i0 + 2 * hop > len(a) or o < 0: continue
    bed[o:o + 2 * hop] += a[i0:i0 + 2 * hop] * win
bed = bed[:N] * (db(-9) ** D)[:, None]

# ------------------------------------------------------------------ CUES (EDIT) — sound design follows the picture
cuts = []; prev = None
for f, v in enumerate(fl):
    key = v[0] if v else None
    if f > 0 and key != prev and v is not None and prev is not None: cuts.append(f / FPS)
    prev = key
for c in cuts: put('sfx', c - 0.01, click(), -14, rng.uniform(-0.3, 0.3))       # tiny click on every cut (skip in calm parts)
put('low', 0.3, boom(1.8, 110, 30, 0.6), -9)                                       # intro hit
# examples of the vocabulary used in the Bayan reel:
#   whoosh into a cut: put('sfx', t - 0.12, whoosh(0.35, 500, 7000, 0.7), -18)      reversed whoosh = pen/reveal
#   odometer: for k in range(10): put('sfx', t0 + k * 0.045 + 0.3, tick(2200 + 90 * k, 0.02), -24, -0.5 + 0.1 * k)
#   kick under a slammed key word: put('low', word_t, kick(90, 40, 0.25), -18)
#   typing under ghost-fill type: for w in words: put('sfx', w[1] - 0.02, typeclick(), -22)
#   referee: put('sfx', t, whistle(0.4), -15)    climax: boom(3.2,70,20) + kick(160,38) at the stop, ear_ring(), drone(), heartbeat() every 1 s
#   into the light: riser(1.2, 180, 5200) then whoosh(1.2, 6000, 600, 0.15)      dust: sand()

# ------------------------------------------------------------------ sum + report
v2 = np.stack([voice, voice], 1); Dfx = db(-7) ** D
bus['sfx'] *= Dfx[:, None]; bus['low'] *= Dfx[:, None]
out = music + v2 + bus['amb'] + bed * db(-15) + bus['sfx'] * db(-3) + bus['low'] * db(-4)
rest = out - v2
for v in VO:
    s0, s1 = v['segs'][0], v['segs'][-1]; i, j = int(s0['at'] * SR), int((s1['at'] + s1['out'] - s1['in']) * SR)
    vr = 20 * np.log10(np.sqrt(np.mean(v2[i:j] ** 2)) / (np.sqrt(np.mean(rest[i:j] ** 2)) + 1e-9))
    print(f"{v['id']:5s} {s0['at']:7.2f}  voice/rest = {vr:+.1f} dB" + ('   <-- LOW (< +10)' if vr < 10 else ''))
def wav(p, x, ch):
    w = wave.open(p, 'w'); w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
wav('voice.wav', voice / (np.abs(voice).max() + 1e-9) * 0.9, 1)
out = np.nan_to_num(out); out /= np.abs(out).max() / 0.97

# ------------------------------------------------------------------ chat cold open sounds (only with chat.js; times match chat.js)
if PREF:
    n0 = int(PREF / FPS * SR); chat = np.zeros((n0, 2))
    def cput(t, x, g, pan=0.0):
        if x.ndim == 1: x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
        i = int(t * SR); j = min(n0, i + len(x)); chat[i:j] += x[:j - i] * db(g)
    cput(0.85, np.concatenate([blip(740, 760), blip(1100, 1120)]), -20)            # incoming message
    rr = np.random.default_rng(3); tt = 1.65
    while tt < 2.85: cput(tt, typeclick(), -24 + rr.uniform(-2, 2), rr.uniform(-0.2, 0.2)); tt += rr.uniform(0.055, 0.095)
    cput(2.92, whoosh(0.2, 800, 5000, 0.8), -24); cput(2.97, blip(900, 1300, 0.09), -19)   # sent
    cput(3.9, blip(1000, 1250, 0.08), -21)                                                 # video arrives
    cput(4.7, click(), -15)                                                                # tap
    cput(4.8, riser(0.9, 220, 5000), -19); cput(5.55, boom(1.8, 60, 26, 0.1), -16)        # into the dark → the film
    out = np.concatenate([np.nan_to_num(chat), out], 0)
wav('mix.wav', out, 2)
print('ok', len(cuts), 'cuts', f'{len(out) / SR:.2f}s')
