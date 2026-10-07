import json, sys, subprocess
from atoms import *
FPS = 30; NF = int(DUR * FPS)
SHIFT = 9.66; BEAT = 60 / 99.4; X1 = 6 * BEAT; CH0 = 61.72 + X1; PR0 = 76.0; SHIFT_B = PR0 - 52.06; P = PR0 - CH0
fl = [None] * NF
import os
PREF = int(os.environ.get('PRE_FRAMES', '0'))   # chat cold open in front of the film
for p in sys.argv[1:]:
    for i, v in enumerate(json.load(open(p))):
        j = i - PREF
        if v is not None and 0 <= j < NF: fl[j] = v
VO = json.load(open('vo8.json'))

# ---------------------------------------------------------------- music: phrase 2 twice; stops for the climax, resumes for the prayer
nas = load('../nasheed/my_dream.wav')
def nseg(a, b): return nas[int(a * SR):int(b * SR)].copy()
music = np.zeros((N, 2))
def lay(t7a, t7b, nas_a, fi=0.012, fo=0.012):
    x = nseg(nas_a, nas_a + (t7b - t7a)); x = fade(x, fi, fo); i = int(t7a * SR); music[i:i + len(x)] += x[:N - i]
lay(0, 23.38 + 0.012, 1.0)
lay(23.38, CH0 + 0.6, 23.38 + 1.0 - SHIFT)                      # continues through lens + chase
lay(PR0 - 0.2, DUR, CH0 + 1.0 - SHIFT - 0.2, fi=1.2)              # resumes where it stopped
# the climax: music is cut dead on the frame; only its hall rings out into the dark
ts0 = int(CH0 * SR); tail_src = music[ts0 - int(0.45 * SR):ts0].copy()
music[ts0 - int(0.008 * SR):ts0] *= np.linspace(1, 0, int(0.008 * SR))[:, None]; music[ts0:int((PR0 - 0.2) * SR)] = 0
def long_verb(x, dur=3.2, decay=1.9, lp_f=3500):
    t_ = np.arange(int(dur * SR)) / SR; ir = rng.standard_normal(len(t_)) * np.exp(-t_ * decay); ir = lp(ir, lp_f); ir /= np.sqrt((ir ** 2).sum())
    return np.stack([fftconvolve(x[:, c], ir) for c in range(2)], 1)
hall_tail = long_verb(tail_src)[int(0.45 * SR):]          # only what rings after the cut
music[ts0:ts0 + len(hall_tail)] += hall_tail[:N - ts0] * db(-5)
f0 = int((67.6 + SHIFT_B) * SR); music[f0:] *= np.linspace(1, 0, N - f0)[:, None] ** 1.5

# ---------------------------------------------------------------- voice: AI-cleaned lavalier (DeepFilterNet3 + voice EQ), cut in the pauses
clean = load('../speech/full_clean.wav')[:, 0]
voice = np.zeros(N); duck = np.zeros(N); vclimax = np.zeros(N)
for v in VO:
    g = {'Q9': 3.5, 'QD': 2.5}.get(v['id'], 0)
    for s in v['segs']:
        x = clean[int(s['in'] * SR):int(s['out'] * SR)].copy()
        x = fade(x, 0.012, 0.025) * db(g)
        i = int(s['at'] * SR); voice[i:i + len(x)] += x[:N - i]
        if v['id'] in ('C1', 'C2', 'C3', 'C4'): vclimax[i:i + len(x)] += x[:N - i]
        duck[int((s['at'] - 0.1) * SR):int((s['at'] + s['out'] - s['in'] + 0.12) * SR)] = 1
rms = np.sqrt(np.mean(voice[duck > 0] ** 2)); voice *= 0.17 / (rms + 1e-9); vclimax *= 0.17 / (rms + 1e-9)
# a cold hall on the voice in the climax (pre-delay 25 ms, ~2.4 s decay), mixed under the dry voice
_t = np.arange(int(2.6 * SR)) / SR; _ir = rng.standard_normal(len(_t)) * np.exp(-_t * 2.6); _ir = hp(lp(_ir, 4200), 300); _ir /= np.sqrt((_ir ** 2).sum())
wet = fftconvolve(vclimax, _ir)[:N]; wet = np.concatenate([np.zeros(int(0.025 * SR)), wet])[:N]
voice += wet * db(-9)
def smooth(x, a, r):
    y = np.zeros_like(x); s = 0.0; ka = 1 / (a * SR); kr = 1 / (r * SR); B = 240
    for i in range(0, len(x), B):
        tgt = x[i:i + B].max(); s += (tgt - s) * min(1, (ka if tgt > s else kr) * B); y[i:i + B] = s
    return y
D = smooth(duck, 0.12, 0.45)
chapter = np.zeros(N); chapter[int(15.6 * SR):int(29.3 * SR)] = 1; CHp = smooth(chapter, 0.8, 0.5)
music *= (db(-14) ** D * db(-4) ** CHp)[:, None]

# ---------------------------------------------------------------- location bed (speech + climax plates muted)
clips = {}; hop = SR // FPS; win = np.hanning(2 * hop + 1)[:-1][:, None]
bed = np.zeros((N + 4 * hop, 2))
MUTE = {'0017', '0018', '0019', '0020', '0021', '0022', '0023', '0024', '0025', '0102', '0118', '0100'}
for f, v in enumerate(fl):
    if v is None or v[0] in MUTE: continue
    clip, st = v
    if clip not in clips: clips[clip] = load(f'../lrf/{clip}.mp4')
    a = clips[clip]; i0 = int(st * SR) - hop // 2; o = f * hop - hop // 2
    if i0 < 0 or i0 + 2 * hop > len(a) or o < 0: continue
    bed[o:o + 2 * hop] += a[i0:i0 + 2 * hop] * win
bed = bed[:N] * (db(-9) ** D)[:, None]
rt = lp(hp(load('../speech/full.wav')[int(77.2 * SR):int(87.6 * SR)], 120), 3000)
put('amb', 15.49, fade(rt, 0.4, 0.8), -18); put('amb', 25.2, fade(rt[:int(4.6 * SR)], 0.8, 0.5), -18)

# ---------------------------------------------------------------- sfx
def click():
    t = np.arange(int(0.03 * SR)) / SR
    return hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 380) * 0.7 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 260) * 0.5
cuts = []; prev = None
for f, v in enumerate(fl):
    key = v[0] if v else None
    if f > 0 and key != prev and v is not None and prev is not None: cuts.append(f / FPS)
    prev = key
Sx = 'sfx'
for c in cuts:
    if 4.6 < c < CH0 - 0.05 or PR0 + 0.5 < c < PR0 + 6.3: put(Sx, c - 0.01, click(), -14, rng.uniform(-0.3, 0.3))
WD = {v['id']: v['words'] for v in VO}
# intro / outside
put('low', 4.67, boom(1.8, 110, 30, 0.6), -9); put(Sx, 4.6, whoosh(0.35, 8000, 300, 0.1), -16)
put(Sx, 5.9, whoosh(0.9, 6000, 900, 0.3, rev=True), -24)                                  # Arabic pen
put(Sx, 9.6, whoosh(0.5, 300, 6000, 0.7), -18); put('low', 9.72, boom(1.4, 90, 34, 0.3), -14)
put(Sx, 11.78, whoosh(0.45, 300, 6000, 0.7), -19); put('low', 11.9, boom(1.3, 85, 34, 0.25), -15)   # LaOla lights up
for k in range(10): put(Sx, 14.32 + k * 0.045 + 0.3, tick(2200 + 90 * k, 0.02), -24, -0.5 + 0.1 * k)  # odometer
put(Sx, 15.25, riser(0.3, 400, 8000), -18)
# speech chapter
put('low', 16.90, boom(2.2, 70, 28, 0.2), -14)
for w in WD['Q1']: put(Sx, w[1] - 0.02, typeclick(), -15 if w[0] in ('Fußball', 'Islam') else -22)
for i in (3, 5): put('low', WD['Q1'][i][1], kick(90, 40, 0.25), -18)
q2 = WD['Q2']
for k in range(5): put(Sx, q2[3][1] + 0.08 * k, tick(2600 + 200 * k, 0.025), -22, -0.4 + 0.2 * k)
for i in (8, 9, 10, 12): put(Sx, q2[i][1], tick(1800, 0.04), -19)
put('low', q2[20][1], kick(80, 36, 0.3), -14)                                               # TEAM lands on the turf
put(Sx, 21.4, whoosh(0.25, 2000, 400, 0.4), -22)
# shoe → ball up → match
put(Sx, 23.75 + SHIFT, riser(0.7, 300, 9000), -16); put('low', 24.45 + SHIFT, boom(1.8, 120, 30, 0.5), -10); put(Sx, 24.45 + SHIFT, whistle(0.4), -15)
for s in range(4): put(Sx, 45.35 + s + 0.6, tick(1500, 0.05), -17)
for st, d in [(49.0, 0.22), (49.3, 0.22), (49.62, 0.55)]: put(Sx, st - 0.25, whistle(d), -14)
put('low', 49.71, boom(1.6, 100, 30, 0.4), -12)
# goals list
q6 = [w for w in WD['Q6']]
for k in (1, 2, 3):
    e = [w for w in q6 if w[3] == k][-1][2]; put('low', e, kick(110, 45, 0.25), -15); put(Sx, e, click(), -16)
put(Sx, WD['Q8'][0][1] - 0.62, whoosh(0.5, 600, 4000, 0.5), -20)
# lens → Earth
put(Sx, 48.8 + SHIFT, riser(0.7, 300, 10000), -15); put('low', 49.5 + SHIFT, boom(1.1, 150, 30, 0.9), -8); put(Sx, 49.5 + SHIFT, kick(180, 40, 0.35), -9)
put(Sx, 60.28, whoosh(0.7, 500, 7000, 0.35), -21); put('low', 60.32, boom(2.4, 55, 24, 0.05), -17)
# chase: a swish on every cut
for k in range(3): put(Sx, 61.72 + k * 2 * BEAT - 0.08, whoosh(0.25, 800, 6000, 0.6), -19)
# climax: no music — drone, the dust, the final word
put('low', CH0, boom(3.2, 70, 20, 0.35), -6); put(Sx, CH0, kick(160, 38, 0.4), -8)                      # the cut lands like a door
ring_t = np.arange(int(2.8 * SR)) / SR; ring = np.sin(2 * np.pi * 5600 * ring_t) * np.exp(-ring_t * 1.4) * 0.5; put(Sx, CH0 + 0.02, fade(ring, 0.01, 0.5), -33)  # ear-ring
dr = drone(P - 0.2, 41.2); dr = fade(dr, 0.25, 1.0); put('low', CH0 + 0.05, dr, -15)
for kk, hb_t in enumerate(np.arange(CH0 + 0.9, PR0 - 0.9, 1.0)): put('low', hb_t, heartbeat(), -12 - 0.4 * kk)
put(Sx, PR0 - 1.15, riser(1.2, 180, 5200), -21); put(Sx, PR0 - 0.05, whoosh(1.2, 6000, 600, 0.15), -24)  # into the light
c2 = WD['C2']; tsd = [w for w in c2 if w[0].startswith('nichts')][0][1]
put('low', c2[1][1], boom(1.6, 80, 30, 0.2), -13)
sand = bp(rng.standard_normal(int(1.6 * SR)), 2500, 9000) * np.linspace(1, 0, int(1.6 * SR)) ** 1.5 * 0.6; put(Sx, tsd, fade(sand, 0.15, 0.3), -22)
put('low', [w for w in WD['C4'] if w[0] == 'Spiel'][0][1], boom(2.6, 55, 22, 0.15), -11)
# prayer → winners (shifted by the chase + climax)
for k in range(1, 6): put(Sx, 58.65 + SHIFT_B + k * 1.2 - 0.12, whoosh(0.22, 500, 7000, 0.7), -18); put(Sx, 58.65 + SHIFT_B + k * 1.2, click(), -11)
put(Sx, 65.85 + SHIFT_B, whoosh(0.7, 300, 5000, 0.8), -16); put('low', 66.55 + SHIFT_B, boom(2.6, 80, 26, 0.4), -10)

v2 = np.stack([voice, voice], 1)
Dfx = db(-7) ** D
mix['sfx'] *= Dfx[:, None]; mix['low'] *= Dfx[:, None]
out = music + v2 + mix['amb'] + bed * db(-15) + mix['sfx'] * db(-3) + mix['low'] * db(-4)
rest = out - v2
for v in VO:
    s0, s1 = v['segs'][0], v['segs'][-1]; i, j = int(s0['at'] * SR), int((s1['at'] + s1['out'] - s1['in']) * SR)
    print(f"{v['id']:4s} {s0['at']:6.2f}  voice/rest = {20 * np.log10(np.sqrt(np.mean(v2[i:j] ** 2)) / (np.sqrt(np.mean(rest[i:j] ** 2)) + 1e-9)):+.1f} dB")
w = wave.open('voice_v8.wav', 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(voice / (np.abs(voice).max() + 1e-9), -1, 1) * 32767 * 0.9).astype(np.int16).tobytes()); w.close()
out = np.nan_to_num(out); out /= np.abs(out).max() / 0.97
if PREF:
    PRE = PREF / FPS; n0 = int(PRE * SR); chat = np.zeros((n0, 2))
    def cput(t, x, g, pan=0.0):
        if x.ndim == 1: x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
        i = int(t * SR); j = min(n0, i + len(x)); chat[i:j] += x[:j - i] * db(g)
    def blip(f0, f1, d=0.07):
        tt = np.arange(int(d * SR)) / SR; f = np.linspace(f0, f1, len(tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38) * 0.8
    cput(0.85, np.concatenate([blip(740, 760), blip(1100, 1120)]), -20)          # incoming
    rr = np.random.default_rng(3); tt = 1.65
    while tt < 2.85: cput(tt, typeclick(), -24 + rr.uniform(-2, 2), rr.uniform(-0.2, 0.2)); tt += rr.uniform(0.055, 0.095)
    cput(2.92, whoosh(0.2, 800, 5000, 0.8), -24); cput(2.97, blip(900, 1300, 0.09), -19)  # sent
    cput(3.9, blip(1000, 1250, 0.08), -21)                                                   # video arrives
    cput(4.7, click(), -15)                                                                 # tap
    cput(4.8, riser(0.9, 220, 5000), -19); cput(5.55, boom(1.8, 60, 26, 0.1), -16)          # into the dark, then the film
    chat = np.nan_to_num(chat); out = np.concatenate([chat, out], 0)
w = wave.open('mix_v8.wav', 'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print('ok', len(cuts), 'cuts')
