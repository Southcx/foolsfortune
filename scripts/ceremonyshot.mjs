// The score ceremony shown alone: a Querent-shaped top-tier step list played on a bare page (src/ui/scoreceremonydemo.js), a frame at
// each of 0, 0.4, 1.2 and 2.0 real seconds after the play. One run, one look.   node scripts/ceremonyshot.mjs [port] [outDir]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || 5650), out = process.argv[3] || path.join(ROOT, 'ceremony-frames');
const harness = path.join(ROOT, '_ceremony-harness.html');
const DEMO = '../src/ui/scoreceremonydemo.js'; // (the page it plays)
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(harness, `<!doctype html><meta charset=utf-8><body style="margin:0;height:100vh;background:radial-gradient(#2a1d3d,#0b0712)">
<script type=module>
import { mountDemo } from '/${path.relative(ROOT, path.resolve(path.dirname(fileURLToPath(import.meta.url)), DEMO))}';
window.d = mountDemo(document.body, {}); window.ready = true;
</script>`);
const server = await createServer({ root: ROOT, server: { port, strictPort: true }, logLevel: 'error' });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', (e) => console.log('pageerror', e.message));
  await pg.goto(`http://localhost:${port}/_ceremony-harness.html`);
  await pg.waitForFunction(() => window.ready);
  await pg.evaluate(() => {
    window.t0 = performance.now(); window.p = window.d.play('top');
    window.d.reels[0].spin(3); window.d.reels[1].spin(1, { stagger: 0.15 }); window.d.reels[2].spin(4, { stagger: 0.3 });
  });
  for (const t of [0, 0.4, 1.2, 2.0]) {
    const wait = t * 1000 - (await pg.evaluate(() => performance.now() - window.t0));
    if (wait > 0) await pg.waitForTimeout(wait);
    await pg.screenshot({ path: path.join(out, `C-ceremony-${t.toFixed(1)}s.png`) });
    console.log('frame', t, 'at', Math.round(await pg.evaluate(() => performance.now() - window.t0)), 'ms');
  }
} finally {
  await browser?.close(); await server.close(); fs.rmSync(harness, { force: true });
}
