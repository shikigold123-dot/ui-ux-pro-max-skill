// kinetic.js — speech type that lives IN the picture (no subtitle bar).
// The sentence is present as a faint ghost the moment it starts; letters fill in with the voice; a spark rides the fill front.
// Mixed families per block: big condensed key word + serif italic + grotesk + tiny mono label. Arabic falls back to Amiri.
// Word format everywhere: [text, t0, t1, style]  (t0/t1 = spoken start/end in timeline seconds, from vo.json)
const FF = { sans: 'ArchivoX', serif: 'SerifX', serifR: 'SerifR', mono: 'MonoX', cond: 'Anton', arab: 'Amiri' };
const BLUE = C.accent2, BAND = C.accent;   // aliases: the light accent (key words, glow) and the solid accent (bands, rules)
const ST = {                                // style shorthands: ST.c(300, KEY) etc.
  s: (size, x = {}) => ({ ff: 'sans', size, ...x }),          // grotesk 800 — body lines
  r: (size, x = {}) => ({ ff: 'serif', size, ...x }),         // serif italic — the emotional word
  c: (size, x = {}) => ({ ff: 'cond', size, ls: 2, ...x }),   // condensed caps — THE key word, huge
  m: (size, x = {}) => ({ ff: 'mono', size, weight: 500, ls: 4, ...x }), // mono — labels, numbers, HUD
};
const KEY = { color: C.accent2, glow: 'rgba(80,170,255,0.9)' }; // set glow to match C.accent2 in main.js if you change the palette
function fnt(o) {
  const ff = o.ff ?? 'sans', wt = o.weight ?? (ff === 'sans' ? 800 : ff === 'mono' ? 500 : 400);
  ctx.font = `${wt} ${o.size}px ${FF[ff]}, Amiri`;
  ctx.fontStretch = 'normal'; ctx.letterSpacing = (o.ls ?? 0) + 'px';
}
function mw(s, o) { ctx.save(); fnt(o); const w = ctx.measureText(s).width; ctx.restore(); return w; }
function spark(x, y, a = 1, r = 7) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, 'rgba(220,240,255,0.95)'); g.addColorStop(0.25, 'rgba(120,200,255,0.55)'); g.addColorStop(1, 'rgba(60,150,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 7); ctx.fill(); ctx.restore();
}
// one word: ghost → per-letter fill (t0..t1) → optional dissolve (out 0..1)
function kword(t, s, x, y, o, t0, t1, vis = 1, out = 0, align = 'left') {
  if (vis <= 0 || out >= 1) return 0;
  ctx.save(); fnt(o); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const w = ctx.measureText(s).width; if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
  const lift = -o.size * 0.35 * E.inCubic(out);
  if (out > 0) ctx.filter = `blur(${(10 * out).toFixed(1)}px)`;
  const col = o.color ?? '#f5f1e8';
  // ghost
  ctx.globalAlpha = vis * (1 - out) * (o.ghost ?? 0.17); ctx.fillStyle = col; ctx.fillText(s, x, y + lift);
  // fill
  const dur = Math.max(0.1, t1 - t0), u = clamp((t - t0) / dur);
  if (u > 0) {
    const n = s.length, k = u * n, i = Math.min(n, Math.floor(k) + 1);
    const wa = ctx.measureText(s.slice(0, i - 1)).width, wb = ctx.measureText(s.slice(0, i)).width, cw = u >= 1 ? w + 40 : lerp(wa, wb, E.outCubic(clamp(k - (i - 1))));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - o.size * 1.3 + lift, cw + 30, o.size * 1.8); ctx.clip();
    ctx.globalAlpha = Math.min(1, vis) * (1 - out); ctx.fillStyle = col;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.size * 0.35; }
    else { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = o.size * 0.25; }
    ctx.fillText(s, x, y + lift);
    if (o.glow) { ctx.shadowBlur = o.size * 0.1; ctx.fillText(s, x, y + lift); }
    ctx.restore();
    if (u < 1 && !o.noSpark) spark(x + cw, y - o.size * 0.32 + lift, 1 - out, Math.max(5, o.size / 14));
  }
  ctx.restore();
  return w;
}
// a stacked block: rows of words; each word = [text, t0, t1, style]; rows = [{y, x, align, ws:[...] , gap}]
function kblock(t, rows, a, b, o0 = {}) {
  const vis = E.outCubic(prog(t, a - 0.12, a + 0.25));
  if (t < a - 0.12 || t > b + 0.6) return;
  rows.forEach((r, ri) => {
    const st = r.ws.map(w => ({ ...o0, ...r.o, ...w[3] })), sp = r.ws.map((w, i) => mw(' ', st[i]) * 0.9);
    const ws = r.ws.map((w, i) => mw(w[0], st[i])), tot = ws.reduce((p, c) => p + c, 0) + sp.slice(0, -1).reduce((p, c) => p + c, 0);
    let x = r.align === 'center' ? (r.x ?? W / 2) - tot / 2 : r.align === 'right' ? (r.x ?? W - 90) - tot : (r.x ?? 90);
    r.ws.forEach((w, i) => {
      const out = clamp((t - b - 0.04 * (ri * 3 + i)) / 0.45);
      const enter = E.outExpo(prog(t, a - 0.12 + 0.03 * ri, a + 0.35 + 0.03 * ri));
      const dy = (r.rise ?? 40) * (1 - enter);
      kword(t, w[0], x, r.y + dy, st[i], w[1], w[2], vis * enter, out);
      x += ws[i] + sp[i];
    });
  });
}
// text on a circle; chars fill as spoken. a0 = angle (rad) of the text centre, dir 1 = clockwise
function arcText(t, s, cx, cy, r, a0, o, t0, t1, vis = 1, out = 0, dir = 1) {
  if (vis <= 0 || out >= 1) return;
  ctx.save(); fnt(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ch = [...s], cw = ch.map(c => ctx.measureText(c).width), tot = cw.reduce((p, c) => p + c, 0);
  let acc = 0; const u = clamp((t - t0) / Math.max(0.1, t1 - t0)) * ch.length;
  ch.forEach((c, i) => {
    const ang = a0 + dir * ((acc + cw[i] / 2) - tot / 2) / r; acc += cw[i];
    const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang), filled = i < u;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + dir * Math.PI / 2);
    ctx.globalAlpha = vis * (1 - out) * (filled ? 1 : 0.2); ctx.fillStyle = o.color ?? '#f5f1e8';
    if (filled && o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.size * 0.4; }
    ctx.fillText(c, 0, 0); ctx.restore();
    if (filled && i === Math.floor(u) - 1 && u < ch.length) spark(x, y, vis * (1 - out), 6);
  });
  ctx.restore();
}
// text riding a glowing wave; the line draws ahead of the words like something being chased
function waveText(t, words, x0, x1, y0, amp, k, ph, o, vis = 1, out = 0) {
  if (vis <= 0 || out >= 1) return;
  const P = s => [x0 + s, y0 + amp * Math.sin(k * s + ph)], A = s => Math.atan(amp * k * Math.cos(k * s + ph));
  ctx.save(); fnt(o); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const sp = ctx.measureText(' ').width; let s = 0, head = 0;
  const chars = [];
  words.forEach(w => { const st = { ...o, ...(w[3] || {}) }; [...w[0]].forEach((ch, i, arr) => { const cwid = mw(ch, st) + (st.ff === 'cond' ? st.size * 0.03 : 0); chars.push({ c: ch, s, w: cwid, on: t >= w[1] + (w[2] - w[1]) * i / arr.length, st }); s += cwid; }); s += sp; });
  chars.forEach(c => { if (c.on) head = c.s + c.w; });
  const lead = Math.min(x1 - x0, head + 160 * vis);
  // the line
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - out) * 0.9; ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.shadowColor = BLUE; ctx.shadowBlur = 18;
  ctx.beginPath(); for (let q = 0; q <= lead; q += 6) { const [x, y] = P(q); q ? ctx.lineTo(x, y + 18) : ctx.moveTo(x, y + 18); } ctx.stroke(); ctx.restore();
  const [hx, hy] = P(lead); spark(hx, hy + 18, (1 - out) * vis, 9);
  chars.forEach(c => {
    const [x, y] = P(c.s + c.w / 2), a = A(c.s + c.w / 2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); fnt(c.st);
    ctx.globalAlpha = vis * (1 - out) * (c.on ? 1 : 0.18); ctx.fillStyle = c.st.color ?? '#f5f1e8';
    if (c.on && c.st.glow) { ctx.shadowColor = c.st.glow; ctx.shadowBlur = c.st.size * 0.35; } else if (c.on) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; }
    ctx.fillText(c.c, -c.w / 2, 0); ctx.restore();
  });
  ctx.restore();
}
// text lying on the turf (perspective squash + shear), with a soft contact shadow
function floorText(t, s, x, y, o, t0, t1, vis, out, squash = 0.42, shear = 0) {
  if (vis <= 0 || out >= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, shear, squash, 0, 0);
  kword(t, s, 0, 0, o, t0, t1, vis, out, 'center');
  ctx.restore();
}
// HUD: crop marks + tiny mono readouts (the reference's "instrument" layer, kept quiet)
function hud(t, a = 1, labels = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = '#f5f1e8'; ctx.lineWidth = 2;
  const m = 44, L = 46;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); });
  ctx.restore();
  const lab = (s, x, y, al, col = '#f5f1e8', al2 = 0.7) => { ctx.save(); fnt({ ff: 'mono', size: 21, weight: 500, ls: 3 }); ctx.textAlign = al; ctx.globalAlpha = al2 * a; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); };
  if (labels.tl) lab(labels.tl, 64, 104, 'left');
  if (labels.tr) lab(labels.tr, W - 64, 104, 'right', BLUE, 0.85);
  if (labels.bl) lab(labels.bl, 64, H - 80, 'left');
  if (labels.br) lab(labels.br, W - 64, H - 80, 'right');
}
// particles: sample a rendered word into dust that drifts away
const DUST = new Map();
function dustOf(key, s, o) {
  if (DUST.has(key)) return DUST.get(key);
  const c = mk(W, 700); c.x.font = `${o.weight ?? ''} ${o.size}px ${FF[o.ff ?? 'cond']}`; c.x.textAlign = 'center'; c.x.textBaseline = 'middle'; c.x.fillStyle = '#fff'; c.x.fillText(s, W / 2, 350);
  const d = c.x.getImageData(0, 0, W, 700).data, pts = [];
  for (let y = 0; y < 700; y += 5) for (let x = 0; x < W; x += 5) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y - 350, hash(x * 7.1 + y), hash(x + y * 3.3)]);
  const r = { canvas: c.c, pts }; DUST.set(key, r); return r;
}
function dustText(t, key, s, o, cx, cy, ts, alpha = 1) {
  const D = dustOf(key, s, o);
  if (t < ts) { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(D.canvas, 0, cy - 350); ctx.restore(); return; }
  const age = t - ts;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, h1, h2] of D.pts) {
    const del = (x / W) * 0.55 + h1 * 0.25, a2 = age - del;
    if (a2 < 0) { ctx.globalAlpha = alpha * 0.9; ctx.fillStyle = '#f5f1e8'; ctx.fillRect(x, cy + y, 5, 5); continue; }
    const k = a2 / 1.4; if (k >= 1) continue;
    const px = x + a2 * (120 + 260 * h2) + 40 * Math.sin(a2 * 6 + h1 * 9), py = cy + y - a2 * (140 + 220 * h1) + 30 * Math.cos(a2 * 5 + h2 * 7);
    ctx.globalAlpha = alpha * (1 - k) * 0.85; ctx.fillStyle = h1 > 0.7 ? BLUE : '#f5f1e8'; const sz = 4 * (1 - 0.6 * k); ctx.fillRect(px, py, sz, sz);
  }
  ctx.restore();
}

// words follow a circle (orbit around a ball / clock / logo); each letter fills on its word's time. dir 1 = clockwise (text on top), -1 = text under the circle
function arcWords(t, ws, cx, cy, r, a0, o, vis, out, dir = 1) {
  ctx.save(); fnt(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const sp = ctx.measureText(' ').width, items = [];
  ws.forEach(w => { [...w[0]].forEach((c, i, arr) => { fnt({ ...o, ...(w[3] || {}) }); items.push({ c, w: ctx.measureText(c).width, on: w[1] + (w[2] - w[1]) * i / arr.length, st: w[3] }); }); items.push({ c: ' ', w: sp, on: 1e9 }); });
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

// ---------------------------------------------------------------- VO helpers (vo.json from scripts/vo_plan.py)
let VO = [];
const VOid = id => { const v = VO.find(v => v.id === id); if (!v) throw new Error('no VO ' + id); return v; };
const WD = id => VOid(id).words;                         // [[text, t0, t1, chunk], ...]
const endOf = id => { const ws = WD(id); return ws[ws.length - 1][2]; };
// word i of VO id as a kinetic word; txt overrides the displayed text (e.g. 'BALL' for 'Ball?')
const wv = (id, i, st, txt) => { const w = WD(id)[i]; return [txt ?? w[0], w[1], w[2], st]; };
