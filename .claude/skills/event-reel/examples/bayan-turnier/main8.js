// v8 — the talk's core message carries the film. New: kinetic speech type (caps8), Earth on the ball,
// "Wir rennen der Dunya hinterher" chase, a music-less climax ("…das falsche Spiel gespielt"), prayer with "Allah ﷻ".
const C3A = 21.80, C4A = 27.02, TEAM_END = 29.62;
const X1 = 6 * BEAT, CH0 = 61.72 + X1, PR0 = 76.0, SHIFT_B = PR0 - 52.06, DUR8 = 69.3 + SHIFT_B;
let VO8 = [], LAND = [];
const V8 = id => VO8.find(v => v.id === id), WD = id => V8(id).words;
const S = (o) => o; // style literal helper
const ST = {
  s: (size, x = {}) => ({ ff: 'sans', size, ...x }),
  r: (size, x = {}) => ({ ff: 'serif', size, ...x }),
  c: (size, x = {}) => ({ ff: 'cond', size, ls: 2, ...x }),
  m: (size, x = {}) => ({ ff: 'mono', size, weight: 500, ls: 4, ...x }),
};
const KEY = { color: BLUE, glow: 'rgba(80,170,255,0.9)' };
// word i of a VO as [text, t0, t1, style]
const w8 = (id, i, st, txt) => { const w = WD(id)[i]; return [txt ?? w[0], w[1], w[2], st]; };
const endOf = id => { const ws = WD(id); return ws[ws.length - 1][2]; };

// ================================================================== B · OUTSIDE overlays
// "Salam Aleykum": Arabic writes itself right-to-left (its own direction), the Latin line fills in after it.
function salam(t) {
  if (t < 5.8 || t > 8.3) return;
  const out = clamp((t - 7.92) / 0.32), y = 1240;
  const g = ctx.createLinearGradient(0, 900, 0, 1700); g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(0.5, `rgba(4,8,12,${0.55 * (1 - out)})`); g.addColorStop(1, 'rgba(4,8,12,0)');
  ctx.save(); ctx.globalAlpha = E.outCubic(prog(t, 5.8, 6.1)); ctx.fillStyle = g; ctx.fillRect(0, 900, W, 800); ctx.restore();
  // Arabic: clip-wipe from the right with a spark at the pen
  const u = E.inOutCubic(prog(t, 5.95, 6.85));
  ctx.save(); fnt({ ff: 'arab', size: 190 }); ctx.textAlign = 'center';
  const aw = ctx.measureText('السلام عليكم').width, x1 = W / 2 + aw / 2 + 20, xw = x1 - (aw + 40) * u;
  ctx.globalAlpha = 0.16 * (1 - out); ctx.fillStyle = '#f5f1e8'; ctx.fillText('السلام عليكم', W / 2, y);
  ctx.beginPath(); ctx.rect(xw, y - 260, x1 - xw + 10, 360); ctx.clip();
  ctx.globalAlpha = 1 - out; ctx.shadowColor = 'rgba(80,170,255,0.8)'; ctx.shadowBlur = 40; ctx.fillStyle = '#f5f1e8';
  ctx.translate(0, -30 * E.inCubic(out)); ctx.fillText('السلام عليكم', W / 2, y);
  ctx.restore();
  if (u > 0 && u < 1) spark(xw, y - 70, 1, 10);
  // Latin, filling left-to-right
  const lw = mw('Salam Aleykum', ST.s(96));
  kword(t, 'Salam', W / 2 - lw / 2, y + 185, ST.s(96), 6.62, 6.95, E.outCubic(prog(t, 6.45, 6.7)), out);
  kword(t, 'Aleykum', W / 2 - lw / 2 + mw('Salam ', ST.s(96)), y + 185, { ...ST.s(96), ...KEY }, 6.95, 7.35, E.outCubic(prog(t, 6.45, 6.7)), out);
  const la = E.outCubic(prog(t, 6.0, 6.4)) * (1 - out);
  ctx.save(); fnt(ST.m(22)); ctx.textAlign = 'center'; ctx.globalAlpha = 0.8 * la; ctx.fillStyle = BLUE; ctx.fillText('ANKUNFT · 18:41', W / 2, y + 270); ctx.restore();
}
// the date: an odometer that rolls into 03.10.2026, with the place underneath
function dateStamp(t) {
  if (t < 14.26 || t > 15.5) return;
  const out = E.inExpo(prog(t, 15.22, 15.49)), y = 1010, s = '03.10.2026', o = ST.c(176, { ls: 4 });
  const cws = [...s].map(c => mw(c, o)), tot = cws.reduce((a, b) => a + b, 0); let x = W / 2 - tot / 2;
  ctx.save(); ctx.globalAlpha = 0.45 * (1 - out) * E.outCubic(prog(t, 14.26, 14.4)); ctx.fillStyle = '#04080c'; ctx.fillRect(0, y - 250, W, 420); ctx.restore();
  [...s].forEach((c, i) => {
    const a = 14.32 + i * 0.045, u = E.outExpo(prog(t, a, a + 0.55));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 160, cws[i] + 8, 200); ctx.clip(); ctx.translate(0, -60 * out); ctx.globalAlpha = 1 - out;
    if (c === '.') { if (u > 0.5) { fnt(o); ctx.fillStyle = BLUE; ctx.fillText(c, x, y); } }
    else {
      const d = +c, roll = (1 - u) * (8 + i), base = d + roll; // digits scroll upward and land
      for (let k = -1; k <= 1; k++) { const n = ((Math.floor(base) + k) % 10 + 10) % 10, yy = y + (k - (base - Math.floor(base))) * -175; fnt(o); ctx.fillStyle = '#f5f1e8'; ctx.globalAlpha = (1 - out) * (k === 0 ? 1 : 0.5); ctx.fillText(String(n), x, yy); }
    }
    ctx.restore(); x += cws[i];
  });
  const lu = E.outExpo(prog(t, 14.55, 15.0)); ctx.save(); ctx.globalAlpha = 1 - out; ctx.fillStyle = BAND; ctx.fillRect(W / 2 - 330 * lu, y + 46, 660 * lu, 6); ctx.restore();
  ctx.save(); fnt(ST.m(24, { ls: 6 })); ctx.textAlign = 'center'; ctx.globalAlpha = (1 - out) * E.outCubic(prog(t, 14.7, 15.0)); ctx.fillStyle = '#f5f1e8';
  ctx.fillText('SAMSTAG · LAOLA SPORTCENTER · ESSEN', W / 2, y + 112); ctx.restore();
  ctx.save(); fnt(ST.m(22)); ctx.textAlign = 'center'; ctx.globalAlpha = 0.8 * (1 - out) * E.outCubic(prog(t, 14.4, 14.7)); ctx.fillStyle = BLUE; ctx.fillText('BAYAN TURNIER', W / 2, y - 200); ctx.restore();
}

// ================================================================== C · SPEECH CHAPTER (hero kept, type rebuilt bigger)
async function hero8(t) {
  const sc = 1.02 + 0.07 * E.inOutCubic(prog(t, 16.90, C3A)), fx = W / 2, fy = 1250;
  await shot('c2', t, { s: sc, fx, fy });
  vignette(0.55); black(0.34 * E.outCubic(prog(t, 16.90, 17.3)));
  const q1 = WD('Q1'), q2 = WD('Q1b'), wt = i => q1[i][1], vt = i => q2[i][1];
  const qe = q2[q2.length - 1][2], out = E.inExpo(prog(t, qe + 0.04, qe + 0.3)), swap = E.inOutCubic(prog(t, vt(0) - 0.28, vt(0) - 0.02)), par = 1 + 0.035 * prog(t, 16.9, C3A);
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(par, par); ctx.translate(-W / 2, -1000 - 160 * out); ctx.globalAlpha = 1 - out;
  const big = (s, y, a, col, gone = 0, pulse = 0) => { const u = E.outExpo(prog(t, a - 0.05, a + 0.35)); if (u <= 0 || gone >= 1) return; const k = 1 + 0.08 * (1 - u) + 0.06 * pulse; ctx.save(); ctx.globalAlpha *= 1 - gone; ctx.beginPath(); ctx.rect(0, y - 260, W, 300); ctx.clip(); text(s, W / 2, y + 180 * (1 - u) + 200 * gone, { size: 280, ls: 4, color: col, sx: k, sy: k, shadow: true, shadowBlur: 50 }); ctx.restore(); };
  const vis1 = E.outCubic(prog(t, wt(0) - 0.15, wt(0) + 0.2)) * (1 - swap);
  // Q1 small words as ghost-fill rows
  const r1 = [['Was', 0], ['hat', 1], ['eigentlich', 2]].map(([s, i]) => [s, q1[i][1], q1[i][2]]);
  let x = W / 2 - (mw('Was hat eigentlich', ST.s(62))) / 2;
  r1.forEach(([s, a, b]) => { kword(t, s, x, 440, ST.s(62), a, b, vis1, 0); x += mw(s + ' ', ST.s(62)); });
  const pulse = Math.sin(Math.PI * prog(t, vt(6) - 0.05, vt(6) + 0.35));
  big('FUSSBALL', 735, wt(3), C.white, swap);
  if (t > vt(6) - 0.1) big('FUSSBALL', 735, vt(6), C.white);
  kword(t, 'mit', W / 2, 840, ST.r(76, KEY), q1[4][1], q1[4][2], vis1, 0, 'center');
  big('ISLAM', 1090, wt(5), C.gold2, swap);
  x = W / 2 - mw('zu tun?', ST.s(62)) / 2; kword(t, 'zu', x, 1200, ST.s(62), q1[6][1], q1[6][2], vis1, 0); kword(t, 'tun?', x + mw('zu ', ST.s(62)), 1200, ST.s(62), q1[7][1], q1[7][2], vis1, 0);
  if (t > vt(0) - 0.15) {
    const vis2 = E.outCubic(prog(t, vt(0) - 0.15, vt(0) + 0.2));
    const r = [['Das', 0, ST.s(70)], ['Leben', 1, ST.r(96, KEY)], ['ist', 2, ST.s(70)]]; let xx = W / 2 - (r.reduce((p, c) => p + mw(c[0] + ' ', c[2]), 0)) / 2;
    r.forEach(([s, i, o]) => { kword(t, s, xx, 330, o, q2[i][1], q2[i][2], vis2, 0); xx += mw(s + ' ', o); });
    const r2 = [['genau', 3], ['wie', 4], ['im', 5]]; xx = W / 2 - mw('genau wie im', ST.s(58)) / 2;
    r2.forEach(([s, i]) => { kword(t, s, xx, 425, ST.s(58), q2[i][1], q2[i][2], vis2, 0); xx += mw(s + ' ', ST.s(58)); });
    const r3 = E.outExpo(prog(t, vt(6), vt(6) + 0.5)); if (r3 > 0) { ctx.fillStyle = C.band; ctx.fillRect(W / 2 - 220 * r3, 770, 440 * r3, 8); }
    // "Das Fußballspiel." — the sentence ends on the anchor word
    xx = W / 2 - mw('das Fußballspiel.', ST.r(78)) / 2; kword(t, 'das', xx, 880, ST.r(78), q2[7][1], q2[7][2], E.outCubic(prog(t, q2[7][1] - 0.15, q2[7][1])), 0); kword(t, 'Fußballspiel.', xx + mw('das ', ST.r(78)), 880, { ...ST.r(78), ...KEY }, q2[8][1], q2[8][2], E.outCubic(prog(t, q2[7][1] - 0.15, q2[7][1])), 0);
  }
  ctx.restore();
  try { await cutoutFull('c2', t); drawLayer(cut.c, sc, fx, fy, 1); } catch (e) { }
}
async function positions8(t) {
  await shot('c3', t, { s: 1.06 + 0.04 * prog(t, C3A, C4A), fy: 1100 });
  vignette(0.5);
  const q = WD('Q2'), T = i => q[i][1];
  BOARD.y = 600; BOARD.w = 440; BOARD.h = 600;
  const keys = { TW: { pop: T(3), hi: T(8), label: 'TORWART' }, VL: { pop: T(3) + 0.08, hi: T(9), label: '' }, VR: { pop: T(3) + 0.16, hi: T(9), label: 'VERTEIDIGER' }, MF: { pop: T(3) + 0.24, hi: T(10), label: 'MITTELFELD' }, ST: { pop: T(3) + 0.32, hi: T(12), label: 'STÜRMER' } };
  tacticsBoard(t, C3A + 0.1, keys, E.inExpo(prog(t, C4A - 0.28, C4A)));
  // caption block under the board
  kblock(t, [
    { y: 1170, x: 90, ws: [w8('Q2', 0, ST.s(64)), w8('Q2', 1, ST.s(64)), w8('Q2', 2, ST.s(64))] },
    { y: 1420, x: 90, ws: [w8('Q2', 3, ST.c(190, KEY), 'POSITION'), w8('Q2', 4, ST.r(110), 'hat.')] },
  ], q[0][1], q[5][1] - 0.2);
  kblock(t, [{ y: 1300, x: 90, ws: [w8('Q2', 5, ST.s(64)), w8('Q2', 6, ST.s(64)), w8('Q2', 7, ST.r(96), 'du –')] }], q[5][1], C4A - 0.28);
}
// labels on the board, bigger than v7
tacticsBoard = (function (orig) {
  return function (t, a, keys, out) {
    const _text = text;
    text = (s, x, y, o) => _text(s, x, y, s && o && o.f === 'Oswald' && o.size === 34 ? { ...o, size: 46, ls: 5 } : o);
    try { orig(t, a, keys, out); } finally { text = _text; }
  };
})(tacticsBoard);
async function team8(t) {
  const q = WD('Q2'), sc = 1.04 + 0.05 * prog(t, C4A, TEAM_END);
  await shot('c4', t, { s: sc, fy: 1000 });
  vignette(0.5);
  const g = ctx.createLinearGradient(0, 1100, 0, H); g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(1, 'rgba(4,8,12,0.7)'); ctx.fillStyle = g; ctx.fillRect(0, 1100, W, H - 1100);
  kblock(t, [
    { y: 1290, x: 90, ws: [13, 14].map(i => w8('Q2', i, ST.s(70))) },
    { y: 1380, x: 90, ws: [15, 16, 17, 18].map(i => w8('Q2', i, ST.s(70))) },
  ], q[13][1], 29.3);
}
function teamFloor(t) { // "ein Team." lies on the turf and rides the cut into the boot shot
  const q = WD('Q2'); if (t < q[19][1] - 0.25 || t >= TEAM_END) return;
  const vis = E.outCubic(prog(t, q[19][1] - 0.25, q[19][1] + 0.1)), out = clamp((t - (TEAM_END - 0.16)) / 0.16);
  const o1 = ST.s(120), o2 = { ...ST.c(330), ...KEY }, w1 = mw('ein', o1), w2 = mw('TEAM.', o2), gap = 46, x0 = W / 2 - (w1 + gap + w2) / 2;
  floorText(t, 'ein', x0 + w1 / 2, 1680, o1, q[19][1], q[19][2], vis, out, 0.42, -0.3);
  floorText(t, 'TEAM.', x0 + w1 + gap + w2 / 2, 1680, o2, q[20][1], q[20][2] + 0.1, vis, out, 0.42, -0.3);
}
async function speech8(t) {
  if (t < 16.90) {
    await shot('c1', t, { s: 1.03 + 0.05 * prog(t, 15.49, 16.90), fy: 1000 });
    vignette(0.55); zoomBlur4(0.14 * (1 - E.outCubic(prog(t, 15.49, 15.8))));
    speakerTag(t, 15.62, 16.88);
  } else if (t < C3A) await hero8(t);
  else if (t < C4A) await positions8(t);
  else await team8(t);
}
function kick8(t) { // "Bruder, viel Spaß beim Fußball." over the boot
  const q = WD('K'); if (t < q[0][1] - 0.2 || t > 32.4) return;
  kblock(t, [
    { y: 430, x: 90, ws: [w8('K', 0, ST.m(40, { color: BLUE }), 'BRUDER,')] },
    { y: 600, x: 84, ws: [w8('K', 1, ST.r(170)), w8('K', 2, { ...ST.r(170), ...KEY })] },
    { y: 710, x: 90, ws: [w8('K', 3, ST.s(84)), w8('K', 4, ST.s(84))] },
  ], q[0][1], 32.05);
}

// ================================================================== F · MATCH: type around the clock, the whistle line
clock = function (t, a, b, from, to, label = 'SPIELZEIT') {
  const fi = E.outExpo(prog(t, a, a + 0.4)), fo = E.inExpo(prog(t, b - 0.25, b));
  if (fi <= 0 || fo >= 1) return;
  const u = prog(t, a + 0.15, b - 0.3), rem = Math.max(0, Math.round(lerp(from, to, u))), el = 1 - rem / 540;
  const cx = W / 2, cy = 560, R = 165;
  ctx.save(); ctx.globalAlpha = fi * (1 - fo); ctx.translate(0, -40 * fo);
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520); g.addColorStop(0, 'rgba(4,8,12,0.6)'); g.addColorStop(1, 'rgba(4,8,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1100);
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(245,241,232,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = C.band; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(80,170,255,0.8)'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * el * fi); ctx.stroke(); ctx.shadowBlur = 0;
  for (let k = 0; k < 60; k++) { const an = k / 60 * Math.PI * 2, r0 = R - 22, r1 = R - (k % 5 ? 30 : 40); ctx.strokeStyle = 'rgba(245,241,232,0.35)'; ctx.lineWidth = k % 5 ? 1.5 : 3; ctx.beginPath(); ctx.moveTo(cx + r0 * Math.cos(an), cy + r0 * Math.sin(an)); ctx.lineTo(cx + r1 * Math.cos(an), cy + r1 * Math.sin(an)); ctx.stroke(); }
  const mm = String(Math.floor(rem / 60)).padStart(2, '0'), ss = String(rem % 60).padStart(2, '0');
  text(`${mm}:${ss}`, cx, cy + 40, { size: 118, ls: 2, shadow: false });
  ctx.save(); fnt(ST.m(22, { ls: 8 })); ctx.textAlign = 'center'; ctx.fillStyle = BLUE; ctx.fillText(label, cx, cy + 92); ctx.restore();
  ctx.restore();
};
function arcWords(t, ws, cx, cy, r, a0, o, vis, out, dir = 1) { // words follow a circle, each letter filling on its word's time
  ctx.save(); fnt(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const sp = ctx.measureText(' ').width, items = [];
  ws.forEach(w => { [...w[0]].forEach((c, i, arr) => items.push({ c, w: ctx.measureText(c).width, on: w[1] + (w[2] - w[1]) * i / arr.length, st: w[3] })); items.push({ c: ' ', w: sp, on: 1e9 }); });
  items.pop(); const tot = items.reduce((p, c) => p + c.w, 0); let acc = 0, last = null;
  items.forEach(it => {
    const ang = a0 + dir * ((acc + it.w / 2) - tot / 2) / r; acc += it.w; if (it.c === ' ') return;
    const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang), on = t >= it.on;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + dir * Math.PI / 2); fnt({ ...o, ...(it.st || {}) });
    ctx.globalAlpha = vis * (1 - out) * (on ? 1 : 0.2); ctx.fillStyle = (it.st && it.st.color) || '#f5f1e8';
    if (on) { ctx.shadowColor = (it.st && it.st.glow) || 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; }
    ctx.fillText(it.c, 0, 0); ctx.restore(); if (on) last = [x, y];
  });
  ctx.restore();
  const lastOn = items.filter(i => i.c !== ' ').every(i => t >= i.on);
  if (last && !lastOn) spark(last[0], last[1], vis * (1 - out), 7);
}
function matchType(t) {
  // Q4 around the clock
  const q4 = WD('Q4');
  if (t > q4[0][1] - 0.3 && t < 38.95) {
    const vis = E.outCubic(prog(t, q4[0][1] - 0.3, q4[0][1])), out = clamp((t - 38.62) / 0.3);
    arcWords(t, q4.map(w => [w[0], w[1], w[2], w[0].startsWith('Spielzeit') ? KEY : null]), W / 2, 560, 240, -Math.PI / 2, ST.s(42, { ls: 1 }), vis, out);
  }
  // Q5 the whistle line: Abpfiff huge
  const q5 = WD('Q5');
  if (t > q5[0][1] - 0.4 && t < 49.7) { const ga = Math.min(E.outCubic(prog(t, q5[0][1] - 0.4, q5[0][1])), 1 - prog(t, 49.3, 49.7)); const g = ctx.createLinearGradient(0, 1050, 0, H); g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(0.35, `rgba(4,8,12,${0.6 * ga})`); g.addColorStop(1, `rgba(4,8,12,${0.8 * ga})`); ctx.fillStyle = g; ctx.fillRect(0, 1050, W, H - 1050); }
  kblock(t, [
    { y: 1250, align: 'center', ws: [0, 1, 2].map(i => w8('Q5', i, i === 2 ? ST.r(100, KEY) : ST.s(70))) },
    { y: 1345, align: 'center', ws: [3, 4].map(i => w8('Q5', i, ST.s(56))) },
    { y: 1585, align: 'center', ws: [w8('Q5', 5, { ...ST.c(250), ...KEY }, 'ABPFIFF,')] },
    { y: 1710, align: 'center', ws: [6, 7, 8, 9].map(i => w8('Q5', i, ST.r(92))) },
  ], q5[0][1], 49.25);
}

// ================================================================== G · "Und was sind die Tore im Leben?" list (bigger, ghost-fill)
function goals8(t) {
  const q = WD('Q6'); if (t < q[0][1] - 0.2 || t > WD('Q8')[0][1]) return;
  const q8s = WD('Q8')[0][1], strike = q8s - 0.62, end = q8s, fo = E.inExpo(prog(t, q8s - 0.38, q8s - 0.05));
  const dim = Math.min(E.outCubic(prog(t, 52.7, 53.3)), 1 - fo); if (dim > 0) black(0.5 * dim);
  const ch = k => q.filter(w => w[3] === k);
  const h = ch(0); // Und was sind die Tore im Leben?
  kblock(t, [
    { y: 470, x: 90, ws: h.slice(0, 4).map(w => [w[0], w[1], w[2], ST.s(60)]) },
    { y: 610, x: 86, ws: h.slice(4).map(w => [w[0], w[1], w[2], w[0] === 'Tore' ? { ...ST.c(150), ...KEY } : ST.r(110)]) },
  ], h[0][1], q8s - 0.55);
  const items = [['SCHULABSCHLUSS', ch(1), 2], ['SCHÖNES AUTO', ch(2), 1], ['TEURES HAUS', ch(3), 1]];
  items.forEach(([s, ws, ki], i) => {
    const a = ws[ki][1], b = ws[ws.length - 1][2], u = E.outExpo(prog(t, a - 0.12, a + 0.25)), y = 860 + i * 175;
    if (u <= 0) return;
    const st = E.inOutCubic(prog(t, strike + i * 0.1, strike + i * 0.1 + 0.32));
    ctx.save(); ctx.globalAlpha = (1 - fo); ctx.beginPath(); ctx.rect(0, y - 130, W, 160); ctx.clip(); ctx.translate(0, 130 * (1 - u));
    ctx.save(); fnt(ST.m(28)); ctx.fillStyle = BLUE; ctx.globalAlpha *= 1 - 0.6 * st; ctx.fillText(String(i + 1).padStart(2, '0'), 92, y - 76); ctx.restore();
    kword(t, s, 140, y, { ...ST.c(118), ghost: 0.17 * (1 - 0.6 * st) }, a, b, (1 - fo) * (1 - 0.6 * st), 0);
    if (st > 0) { ctx.globalAlpha = 1 - fo; ctx.fillStyle = BAND; ctx.shadowColor = BLUE; ctx.shadowBlur = 14; ctx.fillRect(126, y - 52, (mw(s, ST.c(118)) + 30) * st, 10); }
    ctx.restore();
  });
}
function ball8(t) { // "Was ist der Ball in diesem Leben?"
  const q = WD('Q8'); if (t < q[0][1] - 0.2 || t > 59.4) return;
  kblock(t, [
    { y: 360, align: 'center', ws: [0, 1, 2].map(i => w8('Q8', i, ST.s(66))) },
    { y: 640, align: 'center', ws: [w8('Q8', 3, { ...ST.c(300), ...KEY }, 'BALL')] },
    { y: 770, align: 'center', ws: [4, 5, 6].map(i => w8('Q8', i, ST.r(104))) },
  ], q[0][1], 58.95);
}

// ================================================================== H · the ball becomes the Earth
function project(lon, lat, lon0, lat0) {
  const l = (lon - lon0) * Math.PI / 180, p = lat * Math.PI / 180, p0 = lat0 * Math.PI / 180;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [Math.cos(p) * Math.sin(l), -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), cosc];
}
function earth8(t) {
  const fr = Math.round(t * FPS), k0 = BALLTRK[fr]; if (!k0) return;
  const z = lensFrame(t), cx = LPX + (k0[0] - LPX) * z, cy = LPY + (k0[1] - LPY) * z, r0 = k0[2] * z, R = r0 * 0.99; // track was measured unzoomed
  const u = E.outCubic(prog(t, 60.4, 60.85)), fo = 1 - E.inCubic(prog(t, 61.45, 61.72)); if (u <= 0 || fo <= 0) return;
  const lon0 = 10 - (t - 60.3) * 38, lat0 = 22;   // Europe faces us, the globe turns
  // 1 · focus: the room falls away
  ctx.save(); ctx.globalAlpha = 0.55 * u * fo; ctx.fillStyle = '#02060c'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, R + 6, 0, 7, true); ctx.fill('evenodd'); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
  // 2 · ocean: the leather goes deep blue (reveal as an expanding disc from the centre)
  ctx.save();
  ctx.globalAlpha = 0.8 * fo * u; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#1b4f8f'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.globalCompositeOperation = 'source-over';
  const sh = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); sh.addColorStop(0, 'rgba(120,190,255,0.18)'); sh.addColorStop(1, 'rgba(0,10,30,0.55)'); ctx.globalAlpha = fo * u; ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  // 3 · land
  ctx.globalAlpha = fo * u; ctx.fillStyle = 'rgba(150,215,255,0.78)'; ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 12;
  for (const ring of LAND) {
    ctx.beginPath(); let vis = 0;
    ring.forEach(([lo, la], i) => { let [x, y, z] = project(lo, la, lon0, lat0); if (z < 0) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } else vis++; const X = cx + x * R, Y = cy + y * R; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    if (vis > 1) { ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.shadowBlur = 0;
  // 4 · graticule
  ctx.strokeStyle = 'rgba(200,235,255,0.35)'; ctx.lineWidth = 1.2;
  for (let lo = -180; lo < 180; lo += 30) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 5) { const [x, y, z] = project(lo, la, lon0, lat0); if (z > 0) { pen ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R); pen = true; } else pen = false; } ctx.stroke(); }
  for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 5) { const [x, y, z] = project(lo, la, lon0, lat0); if (z > 0) { pen ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R); pen = true; } else pen = false; } ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  // 5 · atmosphere rim + scan ring
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fo * u;
  const at = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12); at.addColorStop(0, 'rgba(90,180,255,0)'); at.addColorStop(0.45, 'rgba(90,180,255,0.55)'); at.addColorStop(1, 'rgba(90,180,255,0)');
  ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.fill();
  ctx.restore();
  // 6 · type on the orbit
  const q = WD('Q9');
  const top = true;
  arcWords(t, [['DIE', q[0][1], q[0][2]], ['ERDKUGEL', q[1][1], q[1][2], KEY]], cx, cy, top ? R + 64 : R + 80, top ? -Math.PI / 2 : Math.PI / 2 - 0.25, ST.c(92, { ls: 8 }), u, 1 - fo, top ? 1 : -1);
  const lu = E.outCubic(prog(t, 60.6, 61.0)) * fo;
  if (lu > 0) { ctx.save(); fnt({ ff: 'arab', size: 120 }); ctx.textAlign = 'center'; ctx.globalAlpha = lu; ctx.fillStyle = BLUE; ctx.shadowColor = BLUE; ctx.shadowBlur = 30; ctx.fillText('الدنيا', Math.max(220, Math.min(W - 220, cx + (top ? 0 : 160))), Math.min(H - 200, cy + R + (top ? 160 : 260))); ctx.restore(); }
}

// ================================================================== I · CHASE: "Wir rennen der Dunya unser Leben lang hinterher."
async function chase8(t) {
  const k = Math.floor((t - 61.72) / (2 * BEAT)), ids = ['g7', 't2', 't1'], a7 = 61.72 + k * 2 * BEAT;
  await reuse(ids[Math.min(2, k)], a7, t, { punch: 0.12, push: 0.08 });
  vignette(0.55); black(0.25);
  if (t - a7 < 0.08) flash(0.5 * (1 - (t - a7) / 0.08));
  const q = WD('QD'), vis = E.outCubic(prog(t, q[0][1] - 0.3, q[0][1])), out = clamp((t - 65.05) / 0.28);
  const st = w => w[0].startsWith('Dunya') ? { ...ST.r(116), ...KEY } : ST.s(80);
  waveText(t, q.slice(0, 4).map(w => [w[0], w[1], w[2], st(w)]), 70, W - 60, 700, 22, 0.008, (t - 61.7) * 1.6, ST.s(80), vis, out);
  waveText(t, q.slice(4, 7).map(w => [w[0], w[1], w[2], st(w)]), 70, W - 60, 960, 22, 0.008, (t - 61.7) * 1.6 + 1.6, ST.s(80), vis, out);
  waveText(t, q.slice(7).map(w => [w[0], w[1], w[2], { ...ST.c(170), ...KEY }]), 70, W - 60, 1240, 22, 0.008, (t - 61.7) * 1.6 + 3.2, ST.s(80), vis, out);
}

// ================================================================== J · CLIMAX (no music): Todesengel · 10:0 · das falsche Spiel
async function climax8(t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (t < 67.5) {
    const jolt = 26 * Math.exp(-(t - CH0) * 9);
    await shot('x1', t, { s: 1.1 + 0.05 * prog(t, CH0, 67.5), dy: jolt * Math.sin((t - CH0) * 60), filter: 'saturate(0.3) brightness(0.5) contrast(1.15)' });
    vignette(0.85); flash(0.55 * (1 - prog(t, CH0, CH0 + 0.12)), '200,220,255'); black(0.22 + 0.08 * hash(Math.floor(t * 30)));
    kblock(t, [
      { y: 820, align: 'center', ws: [0, 1].map(i => w8('C1', i, ST.s(70))) },
      { y: 990, align: 'center', ws: [w8('C1', 2, ST.r(170))] },
      { y: 1100, align: 'center', ws: [3, 4].map(i => w8('C1', i, ST.s(70))) },
    ], WD('C1')[0][1], 67.25);
  } else if (t < 70.6) {
    // the scoreboard of a lifetime, then dust
    await shot('x1', 67.49, { s: 1.12, filter: 'blur(18px) saturate(0.4) brightness(0.28)' });
    vignette(0.75);
    const q = WD('C2'), ts = q.find(w => w[0].startsWith('nichts'))[1];
    const sv = E.outExpo(prog(t, q[1][1] - 0.1, q[1][1] + 0.35));
    if (sv > 0) dustText(t, 'score', '10:0', { ff: 'cond', size: 520 }, W / 2, 960, ts, sv);
    kblock(t, [{ y: 620, align: 'center', ws: [w8('C2', 0, ST.r(96))] }], q[0][1], ts - 0.1);
    kblock(t, [{ y: 1250, align: 'center', ws: [2, 3, 4].map(i => w8('C2', i, ST.r(84), i === 4 ? 'hatte –' : undefined)) }], q[2][1], ts - 0.1);
    kblock(t, [
      { y: 1420, align: 'center', ws: [5, 6].map(i => w8('C2', i, ST.s(66))) },
      { y: 1560, align: 'center', ws: [7, 8, 9].map(i => w8('C2', i, ST.r(126))) },
    ], q[5][1], 70.5);
    black(prog(t, 70.48, 70.6));
  } else if (t < 72.3) {
    await shot('x3', t, { s: 1.04 + 0.03 * prog(t, 70.6, 72.3), filter: 'saturate(0.5) brightness(0.55)' });
    vignette(0.7); black(1 - prog(t, 70.6, 70.9));
    kblock(t, [
      { y: 880, align: 'center', ws: [0, 1, 2].map(i => w8('C3', i, ST.s(74))) },
      { y: 1040, align: 'center', ws: [3, 4].map(i => w8('C3', i, ST.r(130), i === 4 ? 'man:' : undefined)) },
    ], WD('C3')[0][1], 72.05);
  } else {
    await shot('x4', t, { s: 1.05 + 0.06 * E.inOutCubic(prog(t, 72.3, PR0)), filter: 'grayscale(0.85) brightness(0.42) contrast(1.1)' });
    vignette(0.75);
    black(1 - prog(t, 72.3, 72.55)); black(E.inCubic(prog(t, 75.6, 75.95)));
    const q = WD('C4');
    kblock(t, [
      { y: 640, align: 'center', ws: [0, 1, 2, 3, 4].map(i => w8('C4', i, ST.s(64))) },
      { y: 830, align: 'center', ws: [5, 6].map(i => w8('C4', i, i === 6 ? { ...ST.r(170), ...KEY } : ST.r(170))) },
      { y: 1390, align: 'center', ws: [w8('C4', 8, ST.r(130))] },
    ], q[0][1], 75.55);
    kblock(t, [{ y: SPL.y, align: 'center', ws: [w8('C4', 7, ST.c(SPL.size), 'SPIEL')] }], q[0][1], 99);
    if (t > PR0 - 0.3) await portal(t);
  }
}

// ================================================================== K · PRAYER: "Welche Rolle hat Allah ﷻ in deinem Leben?"
// from "das falsche SPIEL" into the prayer: the word fills with the prayer, then the camera flies through the I
const SPL = { y: 1230, size: 430 }, PORT = mk(W, H);
async function portal(t) {
  const o = ST.c(SPL.size), tw = mw('SPIEL', o), x0 = W / 2 - tw / 2;
  const ix = x0 + mw('SP', o) + mw('I', o) / 2, iy = SPL.y - SPL.size * 0.37;
  const fill = E.inOutCubic(prog(t, PR0 - 0.3, PR0 + 0.05)), z = 1 + 46 * E.inExpo(prog(t, PR0 + 0.05, PR0 + 0.95));
  const img = await frameOf('p1', 52.06 + Math.max(0, t - PR0));
  const m = PORT.x; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'copy'; m.clearRect(0, 0, W, H);
  m.translate(ix, iy); m.scale(z, z); m.translate(-ix, -iy);
  m.font = `${SPL.size}px Anton`; m.letterSpacing = '2px'; m.textAlign = 'left'; m.textBaseline = 'alphabetic'; m.fillStyle = '#fff'; m.fillText('SPIEL', x0, SPL.y);
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.filter = `brightness(${1 + 0.6 * (1 - fill)})`; m.drawImage(img, 0, 0, W, H); m.restore();
  if (t >= PR0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.globalAlpha = fill; ctx.drawImage(PORT.c, 0, 0); ctx.restore();
  if (z > 1.01 && z < 30) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * (1 - prog(z, 1, 30)); ctx.filter = 'blur(18px)'; ctx.drawImage(PORT.c, 0, 0); ctx.restore(); }
}
async function prayer8(t) {
  const t6 = t - SHIFT_B;
  if (t < PR0 + 0.95) { await portal(t); return; }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const ap = 1, hh = H;
  ctx.save();
  for (const [id, a, b, o] of [['p1', 52.06, 54.4, {}], ['p2', 53.9, 56.5, { fx: 200, fy: 900, base: 1.3 }], ['p3', 56.0, 58.65, { fx: 560, fy: 1100, base: 1.05 }]]) {
    if (t6 < a || t6 >= b) continue;
    const al = id === 'p1' ? Math.min(prog(t6, a, a + 0.25), 1 - prog(t6, b - 0.5, b)) : id === 'p3' ? prog(t6, a, a + 0.5) : Math.min(prog(t6, a, a + 0.5), 1 - prog(t6, b - 0.5, b));
    await shot(id, t6, { s: (o.base ?? 1.03) + 0.04 * prog(t6, a, b), fx: o.fx, fy: o.fy, alpha: al });
  }
  ctx.restore();
  vignette(0.65);
  const q = WD('Q10'), a = q[0][1];
  // the Name, large and quiet behind the line
  const nv = E.outCubic(prog(t, q[3][1] - 0.2, q[3][1] + 0.8)) * (1 - prog(t, PR0 + 5.7, PR0 + 6.3));
  if (nv > 0) { ctx.save(); fnt({ ff: 'arab', size: 560 }); ctx.textAlign = 'center'; ctx.globalAlpha = 0.16 * nv; ctx.fillStyle = BLUE; ctx.shadowColor = BLUE; ctx.shadowBlur = 60; ctx.fillText('الله', W / 2, 1180); ctx.restore(); }
  kblock(t, [
    { y: 760, align: 'center', ws: [0, 1, 2].map(i => w8('Q10', i, i === 1 ? ST.r(96) : ST.s(70))) },
    { y: 960, align: 'center', ws: [w8('Q10', 3, { ...ST.r(200), ...KEY })] },
    { y: 1090, align: 'center', ws: [4, 5, 6].map(i => w8('Q10', i, ST.s(78))) },
  ], a, PR0 + 5.8);
  black(prog(t, PR0 + 6.34, PR0 + 6.59));
}

// ------------------------------------------------------------------ v9 overrides
shoe = async function (t) { // v6 time: only the foot going into the boot
  const foc = 1 - E.outCubic(prog(t, 19.64, 19.95));
  await shot('sh', t, { s: 1.08 + 0.07 * prog(t, 19.64, 21.45), fx: 560, fy: 900, filter: `blur(${(8 * foc).toFixed(1)}px)` });
  vignette(0.6); black(1 - prog(t, 19.64, 19.78));
};
behindText = async function (t) { await shot('g3', t, { s: cam('g3', t, 0.05, 0.07, 0.3) }); };
const LPX = 230, LPY = 560;
function lensFrame(t) { return 1 + 0.82 * E.inOutCubic(prog(t, 59.2, 59.55)) * (1 - E.inOutCubic(prog(t, 60.34, 60.66))); } // push into the left so the grabbing right hand stays out
// LaOla: like the Ummah shirt — the world drains, only the green sign lights up (colour-keyed per frame, fmasks/n1|n2)
async function laolaWow(t, id, sc) {
  const k = E.inOutCubic(prog(t, 11.9, 12.2)) * (1 - E.inOutCubic(prog(t, 12.85, 13.09)));
  await shot(id, t, { s: sc, filter: k > 0.001 ? `grayscale(${k.toFixed(3)}) brightness(${(1 - 0.62 * k).toFixed(3)})` : 'none' });
  if (k <= 0.001) return;
  const s0 = SHOTS[id], i = Math.max(1, Math.min(s0.n, frameIdx(s0, t)));
  const img = await frameOf(id, t), m = await loadPath(`../fmasks/${id}/${pad5(i)}.png`);
  glow.x.save(); glow.x.setTransform(1, 0, 0, 1, 0, 0); glow.x.globalCompositeOperation = 'copy'; glow.x.drawImage(m, 0, 0, W, H);
  glow.x.globalCompositeOperation = 'source-in'; glow.x.fillStyle = '#7dff4f'; glow.x.fillRect(0, 0, W, H); glow.x.restore();
  cut.x.save(); cut.x.setTransform(1, 0, 0, 1, 0, 0); cut.x.globalCompositeOperation = 'copy'; cut.x.drawImage(m, 0, 0, W, H);
  cut.x.globalCompositeOperation = 'source-in'; cut.x.drawImage(img, 0, 0, W, H);
  const sw = prog(t, 12.25, 12.85); if (sw > 0 && sw < 1) { cut.x.globalCompositeOperation = 'source-atop'; const gx = lerp(-300, W + 300, E.inOutCubic(sw)), g = cut.x.createLinearGradient(gx - 160, 0, gx + 160, 400); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cut.x.fillStyle = g; cut.x.fillRect(0, 0, W, H); }
  cut.x.restore();
  drawLayer(glow.c, sc * 1.01, W / 2, H / 2, 0.75 * k, 'lighter', 'blur(30px)');
  drawLayer(glow.c, sc * 1.003, W / 2, H / 2, 0.45 * k, 'lighter', 'blur(7px)');
  drawLayer(cut.c, sc, W / 2, H / 2, k, 'source-over', 'saturate(1.6) brightness(1.3)');
  flash(0.28 * (1 - prog(t, 11.9, 12.1)) * (t >= 11.9 ? 1 : 0), '150,255,120');
}
// the greeting: camera locks onto the clasped hands (positions measured on the native crop)
const HANDS = [[2.77, 485, 960], [3.2, 470, 1190]]; // the clasp, low in frame
async function o2Cam(t) {
  const s0 = SHOTS.o2, st = s0.in + (t - s0.a) * s0.sp; let k = 0; while (k < HANDS.length - 2 && st > HANDS[k + 1][0]) k++;
  const [ta, xa, ya] = HANDS[k], [tb, xb, yb] = HANDS[k + 1], u = clamp((st - ta) / (tb - ta));
  const hx = lerp(xa, xb, u), hy = lerp(ya, yb, u), s = 1.55 + 0.06 * prog(t, 5.78, 7.06);
  await shot('o2', t, { s, fx: hx, fy: hy, dx: 560 - hx, dy: 640 - hy });
}
// light opens the prayer: a line in the dark becomes the picture
function dawnLine(t) {
  const u = E.outExpo(prog(t, PR0 - 0.45, PR0 + 0.05)); if (u <= 0 || t > PR0 + 0.2) return;
  const a = 1 - prog(t, PR0 + 0.05, PR0 + 0.2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(W / 2 - W * u / 2, 0, W / 2 + W * u / 2, 0); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(0.5, 'rgba(235,248,255,1)'); g.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(120,200,255,1)'; ctx.shadowBlur = 40; ctx.fillRect(W / 2 - W * u / 2, H / 2 - 2, W * u, 4); ctx.restore();
}

// ------------------------------------------------------------------ HUD: where the voice comes from
function hud8(t) {
  if (t < 4.9 || t > PR0 + 6.5) return;
  let lab = null;
  for (const v of VO8) { const s0 = v.segs[0], s1 = v.segs[v.segs.length - 1]; const a = s0.at, b = s1.at + s1.out - s1.in; if (t >= a - 0.2 && t <= b + 0.4) { const mic = s0.in + (t - a); lab = `ANSPRACHE ▸ ${String(Math.floor(mic / 60)).padStart(2, '0')}:${String(Math.floor(mic % 60)).padStart(2, '0')}`; } }
  const a = Math.min(prog(t, 4.9, 5.4), 1 - prog(t, PR0 + 6.0, PR0 + 6.5));
  hud(t, a, { tl: 'BAYAN TURNIER · 03.10.2026' });
}

// ------------------------------------------------------------------ entry
async function draw8(t, f) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  FRAME_LOG.done = false; FRAME_LOG.v = null;
  const t6 = t - SHIFT;
  if (t < 4.67) await intro(t);
  else if (t < 15.49) await outside(t);
  else if (t < TEAM_END) await speech8(t);
  else if (t < 31.11) await shoe(t6);
  else if (t < M0) await ballUp(t6);
  else if (t < 49.71) await match7(t);
  else if (t < 53.34) await table4(t6);
  else if (t < 56.93) await moments7(t);
  else if (t < 61.72) { const k = lensFrame(t); ctx.save(); ctx.translate(LPX, LPY); ctx.scale(k, k); ctx.translate(-LPX, -LPY); await lens(t6); ctx.restore(); }
  else if (t < CH0) await chase8(t);
  else if (t < PR0) await climax8(t);
  else if (t < PR0 + 6.59) await prayer8(t);
  else await winners(t - SHIFT_B);
  if (t >= 4.67 && t < 4.82) flash(1 - prog(t, 4.67, 4.82));
  salam(t); dateStamp(t);
  teamFloor(t); kick8(t); matchType(t); goals8(t); ball8(t);
  if (t > 60 && t < 61.75 && !window.NOEARTH) earth8(t);
  hud8(t);
  grain(f, t >= CH0 && t < PR0 ? 0.11 : 0.055);
  window.__log[f] = FRAME_LOG.v;
}
const _setup7 = window.setup;
window.setup = async () => {
  const n = await _setup7();
  VO8 = await (await fetch('../vo8.json')).json();
  LAND = await (await fetch('../land.json')).json();
  await Promise.all(['800 40px ArchivoX', '40px SerifX', '500 40px MonoX', '40px Amiri'].map(f => document.fonts.load(f)));
  // v8 shot table edits: Salam close-up held longer (o3/o4 dropped), climax plates
  SHOTS.o2 = { id: 'o2', clip: '0003', in: 2.2, a: 5.78 - (2.77 - 2.2) / 0.336, b: 7.06, sp: 0.336, n: 58, dir: 'frames/o2k' };  // only the clasp (src 2.77–3.2), native crop
  SHOTS.c2 = { ...SHOTS.c2, a: 16.90, b: C3A };
  SHOTS.c3 = { ...SHOTS.c3, in: 1.048, a: C3A, b: C4A };                                                   // lips stay on the voice
  SHOTS.c4 = { id: 'c4', clip: '0037', in: 0.0, a: C4A, b: TEAM_END, sp: 1.0, n: 96, dir: 'full/0037', fps: 30 };  // teammates in matching bibs
  SHOTS.sh = { id: 'sh', clip: '0026', in: 1.95, a: 19.64, b: 21.45, sp: 0.69, n: 81, dir: 'frames/sh9' };     // the foot sliding in
  SHOTS.x1 = { id: 'x1', clip: '0102', in: 0.0, a: CH0, b: 67.5, sp: 0.92, n: 60, dir: 'full/0102', fps: 30 };
  SHOTS.x3 = { id: 'x3', clip: '0118', in: 0.1, a: 70.6, b: 72.3, sp: 1.0, n: 187, dir: 'full/0118', fps: 30 };
  SHOTS.x4 = { id: 'x4', clip: '0100', in: 4.0, a: 72.3, b: PR0, sp: 1.0, n: 445, dir: 'full/0100', fps: 30 };
  return n;
};
window.renderFrame = async (f, q = 0.94) => { await draw8(f / FPS, f); trimCache(); return cv.toDataURL('image/jpeg', q); };
