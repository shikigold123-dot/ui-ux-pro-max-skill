// core.js — deterministic 9:16 motion-graphics compositor (Canvas2D).
// Every frame is a pure function of time t. The Playwright driver (drive.js) calls window.renderFrame(f)
// and pipes the returned JPEG into ffmpeg. No wall-clock, no Math.random() in drawing code (use hash()).
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
// palette — override per project in main.js (C.accent etc.). Keep ONE accent colour per film.
const C = { ink: '#070d0a', white: '#f5f1e8', accent: '#3b8fd4', accent2: '#8fd0ff', red: '#ff4a3d' };

// ---------------------------------------------------------------- utilities
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outExpo: u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  inExpo: u => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  inOutExpo: u => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2),
  outCubic: u => 1 - Math.pow(1 - u, 3),
  inCubic: u => u * u * u,
  inOutCubic: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outBack: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  outQuart: u => 1 - Math.pow(1 - u, 4),
};
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, x: c.getContext('2d') }; }
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
const pad5 = i => String(i).padStart(5, '0');

// ---------------------------------------------------------------- footage
// SHOTS (shots.json): { id: { id, clip, in, a, b, sp, n, dir, fps } }
//   clip = source clip name (used by the audio bed), in = source time at t=a, [a,b) = timeline window,
//   sp = speed (1 = realtime, 0.5 = half speed), n = frame count in dir, dir = frames folder (relative to project root),
//   fps = fps of the extracted frames (30 for normal, 60 for slow-motion-capable extracts).
let SHOTS = {};
const ASSET = {};
const cache = new Map();
function loadPath(p) {
  if (cache.has(p)) { const v = cache.get(p); cache.delete(p); cache.set(p, v); return v; }
  const v = fetch(p).then(r => { if (!r.ok) throw new Error('404 ' + p); return r.blob(); }).then(b => createImageBitmap(b));
  cache.set(p, v); return v;
}
function trimCache(max = 64) {
  while (cache.size > max) { const k = cache.keys().next().value; const p = cache.get(k); cache.delete(k); p.then(b => b.close()).catch(() => { }); }
}
// per-shot time remapping (speed ramps): override RAMPS[id] = u => sourceTime (u = t - s.a)
const RAMPS = {};
function srcTime(s, t) { return RAMPS[s.id] ? RAMPS[s.id](t - s.a) : s.in + (t - s.a) * s.sp; }
function frameIdx(s, t) { return Math.max(1, Math.min(s.n, 1 + Math.round((srcTime(s, t) - s.in) * (s.fps ?? 30)))); }
function frameOf(sid, t) { const s = SHOTS[sid]; return loadPath(`../${s.dir}/${pad5(frameIdx(s, t))}.jpg`); }
function maskOf(sid, t, kind = 'fmasks') { const s = SHOTS[sid]; return loadPath(`../${kind}/${sid}/${pad5(frameIdx(s, t))}.png`); }
// frame log: which clip/source-time is on screen each frame → the audio mix rebuilds the location bed + cut clicks from it
const FRAME_LOG = { done: false, v: null };
window.__log = [];
// draw a full-frame shot with a camera transform: scale s about focus (fx,fy), offset (dx,dy), rotation, filter
async function shot(sid, t, o = {}) {
  const s0 = SHOTS[sid];
  if (!s0) throw new Error('unknown shot ' + sid);
  if (!FRAME_LOG.done && !o.noLog) { FRAME_LOG.done = true; FRAME_LOG.v = [s0.clip, srcTime(s0, t)]; }
  const img = await frameOf(sid, t);
  const s = o.s ?? 1, fx = o.fx ?? W / 2, fy = o.fy ?? H / 2;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.filter) ctx.filter = o.filter;
  ctx.translate(fx + (o.dx ?? 0), fy + (o.dy ?? 0));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(s, s);
  ctx.drawImage(img, -fx, -fy, W, H);
  ctx.restore();
}
// camera: slow push across the shot + a decaying "punch" right after the cut
function cam(sid, t, push = 0.05, punch = 0.07, pd = 0.3) {
  const s = SHOTS[sid];
  return 1 + push * prog(t, s.a, s.b) + punch * (1 - E.outExpo(prog(t, s.a, s.a + pd)));
}
function current(ids, t) { for (const id of ids) { const s = SHOTS[id]; if (t >= s.a && t < s.b) return id; } return ids[ids.length - 1]; }
// play a list of shots back-to-back with default camera moves
async function sequence(ids, t, o = {}) {
  const id = current(ids, t);
  await shot(id, t, { s: cam(id, t, o.push ?? 0.05, o.punch ?? 0.07), ...(o.per?.[id] ?? {}) });
  return id;
}

// ---------------------------------------------------------------- layers / masks
const tmp = mk(W, H), chR = mk(W, H), chG = mk(W, H), chB = mk(W, H), mask = mk(W, H), cut = mk(W, H), glow = mk(W, H);
// person-only layer (rembg mask in fmasks/<sid>/) into `cut` → draw text, then drawLayer(cut.c…) on top = text BEHIND the person
async function cutout(sid, t, kind = 'fmasks') {
  const img = await frameOf(sid, t), m = await maskOf(sid, t, kind);
  cut.x.save(); cut.x.setTransform(1, 0, 0, 1, 0, 0); cut.x.globalCompositeOperation = 'copy'; cut.x.drawImage(m, 0, 0, W, H);
  cut.x.globalCompositeOperation = 'source-in'; cut.x.drawImage(img, 0, 0, W, H); cut.x.restore();
  return m;
}
function drawLayer(c, s, fx, fy, alpha = 1, comp = 'source-over', filter = 'none') {
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = comp; ctx.filter = filter; ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); ctx.drawImage(c, 0, 0); ctx.restore();
}

// ---------------------------------------------------------------- effects
function rgbSplit(px) {
  if (px < 0.6) return;
  tmp.x.globalCompositeOperation = 'copy'; tmp.x.drawImage(cv, 0, 0);
  for (const [ch, col] of [[chR, '#f00'], [chG, '#0f0'], [chB, '#00f']]) {
    ch.x.globalCompositeOperation = 'copy'; ch.x.drawImage(tmp.c, 0, 0);
    ch.x.globalCompositeOperation = 'multiply'; ch.x.fillStyle = col; ch.x.fillRect(0, 0, W, H);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'copy'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(chR.c, -px, 0); ctx.drawImage(chG.c, 0, 0); ctx.drawImage(chB.c, px, px * 0.3);
  ctx.restore();
}
function dirBlur(dx, dy = 0, n = 8) {
  if (Math.abs(dx) + Math.abs(dy) < 1) return;
  tmp.x.globalCompositeOperation = 'copy'; tmp.x.drawImage(cv, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'copy'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 / n;
  for (let k = 0; k < n; k++) { const u = k / (n - 1) - 0.5; ctx.drawImage(tmp.c, dx * u, dy * u); }
  ctx.restore();
}
// radial zoom blur toward (cx,cy): amt 0..0.2 — use on whip-in cuts
function zoomBlur(amt, cx = W / 2, cy = H / 2, n = 8) {
  if (amt < 0.004) return;
  tmp.x.globalCompositeOperation = 'copy'; tmp.x.drawImage(cv, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 / n * 1.6;
  for (let k = 1; k < n; k++) { const s = 1 + amt * k / n; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); ctx.drawImage(tmp.c, 0, 0); ctx.restore(); }
  ctx.restore();
}
const grains = [];
function makeGrain() {
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // deterministic
  for (let g = 0; g < 6; g++) {
    const m = mk(540, 960), d = m.x.createImageData(540, 960);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - 0.5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    m.x.putImageData(d, 0, 0); grains.push(m.c);
  }
}
// grain: 0.05–0.06 normal; up to 0.11 for a dark climax. More = text shimmers after encoding.
function grain(f, a = 0.055) {
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a;
  ctx.drawImage(grains[f % 6], 0, 0, W, H); ctx.restore();
}
function vignette(a = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.68);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function flash(a, col = '255,255,255') { if (a <= 0.003) return; ctx.save(); ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function black(a) { flash(a, '0,0,0'); }
function shake(t, amp, seed = 1) { return [Math.sin(t * 91 + seed) * amp, Math.cos(t * 77 + seed * 3) * amp]; }
// legibility scrim: soft dark gradient band behind text (never a hard box)
function scrim(y0, y1, a = 0.5) {
  if (a <= 0) return;
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(0.5, `rgba(4,8,12,${a})`); g.addColorStop(1, 'rgba(4,8,12,0)');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); ctx.restore();
}

// ---------------------------------------------------------------- simple type (kinetic type lives in kinetic.js)
function setFont(o) {
  const f = o.f ?? 'Anton', size = o.size ?? 100;
  ctx.font = `${o.weight ?? ''} ${size}px ${f}`.trim();
  ctx.fontStretch = o.stretch ?? 'normal';
  ctx.letterSpacing = (o.ls ?? 0) + 'px';
}
function text(str, x, y, o = {}) {
  ctx.save();
  setFont(o);
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = o.base ?? 'alphabetic';
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = o.shadowBlur ?? 40; }
  if (o.sx || o.sy || o.rot) { ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.sx ?? 1, o.sy ?? 1); x = 0; y = 0; }
  if (o.fill !== false) { ctx.fillStyle = o.color ?? C.white; ctx.fillText(str, x, y); }
  if (o.stroke) { ctx.shadowBlur = 0; ctx.lineWidth = o.lw ?? 3; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
  ctx.restore();
}
function measure(str, o) { ctx.save(); setFont(o); const w = ctx.measureText(str).width; ctx.restore(); return w; }
// text filled with live footage of shot sid
async function videoText(str, x, y, o, sid, t, imgScale = 1.15) {
  const img = await frameOf(sid, t);
  const m = mask.x;
  m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'copy'; m.clearRect(0, 0, W, H);
  m.font = `${o.weight ?? ''} ${o.size}px ${o.f ?? 'Anton'}`.trim(); m.letterSpacing = (o.ls ?? 0) + 'px';
  m.textAlign = 'center'; m.fillStyle = '#fff';
  m.translate(x, y); m.scale(o.sx ?? 1, o.sx ?? 1); m.fillText(str, 0, 0);
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = 'source-in'; m.filter = 'brightness(1.25) contrast(1.1)';
  const iw = W * imgScale, ih = H * imgScale;
  m.drawImage(img, (W - iw) / 2, y - ih * 0.55, iw, ih);
  m.restore();
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(mask.c, 0, 0); ctx.restore();
}

// ---------------------------------------------------------------- geometry
function arcDraw(x, y, r, u, o = {}) {
  if (u <= 0) return;
  ctx.save(); ctx.beginPath(); const s = o.start ?? -Math.PI / 2;
  ctx.arc(x, y, r, s, s + Math.PI * 2 * u);
  ctx.lineWidth = o.lw ?? 3; ctx.strokeStyle = o.color ?? C.accent; ctx.globalAlpha = o.alpha ?? 1; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
function line(x1, y1, x2, y2, o = {}) { ctx.save(); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = o.lw ?? 2; ctx.strokeStyle = o.color ?? C.white; ctx.globalAlpha = o.alpha ?? 1; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); ctx.restore(); }
function brackets(x, y, w, h, len, o = {}) {
  ctx.save(); ctx.lineWidth = o.lw ?? 3; ctx.strokeStyle = o.color ?? C.white; ctx.globalAlpha = o.alpha ?? 1; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(cx, cy + sy * len); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * len, cy);
  }
  ctx.stroke(); ctx.restore();
}
function pill(x, y, w, h, fill, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.restore(); }

// ---------------------------------------------------------------- frame entry (main.js defines draw(t, f) and may extend setup)
async function loadAsset(name, path) { try { const r = await fetch(path); if (r.ok) ASSET[name] = await createImageBitmap(await r.blob()); } catch (e) { } }
window.setup = async () => {
  SHOTS = await (await fetch('../shots.json')).json();
  await Promise.all(['40px Anton', '800 40px ArchivoX', '40px SerifX', '40px SerifR', '500 40px MonoX', '40px Amiri', '500 40px Oswald'].map(f => document.fonts.load(f)));
  makeGrain();
  if (window.projectSetup) await window.projectSetup();
  return Object.keys(SHOTS).length;
};
window.renderFrame = async (f, q = 0.94) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  FRAME_LOG.done = false; FRAME_LOG.v = null;
  await draw(f / FPS, f);
  window.__log[f] = FRAME_LOG.v;
  trimCache();
  return cv.toDataURL('image/jpeg', q);
};
