# Speech cleanup for lavalier / camera audio: DeepFilterNet3 (denoise + de-reverb) → voice EQ chain.
# Usage: venv/bin/python voice_clean.py <in.wav> <out.wav> [atten_lim_db]   (run from the dir that holds dfm/)
# Why: plain afftdn/arnndn makes a dull, roomy lav WORSE ("low quality" complaint). DFN3 + presence EQ fixed it.
# Check the result by ear-proxy: LTAS before/after (more 2–5 kHz, less 200–300 Hz mud) and Whisper still transcribes cleanly.
import sys, subprocess, wave, numpy as np, torch
from df.enhance import enhance, init_df
src, dst = sys.argv[1], sys.argv[2]
lim = float(sys.argv[3]) if len(sys.argv) > 3 else None
model, state, _ = init_df(model_base_dir='dfm/DeepFilterNet3')
SR = state.sr()
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
x = torch.from_numpy(np.frombuffer(raw, np.float32).copy())[None]
out, CH = [], SR * 30
for i in range(0, x.shape[1], CH):              # 30 s blocks with 1 s of left context (memory-safe on long talks)
    seg = x[:, max(0, i - SR):i + CH]
    y = enhance(model, state, seg, atten_lim_db=lim)
    out.append(y[:, (SR if i > 0 else 0):][:, :CH]); print(i // SR, 's', flush=True)
y = torch.cat(out, 1)[0].numpy(); y = y / (np.abs(y).max() + 1e-9) * 0.9
tmp = dst + '.dfn.wav'
w = wave.open(tmp, 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
EQ = ('highpass=f=90:p=2,equalizer=f=230:t=q:w=1.2:g=-4,equalizer=f=1800:t=q:w=1.5:g=2,equalizer=f=3200:t=q:w=1.2:g=3.5,'
      'equalizer=f=5500:t=q:w=1.5:g=1.5,deesser=i=0.3:f=0.5,acompressor=threshold=0.1:ratio=3:attack=6:release=90:makeup=1.5,alimiter=limit=0.9')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', EQ, '-ar', '48000', dst], check=True)
print('done', dst)
