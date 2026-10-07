# Kinetic typography (kinetic.js)

Reference look: high-end motion-graphics reels — text on paths, ghost-fill, HUD crop marks, soft glow — kept
quiet and legible. Captions are **part of the picture**, never a subtitle bar at the bottom.

## Families (one block mixes 2–3)
| key | font | use | typical size (px on 1080 w) |
|---|---|---|---|
| `ST.c` | Anton (condensed caps) | THE key word, scores, titles | 150–430 |
| `ST.s` | Archivo 800 | body lines | 56–84 |
| `ST.r` | Instrument Serif Italic | the emotional/turning word | 96–200 |
| `ST.m` | JetBrains Mono 500, tracked | labels, HUD, numbers | 21–40 |
| arab | Amiri | Arabic, ﷺ ﷻ | 120–560 |
`KEY` = accent colour + glow for 1 word per line (max 2).

## Primitives
- `kword(t, s, x, y, o, t0, t1, vis, out, align)` — ghost (17 % fill, no stroke) → letters fill t0→t1 → blur-lift out.
- `kblock(t, rows, a, b)` — stacked rows `{y, x|align, ws:[[text,t0,t1,style]], rise}`; enters a−0.12…a+0.35, each
  word fades out staggered from b. **b must end before the next block's a** (≥ 0.05 s gap).
- `arcText` / `arcWords(t, ws, cx, cy, r, a0, o, vis, out, dir)` — on a circle (clock, ball, logo). dir 1 = top
  reading clockwise; −1 = under the circle.
- `waveText(t, words, x0, x1, y0, amp, k, phase, o, vis, out)` — glowing line drawn ahead of the words (chase).
  One wave per short line; measure that it fits (x1 − x0).
- `floorText(...)` — perspective on the ground (squash 0.42, shear −0.3); fixed gap between words (46 px).
- `dustText(t, key, s, o, cx, cy, ts, alpha)` — word dissolves to particles at ts (scores, "10:0").
- `hud(t, a, {tl,tr,bl,br})` — crop marks + one mono label. Keep it to ONE label (event · date). No talk timecode.
- Helpers: `WD(id)` words of a VO line, `wv(id, i, style, txt)` one word, `endOf(id)`.

## Layout rules
- Safe area: x 84–996, y 230–1700 (top/bottom UI of Instagram/WhatsApp). Body left-aligned at x 90 or centred.
- Line heights: body ~1.25×size; between a 64 px line and a 190 px key word use ≥ 1.2× the big size.
- Mixed-font rows: measure each word with its own style (`mw`) — mismatched measuring = words touching
  ("ein Team" without a gap, "hinterher" letters cramped).
- Legibility: `scrim(y0, y1, a)` gradient behind text on bright footage (0.45–0.6), never a box.
- One block on screen at a time. If the voice continues into a new sentence, the old block must be gone
  ("FUSSBALL still on screen while the next sentence starts" was a bug).
- Key word timing: slam/fill exactly on the spoken word (onset-corrected). Ghost appears with the sentence start.
- Don't put text over faces; place by the shot (sky, turf, wall). Text can sit behind a person (person mask).
- Arabic greeting: write right-to-left with the pen spark, then the Latin transliteration fills left-to-right.
- Emoji in text: join with NBSP (` `) so it never wraps alone.
- Text sizes: the user asked twice for BIGGER talk captions — body ≥ 64 px, key word ≥ 150 px.
- No outline on ghost text and grain ≤ 0.06: both made letters shimmer after encoding.
