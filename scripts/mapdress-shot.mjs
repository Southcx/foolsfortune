// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS, SHOT: its harness (scripts/mapdress-harness.html, the dress at ../src/ui/mapdress/index.js fed fake data) shot
// headless at the desk (1280 x 800) and a phone either way up (390 x 844, 844 x 390), the island level and the Gnomon flats' page at
// each, laid on one contact sheet. One look, never a tune-and-rerun loop (CLAUDE.md, Subagents).
//   node scripts/mapdress-shot.mjs [out.jpg]      (default docs/plans/art/map-dressed.jpg; PORT=6800..6849, its own dev server)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ENTRY = '../src/ui/mapdress/index.js'; // (what the harness shows: the check's import graph reads this line)
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
if (!fs.existsSync(path.resolve(ROOT, 'scripts', ENTRY))) throw new Error(`no ${ENTRY}`);
const out = path.resolve(ROOT, process.argv[2] || 'docs/plans/art/map-dressed.jpg');
const port = +(process.env.PORT || 6812);
const SIZES = [['desk 1280 x 800', 1280, 800, 1], ['phone upright 390 x 844', 390, 844, 2], ['phone on its side 844 x 390', 844, 390, 2]];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mapdress-'));
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
const shots = [], errs = [];
try {
  for (const [label, w, h, dpr] of SIZES) for (const view of ['island', 'area']) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    page.on('pageerror', (e) => errs.push(`${label} ${view}: ${e.message}`));
    await page.goto(`http://127.0.0.1:${port}/scripts/mapdress-harness.html?view=${view}`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
    await page.waitForTimeout(400);
    const f = path.join(tmp, `${view}-${w}x${h}.png`);
    await page.screenshot({ path: f });
    shots.push({ label: `${view === 'island' ? 'THE ISLAND' : 'AN AREA: THE GNOMON FLATS'} · ${label}`, f, w, h });
    await page.close();
  }
  // the contact sheet: the desk's two side by side, then the phones'
  const k = 0.7, img = (s) => `<figure><img src="data:image/png;base64,${fs.readFileSync(s.f).toString('base64')}" style="width:${Math.round(s.w * k)}px;height:${Math.round(s.h * k)}px"><figcaption>${s.label}</figcaption></figure>`;
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#1c0d08;color:#efe6d2;font:14px Georgia,serif;width:max-content}
h1{font:700 26px Georgia,serif;letter-spacing:.16em;margin:0 0 4px}p{margin:0 0 18px;opacity:.75}.row{display:flex;gap:18px;align-items:flex-start;margin-bottom:18px}
figure{margin:0}img{display:block;box-shadow:0 0 0 1px #5c3020}figcaption{margin-top:6px;letter-spacing:.08em;opacity:.8}</style>
<h1>THE MAP, DRESSED</h1><p>src/ui/mapdress/ fed fake data (scripts/mapdress-fake.js): the island level (B1) and the Gnomon flats' page (B2's hand, panel C). Every count illustrative; words are placeholders.</p>
<div class="row">${img(shots[0])}${img(shots[1])}</div><div class="row">${img(shots[2])}${img(shots[3])}<div>${img(shots[4])}<div style="height:18px"></div>${img(shots[5])}</div></div>`;
  const sheet = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await sheet.setContent(html);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sheet.screenshot({ path: out, type: 'jpeg', quality: 86, fullPage: true });
  for (const s of shots) fs.copyFileSync(s.f, path.join(process.env.SHOTS_DIR || tmp, path.basename(s.f)));
  console.log(`contact sheet: ${path.relative(ROOT, out)}  (shots: ${process.env.SHOTS_DIR || tmp})`);
} finally {
  await browser.close(); await server.close();
}
if (errs.length) { console.error(errs.join('\n')); process.exitCode = 1; }
