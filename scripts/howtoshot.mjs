// ---------------------------------------------------------------------------------------
// THE HOW-TO SHOT, headless (src/ui/howto.js; Calissa's casino brief, section 4): a stand-in page of three pieces on a dark table, a
// spotlight on one of them with its line, its pips and SKIP. It bundles the overlay with esbuild, loads it in Chromium and takes one
// PNG. The stand-in is the demo entry point the brief asks for, so the overlay can be shown alone. `node scripts/howtoshot.mjs [out.png]`
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { HowTo } from '../src/ui/howto.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || '/tmp/claude-0/-home-user-foolsfortune/60222257-7177-5bc0-9f7e-a90ec12db629/scratchpad/casino/F-howto.png';
const WORK = path.dirname(OUT);
fs.mkdirSync(WORK, { recursive: true });

// The demo entry: three pieces on a dark cloth, a lesson of three steps, the first one on screen with no wait.
const DEMO = `
import { HowTo } from ${JSON.stringify(path.join(ROOT, 'src/ui/howto.js'))};
const howTo = new HowTo({ root: document.body });
const piece = (id) => document.getElementById(id).getBoundingClientRect();
howTo.play([
  { target: () => piece('tile-a'), line: 'These tiles are yours. Shut them all to win.' },
  { target: () => piece('tile-b'), line: 'Pick a set that adds up to the die.', wait: () => window.__picked === true },
  { target: null, line: 'Every point is shown on the plate, and the win is announced.' },
], { onDone: () => { window.__done = true; }, onSkip: () => { window.__skipped = true; } });
window.__howTo = howTo;
`;
const entry = path.join(WORK, 'howto-demo-entry.js');
fs.writeFileSync(entry, DEMO);
const bundle = path.join(WORK, 'howto-demo.js');
await build({ entryPoints: [entry], bundle: true, format: 'iife', outfile: bundle, absWorkingDir: ROOT, logLevel: 'error' });

const html = path.join(WORK, 'howto-demo.html');
fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;height:100%;background:#0d0a14;overflow:hidden}
.piece{position:absolute;width:150px;height:96px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  font:700 18px system-ui,sans-serif;color:#17111f;background:#d9cfe8}
#tile-a{left:calc(50% - 300px);top:38%;background:#f0e442}
#tile-b{left:calc(50% - 75px);top:38%;background:#0072b2;color:#f4ecd8}
#tile-c{left:calc(50% + 150px);top:38%;background:#cc79a7}
.felt{position:absolute;left:8%;right:8%;top:24%;height:40%;border-radius:18px;background:#1c1428;box-shadow:inset 0 0 0 2px #2e2440}
</style></head><body>
<div class="felt"></div>
<div id="tile-a" class="piece">3</div>
<div id="tile-b" class="piece">5</div>
<div id="tile-c" class="piece">7</div>
<script src="howto-demo.js"></script>
</body></html>`);

console.log('overlay class', HowTo.name);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + html);
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT });
  console.log(`shot ${OUT}`);
  console.log(errors.length ? `errors: ${errors.join(' | ')}` : 'no page errors');
} finally {
  await browser.close();
}
