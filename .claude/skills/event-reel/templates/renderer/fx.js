// fx.js — signature effects from the Bayan-Turnier reel, generalised. Each is a pure function of t.
// Requires core.js + kinetic.js. Pick 4–6 per film, never all; each one should carry a line of the story.

// ---------------------------------------------------------------- camera helpers
// keyframed focus tracking on a shot: KEYS = [[srcTime, x, y], ...] measured on the extracted frames.
// The point is glided (linear between keys, NOT per-frame detection → no jitter) and held at anchor (ax, ay).
async function trackCam(sid, t, KEYS, s = 1.5, ax = W / 2, ay = H / 2, o = {}) {
  const s0 = SHOTS[sid], st = srcTime(s0, t); let k = 0;
  while (k < KEYS.length - 2 && st > KEYS[k + 1][0]) k++;
  const [ta, xa, ya] = KEYS[k], [tb, xb, yb] = KEYS[Math.min(k + 1, KEYS.length - 1)], u = tb > ta ? clamp((st - ta) / (tb - ta)) : 0;
  const hx = lerp(xa, xb, E.inOutCubic(u)), hy = lerp(ya, yb, E.inOutCubic(u));
  await shot(sid, t, { s, fx: hx, fy: hy, dx: ax - hx, dy: ay - hy, ...o });
}
// re-frame the whole drawn scene (push in toward px,py and back out). Wrap the scene draw:
//   const z = pushFrame(t, a0, a1, b0, b1, 0.8); ctx.save(); zoomAbout(px, py, z); await scene(t); ctx.restore();
// Anything tracked on the un-zoomed frame maps analytically: x' = px + (x - px) * z.
function pushFrame(t, a0, a1, b0, b1, amt) { return 1 + amt * E.inOutCubic(prog(t, a0, a1)) * (1 - E.inOutCubic(prog(t, b0, b1))); }
function zoomAbout(px, py, z) { ctx.translate(px, py); ctx.scale(z, z); ctx.translate(-px, -py); }

// ---------------------------------------------------------------- odometer date / number
// digits roll upward and land one after another; separators pop. Good for dates, scores, counts.
function odometer(t, s, t0, y, o = ST.c(176, { ls: 4 }), opts = {}) {
  const t1 = opts.end ?? t0 + 1.2;
  if (t < t0 || t > t1 + 0.05) return;
  const out = E.inExpo(prog(t, t1 - 0.27, t1));
  const cws = [...s].map(c => mw(c, o)), tot = cws.reduce((a, b) => a + b, 0); let x = W / 2 - tot / 2;
  ctx.save(); ctx.globalAlpha = 0.45 * (1 - out) * E.outCubic(prog(t, t0, t0 + 0.14)); ctx.fillStyle = '#04080c'; ctx.fillRect(0, y - 250, W, 420); ctx.restore();
  [...s].forEach((c, i) => {
    const a = t0 + 0.06 + i * 0.045, u = E.outExpo(prog(t, a, a + 0.55));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - o.size * 0.91, cws[i] + 8, o.size * 1.14); ctx.clip(); ctx.translate(0, -60 * out); ctx.globalAlpha = 1 - out;
    if (!/[0-9]/.test(c)) { if (u > 0.5) { fnt(o); ctx.fillStyle = C.accent2; ctx.fillText(c, x, y); } }
    else {
      const d = +c, roll = (1 - u) * (8 + i), base = d + roll;
      for (let k = -1; k <= 1; k++) { const n = ((Math.floor(base) + k) % 10 + 10) % 10, yy = y + (k - (base - Math.floor(base))) * -o.size; fnt(o); ctx.fillStyle = C.white; ctx.globalAlpha = (1 - out) * (k === 0 ? 1 : 0.5); ctx.fillText(String(n), x, yy); }
    }
    ctx.restore(); x += cws[i];
  });
  const lu = E.outExpo(prog(t, t0 + 0.3, t0 + 0.75)); ctx.save(); ctx.globalAlpha = 1 - out; ctx.fillStyle = C.accent; ctx.fillRect(W / 2 - 330 * lu, y + 46, 660 * lu, 6); ctx.restore();
  if (opts.sub) { ctx.save(); fnt(ST.m(24, { ls: 6 })); ctx.textAlign = 'center'; ctx.globalAlpha = (1 - out) * E.outCubic(prog(t, t0 + 0.45, t0 + 0.75)); ctx.fillStyle = C.white; ctx.fillText(opts.sub, W / 2, y + 112); ctx.restore(); }
  if (opts.over) { ctx.save(); fnt(ST.m(22)); ctx.textAlign = 'center'; ctx.globalAlpha = 0.8 * (1 - out) * E.outCubic(prog(t, t0 + 0.15, t0 + 0.45)); ctx.fillStyle = C.accent2; ctx.fillText(opts.over, W / 2, y - 200); ctx.restore(); }
}

// ---------------------------------------------------------------- greeting / script wipe
// a word writes itself in its own direction (rtl for Arabic) with a pen spark, a Latin line fills in after it.
// e.g. scriptWipe(t, 'السلام عليكم', 'rtl', [['Salam', 6.62, 6.95, ST.s(96)], ['Aleykum', 6.95, 7.35, {...ST.s(96), ...KEY}]], 5.8, 8.3, 1240, 'ANKUNFT · 18:41')
function scriptWipe(t, script, dir, latin, a, b, y = 1240, label = null, size = 190) {
  if (t < a || t > b) return;
  const out = clamp((t - (b - 0.38)) / 0.32);
  scrim(y - 340, y + 460, 0.55 * (1 - out) * E.outCubic(prog(t, a, a + 0.3)));
  const u = E.inOutCubic(prog(t, a + 0.15, a + 1.05));
  ctx.save(); fnt({ ff: dir === 'rtl' ? 'arab' : 'serif', size }); ctx.textAlign = 'center';
  const aw = ctx.measureText(script).width, xl = W / 2 - aw / 2 - 20, xr = W / 2 + aw / 2 + 20;
  const x0 = dir === 'rtl' ? xr - (aw + 40) * u : xl, x1 = dir === 'rtl' ? xr : xl + (aw + 40) * u;
  ctx.globalAlpha = 0.16 * (1 - out); ctx.fillStyle = C.white; ctx.fillText(script, W / 2, y);
  ctx.beginPath(); ctx.rect(x0, y - 260, x1 - x0 + 10, 360); ctx.clip();
  ctx.globalAlpha = 1 - out; ctx.shadowColor = KEY.glow; ctx.shadowBlur = 40; ctx.fillStyle = C.white;
  ctx.translate(0, -30 * E.inCubic(out)); ctx.fillText(script, W / 2, y);
  ctx.restore();
  if (u > 0 && u < 1) spark(dir === 'rtl' ? x0 : x1, y - size * 0.37, 1, 10);
  if (latin && latin.length) {
    const tot = latin.reduce((p, w, i) => p + mw(w[0] + (i < latin.length - 1 ? ' ' : ''), w[3]), 0); let x = W / 2 - tot / 2;
    const vis = E.outCubic(prog(t, a + 0.65, a + 0.9));
    latin.forEach((w, i) => { kword(t, w[0], x, y + size * 0.97, w[3], w[1], w[2], vis, out); x += mw(w[0] + (i < latin.length - 1 ? ' ' : ''), w[3]); });
  }
  if (label) { ctx.save(); fnt(ST.m(22)); ctx.textAlign = 'center'; ctx.globalAlpha = 0.8 * E.outCubic(prog(t, a + 0.2, a + 0.6)) * (1 - out); ctx.fillStyle = C.accent2; ctx.fillText(label, W / 2, y + size * 1.42); ctx.restore(); }
}

// ---------------------------------------------------------------- colour-key / person glow ("only this lights up")
// the world drains to grey and dims, the masked thing (logo/sign by HSV key, shirt, person by rembg) glows in colour,
// a light sweep runs across it. mask PNGs in <kind>/<sid>/NNNNN.png (white RGBA alpha).
// k(t): 0..1 envelope, e.g. E.inOutCubic(prog(t, 11.9, 12.2)) * (1 - E.inOutCubic(prog(t, 12.85, 13.09)))
async function colorGlow(t, sid, sc, k, col = '#7dff4f', sweep = null, kind = 'fmasks') {
  await shot(sid, t, { s: sc, filter: k > 0.001 ? `grayscale(${k.toFixed(3)}) brightness(${(1 - 0.62 * k).toFixed(3)})` : 'none' });
  if (k <= 0.001) return;
  const img = await frameOf(sid, t), m = await maskOf(sid, t, kind);
  glow.x.save(); glow.x.setTransform(1, 0, 0, 1, 0, 0); glow.x.globalCompositeOperation = 'copy'; glow.x.drawImage(m, 0, 0, W, H);
  glow.x.globalCompositeOperation = 'source-in'; glow.x.fillStyle = col; glow.x.fillRect(0, 0, W, H); glow.x.restore();
  cut.x.save(); cut.x.setTransform(1, 0, 0, 1, 0, 0); cut.x.globalCompositeOperation = 'copy'; cut.x.drawImage(m, 0, 0, W, H);
  cut.x.globalCompositeOperation = 'source-in'; cut.x.drawImage(img, 0, 0, W, H);
  if (sweep) { const sw = prog(t, sweep[0], sweep[1]); if (sw > 0 && sw < 1) { cut.x.globalCompositeOperation = 'source-atop'; const gx = lerp(-300, W + 300, E.inOutCubic(sw)), g = cut.x.createLinearGradient(gx - 160, 0, gx + 160, 400); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cut.x.fillStyle = g; cut.x.fillRect(0, 0, W, H); } }
  cut.x.restore();
  drawLayer(glow.c, sc * 1.01, W / 2, H / 2, 0.75 * k, 'lighter', 'blur(30px)');
  drawLayer(glow.c, sc * 1.003, W / 2, H / 2, 0.45 * k, 'lighter', 'blur(7px)');
  drawLayer(cut.c, sc, W / 2, H / 2, k, 'source-over', 'saturate(1.6) brightness(1.3)');
}
// text BEHIND a person: draw shot, draw type, then the person cut-out on top
async function behindPerson(t, sid, o, drawType) {
  await shot(sid, t, o);
  drawType();
  await cutout(sid, t);
  drawLayer(cut.c, o.s ?? 1, o.fx ?? W / 2, o.fy ?? H / 2);
}

// ---------------------------------------------------------------- the ball becomes the Earth (any round object → globe)
// track = { frame: [x, y, r] } measured with scripts/ball_track.py on the UN-zoomed render; z/px/py = active pushFrame.
let LAND = [];
function project(lon, lat, lon0, lat0) {
  const l = (lon - lon0) * Math.PI / 180, p = lat * Math.PI / 180, p0 = lat0 * Math.PI / 180;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [Math.cos(p) * Math.sin(l), -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), cosc];
}
// a0/a1 = fade in, b0/b1 = fade out (timeline s). words = arcWords items for the orbit (or null). sub = small line under it (e.g. 'الدنيا')
function earthOn(t, track, a0, a1, b0, b1, words = null, sub = null, z = 1, px = W / 2, py = H / 2) {
  const fr = Math.round(t * FPS), k0 = track[fr]; if (!k0) return;
  const cx = px + (k0[0] - px) * z, cy = py + (k0[1] - py) * z, R = k0[2] * z * 0.99;
  const u = E.outCubic(prog(t, a0, a1)), fo = 1 - E.inCubic(prog(t, b0, b1)); if (u <= 0 || fo <= 0) return;
  const lon0 = 10 - (t - a0) * 38, lat0 = 22; // Europe faces us, the globe turns
  ctx.save(); ctx.globalAlpha = 0.55 * u * fo; ctx.fillStyle = '#02060c'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, R + 6, 0, 7, true); ctx.fill('evenodd'); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
  ctx.globalAlpha = 0.8 * fo * u; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#1b4f8f'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.globalCompositeOperation = 'source-over';
  const sh = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); sh.addColorStop(0, 'rgba(120,190,255,0.18)'); sh.addColorStop(1, 'rgba(0,10,30,0.55)'); ctx.globalAlpha = fo * u; ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.globalAlpha = fo * u; ctx.fillStyle = 'rgba(150,215,255,0.78)'; ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 12;
  for (const ring of LAND) {
    ctx.beginPath(); let vis = 0;
    ring.forEach(([lo, la], i) => { let [x, y, zz] = project(lo, la, lon0, lat0); if (zz < 0) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } else vis++; const X = cx + x * R, Y = cy + y * R; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    if (vis > 1) { ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(200,235,255,0.35)'; ctx.lineWidth = 1.2;
  for (let lo = -180; lo < 180; lo += 30) { ctx.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 5) { const [x, y, zz] = project(lo, la, lon0, lat0); if (zz > 0) { pen ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R); pen = true; } else pen = false; } ctx.stroke(); }
  for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 5) { const [x, y, zz] = project(lo, la, lon0, lat0); if (zz > 0) { pen ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R); pen = true; } else pen = false; } ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fo * u;
  const at = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12); at.addColorStop(0, 'rgba(90,180,255,0)'); at.addColorStop(0.45, 'rgba(90,180,255,0.55)'); at.addColorStop(1, 'rgba(90,180,255,0)');
  ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.fill(); ctx.restore();
  if (words) arcWords(t, words, cx, cy, R + 64, -Math.PI / 2, ST.c(92, { ls: 8 }), u, 1 - fo, 1);
  if (sub) { const lu = E.outCubic(prog(t, a0 + 0.2, a0 + 0.6)) * fo; ctx.save(); fnt({ ff: /[؀-ۿ]/.test(sub) ? 'arab' : 'serif', size: 120 }); ctx.textAlign = 'center'; ctx.globalAlpha = lu; ctx.fillStyle = C.accent2; ctx.shadowColor = C.accent2; ctx.shadowBlur = 30; ctx.fillText(sub, clamp(cx, 220, W - 220), Math.min(H - 200, cy + R + 160)); ctx.restore(); }
}

// ---------------------------------------------------------------- portal: a word fills with the next scene, the camera flies through a letter
// word drawn at (W/2, y) in Anton `size`; letterIdx = index of the letter to fly through (pick a tall open one: I, l, 1, H gap…).
// t0 = moment the fly-through starts (= first frame of the next scene); nextShot/nextAt = shot + its timeline time at t0.
const PORT = mk(W, H);
async function portal(t, word, y, size, letterIdx, t0, nextShot, nextAt, dur = 0.9) {
  const o = ST.c(size), tw = mw(word, o), x0 = W / 2 - tw / 2;
  const ix = x0 + mw(word.slice(0, letterIdx), o) + mw(word[letterIdx], o) / 2, iy = y - size * 0.37;
  const fill = E.inOutCubic(prog(t, t0 - 0.3, t0 + 0.05)), z = 1 + 46 * E.inExpo(prog(t, t0 + 0.05, t0 + dur + 0.05));
  const img = await frameOf(nextShot, nextAt + Math.max(0, t - t0));
  const m = PORT.x; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'copy'; m.clearRect(0, 0, W, H);
  m.translate(ix, iy); m.scale(z, z); m.translate(-ix, -iy);
  m.font = `${size}px Anton`; m.letterSpacing = '2px'; m.textAlign = 'left'; m.textBaseline = 'alphabetic'; m.fillStyle = '#fff'; m.fillText(word, x0, y);
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.filter = `brightness(${1 + 0.6 * (1 - fill)})`; m.drawImage(img, 0, 0, W, H); m.restore();
  if (t >= t0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.globalAlpha = fill; ctx.drawImage(PORT.c, 0, 0); ctx.restore();
  if (z > 1.01 && z < 30) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * (1 - prog(z, 1, 30)); ctx.filter = 'blur(18px)'; ctx.drawImage(PORT.c, 0, 0); ctx.restore(); }
  return t >= t0 + dur;   // true once the next scene fills the frame → hand over to it
}

// ---------------------------------------------------------------- light line opening a scene out of black
function dawnLine(t, t0) {
  const u = E.outExpo(prog(t, t0 - 0.45, t0 + 0.05)); if (u <= 0 || t > t0 + 0.2) return;
  const a = 1 - prog(t, t0 + 0.05, t0 + 0.2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(W / 2 - W * u / 2, 0, W / 2 + W * u / 2, 0); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(0.5, 'rgba(235,248,255,1)'); g.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(120,200,255,1)'; ctx.shadowBlur = 40; ctx.fillRect(W / 2 - W * u / 2, H / 2 - 2, W * u, 4); ctx.restore();
}

// ---------------------------------------------------------------- ring timer (match clock, round timer, set counter)
function ringTimer(t, a, b, from, to, label, cy = 560, R = 165) {
  const fi = E.outExpo(prog(t, a, a + 0.4)), fo = E.inExpo(prog(t, b - 0.25, b));
  if (fi <= 0 || fo >= 1) return;
  const u = prog(t, a + 0.15, b - 0.3), rem = Math.max(0, Math.round(lerp(from, to, u))), el = 1 - rem / Math.max(from, 1);
  const cx = W / 2;
  ctx.save(); ctx.globalAlpha = fi * (1 - fo); ctx.translate(0, -40 * fo);
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520); g.addColorStop(0, 'rgba(4,8,12,0.6)'); g.addColorStop(1, 'rgba(4,8,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, cy - 560, W, 1100);
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(245,241,232,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = C.accent; ctx.lineCap = 'round'; ctx.shadowColor = KEY.glow; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * el * fi); ctx.stroke(); ctx.shadowBlur = 0;
  for (let k = 0; k < 60; k++) { const an = k / 60 * Math.PI * 2, r0 = R - 22, r1 = R - (k % 5 ? 30 : 40); ctx.strokeStyle = 'rgba(245,241,232,0.35)'; ctx.lineWidth = k % 5 ? 1.5 : 3; ctx.beginPath(); ctx.moveTo(cx + r0 * Math.cos(an), cy + r0 * Math.sin(an)); ctx.lineTo(cx + r1 * Math.cos(an), cy + r1 * Math.sin(an)); ctx.stroke(); }
  const mm = String(Math.floor(rem / 60)).padStart(2, '0'), ss = String(rem % 60).padStart(2, '0');
  text(`${mm}:${ss}`, cx, cy + 40, { size: 118, ls: 2, shadow: false });
  ctx.save(); fnt(ST.m(22, { ls: 8 })); ctx.textAlign = 'center'; ctx.fillStyle = C.accent2; ctx.fillText(label, cx, cy + 92); ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- numbered list that gets struck through ("the goals of this world")
// items = [[label, t0, t1], ...]; strikeAt = time the strikes run; end = gone
function strikeList(t, items, y0, strikeAt, end, step = 175) {
  const fo = E.inExpo(prog(t, end - 0.33, end));
  items.forEach(([s, a, b], i) => {
    const u = E.outExpo(prog(t, a - 0.12, a + 0.25)), y = y0 + i * step;
    if (u <= 0 || fo >= 1) return;
    const st = E.inOutCubic(prog(t, strikeAt + i * 0.1, strikeAt + i * 0.1 + 0.32));
    ctx.save(); ctx.globalAlpha = 1 - fo; ctx.beginPath(); ctx.rect(0, y - 130, W, 160); ctx.clip(); ctx.translate(0, 130 * (1 - u));
    ctx.save(); fnt(ST.m(28)); ctx.fillStyle = C.accent2; ctx.globalAlpha *= 1 - 0.6 * st; ctx.fillText(String(i + 1).padStart(2, '0'), 92, y - 76); ctx.restore();
    kword(t, s, 140, y, { ...ST.c(118), ghost: 0.17 * (1 - 0.6 * st) }, a, b, (1 - fo) * (1 - 0.6 * st), 0);
    if (st > 0) { ctx.fillStyle = C.accent; ctx.shadowColor = C.accent2; ctx.shadowBlur = 14; ctx.fillRect(126, y - 52, (mw(s, ST.c(118)) + 30) * st, 10); }
    ctx.restore();
  });
}
