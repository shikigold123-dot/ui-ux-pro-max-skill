# atoms.py — synthesised sound design (no sample library needed) + small DSP helpers. Imported by mix.py.
# Every atom returns a mono float array at SR; place it with put(bus, t, x, gain_db, pan) in mix.py.
# Levels that worked (before the final loudnorm): boom −6…−15 dB on 'low', whoosh −16…−24, tick −17…−24, click −11…−16.
import numpy as np, subprocess
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000
rng = np.random.default_rng(7)          # deterministic: same mix every run

def db(x): return 10 ** (x / 20)
def load(p, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32).astype(float); return a.reshape(-1, ch) if ch > 1 else a
def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return sosfilt(sos, x, axis=0)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x, axis=0)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x, axis=0)
def env(n, a, r, shape=4.0):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR; e[na:] = np.exp(-tail / max(r, 1e-3) * (shape / 4)); return e
def fade(x, fi=0.01, fo=0.02):
    x = x.copy(); a = int(fi * SR); b = int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x

# ------------------------------------------------------------- sound design atoms
def boom(dur=1.6, f0=95, f1=32, noise=0.5):
    t = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 9); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 2.2)
    n = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 14) * noise
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 120) * 0.35
    return np.tanh((s + n + click) * 1.6) * 0.9
def whoosh(dur=0.5, lo=300, hi=5000, peak=0.6, rev=False):
    n = int(dur * SR); x = rng.standard_normal(n)
    out = np.zeros(n); seg = 2048
    for k in range(0, n, seg):
        u = k / n; fc = lo * (hi / lo) ** u
        out[k:k + seg] = bp(x[k:k + seg + 0], max(40, fc * 0.6), min(SR / 2 - 100, fc * 1.6), 1)[:len(out[k:k + seg])]
    t = np.arange(n) / n
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    out = out * e; out /= np.abs(out).max() + 1e-9
    return out[::-1] if rev else out
def riser(dur=2.0, lo=200, hi=7000):
    w = whoosh(dur, lo, hi, peak=0.97)
    t = np.arange(len(w)) / SR; f = 60 * (8 ** (t / dur)); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2 * 0.4
    return w * 0.8 + sub
def heartbeat():
    def thump(f=55, d=0.18):
        t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * t * (1 - t * 1.5)) * np.exp(-t * 26)
    a = thump(); b = thump(48, 0.2) * 0.7; out = np.zeros(int(0.5 * SR)); out[:len(a)] += a; o = int(0.16 * SR); out[o:o + len(b)] += b
    return lp(out, 200) * 1.4
def kick(f0=120, f1=42, d=0.32):
    t = np.arange(int(d * SR)) / SR; f = f1 + (f0 - f1) * np.exp(-t * 30)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.8) * 0.8
def tick(f=3200, d=0.03):
    t = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * f * t) * 0.6 + hp(rng.standard_normal(len(t)), 4000) * 0.4) * np.exp(-t * 300)
def typeclick():
    t = np.arange(int(0.025 * SR)) / SR; return bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t * 400) * 0.8
def whistle(dur, f=3150):
    t = np.arange(int(dur * SR)) / SR
    trill = 1 + 0.55 * np.sin(2 * np.pi * 28 * t + 2 * np.sin(2 * np.pi * 3 * t))
    fm = f + 35 * np.sin(2 * np.pi * 28 * t)
    ph = 2 * np.pi * np.cumsum(fm) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(len(t)), 2500, 6000) * 0.25
    e = np.minimum(1, t / 0.012) * np.minimum(1, (dur - t) / 0.04)
    return np.clip((s * trill * 0.5 + breath) * e, -1, 1) * 0.6
def drone(dur, f=43.65):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.003 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t))
    air = lp(rng.standard_normal(len(t)), 600) * 0.12
    return (s * 0.5 + air)
def room_reverb(x, dur=1.8):
    ir_t = np.arange(int(dur * SR)) / SR; ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.0); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    return np.stack([fftconvolve(x[:, c], ir)[:len(x) + len(ir) - 1] for c in range(2)], 1)


def click():
    t = np.arange(int(0.03 * SR)) / SR
    return hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 380) * 0.7 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 260) * 0.5
def blip(f0, f1, d=0.07):        # UI notification tone (chat)
    tt = np.arange(int(d * SR)) / SR; f = np.linspace(f0, f1, len(tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38) * 0.8
def ear_ring(dur=2.8, f=5600):   # tinnitus after a hard cut into silence
    t = np.arange(int(dur * SR)) / SR; return fade(np.sin(2 * np.pi * f * t) * np.exp(-t * 1.4) * 0.5, 0.01, 0.5)
def sand(dur=1.6):               # dust/disintegration hiss
    return bp(rng.standard_normal(int(dur * SR)), 2500, 9000) * np.linspace(1, 0, int(dur * SR)) ** 1.5 * 0.6
def long_verb(x, dur=3.2, decay=1.9, lp_f=3500):   # stereo hall for a music tail after a hard stop
    t_ = np.arange(int(dur * SR)) / SR; ir = rng.standard_normal(len(t_)) * np.exp(-t_ * decay); ir = lp(ir, lp_f); ir /= np.sqrt((ir ** 2).sum())
    return np.stack([fftconvolve(x[:, c], ir) for c in range(2)], 1)
def voice_hall(x, dur=2.6, decay=2.6, predelay=0.025):  # cold hall on a mono voice (climax line); mix wet at about −9 dB
    t_ = np.arange(int(dur * SR)) / SR; ir = rng.standard_normal(len(t_)) * np.exp(-t_ * decay); ir = hp(lp(ir, 4200), 300); ir /= np.sqrt((ir ** 2).sum())
    wet = fftconvolve(x, ir)[:len(x)]; return np.concatenate([np.zeros(int(predelay * SR)), wet])[:len(x)]
def smooth(x, a, r):             # envelope follower (attack a, release r seconds) for ducking curves
    y = np.zeros_like(x); s = 0.0; ka = 1 / (a * SR); kr = 1 / (r * SR); B = 240
    for i in range(0, len(x), B):
        tgt = x[i:i + B].max(); s += (tgt - s) * min(1, (ka if tgt > s else kr) * B); y[i:i + B] = s
    return y
