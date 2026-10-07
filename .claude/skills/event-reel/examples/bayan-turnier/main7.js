// v7 — the talk becomes the spine. v6 sections are re-timed (t6 = t7 - SHIFT) around a new speech chapter,
// a re-cut match with mixed tempo, and voice-over captions. Music: nasheed phrase 2 is played twice (audio7.py).
const DUR7 = 78.96, SHIFT = 9.66, BEAT = 60 / 99.4, M0 = 34.11;
const bt = k => M0 + k * BEAT;
let VO = [];

// ---------------------------------------------------------------- footage from arbitrary dirs (full clips @30fps, re-used v6 dirs)
const pad5 = i => String(i).padStart(5, '0');
function loadPath(p) {
  if (cache.has(p)) { const v = cache.get(p); cache.delete(p); cache.set(p, v); return v; }
  const v = fetch(p).then(r => r.blob()).then(b => createImageBitmap(b)); cache.set(p, v); return v;
}
function frameIdx(s, t) {
  return s.dir && s.dir.startsWith('full') ? 1 + Math.round(srcTime(s, t) * (s.fps ?? 30)) : 1 + Math.round((srcTime(s, t) - s.in) * 60);
}
const _frameOf6 = frameOf;
frameOf = async function (sid, t) {
  const s = SHOTS[sid];
  if (s && s.dir) { const i = Math.max(1, Math.min(s.n, frameIdx(s, t))); return loadPath(`../${s.dir}/${pad5(i)}.jpg`); }
  return _frameOf6(sid, t);
};
async function cutoutFull(sid, t) { // person layer from fmasks/<clip>
  const s = SHOTS[sid], i = Math.max(1, Math.min(s.n, frameIdx(s, t)));
  const img = await frameOf(sid, t), m = await loadPath(`../fmasks/${s.clip}/${pad5(i)}.png`);
  cut.x.save(); cut.x.setTransform(1, 0, 0, 1, 0, 0); cut.x.globalCompositeOperation = 'copy'; cut.x.drawImage(m, 0, 0, W, H);
  cut.x.globalCompositeOperation = 'source-in'; cut.x.drawImage(img, 0, 0, W, H); cut.x.restore();
  return m;
}
// draw a v6 shot re-timed: the shot starts at a7 in v7 time
async function reuse(v6id, a7, t, o = {}) {
  const t6 = SHOTS[v6id].a + (t - a7);
  await shot(v6id, t6, { s: cam(v6id, t6, o.push ?? 0.05, o.punch ?? 0.07, 0.3), ...o });
}

// ================================================================== C · SPEECH CHAPTER 15.49 – 29.30
async function speech7(t) {
  if (t < 16.90) {
    await shot('c1', t, { s: 1.03 + 0.05 * prog(t, 15.49, 16.90), fy: 1000 });
    vignette(0.55);
    zoomBlur4(0.14 * (1 - E.outCubic(prog(t, 15.49, 15.8))));
    speakerTag(t, 15.62, 16.88);
  } else if (t < 21.53) await heroQ1(t);
  else if (t < 26.78) await positions(t);
  else await team(t);
}

// "Was hat eigentlich Fußball mit Islam zu tun?" → "Das Leben ist genau wie im Fußball." — set behind the speaker.
// FUSSBALL is the anchor: it stays while the words around it change.
async function heroQ1(t) {
  const sc = 1.02 + 0.07 * E.inOutCubic(prog(t, 16.90, 21.53)), fx = W / 2, fy = 1250;
  await shot('c2', t, { s: sc, fx, fy });
  vignette(0.55);
  black(0.32 * E.outCubic(prog(t, 16.90, 17.3)));
  const q1 = VO.find(v => v.id === 'Q1').cards[0], q2 = VO.find(v => v.id === 'Q1b').cards[0], wt = i => q1[i][1], vt = i => q2[i][1];
  const out = E.inExpo(prog(t, 21.22, 21.5)), swap = E.inOutCubic(prog(t, vt(0) - 0.28, vt(0) - 0.02)), par = 1 + 0.035 * prog(t, 16.9, 21.53);
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(par, par); ctx.translate(-W / 2, -1000 - 160 * out); ctx.globalAlpha = 1 - out;
  const small = (s, x, y, a, o = {}, gone = 0) => { const u = E.outExpo(prog(t, a - 0.04, a + 0.3)); if (u <= 0 || gone >= 1) return; ctx.save(); ctx.globalAlpha *= 1 - gone; ctx.beginPath(); ctx.rect(0, y - 70 + 60 * gone, W, 90); ctx.clip(); text(s, x, y + 50 * (1 - u) + 60 * gone, { f: 'Oswald', weight: 600, size: 44, ls: 10, shadow: true, shadowBlur: 24, ...o }); ctx.restore(); };
  const big = (s, y, a, col, gone = 0, pulse = 0) => { const u = E.outExpo(prog(t, a - 0.05, a + 0.35)); if (u <= 0 || gone >= 1) return; const k = 1 + 0.08 * (1 - u) + 0.06 * pulse; ctx.save(); ctx.globalAlpha *= 1 - gone; ctx.beginPath(); ctx.rect(0, y - 250, W, 290); ctx.clip(); text(s, W / 2, y + 180 * (1 - u) + 200 * gone, { size: 268, ls: 4, color: col, sx: k, sy: k, shadow: true, shadowBlur: 50 }); ctx.restore(); };
  const row = (words, y, times, o, keyIdx, gone = 0) => { const sp = measure(' ', o) + 8, ws = words.map(s => measure(s, o)); let x = W / 2 - (ws.reduce((a, b) => a + b) + (words.length - 1) * sp) / 2; words.forEach((s, i) => { small(s, x + ws[i] / 2, y, times[i], { ...o, color: i === keyIdx ? C.gold2 : C.white }, gone); x += ws[i] + sp; }); };
  const o1 = { f: 'Oswald', weight: 600, size: 44, ls: 10 };
  // Q1
  row(['WAS', 'HAT', 'EIGENTLICH'], 440, [wt(0), wt(1), wt(2)], o1, -1, swap);
  const pulse = Math.sin(Math.PI * prog(t, vt(6) - 0.05, vt(6) + 0.35));
  big('FUSSBALL', 735, wt(3), C.white, 0, pulse);
  small('MIT', W / 2, 822, wt(4), { color: C.gold2 }, swap);
  big('ISLAM', 1080, wt(5), C.gold2, swap);
  small('ZU TUN?', W / 2, 1180, wt(6), {}, swap);
  const ru = E.outExpo(prog(t, wt(5), wt(5) + 0.5)) * (1 - swap); if (ru > 0) { ctx.fillStyle = C.band; ctx.fillRect(W / 2 - 150 * ru, 1112, 300 * ru, 7); }
  // Q1b: DAS LEBEN IST / GENAU WIE IM / FUSSBALL
  if (t > vt(0) - 0.1) {
    row(['DAS', 'LEBEN', 'IST'], 400, [vt(0), vt(1), vt(2)], { ...o1, size: 60, ls: 12 }, 1);
    row(['GENAU', 'WIE', 'IM'], 490, [vt(3), vt(4), vt(5)], o1, -1);
    const r2 = E.outExpo(prog(t, vt(6), vt(6) + 0.5)); if (r2 > 0) { ctx.fillStyle = C.band; ctx.fillRect(W / 2 - 200 * r2, 768, 400 * r2, 7); }
  }
  ctx.restore();
  try { await cutoutFull('c2', t); drawLayer(cut.c, sc, fx, fy, 1); } catch (e) { }
}

// "…dass jeder eine Position hat — Stürmer, Verteidiger, Mittelfeld": a tactics board draws itself above the room
const BOARD = { x: W / 2, y: 610, w: 400, h: 560 };
const SPOTS = { TW: [0, 0.43], VL: [-0.26, 0.2], VR: [0.26, 0.2], MF: [0, -0.02], ST: [0, -0.3] };
function tacticsBoard(t, a, keys, out) {
  const u = E.inOutCubic(prog(t, a, a + 0.7)), { x, y, w, h } = BOARD;
  if (u <= 0 || out >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -60 * out);
  const g = ctx.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, 'rgba(4,8,12,0.75)'); g.addColorStop(1, 'rgba(4,8,12,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1100);
  ctx.strokeStyle = 'rgba(245,241,232,0.9)'; ctx.lineWidth = 3;
  const per = 2 * (w + h), L = per * u;
  ctx.setLineDash([L, per]); ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 18); ctx.stroke(); ctx.setLineDash([]);
  const v = E.outCubic(prog(t, a + 0.35, a + 0.9));
  if (v > 0) {
    ctx.globalAlpha = (1 - out) * v;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 62, 0, 7); ctx.stroke();
    ctx.strokeRect(x - 90, y + h / 2 - 70, 180, 70); ctx.strokeRect(x - 90, y - h / 2, 180, 70);
  }
  // players: appear on "Position", the named ones light up blue with a label
  for (const [k, [px, py]] of Object.entries(SPOTS)) {
    const on = keys[k], cx = x + px * w * 1.6, cy = y + py * h;
    const s = E.outBack(prog(t, on?.pop ?? 1e9, (on?.pop ?? 1e9) + 0.35));
    if (s <= 0) continue;
    const hot = on.hi != null ? E.outExpo(prog(t, on.hi, on.hi + 0.25)) : 0;
    ctx.globalAlpha = 1 - out;
    if (hot > 0) { ctx.fillStyle = `rgba(59,143,212,${0.35 * hot})`; ctx.beginPath(); ctx.arc(cx, cy, 34 + 20 * hot, 0, 7); ctx.fill(); }
    ctx.fillStyle = hot > 0.5 ? C.band : C.white; ctx.beginPath(); ctx.arc(cx, cy, 15 * s, 0, 7); ctx.fill();
    if (hot > 0 && on.label) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx + 30, cy - 30, 420, 60); ctx.clip();
      text(on.label, cx + 34 - 60 * (1 - hot), cy + 13, { f: 'Oswald', weight: 600, size: 34, ls: 4, align: 'left', alpha: hot, shadow: true });
      ctx.restore();
    }
  }
  ctx.restore();
}
async function positions(t) {
  await shot('c3', t, { s: 1.06 + 0.04 * prog(t, 21.53, 26.78), fy: 1100 });
  vignette(0.5);
  const c = VO.find(v => v.id === 'Q2').cards, T = w => (c[0].concat(c[1]).find(x => x[0].startsWith(w)) ?? [0, 1e9])[1];
  const pos = T('Position'), tw = T('Torwart'), vt = T('Verteidiger'), mf = T('Mittelfeld'), st = T('Stürmer');
  const keys = { TW: { pop: pos, hi: tw, label: 'TORWART' }, VL: { pop: pos + 0.08, hi: vt, label: '' }, VR: { pop: pos + 0.16, hi: vt, label: 'VERTEIDIGER' }, MF: { pop: pos + 0.24, hi: mf, label: 'MITTELFELD' }, ST: { pop: pos + 0.32, hi: st, label: 'STÜRMER' } };
  tacticsBoard(t, 21.75, keys, E.inExpo(prog(t, 26.5, 26.78)));
}
async function team(t) {
  await shot('c4', t, { s: 1.04 + 0.05 * prog(t, 26.78, 29.3), fy: 1000 });
  vignette(0.5);
  black(1 - prog(t, 26.78, 26.9) * 1);
}

// ================================================================== F · MATCH 34.11 – 49.71 (26 beats: 2 | 6 | 1111 | 2 | 2 | 11 | 4 | 4)
function clock(t, a, b, from, to, label = 'SPIELZEIT') { // mm:ss counting from→to (seconds remaining), ring = elapsed of 9 min
  const fi = E.outExpo(prog(t, a, a + 0.4)), fo = E.inExpo(prog(t, b - 0.25, b));
  if (fi <= 0 || fo >= 1) return;
  const u = prog(t, a + 0.15, b - 0.3), rem = Math.max(0, Math.round(lerp(from, to, u))), el = 1 - rem / 540;
  const cx = W / 2, cy = 470, R = 132;
  ctx.save(); ctx.globalAlpha = fi * (1 - fo); ctx.translate(0, -40 * fo);
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 420); g.addColorStop(0, 'rgba(4,8,12,0.55)'); g.addColorStop(1, 'rgba(4,8,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(245,241,232,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = C.band; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * el * fi); ctx.stroke();
  const mm = String(Math.floor(rem / 60)).padStart(2, '0'), ss = String(rem % 60).padStart(2, '0');
  text(`${mm}:${ss}`, cx, cy + 34, { size: 96, ls: 2, shadow: false });
  text(label, cx, cy - R - 34, { f: 'Oswald', weight: 600, size: 26, ls: 10, color: C.gold2, shadow: true });
  ctx.restore();
}
async function match7(t) {
  const k = Math.floor((t - M0) / BEAT + 1e-6);
  if (k < 2) await reuse('g1', bt(0), t);
  else if (k < 8) await shot('m2', t, { s: 1.04 + 0.06 * prog(t, bt(2), bt(8)), fy: 1100 });
  else if (k < 12) await reuse(['g5', 'g6', 'g4', 'g9'][k - 8], bt(k), t, { punch: 0.1 });
  else if (k < 14) await behindText(SHOTS.g3.a + (t - bt(12)));
  else if (k < 16) await trip(SHOTS.t1.a + (t - bt(14)));
  else if (k < 18) await reuse(['g10', 'g11'][k - 16], bt(k), t, { punch: 0.1 });
  else if (k < 22) await shot('m11', t, { s: cam('m11', t, 0.05, 0.08, 0.3) });
  else await shot('m12', t, { s: 1.02 + 0.08 * E.inOutCubic(prog(t, bt(22), 49.71)), fy: 1050 });
  if (k !== 14 && k !== 15) vignette(0.5);
  flash(0.9 * (1 - E.outCubic(prog(t, M0, M0 + 0.3))) * (t >= M0 ? 1 : 0));
  // results ticker: one result per beat across the fast run (beats 8–17), flips on every cut
  if (t >= bt(8) - 0.3 && t < bt(18) + 0.3) {
    const mi = clamp(k - 8, 0, 9), m = MATCHES[mi], mt = bt(8 + mi);
    const hin = E.outExpo(prog(t, bt(8) - 0.3, bt(8))), hout = E.inExpo(prog(t, bt(18), bt(18) + 0.3)), sw = E.outExpo(prog(t, mt, mt + 0.18));
    ctx.save(); ctx.translate(0, -170 * (1 - hin) - 170 * hout);
    pill(70, 248, W - 140, 132, 'rgba(7,13,10,0.78)');
    text(`SPIEL ${String(mi + 1).padStart(2, '0')}/10`, 120, 296, { f: 'Mono', weight: 600, size: 22, ls: 4, color: C.gold2, align: 'left', shadow: false });
    text(m[0] + ' UHR', W - 120, 296, { f: 'Mono', weight: 500, size: 22, ls: 3, align: 'right', alpha: 0.7, shadow: false });
    ctx.fillStyle = 'rgba(245,241,232,0.15)'; ctx.fillRect(120, 310, W - 240, 2); ctx.fillStyle = C.gold; ctx.fillRect(120, 310, (W - 240) * (mi + sw) / 10, 2);
    ctx.beginPath(); ctx.rect(70, 314, W - 140, 66); ctx.clip();
    const yy = 362 + 56 * (1 - sw), tf = { f: 'Oswald', weight: 600, size: 38, ls: 1, shadow: false };
    text(TN[m[1]], W / 2 - 78, yy, { ...tf, align: 'right', alpha: m[2] >= m[3] ? 1 : 0.6 });
    text(`${m[2]} : ${m[3]}`, W / 2, yy, { f: 'Mono', weight: 800, size: 38, ls: 2, color: C.gold2, shadow: false });
    text(TN[m[4]], W / 2 + 78, yy, { ...tf, align: 'left', alpha: m[3] >= m[2] ? 1 : 0.6 });
    ctx.restore();
  }
  // game time: the 9 minutes fly by under "…eine Spielzeit hat", then the last seconds run out under "…einen Abpfiff"
  clock(t, bt(2) + 0.05, bt(8), 540, 271);
  clock(t, 45.2, 49.62, 6, 0);
  const wh = prog(t, 49.3, 49.45) * (1 - prog(t, 49.45, 49.71)); // final whistle: ring flare
  flash(0.95 * E.inCubic(prog(t, 49.4, 49.71)), '255,255,255');
  if (wh > 0) flash(0.25 * wh, '120,190,255');
}

// ================================================================== I · MOMENTS + "Die Tore im Leben" 53.34 – 56.93 (+ list into the lens shot)
async function moments7(t) {
  const t6 = t - SHIFT, id = current(['k1', 'k2', 'k3'], t6);
  await shot(id, t6, { s: cam(id, t6, 0.05, id === 'k1' ? 0 : 0.07), fx: id === 'k1' ? 520 : W / 2, fy: id === 'k1' ? 900 : H / 2 });
  vignette(0.5);
  black(1 - prog(t6, 43.68, 43.9));
}
function goalsList(t) {
  const q = VO.find(v => v.id === 'Q6'); if (!q) return;
  const c = q.cards, a0 = c[0][0][1] - 0.1, strike = VO.find(v => v.id === 'Q8').cards[0][0][1] + 0.1, end = 58.62;
  if (t < a0 || t > end) return;
  const fo = E.inExpo(prog(t, end - 0.35, end));
  const dim = Math.min(E.outCubic(prog(t, 53.1, 53.6)), 1 - fo);
  if (dim > 0) black(0.5 * dim);
  ctx.save(); ctx.globalAlpha = 1 - fo;
  const hw = c[0].map(w => w[0].toUpperCase().replace('?', '')), ho = { f: 'Oswald', weight: 600, size: 36, ls: 7 }, sp = measure(' ', ho) + 4;
  const ws = hw.map(s => measure(s, ho)); let x = 150;
  hw.forEach((s, i) => { const u = E.outExpo(prog(t, c[0][i][1] - 0.04, c[0][i][1] + 0.3)); if (u > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 610 - 50, W, 66); ctx.clip(); text(s, x, 610 + 46 * (1 - u), { ...ho, color: c[0][i][3].includes('k') ? C.gold2 : C.white, align: 'left', shadow: true }); ctx.restore(); } x += ws[i] + sp; });
  const hr = E.outExpo(prog(t, c[0][0][1], c[0][0][1] + 0.6)); ctx.fillStyle = C.band; ctx.fillRect(150, 640, 300 * hr, 5);
  const items = [['SCHULABSCHLUSS', c[1]], ['SCHÖNES AUTO', c[2]], ['TEURES HAUS', c[3]]];
  items.forEach(([s, cw], i) => {
    const key = cw[cw.length - 1], a = key[1] - 0.12, u = E.outExpo(prog(t, a, a + 0.35)), y = 820 + i * 160;
    if (u <= 0) return;
    const st = E.inOutCubic(prog(t, strike + i * 0.1, strike + i * 0.1 + 0.32));
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 112, W, 140); ctx.clip();
    const yy = y + 120 * (1 - u);
    text(String(i + 1).padStart(2, '0'), 150, yy - 62, { f: 'Oswald', weight: 600, size: 26, ls: 4, color: C.gold2, align: 'left', alpha: 1 - 0.6 * st, shadow: true });
    text(s, 200, yy, { size: 96, ls: 1, align: 'left', alpha: 1 - 0.55 * st, shadow: true, shadowBlur: 24 });
    if (st > 0) { const sw = measure(s, { size: 96, ls: 1 }) + 20; ctx.fillStyle = C.band; ctx.fillRect(190, yy - 46, sw * st, 9); }
    ctx.restore();
    const n = E.outExpo(prog(t, a, a + 0.25));
    text(`${i + 1}:0`, W - 80, yy - 4, { f: 'Oswald', weight: 600, size: 40, align: 'right', color: C.gold2, alpha: n * (1 - 0.6 * st), shadow: true });
  });
  ctx.restore();
}

// "Die Erdkugel." — a globe graticule locks onto the caught ball (tracked per frame, balltrack.json)
let BALLTRK = {};
function globe(t, f) {
  const fr = Math.round(t * FPS), k = BALLTRK[fr];
  if (!k) return;
  const [cx, cy, r0] = k, R = r0 * 0.985, u = E.inOutCubic(prog(t, 60.32, 60.9)), fo = 1 - E.inCubic(prog(t, 61.35, 61.7));
  if (u <= 0 || fo <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
  ctx.globalCompositeOperation = 'screen'; ctx.lineWidth = 3; ctx.strokeStyle = `rgba(143,208,255,${0.85 * fo})`;
  ctx.shadowColor = 'rgba(90,180,255,0.9)'; ctx.shadowBlur = 14;
  const tilt = 0.32, rot = t * 0.9;
  for (let lat = -60; lat <= 60; lat += 30) {               // parallels
    const ph = lat * Math.PI / 180, y = cy - R * Math.sin(ph) * Math.cos(tilt), rx = R * Math.cos(ph), ry = rx * Math.sin(tilt);
    const L = 2 * Math.PI * rx; ctx.setLineDash([L * u, L]); ctx.beginPath(); ctx.ellipse(cx, y, rx, Math.max(1, ry), 0, 0, Math.PI * 2); ctx.stroke();
  }
  for (let m = 0; m < 6; m++) {                              // meridians, spinning
    const lon = rot + m * Math.PI / 6, rx = Math.abs(R * Math.sin(lon));
    const L = 2 * Math.PI * R; ctx.setLineDash([L * u * 0.5, L]); ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(1, rx), R, 0, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); ctx.stroke();
  ctx.restore();
  // label: الدنيا · DUNYA
  const la = E.outExpo(prog(t, 60.55, 61.0)) * fo;
  if (la > 0) {
    text('الدنيا', W / 2, 1440 + 30 * (1 - la), { f: 'Amiri', size: 100, color: C.gold2, alpha: la, shadow: true, shadowBlur: 30 });
    text('DUNYA', W / 2, 1496 + 30 * (1 - la), { f: 'Oswald', weight: 600, size: 24, ls: 14, alpha: 0.85 * la, shadow: true });
  }
}

// ================================================================== H · PRAYER 61.72 – 68.31
async function prayer7(t) {
  const t6 = t - SHIFT;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const [id, a, b, o] of [['p1', 52.06, 54.4, {}], ['p2', 53.9, 56.5, { fx: 200, fy: 900, base: 1.3 }], ['p3', 56.0, 58.65, { fx: 560, fy: 1100, base: 1.05 }]]) {
    if (t6 < a || t6 >= b) continue;
    const al = id === 'p1' ? Math.min(prog(t6, a, a + 0.6), 1 - prog(t6, b - 0.5, b)) : id === 'p3' ? prog(t6, a, a + 0.5) : Math.min(prog(t6, a, a + 0.5), 1 - prog(t6, b - 0.5, b));
    await shot(id, t6, { s: (o.base ?? 1.03) + 0.04 * prog(t6, a, b), fx: o.fx, fy: o.fy, alpha: al });
  }
  vignette(0.6);
  const out = 1 - prog(t, 67.55, 68.05);
  const L = (s, y, a, o) => { const u = E.outCubic(prog(t, a, a + 0.7)); text(s, W / 2, y + 22 * (1 - u), { ...o, alpha: u * out, shadowBlur: 50 }); };
  L('Auf dem Spielfeld getrennt –', 1270, 65.35, { f: 'SerifI', size: 84 });
  L('im Deen eins.', 1420, 65.95, { f: 'Serif', size: 156, color: C.gold2 });
  black(prog(t, 68.06, 68.31));
}

// ================================================================== captions layer
function captions(t) {
  for (const v of VO) {
    if (v.style === 'hero' || v.style === 'list') continue;
    v.cards.forEach((c, ci) => {
      const next = v.cards[ci + 1], nextA = next ? next[0][1] : 1e9;
      const a = c[0][1] - 0.1, b = Math.min(c[c.length - 1][2] + 0.55, nextA - 0.12);
      if (!c._card) c._card = { a, b, words: c, y: ({ Q9: 1660, Q10: 1640, K: 1560 })[v.id] ?? CAP.y };
      lowerCaption(t, c._card);
    });
  }
}

// ------------------------------------------------------------------ entry
async function draw7(t, f) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  FRAME_LOG.done = false; FRAME_LOG.v = null;
  const t6 = t - SHIFT;
  if (t < 4.67) await intro(t);
  else if (t < 15.49) await outside(t);
  else if (t < 29.30) await speech7(t);
  else if (t < 31.11) await shoe(t6);
  else if (t < M0) await ballUp(t6);
  else if (t < 49.71) await match7(t);
  else if (t < 53.34) await table4(t6);
  else if (t < 56.93) await moments7(t);
  else if (t < 61.72) await lens(t6);
  else if (t < 68.31) await prayer7(t);
  else await winners(t6);
  if (t >= 4.67 && t < 4.82) flash(1 - prog(t, 4.67, 4.82));
  goalsList(t);
  if (t > 60 && t < 61.75) globe(t, f);
  captions(t);
  grain(f, 0.08);
  window.__log[f] = FRAME_LOG.v;
}
const _setup6 = window.setup;
window.setup = async () => {
  const n = await _setup6();
  VO = await (await fetch('../vo7.json')).json();
  BALLTRK = await (await fetch('../balltrack.json')).json();
  await document.fonts.load('40px Amiri');
  return n;
};
window.renderFrame = async (f, q = 0.94) => { await draw7(f / FPS, f); trimCache(); return cv.toDataURL('image/jpeg', q); };
