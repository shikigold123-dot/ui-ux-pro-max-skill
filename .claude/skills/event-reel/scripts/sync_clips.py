# Find where each camera clip sits inside the long external recording (mic / recorder):
# envelope cross-correlation (robust, coarse) → refined on raw audio (sample-exact). Score < ~0.3 = suspicious → search
# again restricted near the expected time (creation_time difference), see --near.
# Usage: venv/bin/python sync_clips.py <mic.wav> <out.json> clip1.mp4 clip2.mp4 ... [--near clip=seconds ...]
import sys, json, subprocess, numpy as np
from scipy.signal import fftconvolve
SR = 8000
args = [a for a in sys.argv[3:] if not a.startswith('--near') and '=' not in a]
near = dict((k, float(v)) for k, v in (a.split('=') for a in sys.argv[3:] if '=' in a))
def ld(p): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-af', 'highpass=f=150,lowpass=f=3500', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
def env(x):
    e = np.abs(x); k = int(SR * 0.02); e = np.convolve(e, np.ones(k) / k, 'same')[::40]; return (e - e.mean()) / (e.std() + 1e-9)
mic = ld(sys.argv[1]); M = env(mic); res = {}
for p in args:
    name = p.rsplit('/', 1)[-1].rsplit('.', 1)[0]
    c = ld(p); Ce = env(c)
    xc = fftconvolve(M, Ce[::-1], 'valid')
    if name in near:   # restrict to ±60 s around the expected offset
        lo = max(0, int((near[name] - 60) * SR / 40)); hi = min(len(xc), int((near[name] + 60) * SR / 40)); i = lo + int(np.argmax(xc[lo:hi]))
    else: i = int(np.argmax(xc))
    score = xc[i] / len(Ce)
    s0 = max(0, i * 40 - SR); seg = mic[s0:s0 + len(c) + 2 * SR]
    xr = fftconvolve(seg, c[::-1], 'valid'); j = int(np.argmax(np.abs(xr)))
    res[name] = dict(off=round((s0 + j) / SR, 3), score=round(float(score), 3)); print(name, res[name], flush=True)
json.dump(res, open(sys.argv[2], 'w'), indent=1)
