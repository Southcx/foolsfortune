// A contact sheet of the Courier's poses: each clip of the game's pack sampled at a few times, from the front and the side, on the
// workbench's stage with nothing else on the Courier (CLAUDE.md, Animation: "judge a tool's poses with every other tool off the
// Courier, from the front and the side"). For judging a clip before it goes into the tree, and clipping after.
//
//   node scripts/posesheet.mjs <out.png> <clip>[@t1,t2,...] ...   (times in clip seconds; default: 5 samples across the clip)
//   SIDE=only|both (default both)  ANGLE=deg (the side view's angle, default 90)
//
// Prior art: the animator's contact sheet and the turnaround sheet (one row a clip, front and side by each frame).
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [out, ...want] = process.argv.slice(2);
if (!out || !want.length) { console.error('usage: node scripts/posesheet.mjs out.png Clip[@t,t] ...'); process.exit(1); }
const ANGLE = +(process.env.ANGLE || 90), VIEWS = process.env.SIDE === 'only' ? ['side'] : ['front', 'side'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'poses-'));
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 5230, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 300, height: 400 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
await page.goto(server.resolvedUrls.local[0], { waitUntil: 'commit' });
for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
const rows = await page.evaluate(async (want) => {
  document.getElementById('overlay')?.style.setProperty('display', 'none');
  const g = __game.game, wb = g.workbench;
  await g.clipPack?.social; wb.toggle(true); wb.show('models');
  await wb.loadModel('glb:../assets/courier.glb'); wb.figure.visible = false; wb.root.style.display = 'none';
  const C = g.character.clips;
  return want.map((w) => { const [name, ts] = w.split('@'); const c = C.clips[name]; if (!c) return { name, missing: true };
    const times = ts ? ts.split(',').map(Number) : [0, 0.25, 0.5, 0.75, 1].map((k) => +(k * c.dur).toFixed(2)); return { name, times, dur: c.dur }; });
}, want);
const shots = [];
for (const r of rows) {
  if (r.missing) { console.log(`no clip ${r.name}`); continue; }
  for (const t of r.times) for (const v of VIEWS) {
    await page.evaluate(({ name, t, v, A }) => {
      const wb = __game.game.workbench, cam = wb.camera, a = v === 'side' ? (A * Math.PI) / 180 : 0;
      wb.packClip = name; wb.packT = t; wb.controls.enabled = false;
      cam.aspect = innerWidth / innerHeight; cam.fov = 40; cam.updateProjectionMatrix();
      cam.position.set(Math.sin(a) * 3.4, 1.1, Math.cos(a) * 3.4); wb.controls.target.set(0, 0.9, 0); cam.lookAt(0, 0.9, 0); wb.controls.update();
      wb.frame(0);
    }, { name: r.name, t, v, A: ANGLE });
    const f = path.join(tmp, `${shots.length}.png`); await page.screenshot({ path: f }); shots.push({ f, label: `${r.name} ${t}s ${v}`, row: r.name });
  }
}
await browser.close(); await server.close();
if (errs.length) console.log('page errors:', errs.slice(0, 5));
fs.writeFileSync(path.join(tmp, 'list.json'), JSON.stringify(shots));
execFileSync('python3', ['-I', '-c', `
import json,sys
from PIL import Image, ImageDraw
shots=json.load(open(sys.argv[1])); rows=[]
for s in shots:
  if not rows or rows[-1][0]!=s['row']: rows.append((s['row'],[]))
  rows[-1][1].append(s)
W,H=300,400; cols=max(len(r[1]) for r in rows)
sheet=Image.new('RGB',(W*cols,(H+18)*len(rows)),(20,12,16)); d=ImageDraw.Draw(sheet)
for y,(name,ss) in enumerate(rows):
  for x,s in enumerate(ss):
    sheet.paste(Image.open(s['f']).convert('RGB'),(x*W,y*(H+18)+18)); d.text((x*W+4,y*(H+18)+3),s['label'],fill=(240,220,200))
sheet.save(sys.argv[2])
`, path.join(tmp, 'list.json'), out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${out}: ${shots.length} views`);
