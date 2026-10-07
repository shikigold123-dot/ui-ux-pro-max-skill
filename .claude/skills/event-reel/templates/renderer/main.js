// main.js — THE FILM. One file per project: timeline constants on top, one async function per chapter, draw() dispatches.
// This skeleton is runnable against the demo project (scripts/demo_project.sh) and shows the house patterns:
//   cold intro wordmark → arrival montage (greeting wipe, date odometer) → the talk (speaker, kinetic type in the picture)
//   → action montage on the music grid (mixed tempo) → music-less climax (dust, portal) → calm ending + group photo.
// Replace shot ids / VO ids / texts with the project's. Everything is a pure function of t (seconds of film time).

const BEAT = 60 / 100;                 // from scripts/music_analyze.py (bpm) — cuts in the action land on beats
const M0 = 14.0;                       // first beat of the action montage (snap to a music phrase start)
const bt = k => M0 + k * BEAT;
const T = { intro: 0, arrive: 3.2, talk: 8.0, action: M0, climax: bt(16), end: bt(16) + 6.0 };
const DUR = T.end + 5.0;

// ================================================================== 1 · INTRO: wordmark out of black (plain bold type, no script fonts)
async function intro(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const z = 1 + 0.04 * prog(t, 0, T.arrive);
  ctx.save(); zoomAbout(W / 2, H / 2, z);
  kblock(t, [
    { y: 860, align: 'center', ws: [['DAR UL-BAYAN', 0.35, 0.9, ST.s(78, { ls: 6 })]] },
    { y: 1090, align: 'center', ws: [['EVENT', 0.8, 1.3, { ...ST.c(250), ...KEY }]] },
    { y: 1200, align: 'center', ws: [['Name des Events', 1.2, 1.8, ST.r(96)]] },
  ], 0.3, T.arrive - 0.6);
  ctx.restore();
  hud(t, prog(t, 0.2, 0.8) * (1 - prog(t, T.arrive - 0.4, T.arrive)), { tl: 'EVENT · DD.MM.YYYY' });
}

// ================================================================== 2 · ARRIVAL: calm shots, greeting + date
async function arrival(t) {
  const id = await sequence(['arr1', 'arr2'], t, { push: 0.06, punch: 0.06 });
  vignette(0.5);
  if (t - SHOTS[id].a < 0.25) zoomBlur(0.14 * (1 - E.outCubic(prog(t, SHOTS[id].a, SHOTS[id].a + 0.25))));
  scriptWipe(t, 'السلام عليكم', 'rtl', [['Salam', 4.4, 4.7, ST.s(96)], ['Aleykum', 4.7, 5.1, { ...ST.s(96), ...KEY }]], 3.5, 6.0, 1240, 'ANKUNFT · 18:41');
  odometer(t, '03.10.2026', 6.3, 1010, ST.c(176, { ls: 4 }), { end: 7.7, sub: 'SAMSTAG · ORT · STADT', over: 'EVENT NAME' });
}

// ================================================================== 3 · THE TALK: speaker shot holds, type builds in the picture
async function talk(t) {
  await shot('talk1', t, { s: 1.03 + 0.05 * prog(t, T.talk, T.action), fy: 1000 });
  vignette(0.55);
  const q = WD('V1');
  scrim(1050, 1800, 0.55 * prog(t, q[0][1] - 0.3, q[0][1]));
  kblock(t, [
    { y: 1250, x: 90, ws: q.slice(0, 3).map(w => [w[0], w[1], w[2], ST.s(70)]) },
    { y: 1480, x: 84, ws: [[q[3][0].toUpperCase(), q[3][1], q[3][2], { ...ST.c(220), ...KEY }]] },
    { y: 1610, x: 90, ws: q.slice(4).map(w => [w[0], w[1], w[2], ST.r(100)]) },
  ], q[0][1], endOf('V1') + 0.5);
}

// ================================================================== 4 · ACTION: music grid, mixed tempo (2 | 4 | 1 1 1 1 | 2 | 1 1 | 4 beats)
async function action(t) {
  const id = await sequence(['act1', 'act2', 'act3', 'act4', 'act5', 'act6'], t, { push: 0.08, punch: 0.1 });
  const s = SHOTS[id], since = t - s.a;
  if (since < 0.06 && s.b - s.a < 1.2 * BEAT) flash(0.35 * (1 - since / 0.06));       // 1-beat bursts get a tiny flash
  vignette(0.5);
  ringTimer(t, bt(0) + 0.1, bt(6), 540, 0, 'SPIELZEIT');
  const q = WD('V2');
  // one wave per line — measure: a line must fit in W - 130 px (long lines run off the frame)
  const vis = prog(t, q[0][1] - 0.3, q[0][1]), out = clamp((t - endOf('V2') - 0.6) / 0.3), st = w => w[0].startsWith('Dunya') ? { ...ST.r(116), ...KEY } : ST.s(80);
  waveText(t, q.slice(0, 3).map(w => [w[0], w[1], w[2], st(w)]), 70, W - 60, 1180, 22, 0.008, t * 1.6, ST.s(80), vis, out);
  waveText(t, q.slice(3).map(w => [w[0], w[1], w[2], st(w)]), 70, W - 60, 1420, 22, 0.008, t * 1.6 + 1.6, ST.s(80), vis, out);
}

// ================================================================== 5 · CLIMAX: music stops dead, black, the line, the word dissolves, portal into the ending
async function climax(t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const a = T.climax;
  kblock(t, [{ y: 820, align: 'center', ws: [['und am Ende?', a + 0.4, a + 1.4, ST.r(110)]] }], a + 0.3, a + 2.6);
  if (t > a + 1.6 && t < a + 4.0) dustText(t, 'zero', '10:0', ST.c(420), W / 2, 1150, a + 2.4, prog(t, a + 1.6, a + 1.8));
  kblock(t, [{ y: 1230, align: 'center', ws: [['SPIEL', a + 4.2, a + 4.7, ST.c(430)]] }], a + 4.0, 99);
  if (t > T.end - 0.3) await portal(t, 'SPIEL', 1230, 430, 2, T.end, 'end1', SHOTS.end1.a);   // fly through the "I"
}

// ================================================================== 6 · ENDING: calm, light, the group (photo pan in the real film)
async function ending(t) {
  await shot('end1', t, { s: 1.04 + 0.04 * prog(t, T.end, DUR) });
  vignette(0.6);
  kblock(t, [
    { y: 760, align: 'center', ws: [['Danke', T.end + 1.0, T.end + 1.5, ST.r(140)]] },
    { y: 900, align: 'center', ws: [['FÜRS DABEISEIN', T.end + 1.5, T.end + 2.1, { ...ST.c(130), ...KEY }]] },
  ], T.end + 0.9, DUR - 0.9);
  black(E.inOutCubic(prog(t, DUR - 0.9, DUR)));
}

// ------------------------------------------------------------------ entry
async function draw(t, f) {
  if (t < T.arrive) await intro(t);
  else if (t < T.talk) await arrival(t);
  else if (t < T.action) await talk(t);
  else if (t < T.climax) await action(t);
  else if (t < T.end + 0.95) await climax(t);       // portal hands over after its fly-through
  else await ending(t);
  if (t >= T.arrive && t < T.arrive + 0.15) black(1 - prog(t, T.arrive, T.arrive + 0.15));   // dip, never a white flash
  grain(f, t >= T.climax && t < T.end ? 0.1 : 0.055);
}
window.projectSetup = async () => {
  VO = await (await fetch('../vo.json')).json();
  try { LAND = await (await fetch('../land.json')).json(); } catch (e) { }
  await loadAsset('poster', '../assets/poster.jpg');
};
window.DURATION = DUR;
