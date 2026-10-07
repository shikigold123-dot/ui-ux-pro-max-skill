# Music map: tempo, beat grid, loudness per 0.5 s, strong onsets and phrase dips (where a cut/loop/stop sounds natural).
# Usage: venv/bin/python music_analyze.py <music.wav>
# Use it to: put action cuts on beats, loop/repeat a phrase (splice at phrase starts, length = whole beats),
# hard-stop before the climax on a phrase boundary, and resume later where it stopped.
import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
print(f'duration {len(y) / sr:.2f}s')
tempo, beats = librosa.beat.beat_track(y=y, sr=sr); bt = librosa.frames_to_time(beats, sr=sr)
tempo = float(np.atleast_1d(tempo)[0]); print(f'tempo {tempo:.1f} bpm  beat {60 / tempo:.4f}s  first beats', ' '.join(f'{b:.2f}' for b in bt[:8]))
rms = librosa.feature.rms(y=y, hop_length=sr // 2)[0]; db = 20 * np.log10(rms + 1e-9)
print('loudness/0.5s:', ' '.join(f'{i / 2:.1f}:{d:.0f}' for i, d in enumerate(db)))
env = librosa.onset.onset_strength(y=y, sr=sr); on = librosa.onset.onset_detect(y=y, sr=sr, units='time')
strong = [t for t in on if env[librosa.time_to_frames(t, sr=sr)] > np.percentile(env, 92)]
print('strong onsets', ' '.join(f'{t:.2f}' for t in strong))
# phrase dips: local loudness minima at least 4 beats apart
h = 512; r = librosa.feature.rms(y=y, hop_length=h)[0]; r = np.convolve(r, np.ones(9) / 9, 'same'); ts = librosa.frames_to_time(np.arange(len(r)), sr=sr, hop_length=h)
dips = [ts[i] for i in range(5, len(r) - 5) if r[i] == r[i - 5:i + 6].min() and r[i] < np.percentile(r, 35)]
pd, last = [], -99
for d in dips:
    if d - last > 4 * 60 / tempo: pd.append(d); last = d
print('phrase dips', ' '.join(f'{d:.2f}' for d in pd))
