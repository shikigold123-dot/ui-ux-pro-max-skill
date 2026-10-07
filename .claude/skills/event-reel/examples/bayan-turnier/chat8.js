// Cold open: a short chat. "Ey Bruder, wie war das Turnier? …" → "Bruderherz, du hast definitiv was verpasst – aber schau selbst!"
// → a video message; a tap, the camera flies into it, and the film starts. Generic messenger look in the film's palette.
const PRE = 6.0;
const CH = { bg0: '#0c1318', bg1: '#060a0d', inBub: '#1d282f', outBub: '#2f7fc4', text: '#f3f6f8', meta: 'rgba(243,246,248,0.55)' };
const M1 = 'Ey Bruder, wie war das Turnier? Konnte leider nicht dabei sein\u00A0😕';
const M2 = 'Bruderherz, du hast definitiv was verpasst – aber schau selbst!';
const CF = { ff: 'sans', size: 54, weight: 500 };
function wrapLines(s, maxW, o) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (mw(nx, o) > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
  if (cur) lines.push(cur); return lines;
}
function bubble(x, y, w, h, col, side, a, sc) {
  ctx.save(); ctx.globalAlpha = a; const ox = side === 'in' ? x : x + w, oy = y + h;
  ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.translate(-ox, -oy);
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.fill();
  // tail
  ctx.beginPath(); if (side === 'in') { ctx.moveTo(x + 4, y + h - 34); ctx.lineTo(x - 14, y + h); ctx.lineTo(x + 40, y + h - 4); } else { ctx.moveTo(x + w - 4, y + h - 34); ctx.lineTo(x + w + 14, y + h); ctx.lineTo(x + w - 40, y + h - 4); } ctx.fill();
  ctx.restore();
}
function msgText(lines, x, y, a, sc, side, w, h) {
  ctx.save(); ctx.globalAlpha = a; const ox = side === 'in' ? x - 34 : x - 34 + w, oy = y - 34 + h;
  ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.translate(-ox, -oy);
  fnt(CF); ctx.fillStyle = CH.text; ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, x, y + 54 + i * 68)); ctx.restore();
}
function dots(x, y, t, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = CH.inBub; ctx.beginPath(); ctx.roundRect(x, y, 150, 86, 34); ctx.fill();
  for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * 9 - i * 0.9)); ctx.fillStyle = `rgba(243,246,248,${0.35 + 0.5 * b})`; ctx.beginPath(); ctx.arc(x + 42 + i * 33, y + 46 - 9 * b, 9, 0, 7); ctx.fill(); }
  ctx.restore();
}
const pop = (t, a) => { const u = prog(t, a, a + 0.32); return [E.outCubic(prog(t, a, a + 0.12)), u <= 0 ? 0 : E.outBack(u) * 0.12 + 0.88 + 0.12 * (E.outBack(u) - 1)]; };
function chat8(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  // fly into the video bubble at the end
  const L2p = wrapLines(M2, 780, CF), VBy = 470 + (wrapLines(M1, 780, CF).length * 68 + 84) + 56 + (L2p.length * 68 + 84) + 110;
  const VB = { x: W - 60 - 360, y: VBy, w: 360, h: Math.min(530, H - 230 - VBy) };
  const zz = E.inExpo(prog(t, 4.85, 5.85)), zsc = 1 + zz * (H / VB.h * 1.15 - 1), fcx = VB.x + VB.w / 2, fcy = VB.y + VB.h / 2;
  ctx.save(); ctx.translate(lerp(fcx, W / 2, zz), lerp(fcy, H / 2, zz)); ctx.scale(zsc, zsc); ctx.translate(-fcx, -fcy);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, CH.bg0); g.addColorStop(1, CH.bg1); ctx.fillStyle = g; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  // subtle pattern
  ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = '#8fd0ff'; ctx.lineWidth = 2; for (let k = -20; k < 40; k++) { ctx.beginPath(); ctx.moveTo(k * 90, 0); ctx.lineTo(k * 90 + 900, H); ctx.stroke(); } ctx.restore();
  const ui = E.outCubic(prog(t, 0.0, 0.35));
  // header
  ctx.save(); ctx.globalAlpha = ui; ctx.fillStyle = 'rgba(16,24,29,0.96)'; ctx.fillRect(0, 0, W, 230);
  ctx.strokeStyle = '#f3f6f8'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(78, 120); ctx.lineTo(52, 146); ctx.lineTo(78, 172); ctx.stroke();
  ctx.fillStyle = '#3b8fd4'; ctx.beginPath(); ctx.arc(160, 146, 52, 0, 7); ctx.fill();
  fnt({ ff: 'sans', size: 50, weight: 700 }); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('B', 160, 164);
  ctx.textAlign = 'left'; fnt({ ff: 'sans', size: 48, weight: 700 }); ctx.fillText('Bruder', 236, 140);
  fnt({ ff: 'sans', size: 32, weight: 400 }); ctx.fillStyle = t > 0.25 && t < 0.85 ? '#8fd0ff' : CH.meta; ctx.fillText(t > 0.25 && t < 0.85 ? 'schreibt…' : 'online', 236, 186);
  ctx.restore();
  // date chip
  ctx.save(); ctx.globalAlpha = ui * 0.9; fnt({ ff: 'sans', size: 30, weight: 600 }); const dw = mw('SAMSTAG', { ff: 'sans', size: 30, weight: 600 }) + 50;
  ctx.fillStyle = '#18232a'; ctx.beginPath(); ctx.roundRect(W / 2 - dw / 2, 300, dw, 56, 28); ctx.fill(); ctx.fillStyle = CH.meta; ctx.textAlign = 'center'; ctx.fillText('SAMSTAG', W / 2, 339); ctx.restore();
  // message 1 (incoming)
  const L1 = wrapLines(M1, 780, CF), w1 = Math.max(...L1.map(l => mw(l, CF))) + 68, h1 = L1.length * 68 + 84, x1 = 60, y1 = 470;
  if (t > 0.25 && t < 0.9) dots(x1, y1, t, E.outCubic(prog(t, 0.25, 0.4)) * (1 - prog(t, 0.8, 0.9)));
  const [a1, s1] = pop(t, 0.85);
  if (a1 > 0) { bubble(x1, y1, w1, h1, CH.inBub, 'in', a1, s1); msgText(L1, x1 + 34, y1 + 10, a1, s1, 'in', w1, h1); ctx.save(); ctx.globalAlpha = a1 * 0.8; fnt({ ff: 'sans', size: 26, weight: 400 }); ctx.fillStyle = CH.meta; ctx.textAlign = 'right'; ctx.fillText('21:47', x1 + w1 - 24, y1 + h1 - 16); ctx.restore(); }
  // input bar: the reply is typed, then sent
  const typeA = 1.65, typeB = 2.85, sent = 2.95;
  const n = Math.round(M2.length * clamp((t - typeA) / (typeB - typeA)));
  ctx.save(); ctx.globalAlpha = ui; ctx.fillStyle = 'rgba(16,24,29,0.96)'; ctx.fillRect(0, H - 190, W, 190);
  ctx.fillStyle = '#1d282f'; ctx.beginPath(); ctx.roundRect(40, H - 160, W - 210, 112, 56); ctx.fill();
  ctx.fillStyle = '#3b8fd4'; ctx.beginPath(); ctx.arc(W - 96, H - 104, 56, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(W - 118, H - 128); ctx.lineTo(W - 70, H - 104); ctx.lineTo(W - 118, H - 80); ctx.lineTo(W - 108, H - 104); ctx.closePath(); ctx.fill();
  fnt({ ...CF, size: 42 }); ctx.textAlign = 'left';
  if (t < sent && n > 0) {
    const s = M2.slice(0, n), vis = s.length > 34 ? '…' + s.slice(-33) : s; ctx.fillStyle = CH.text; ctx.fillText(vis, 84, H - 90);
    if (Math.floor(t * 4) % 2 === 0) { const cw = mw(vis, { ...CF, size: 42 }); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(88 + cw, H - 126, 4, 48); }
  } else { ctx.fillStyle = CH.meta; ctx.fillText('Nachricht', 84, H - 90); }
  ctx.restore();
  // message 2 (outgoing)
  const L2 = wrapLines(M2, 780, CF), w2 = Math.max(...L2.map(l => mw(l, CF))) + 68, h2 = L2.length * 68 + 84, x2 = W - 60 - w2, y2 = y1 + h1 + 56;
  const [a2, s2] = pop(t, sent);
  if (a2 > 0) { const rise = 120 * (1 - E.outExpo(prog(t, sent, sent + 0.35))); ctx.save(); ctx.translate(0, rise); bubble(x2, y2, w2, h2, CH.outBub, 'out', a2, s2); msgText(L2, x2 + 34, y2 + 10, a2, s2, 'out', w2, h2); ctx.globalAlpha = a2 * 0.85; fnt({ ff: 'sans', size: 26, weight: 400 }); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'right'; ctx.fillText('21:48 ✓✓', x2 + w2 - 24, y2 + h2 - 16); ctx.restore(); }
  // message 3: the video
  const [a3, s3] = pop(t, 3.9);
  if (a3 > 0) {
    ctx.save(); ctx.globalAlpha = a3; const ox = VB.x + VB.w, oy = VB.y + VB.h; ctx.translate(ox, oy); ctx.scale(s3, s3); ctx.translate(-ox, -oy);
    ctx.fillStyle = CH.outBub; ctx.beginPath(); ctx.roundRect(VB.x - 10, VB.y - 10, VB.w + 20, VB.h + 20, 38); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(VB.x, VB.y, VB.w, VB.h, 30); ctx.clip();
    if (ASSET.winner) { const im = ASSET.winner, sc = VB.h / im.height, iw = im.width * sc; ctx.drawImage(im, VB.x + VB.w / 2 - iw * 0.47, VB.y, iw, VB.h); }
    const gg = ctx.createLinearGradient(0, VB.y, 0, VB.y + VB.h); gg.addColorStop(0, 'rgba(0,0,0,0.45)'); gg.addColorStop(0.45, 'rgba(0,0,0,0.05)'); gg.addColorStop(1, 'rgba(0,0,0,0.65)'); ctx.fillStyle = gg; ctx.fillRect(VB.x, VB.y, VB.w, VB.h);
    fnt({ ff: 'cond', size: 50, ls: 2 }); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('BAYAN TURNIER', VB.x + VB.w / 2, VB.y + 80);
    fnt({ ff: 'mono', size: 20, weight: 500, ls: 4 }); ctx.fillStyle = '#8fd0ff'; ctx.fillText('03.10.2026', VB.x + VB.w / 2, VB.y + 114);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(VB.x + VB.w / 2, VB.y + VB.h / 2, 64, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(VB.x + VB.w / 2 - 20, VB.y + VB.h / 2 - 32); ctx.lineTo(VB.x + VB.w / 2 + 34, VB.y + VB.h / 2); ctx.lineTo(VB.x + VB.w / 2 - 20, VB.y + VB.h / 2 + 32); ctx.closePath(); ctx.fill();
    fnt({ ff: 'sans', size: 28, weight: 600 }); ctx.textAlign = 'left'; ctx.fillText('▶ 1:39', VB.x + 26, VB.y + VB.h - 30);
    // tap ripple
    const tp = prog(t, 4.7, 5.15); if (tp > 0 && tp < 1) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - tp)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(VB.x + VB.w / 2, VB.y + VB.h / 2, 64 + 160 * E.outCubic(tp), 0, 7); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }
  ctx.restore();
  // into the film: brief white bloom, then black (the intro takes over from its own dark start)
  black(E.inOutCubic(prog(t, 5.35, 5.95)));   // fade out to black (no white flash)
  grain(Math.floor(t * 30), 0.05);
}
window.renderFrame = async (f, q = 0.94) => {
  const t = f / FPS;
  if (t < PRE) { chat8(t); window.__log[f] = null; }
  else { await draw8(t - PRE, f); black(1 - E.inOutCubic(prog(t - PRE, 0, 0.55))); }   // …and fade in from black
  trimCache(); return cv.toDataURL('image/jpeg', q);
};
