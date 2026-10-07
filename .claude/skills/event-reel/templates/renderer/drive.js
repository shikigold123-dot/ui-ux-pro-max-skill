// Playwright frame driver. Usage (from the project root, with `python3 -m http.server 8765 --bind 127.0.0.1` running there):
//   node render/drive.js <startFrame> <endFrame> <out.mp4>          → encodes frames [a,b) to out.mp4 (+ out.mp4.log.json)
//   FRAMES=30,95,400 node render/drive.js 0 0 <dir> stills          → writes chosen frames as JPEGs for QC / tracking
//   node render/drive.js 0 0 - info                                   → prints "<DURATION> <PRE>"
// env: PORT (8765), NOEARTH=1 (window.NOEARTH, e.g. to track a ball without the overlay), CRF (14)
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const [a, b, out, mode] = [parseInt(process.argv[2]), parseInt(process.argv[3]), process.argv[4], process.argv[5]];
  const browser = await chromium.launch({ args: ['--disable-web-security', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8765}/render/index.html`);
  console.log('shots', await page.evaluate(() => window.setup()));
  if (mode === 'info') { console.log(await page.evaluate(() => `${window.DURATION} ${window.PRE || 0}`)); await browser.close(); return; }
  if (process.env.NOEARTH) await page.evaluate(() => { window.NOEARTH = true; });
  let ff = null;
  if (mode !== 'stills') {
    ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', process.env.CRF || '14', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  } else fs.mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const list = process.env.FRAMES ? process.env.FRAMES.split(',').map(Number) : Array.from({ length: b - a }, (_, i) => a + i);
  let k = 0;
  for (const f of list) {
    const url = await page.evaluate(f => window.renderFrame(f), f);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (ff) { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    else fs.writeFileSync(`${out}/${String(f).padStart(5, '0')}.jpg`, buf);
    if (++k % 60 === 0) console.log(`frame ${f} ${((Date.now() - t0) / k).toFixed(0)} ms/f`);
  }
  fs.writeFileSync(out + '.log.json', JSON.stringify(await page.evaluate(() => window.__log)));
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await browser.close();
  console.log('done', a, b, ((Date.now() - t0) / 1000).toFixed(1) + 's');
})();
