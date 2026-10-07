# Audio — voice, cuts, music, mix

## Voice cleaning (the "why is his voice so low quality???" lesson)
- Source in the Bayan reel: lavalier into a recorder, 24-bit 48 kHz, dull + room reverb. ffmpeg `afftdn` made it
  worse (watery, even duller). Fix: **DeepFilterNet3** (denoise + de-reverb) then a presence EQ:
  `highpass 90 · −4 dB @230 Hz (mud) · +2 @1.8k · +3.5 @3.2k (intelligibility) · +1.5 @5.5k (air) · de-esser · 3:1 comp · limiter`.
- `voice_clean.py` does both. Install: `setup_env.sh` (patches deepfilternet's torchaudio import; weights from the
  HuggingFace mirror `niobures/DeepFilterNet` because GitHub release downloads may be blocked).
- Verify: LTAS before/after (numpy rfft averaged) — more 2–5 kHz, less 200–300 Hz; and Whisper transcribes cleanly.
- If the voice sits on camera audio only: same chain; if very noisy try `atten_lim_db=18` to keep it natural.

## Cutting speech (the "words are cut off" lesson)
- Never cut at Whisper word edges. `vo_plan.py`: in = quietest 10 ms in the gap before the first word; out = quietest
  10 ms after the last word. Tight joins (< 0.12 s) → search the energy dip around the edge instead.
- Word ends trail longer than Whisper says ("Fußballspiel" → end at 240.26 not 240.0). Starts are early by 40–80 ms
  → `onset()` re-times caption words to the energy onset.
- When a chunk ends mid-thought, extend it to the end of the phrase ("…dass jeder Spieler eine Position hat").
- Remove stray syllables in front ("da" before the question) with a manual `override` in-point.
- After every mix: `whisper_check.py vo.json voice.wav` — compare plan vs heard for every chunk. Ambiguity in the
  source ("Toren"/"Tore") is fine; a missing syllable is not.
- 10 ms envelope plot when in doubt: `rms` every 5 ms around the edge, print as a bar chart, pick the dip by eye.

## Music editing
- `music_analyze.py` → bpm, beat length, phrase dips. Nasheed "My Dream": 99.4 BPM, beat 0.6036 s.
- **Repeat a phrase** to lengthen: lay the same source range twice; splice at a phrase start; 12 ms fades.
- **Insert time** (e.g. a 6-beat chase) in whole beats so the grid stays in phase for everything after.
- **Hard stop for the climax**: cut on the frame (8 ms fade), keep only a long hall tail of the last 0.45 s
  (`long_verb`, −5 dB), silence until the release; **resume where it stopped** with a 1.2 s fade-in.
- Duck under voice −14 dB (attack 0.12 s, release 0.45 s); optional extra −4 dB across a long talk chapter.
- Vocal-only nasheeds (no instruments) are the norm for Islamic events — keep it that way unless the user sends music.

## Bed + sound design
- Location bed rebuilt from the frame log: each frame plays its own clip's audio at the source time (Hann grains),
  −15 dB, ducked −9 dB under voice. Mute speech plates and climax plates (`MUTE_BED`).
- Tiny click on every cut in energetic parts (−14 dB), none in calm parts.
- Vocabulary (atoms.py): boom (intro, big reveals), whoosh (cuts, reversed for reveals/pen), riser (into a reveal or
  light), kick (under slammed key words), tick (odometer, clock), typeclick (under ghost-fill words, −22 dB),
  whistle (referee), drone + heartbeat + ear_ring (silent climax), sand (dust dissolve), blip (chat).
- SFX and subs ducked −7 dB under voice. Report: **voice/rest ≥ +10 dB for every line**; boost single lines
  (`VOICE_GAIN`) rather than lowering everything.
- Master: `loudnorm=I=-14:TP=-1.0:LRA=11`, AAC 256k in the master, 160k in the < 30 MiB deliverable.
- Watch numpy broadcasting in atoms (shape 1200 vs 960 errors = mixing mono/stereo or different lengths).
