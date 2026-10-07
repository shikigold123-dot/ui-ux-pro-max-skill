// v4 — Dar ul-Bayan × Bayan Turnier. Built on base.js (v1 helpers, blue flyer accent). Nasheed "My Dream" grid: 99.4 BPM, video t + 1.0 s = nasheed t.
const DUR4 = 69.3;
function star8() { }
const ASSET = {};
// ---- shot timing (ramps)
function srcTime(s, t) {
  if (s.id === 'l2') { const u = t - s.a; return 2.9 + (u < 0.4 ? u : u < 1.6 ? 0.4 + 0.5 * (u - 0.4) : 1.0 + 0.49 * (u - 1.6)); }
  return s.in + (t - s.a) * s.sp;
}
const _gb4 = getBitmap;
getBitmap = function (sid, idx) {
  if (!sid.startsWith('__mask__')) return _gb4(sid, idx);
  const key = sid + '/' + idx; if (cache.has(key)) return cache.get(key);
  const p = fetch(`../masks/${sid.slice(8)}/${String(idx).padStart(5, '0')}.png`).then(r => r.blob()).then(b => createImageBitmap(b)); cache.set(key, p); return p;
};
const maskOf4 = (sid, t) => { const s = SHOTS[sid]; let i = 1 + Math.round((srcTime(s, t) - s.in) * 60); i = Math.max(1, Math.min(s.n, i)); return getBitmap('__mask__' + sid, i); };
const cut = mk(W, H), glow = mk(W, H);
async function cutout(sid, t) { // person-only layer into `cut`
  const img = await frameOf(sid, t), m = await maskOf4(sid, t);
  cut.x.save(); cut.x.setTransform(1, 0, 0, 1, 0, 0); cut.x.globalCompositeOperation = 'copy'; cut.x.drawImage(m, 0, 0, W, H);
  cut.x.globalCompositeOperation = 'source-in'; cut.x.drawImage(img, 0, 0, W, H); cut.x.restore();
  return m;
}
function drawLayer(c, s, fx, fy, alpha = 1, comp = 'source-over', filter = 'none') {
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = comp; ctx.filter = filter; ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); ctx.drawImage(c, 0, 0); ctx.restore();
}
function turf(a) { ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? 'rgba(30,70,52,0.22)' : 'rgba(12,34,25,0.10)'; ctx.fillRect(0, k * 214, W, 214); } ctx.restore(); }
function shine(x, y, w, h, u, a = 0.9) { // diagonal light sweep inside a box
  if (u <= 0 || u >= 1) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = 'overlay';
  const gx = lerp(x - 260, x + w + 260, u), g = ctx.createLinearGradient(gx - 120, y, gx + 120, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
}
function rays(cx, cy, a, t, col = '150,210,255', n = 22, len = 1600) { // soft volumetric rays
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(10px)'; ctx.translate(cx, cy); ctx.rotate(t * 0.05);
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, 520); bloom.addColorStop(0, `rgba(${col},${0.28 * a})`); bloom.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = bloom; ctx.fillRect(-520, -520, 1040, 1040);
  for (let k = 0; k < n; k++) {
    const ang = k / n * Math.PI * 2 + hash(k) * 0.3, w = 0.012 + 0.022 * hash(k + 7);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, len); g.addColorStop(0, `rgba(${col},${0.16 * a * (0.5 + hash(k + 2))})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, len, ang - w, ang + w); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function motes(a, t, seed = 1, n = 46) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) {
    const x = hash(k * 3 + seed) * W, y0 = hash(k * 5 + seed) * H, sp = 40 + 90 * hash(k + seed * 9), y = ((y0 - t * sp) % H + H) % H, r = 1.5 + 3.5 * hash(k + 3);
    ctx.globalAlpha = a * (0.3 + 0.7 * hash(k + 11)) * (0.6 + 0.4 * Math.sin(t * 3 + k));
    ctx.fillStyle = '#cfe9ff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function flare(x, y, a, w = 900) { // anamorphic streak
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - w, y, x + w, y); g.addColorStop(0, 'rgba(80,160,255,0)'); g.addColorStop(0.5, `rgba(170,215,255,${0.85 * a})`); g.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - w, y - 3, 2 * w, 6); ctx.globalAlpha = 0.5 * a; ctx.fillRect(x - w * 0.6, y - 14, w * 1.2, 28);
  const r = ctx.createRadialGradient(x, y, 0, x, y, 160); r.addColorStop(0, `rgba(220,240,255,${0.8 * a})`); r.addColorStop(1, 'rgba(120,190,255,0)');
  ctx.globalAlpha = 1; ctx.fillStyle = r; ctx.fillRect(x - 160, y - 160, 320, 320); ctx.restore();
}
function leak(u, col = '90,170,255') { if (u <= 0 || u >= 1) return; const x = lerp(-400, W + 400, u); const g = ctx.createRadialGradient(x, H * 0.4, 0, x, H * 0.4, 950); g.addColorStop(0, `rgba(${col},0.6)`); g.addColorStop(1, `rgba(${col},0)`); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = Math.sin(u * Math.PI); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// ---- logo (assets/logo.png if supplied; otherwise the script lettering)
function logo(cx, cy, width, reveal, alpha = 1) {
  if (reveal <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  if (ASSET.logo) {
    const im = ASSET.logo, h = width * im.height / im.width;
    ctx.beginPath(); ctx.rect(cx - width / 2 - 20, cy - h, (width + 40) * reveal, h * 2); ctx.clip();
    ctx.shadowColor = 'rgba(120,200,255,0.5)'; ctx.shadowBlur = 26; ctx.drawImage(im, cx - width / 2, cy - h / 2, width, h);
  } else {
    const so = { f: 'ArchivoX', weight: 800, size: width * 0.125, ls: width * 0.014 }, sw = measure('DAR UL-BAYAN', so), x0 = cx - sw / 2;
    ctx.beginPath(); ctx.rect(x0 - 40, cy - 200, (sw + 80) * reveal, 320); ctx.clip();
    ctx.shadowColor = 'rgba(120,200,255,0.45)'; ctx.shadowBlur = 22; setFont(so); ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText('DAR UL-BAYAN', cx, cy + so.size * 0.36);
  }
  ctx.restore();
}

// ================================================================== A · INTRO 0 – 4.67
async function intro(t) {
  glowBg(prog(t, 0, 0.8)); turf(prog(t, 0, 1.2));
  const z = 1 + 6.5 * E.inExpo(prog(t, 4.25, 4.69)), fade = 1 - prog(t, 4.38, 4.62), cx = W / 2, cy = 960;
  if (t > 4.25) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 330 * z, 0, 7); ctx.clip(); await shot('o1', 4.67, { s: 1.25 - 0.25 * prog(t, 4.25, 4.67), alpha: prog(t, 4.25, 4.4) }); ctx.restore(); }
  ctx.save(); const zz = z * (1 + 0.035 * t / 4.67); ctx.translate(cx, cy); ctx.scale(zz, zz); ctx.translate(-cx, -cy);
  const hl = E.outExpo(prog(t, 0, 1.2)) * 560;
  line(cx - hl, cy, cx - 335, cy, { color: C.white, alpha: 0.3 * fade }); line(cx + 335, cy, cx + hl, cy, { color: C.white, alpha: 0.3 * fade });
  arcDraw(cx, cy, 330, E.inOutCubic(prog(t, 0.15, 1.4)), { lw: 3, alpha: 0.95 });
  ctx.restore();
  ctx.save(); const tz = 1 + 1.8 * E.inExpo(prog(t, 4.25, 4.67)); ctx.translate(cx, cy); ctx.scale(tz, tz); ctx.translate(-cx, -cy); ctx.globalAlpha = fade;
  logo(cx, 520, 640, E.inOutCubic(prog(t, 0.25, 1.4)), fade);
  const pu = E.outCubic(prog(t, 1.45, 2.0));
  if (pu > 0) text('PRÄSENTIERT', cx, 700, { f: 'Oswald', weight: 500, size: 40, ls: lerp(40, 16, pu), alpha: 0.9 * pu * fade });
  let u = prog(t, 2.25, 2.6);
  if (u > 0) await videoText('FUSSBALL', cx, 975, { size: 236, ls: 4, sx: 1.35 - 0.35 * E.outExpo(u), alpha: clamp(u * 5) * fade }, 'mf', 1.6 + (t - 2.25));
  u = prog(t, 2.83, 3.18);
  if (u > 0) await videoText('TURNIER', cx, 1218, { size: 236, ls: 6, sx: 1.35 - 0.35 * E.outExpo(u), alpha: clamp(u * 5) * fade }, 'mt', 1.9 + (t - 2.83));
  u = E.outExpo(prog(t, 3.46, 3.9));
  if (u > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 1245, W, 120); ctx.clip(); ctx.shadowColor = 'rgba(120,200,255,0.5)'; ctx.shadowBlur = 24; text('LAOLA SPORTCENTER', cx, 1338 + 110 * (1 - u), { f: 'Oswald', weight: 600, size: 80, ls: 4, alpha: fade, shadow: false }); ctx.restore(); }
  const bu = E.outExpo(prog(t, 3.75, 4.1)); if (bu > 0) { ctx.fillStyle = C.band; ctx.fillRect(cx - 400 * bu, 1378, 800 * bu, 7); }
  ctx.restore();
}

// ================================================================== B · OUTSIDE → HALL 4.67 – 15.49
const OUT = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'n1', 'n2', 'n3', 'n4', 'n5'];
const LOGO4 = [[386, 754, 247, 326], [299, 684, 324, 396]];
async function outside(t) {
  const id = current(OUT, t), s = SHOTS[id];
  const f = { o2: [540, 930, 0.75] }[id] ?? [W / 2, H / 2, 0];
  let dx = 0;
  if (id === 'n4') dx = -W * 0.7 * E.inExpo(prog(t, 14.14, 14.26));
  if (id === 'n5') dx = W * 0.7 * (1 - E.outExpo(prog(t, 14.26, 14.42)));
  const sc = cam(id, t, 0.06, id === 'o1' ? 0 : 0.08) + f[2] + (id === 'n2' || id === 'n3' ? 0.05 : 0) + (id === 'n5' ? 0.2 * E.inExpo(prog(t, 15.15, 15.49)) : 0);
  if (id === 'o2' && typeof o2Cam === 'function') await o2Cam(t);
  else if ((id === 'n1' || id === 'n2') && typeof laolaWow === 'function') await laolaWow(t, id, sc);
  else if (id === 'o7') await ummahWow(t, sc);
  else await shot(id, t, { s: sc, dx, fx: f[0], fy: f[1], filter: id === 'n5' ? `brightness(${1 + 0.7 * (1 - E.outCubic(prog(t, 14.3, 14.75)))})` : 'none' });
  if (Math.abs(dx) > 2) dirBlur(dx * 0.35);
  if (id === 'n2' || id === 'n3') zoomBlur4(0.06);
  if (id === 'n5') zoomBlur4(0.2 * E.inExpo(prog(t, 15.15, 15.49)));
  vignette(0.5);
  // v8: Salam Aleykum is drawn by main8 (salam())
  // v8: the date is drawn by main8 (dateStamp())
  const lin = E.outExpo(prog(t, 11.95, 12.4)), lout = E.inExpo(prog(t, 13.5, 13.8));
  if (false && lin > 0 && lout < 1) { // v11: the sign itself lights up instead (laolaWow)
    ctx.save(); ctx.beginPath(); ctx.rect(W * lout, 1300, W * (lin - lout), 170); ctx.clip();
    ctx.fillStyle = C.band; ctx.fillRect(0, 1330, W, 120);
    text('LAOLA SPORTCENTER', W / 2, 1418, { f: 'Oswald', weight: 500, size: 84, ls: 3, color: C.white, shadow: false });
    ctx.restore();
  }
  if (id !== 'o1' && id !== 'o7') rgbSplit(5 * (1 - clamp((t - s.a) / 0.1)));
}
function zoomBlur4(amount, cx = W / 2, cy = H / 2, n = 8) {
  if (amount < 0.004) return; tmp.x.globalCompositeOperation = 'copy'; tmp.x.drawImage(cv, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'copy'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 / n;
  for (let k = 0; k < n; k++) { const s = 1 + amount * k / (n - 1); ctx.setTransform(s, 0, 0, s, cx - cx * s, cy - cy * s); ctx.drawImage(tmp.c, 0, 0); }
  ctx.restore();
}
// the Ummah Calisthenics wow: world drains, wearer pops forward with rim light, rays and a shine over the print
async function ummahWow(t, sc) {
  const id = 'o7', fx = W / 2, fy = H / 2;
  const k = E.inOutCubic(prog(t, 9.72, 10.05)) * (1 - E.inOutCubic(prog(t, 10.92, 11.2)));
  await shot(id, t, { s: sc, filter: `grayscale(${k}) brightness(${1 - 0.6 * k}) blur(${2.5 * k}px)` });
  if (k <= 0.001) return;
  const L = LOGO4[0].map((v, i) => lerp(v, LOGO4[1][i], prog(t, 9.47, 11.26)));
  const lx = fx + (L[0] + L[2] / 2 - fx) * sc, ly = fy + (L[1] + L[3] / 2 - fy) * sc;
  rays(lx, ly - 120, k, t, '150,210,255', 16, 1300);
  try {
    const m = await cutout(id, t);
    // rim glow: blurred blue silhouette behind the cutout
    glow.x.save(); glow.x.setTransform(1, 0, 0, 1, 0, 0); glow.x.globalCompositeOperation = 'copy'; glow.x.drawImage(m, 0, 0, W, H);
    glow.x.globalCompositeOperation = 'source-in'; glow.x.fillStyle = '#5ab4ff'; glow.x.fillRect(0, 0, W, H); glow.x.restore();
    const pop = sc * (1 + 0.035 * k);
    drawLayer(glow.c, pop * 1.012, fx, fy, 0.45 * k, 'lighter', 'blur(24px)');
    drawLayer(glow.c, pop * 1.004, fx, fy, 0.3 * k, 'lighter', 'blur(5px)');
    drawLayer(cut.c, pop, fx, fy, 1);
    const bx = fx + (L[0] - fx) * pop, by = fy + (L[1] - fy) * pop, bw = L[2] * pop, bh = L[3] * pop;
    shine(bx, by, bw, bh, prog(t, 10.15, 10.75), 1);
  } catch (e) { }
  motes(k, t, 3);
  flash(0.35 * (1 - prog(t, 9.72, 9.9)) * (t >= 9.72 ? 1 : 0), '160,210,255');
}

// ================================================================== C · SPEECH (picture only) 15.49 – 19.64
const SP = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
async function speech4(t) {
  const id = current(SP, t);
  if (false) {
    await shot('e1', t, { s: cam('e1', t, 0.05, 0.2, 0.4) });
    const img = await frameOf('e2', t);
    for (let k = 0; k < 6; k++) { const u = E.outExpo(prog(t, 16.67 + k * 0.035, 16.9 + k * 0.035)), x = k * 180; ctx.save(); ctx.beginPath(); ctx.rect(x, (k % 2 ? 1 : -1) * H * (1 - u), 181, H); ctx.clip(); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); }
  } else if (false) {
    await shot('e4', t, { s: cam('e4', t) });
    const r = 1300 * E.inOutCubic(prog(t, 18.53, 18.85));
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 7); ctx.clip(); await shot('e5', t, { s: 1.1 - 0.1 * prog(t, 18.53, 18.85) }); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 7); ctx.stroke(); ctx.restore();
  } else {
    let dx = 0, dy = 0;
    if (id === 'e2') dx = -W * 0.8 * E.inExpo(prog(t, 17.18, 17.30));
    if (id === 'e3') dx = W * 0.8 * (1 - E.outExpo(prog(t, 17.30, 17.46)));
    if (id === 'e5') dy = -H * 0.6 * E.inExpo(prog(t, 19.0, 19.11));
    if (id === 'e6') dy = H * 0.6 * (1 - E.outExpo(prog(t, 19.11, 19.25)));
    await shot(id, t, { s: cam(id, t, 0.05, id === 'e1' ? 0.25 : 0.06, 0.4), dx, dy });
    if (dx) dirBlur(dx * 0.4); if (dy) dirBlur(0, dy * 0.4);
  }
  vignette(0.5);
  if (id === 'e4') flash(0.8 * (1 - prog(t, 17.88, 18.0)));
}

// ================================================================== D · SHOE 19.64 – 21.45
async function shoe(t) {
  const foc = 1 - E.outCubic(prog(t, 19.64, 20.1));
  await shot('sh', t, { s: 1.2 + 0.08 * prog(t, 19.64, 21.45), fx: 430, fy: 780, filter: `blur(${10 * foc}px)` });
  vignette(0.6);
  black(1 - prog(t, 19.64, 19.8));
}

// ================================================================== E · BALL UP → INTO THE BALL 21.45 – 24.45
const BALLUP = [535, 1058];
async function ballUp(t) {
  const z = 1 + 0.06 * prog(t, 21.45, 24.0) + 5 * E.inExpo(prog(t, 24.0, 24.47));
  await shot('bu', t, { s: z, fx: BALLUP[0], fy: BALLUP[1] });
  vignette(0.6);
  black(0.35 * prog(t, 22.0, 22.5) * (1 - prog(t, 24.0, 24.2)));
  const a = 1 - prog(t, 23.7, 24.0);
  text(typed('19:00', t, 22.1, 22.35), W / 2, 760, { f: 'Mono', weight: 600, size: 34, ls: 8, color: C.gold2, alpha: a });
  const u = E.outExpo(prog(t, 22.45, 22.9));
  if (u > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 770, W, 200); ctx.clip(); text('ANPFIFF', W / 2, 930 + 180 * (1 - u), { size: 190, ls: 10, alpha: a }); ctx.restore(); }
  // portal: the ball opens into the match
  const pr = E.inExpo(prog(t, 24.05, 24.45));
  if (pr > 0) {
    const r = 60 * z * (1 + 2 * pr);
    ctx.save(); ctx.beginPath(); ctx.arc(BALLUP[0], BALLUP[1], Math.min(r, 2400), 0, 7); ctx.clip(); await shot('g1', 24.45, { s: 1.3 - 0.3 * pr }); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.gold2; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(BALLUP[0], BALLUP[1], Math.min(r, 2400), 0, 7); ctx.stroke(); ctx.restore();
  }
}

// ================================================================== F · MATCH 24.45 – 40.05
const GAME4 = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 't1', 'g9', 'g10', 'g11', 'g12', 'g13'];
const TN = { WP: 'WINTERPAUSE', BR: 'BRÜDER', KA: 'KATERNBERG', UE: 'ÜBRIGGEBLIEBEN', DI: 'DIÄT' };
const MATCHES = [['19:00', 'UE', 2, 6, 'WP'], ['19:11', 'DI', 3, 5, 'BR'], ['19:22', 'KA', 4, 1, 'UE'], ['19:33', 'WP', 7, 0, 'DI'], ['19:44', 'BR', 4, 4, 'KA'], ['19:55', 'DI', 4, 7, 'UE'], ['20:06', 'BR', 4, 4, 'WP'], ['20:17', 'KA', 2, 1, 'DI'], ['20:28', 'UE', 2, 4, 'BR'], ['20:39', 'WP', 3, 1, 'KA']];
async function match(t) {
  const id = current(GAME4, t), s = SHOTS[id];
  if (id === 't1') await trip(t);
  else if (id === 'g3') await behindText(t);
  else await shot(id, t, { s: cam(id, t, 0.05, 0.07, 0.3) });
  vignette(0.5);
  flash(0.9 * (1 - E.outCubic(prog(t, 24.45, 24.75))) * (t >= 24.45 ? 1 : 0));
  // ticker — every result of the evening
  const mi = Math.min(9, Math.floor((t - 24.45) / 1.56)), mt = 24.45 + mi * 1.56, m = MATCHES[mi];
  const hin = E.outExpo(prog(t, 24.6, 25.0)), sw = E.outExpo(prog(t, mt, mt + 0.32)), hout = E.inExpo(prog(t, 39.7, 40.05));
  ctx.save(); ctx.translate(0, -170 * (1 - hin) - 170 * hout);
  pill(70, 248, W - 140, 132, 'rgba(7,13,10,0.78)');
  text(`SPIEL ${String(mi + 1).padStart(2, '0')}/10`, 120, 296, { f: 'Mono', weight: 600, size: 22, ls: 4, color: C.gold2, align: 'left', shadow: false });
  text(m[0] + ' UHR', W - 120, 296, { f: 'Mono', weight: 500, size: 22, ls: 3, align: 'right', alpha: 0.7, shadow: false });
  ctx.fillStyle = 'rgba(245,241,232,0.15)'; ctx.fillRect(120, 310, W - 240, 2); ctx.fillStyle = C.gold; ctx.fillRect(120, 310, (W - 240) * clamp((t - 24.45) / 15.6), 2);
  ctx.beginPath(); ctx.rect(70, 314, W - 140, 66); ctx.clip();
  const yy = 362 + 56 * (1 - sw), tf = { f: 'Oswald', weight: 600, size: 38, ls: 1, shadow: false };
  text(TN[m[1]], W / 2 - 78, yy, { ...tf, align: 'right', alpha: m[2] >= m[3] ? 1 : 0.6 });
  text(`${m[2]} : ${m[3]}`, W / 2, yy, { f: 'Mono', weight: 800, size: 38, ls: 2, color: C.gold2, shadow: false });
  text(TN[m[4]], W / 2 + 78, yy, { ...tf, align: 'left', alpha: m[3] >= m[2] ? 1 : 0.6 });
  ctx.restore();
  // final whistle into the table
  flash(0.9 * prog(t, 39.75, 40.05), '255,255,255');
}
async function trip(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) {
    const u = E.outExpo(prog(t, 32.88 + k * 0.08, 33.35 + k * 0.08)), out = E.inExpo(prog(t, 33.95 + k * 0.03, 34.09));
    const x = k * 360, dir = k % 2 ? 1 : -1, y = dir * H * (1 - u) - dir * H * out, img = await frameOf(['t1', 't2', 't3'][k], t);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y, 352, H); ctx.clip();
    const s = 1.08 + 0.05 * prog(t, 32.88, 34.09); ctx.drawImage(img, x + 180 - (W * s) / 2, y + H / 2 - (H * s) / 2, W * s, H * s); ctx.restore();
    ctx.fillStyle = C.gold; ctx.fillRect(x + 2 + (k ? 0 : 1e4), y, 3, H);
  }
}
async function behindText(t) { // BAYAN TURNIER standing behind the player
  const sc = cam('g3', t, 0.05, 0.07, 0.3);
  await shot('g3', t, { s: sc });
  const u = E.outExpo(prog(t, 26.95, 27.4)), o = E.inExpo(prog(t, 27.8, 28.0));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 760, W, 560); ctx.clip();
  text('BAYAN', W / 2, 1010 + 260 * (1 - u) - 300 * o, { size: 280, ls: 10, shadow: false });
  text('TURNIER', W / 2, 1270 + 260 * (1 - E.outExpo(prog(t, 27.05, 27.5))) - 300 * o, { size: 280, ls: 10, color: C.gold2, shadow: false });
  ctx.restore();
  try { await cutout('g3', t); drawLayer(cut.c, sc, W / 2, H / 2, 1); } catch (e) { }
}

// ================================================================== G · TABLE + CHAMPION 40.05 – 46.09
const TABLE = [['Team Winterpause Spor', 4, 3, 1, 0, '20:7', '+13', 10], ['FC Brüder', 4, 2, 2, 0, '17:13', '+4', 8], ['Team Katernberg', 4, 2, 1, 1, '11:9', '+2', 7], ['FC Übriggeblieben', 4, 1, 0, 3, '12:18', '−6', 3], ['FC Diät', 4, 0, 0, 4, '8:21', '−13', 0]];
async function table4(t) {
  await shot('tb', t, { s: 1.15, filter: 'blur(14px) brightness(0.5) saturate(0.8)' });
  turf(0.4); vignette(0.65);
  flash(0.9 * (1 - prog(t, 40.05, 40.35)));
  const champ = 0;
  // table
  ctx.save(); ctx.translate(0, -120 * champ);
  text(typed('BAYAN TURNIER — GRUPPE A', t, 40.2, 40.6), 72, 500, { f: 'Mono', weight: 600, size: 24, ls: 5, color: C.gold2, align: 'left' });
  ctx.save(); ctx.beginPath(); ctx.rect(0, 510, W, 140); ctx.clip(); text('ABSCHLUSSTABELLE', 70, 630 + 140 * (1 - E.outExpo(prog(t, 40.25, 40.75))), { size: 112, ls: 2, align: 'left', shadow: false }); ctx.restore();
  text(typed('5 TEAMS · 10 SPIELE · 9 MIN · 10/10 GESPIELT', t, 40.5, 41.0), 72, 690, { f: 'Mono', weight: 500, size: 20, ls: 3, align: 'left', alpha: 0.7 });
  const cols = [[W - 470, 'SP'], [W - 415, 'S'], [W - 362, 'U'], [W - 309, 'N'], [W - 222, 'TORE'], [W - 138, '+/−'], [W - 78, 'PKT']], hy = 780, hu = prog(t, 40.6, 40.9);
  text('#', 86, hy, { f: 'Mono', size: 20, color: '#9aa', align: 'left', alpha: hu }); text('TEAM', 136, hy, { f: 'Mono', size: 20, ls: 3, color: '#9aa', align: 'left', alpha: hu });
  cols.forEach(([x, l]) => text(l, x, hy, { f: 'Mono', size: 20, color: '#9aa', align: 'right', alpha: hu }));
  line(72, hy + 22, W - 72, hy + 22, { alpha: 0.3 * hu });
  TABLE.forEach((r, i) => {
    const a = 40.75 + i * 0.1, u = E.outExpo(prog(t, a, a + 0.5)), y = 820 + i * 128;
    ctx.save(); ctx.translate(280 * (1 - u), 0); ctx.globalAlpha *= u;
    if (i === 0) { ctx.fillStyle = C.band; ctx.fillRect(60, y, W - 120, 112); } else { ctx.fillStyle = 'rgba(245,241,232,0.06)'; ctx.fillRect(60, y, W - 120, 112); }
    text(String(i + 1), 88, y + 72, { f: 'Mono', weight: 700, size: 30, align: 'left', shadow: false });
    text(r[0].toUpperCase(), 130, y + 72, { f: 'Oswald', weight: 600, size: 36, ls: 0.5, align: 'left', shadow: false });
    cols.forEach(([x], j) => { let v = r[j + 1]; if (j === 6) v = Math.round(v * E.outCubic(prog(t, a + 0.25, a + 1.0))); text(String(v), x, y + 72, { f: 'Mono', weight: j === 6 ? 800 : 500, size: j === 6 ? 34 : 26, align: 'right', shadow: false }); });
    ctx.restore();
    if (i === 0) shine(60, y, W - 120, 112, prog(t, 42.4, 43.1), 0.9);
  });
  ctx.restore();
  black(prog(t, 43.4, 43.68));
}

// ================================================================== H · PRAYER 52.06 – 58.65
async function prayer5(t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const [id, a, b, o] of [['p1', 52.06, 54.4, {}], ['p2', 53.9, 56.5, { fx: 200, fy: 900, base: 1.3 }], ['p3', 56.0, 58.65, { fx: 560, fy: 1100, base: 1.05 }]]) {
    if (t < a || t >= b) continue;
    const al = id === 'p1' ? Math.min(prog(t, a, a + 0.6), 1 - prog(t, b - 0.5, b)) : id === 'p3' ? prog(t, a, a + 0.5) : Math.min(prog(t, a, a + 0.5), 1 - prog(t, b - 0.5, b));
    await shot(id, t, { s: (o.base ?? 1.03) + 0.04 * prog(t, a, b), fx: o.fx, fy: o.fy, alpha: al });
  }
  vignette(0.6);
  const out = 1 - prog(t, 57.7, 58.3);
  const L = (s, y, a, o) => { const u = E.outCubic(prog(t, a, a + 0.8)); text(s, W / 2, y + 22 * (1 - u), { ...o, alpha: u * out, shadowBlur: 50 }); };
  L('Auf dem Spielfeld getrennt –', 1270, 53.2, { f: 'SerifI', size: 84 });
  L('im Deen eins.', 1420, 54.0, { f: 'Serif', size: 156, color: C.gold2 });
  black(prog(t, 58.4, 58.65));
}

// ================================================================== I · MOMENTS 52.68 – 55.66
async function moments(t) {
  const id = current(['k1', 'k2', 'k3'], t);
  await shot(id, t, { s: cam(id, t, 0.05, id === 'k1' ? 0 : 0.07), fx: id === 'k1' ? 520 : W / 2, fy: id === 'k1' ? 900 : H / 2 });
  vignette(0.5);
  black(1 - prog(t, 43.68, 43.9));
  if (id === 'k1') {
    const a = prog(t, 43.9, 44.3) * (1 - prog(t, 44.6, 44.88));
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; text('GENERATION', W / 2, 1480, { size: 170, ls: 6, alpha: 0.9 * a, shadow: false }); ctx.restore();
    text('DIE NÄCHSTE', W / 2, 1290, { f: 'Mono', weight: 500, size: 26, ls: 14, alpha: 0.75 * a });
  }
}

// ================================================================== J · SHOT AT THE LENS 55.66 – 61.67
const INC = [480, 840], HOLD = [540, 985, 450];
async function lens(t) {
  if (t < 49.1) {
    await shot('l1', t, { s: cam('l1', t, 0.1, 0.06) + 0.08, fx: 420, fy: 1000 });
    vignette(0.55); zoomBlur4(0.12 * E.inExpo(prog(t, 48.85, 49.1)), 420, 900);
    return;
  }
  const u = t - 49.1;
  const ir = 0;
  const z = u < 0.4 ? 1 + 1.1 * E.inCubic(u / 0.4) : 2.1 - 1.08 * E.outExpo(clamp((u - 0.4) / 0.5));
  const amp = u < 0.4 ? 26 * E.inCubic(u / 0.4) : 32 * (1 - clamp((u - 0.4) / 0.35));
  const sh = shake(t, amp, 4);
  const fit = lerp(1, 330 / (HOLD[2] * 1.15), ir), cx = lerp(HOLD[0], W / 2, ir), cy = lerp(HOLD[1], 960, ir), R = lerp(1500, 330, ir);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
  if (u < 0.6) await shot('l2', t, { s: z, fx: INC[0], fy: INC[1], dx: sh[0], dy: sh[1] });
  else await shot('l2', t, { s: z * fit, fx: HOLD[0], fy: HOLD[1], dx: sh[0] + cx - HOLD[0], dy: sh[1] + cy - HOLD[1] });
  ctx.restore();
  if (u < 0.4) zoomBlur4(0.1 * E.inCubic(u / 0.4), INC[0], INC[1]);
  vignette(0.55);
  if (u >= 0.4 && u < 0.7) { flash(0.85 * (1 - prog(u, 0.4, 0.55))); rgbSplit(18 * (1 - prog(u, 0.4, 0.7))); }
  const g = E.outExpo(prog(t, 50.75, 51.05)), go = 1 - prog(t, 51.7, 51.95);
  if (g > 0) {
    // v7: no caption here — the voice takes over ("Die Erdkugel.")
  }
  black(prog(t, 51.85, 52.06));
  if (ir > 0) { ctx.save(); ctx.strokeStyle = C.gold; ctx.globalAlpha = ir; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.restore(); }
}

// ================================================================== K · WINNERS 58.65 – 69.3 (last scene)
// one player per beat-pair, full screen, whip-panned left to right across the team photo, then the whole team
const GUYS = [[265, 105], [535, 175], [745, 180], [935, 210], [1150, 190], [1360, 230]];
const PW = 1561, PH = 967, HC = 760, WC = HC * 9 / 16, T0 = 58.65, STEP = 1.2, WHIP = 0.22;
function camAt(k) { const [x, hy] = GUYS[k]; return [clamp(x, WC / 2, PW - WC / 2), hy - 175 + HC / 2, HC]; }
const FULL = [PW / 2, PH / 2, PW * 16 / 9];
function winnerCam(t) {
  const end = T0 + 6 * STEP, zo = E.inOutCubic(prog(t, end, end + 0.75));
  if (t >= end) { const a = camAt(5); return [lerp(a[0], FULL[0], zo), lerp(a[1], FULL[1], zo), lerp(a[2], FULL[2], zo), 0]; }
  const k = Math.max(0, Math.floor((t - T0) / STEP)), local = t - T0 - k * STEP;
  const a = camAt(k), push = 1 - 0.05 * clamp(local / STEP);
  if (k < 5 && local > STEP - WHIP) {
    const u = E.inOutCubic((local - (STEP - WHIP)) / WHIP), b = camAt(k + 1);
    const vel = Math.sin(u * Math.PI);
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2] * push, b[2], u), vel];
  }
  return [a[0], a[1], a[2] * push, 0];
}
async function winners(t) {
  const im = ASSET.winner3 ?? ASSET.winner, sc3 = im && im.width > 2000 ? 3 : 1;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  if (ASSET.winner) { const s = Math.max(W / PW, H / PH) * 1.2; ctx.save(); ctx.filter = 'blur(28px) brightness(0.3) saturate(0.7)'; ctx.drawImage(ASSET.winner, W / 2 - PW * s / 2, H / 2 - PH * s / 2, PW * s, PH * s); ctx.restore(); }
  const [cx, cy, hc, vel] = winnerCam(t), s = H / hc;
  if (im) { ctx.save(); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, 0, 0, im.width, im.height, W / 2 - cx * s, H / 2 - cy * s, PW * s, PH * s); ctx.restore(); }
  if (vel > 0.02) dirBlur(-vel * 260);
  vignette(0.45);
  black(1 - prog(t, T0, T0 + 0.25));
  const end = T0 + 6 * STEP, fin = E.outCubic(prog(t, end + 0.5, end + 1.1));
  // during the pan: one quiet line at the top
  const pa = 0; // v9: the team line only appears on the full photo
  if (pa > 0) {
    const g = ctx.createLinearGradient(0, 200, 0, 520); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = g; ctx.fillRect(0, 200, W, 320); ctx.restore();
    text('SIEGER', W / 2, 300, { f: 'Oswald', weight: 500, size: 26, ls: 10, color: C.gold2, alpha: pa });
    text('TEAM WINTERPAUSE SPOR', W / 2, 370, { size: 54, ls: 3, alpha: pa });
  }
  // the whole team: title above, numbers below
  if (fin > 0) {
    const ph = PH * s, py = H / 2 - cy * s;
    logo(W / 2, 330, 420, E.inOutCubic(prog(t, end + 0.6, end + 1.5)), fin);
    text('SIEGER · BAYAN TURNIER 2026', W / 2, 460, { f: 'Oswald', weight: 500, size: 28, ls: 8, color: C.gold2, alpha: fin });
    text('TEAM WINTERPAUSE SPOR', W / 2, 560, { size: 84, ls: 3, alpha: fin });
    ctx.save(); ctx.globalAlpha = fin; ctx.fillStyle = C.gold; ctx.fillRect(0, py - 4, W, 4); ctx.fillRect(0, py + ph, W, 4); ctx.restore();
    const st = [['PUNKTE', '10'], ['BILANZ', '3–1–0'], ['TORE', '20:7']];
    st.forEach(([k, v], i) => { const a = prog(t, end + 0.9 + i * 0.1, end + 1.3 + i * 0.1), x = W / 2 + (i - 1) * 300; text(v, x, 1400, { f: 'Oswald', weight: 600, size: 64, alpha: a }); text(k, x, 1440, { f: 'Oswald', weight: 400, size: 22, ls: 6, color: C.gold2, alpha: a }); });
    const bu = E.outCubic(prog(t, end + 1.3, end + 1.8));
    if (bu > 0) { ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - 440 * bu, 1474, 880 * bu, 80); ctx.clip(); ctx.fillStyle = C.band; ctx.fillRect(W / 2 - 440, 1474, 880, 80); text('LAOLA SPORTCENTER · 03.10.2026', W / 2, 1528, { f: 'Oswald', weight: 500, size: 42, ls: 2, shadow: false }); ctx.restore(); }
  }
  black(E.inOutCubic(prog(t, 68.4, 69.3)));
}

// ------------------------------------------------------------------ entry
window.__log = [];
async function draw4(t, f) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  FRAME_LOG.done = false; FRAME_LOG.v = null;
  if (t < 4.67) await intro(t);
  else if (t < 15.49) await outside(t);
  else if (t < 19.64) await speech4(t);
  else if (t < 21.45) await shoe(t);
  else if (t < 24.45) await ballUp(t);
  else if (t < 40.05) await match(t);
  else if (t < 43.68) await table4(t);
  else if (t < 47.27) await moments(t);
  else if (t < 52.06) await lens(t);
  else if (t < 58.65) await prayer5(t);
  else await winners(t);
  if (t >= 4.67 && t < 4.82) flash(1 - prog(t, 4.67, 4.82));
  grain(f, 0.08);
  window.__log[f] = FRAME_LOG.v;
}
const _setup = window.setup;
window.setup = async () => {
  const n = await _setup();
  try { const r = await fetch('../assets/logo.png'); if (r.ok) ASSET.logo = await createImageBitmap(await r.blob()); } catch (e) { }
  try { const r = await fetch('../assets/winner.jpg'); if (r.ok) ASSET.winner = await createImageBitmap(await r.blob()); } catch (e) { }
  try { const r = await fetch('../assets/winner3x.jpg'); if (r.ok) ASSET.winner3 = await createImageBitmap(await r.blob()); } catch (e) { }
  return n;
};
window.renderFrame = async (f, q = 0.94) => { await draw4(f / FPS, f); trimCache(); return cv.toDataURL('image/jpeg', q); };

// ---- de-slop (ui-ux-pro-max: 1–2 animated elements per view, no decorative loops, one consistent type system)
function rays() { }
function motes() { }
function flare() { }
function leak() { }
function rgbSplit() { }
function typed(str, t, a, b) { return t >= a ? str : ''; }
const _setFont6 = setFont;
setFont = function (o) {
  if (o.f === 'Mono') o = { ...o, f: 'Oswald', weight: 500, ls: Math.max(2, (o.ls ?? 0) * 0.8) };
  else if (o.f === 'Serif' || o.f === 'SerifI') o = { ...o, f: 'Oswald', weight: 300, size: o.size * 0.82, ls: 1 };
  else if (o.f === 'Archivo') o = { ...o, f: 'Oswald', weight: 600, stretch: 'normal' };
  return _setFont6(o);
};
