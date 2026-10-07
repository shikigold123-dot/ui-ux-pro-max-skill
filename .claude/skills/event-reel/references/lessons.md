# Lessons — every correction from the Bayan Turnier reel (v1 → v12), as checks

Run through this list before delivering any version.

## Sound
- [ ] Voice clear and present (DFN3 + EQ) — "why is his voice such low quality???"
- [ ] No word clipped at start or end — "Fußball… the 'spiel' is gone", "'es ist so' gets cut off".
- [ ] No stray syllable before a line — "at 1:22 there's still a 'da'".
- [ ] The hard line hits harder: abrupt music stop, hall on the voice, drone/heartbeat — "make the Todesengel moment more abrupt and oppressive, maybe a reverb".
- [ ] voice/rest ≥ +10 dB on every line; music never fights the voice.

## Picture / framing
- [ ] Handshake: hands only — first "only the hands", then "a bit wider, but no faces of either". Find the framing that satisfies both.
- [ ] Shoe scene: only the moment the foot goes into the shoe.
- [ ] Shot to camera: frame so only the left hand is seen, crop the right hand that grabs afterwards.
- [ ] "Every player has a team" → a matching short scene (teammates in the same bibs), not a random shot.
- [ ] Ball → Earth must be clearly visible and correctly aligned after any re-framing (it broke once when the frame was zoomed: transform the track analytically).
- [ ] Venue sign: light up its OWN colour (green LaOla sign) like the earlier shirt glow — no blue band with text over it.
- [ ] Shot to camera filmed badly can't be fixed — say so honestly, get the most out of it.

## Text
- [ ] The talk captions creative, in the picture, BIG — "not classic at the bottom", "write the talk bigger, you can hardly see it".
- [ ] No text still on screen when the next sentence starts — "FUSSBALL is still shown although the next sentence started", "the previous text should go slightly earlier so there's no overlap".
- [ ] No text covering other text — "'genau wie im' covers 'Fußball'", "'dass jeder' a bit higher, otherwise they run into each other".
- [ ] Spacing between words correct — "'ein Team' has no space", "'hinterher' letters too close".
- [ ] Nothing runs out of frame — "'hinterher' goes out of the picture".
- [ ] No duplicated info — "10:0 shown twice, only the big one", winners' info only on the final group photo.
- [ ] No overlays the user didn't ask for — remove talk timecode info, "Bayan Turnier" label at 0:42, scores next to the list.
- [ ] Lines that don't fit the message get cut ("im Feld getrennt, im Deen eins" — "doesn't fit").
- [ ] Wordmark in normal bold type, no script font (original logo not available).
- [ ] Greeting and date animated properly and not as the first thing — "the 03.10 near the start doesn't fit, animate it better".
- [ ] Little flicker on text: no ghost outline, grain ≤ 0.06.

## Structure / feel
- [ ] Core message comes through clearly — "the core message must come out more, change the video as you like".
- [ ] Mixed tempo, not only short shots.
- [ ] Transition before the big question ("Welche Rolle hat Allah in deinem Leben") — a real transition (portal), not a cut.
- [ ] Sync of picture and speech in the reflection part ±2–3 s checked — "synchronisation doesn't fit 2–3 s before and after".
- [ ] Chat opener: video bubble lower with a gap under the last message; black (not white) transition; fade out → fade in.
- [ ] Production ready: "give it everything, max quality".

## Process
- The user gives timestamped notes in bullets; fix every bullet, answer each one in the summary.
- Timestamps include the chat opener — convert.
- Report honestly what couldn't be done (Drive upload of 235 MB, bad source footage).
- Don't push videos into the repo. Keep deliverables in the scratchpad `output/`.
- Process traps: `pkill -f <pattern>` killed the agent's own shell (pattern in its command line) → use PID files;
  the http.server dies → check with curl before rendering; concat raced with unfinished segments → write list after `wait`;
  `rm` with globs after `cd` was blocked by the sandbox → use explicit paths.
