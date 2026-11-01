// The contact sheet's key-pose mode (scripts/posesheet.mjs --keys; docs/plans/KEY-POSES.md 7): each move of a key table shot in the Anim
// Lab (workbench/animstage.js: the game's own animation stack, the tool in the hand) on the frame each key has snapped in, front over
// side, captioned with the key's numbers. One source with the game: the table is read through keysOf (courier/anim/keyposes.js).
//
// A move the Anim Lab has no play for (the fighter's: the Arena's kit drives those) is shown as stills: each key's own pose
// (KeyTrack.keyPose) laid on the lab's Courier with nothing in the hands. A table the game has not registered is read from its file,
// its timing filled by the rule's fillKeys where that module is there (the fighter's: progress/platformfighter.js).
//
//   keySheet(out, ['cutlass:c1,c2,c3', 'fighter:jab1,fsmash', ...])   VW, VH (env: a view's size in px, default 320 x 420)
//
// Prior art: the animator's contact sheet (one column a key), Guilty Gear Xrd's frame-by-frame review, the Anim Lab's snapshot.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The tool as the Anim Lab wears it, by its moveset's id (the key table's key). */
const LAB_TOOL = { cutlass: 'sondelass:cutlass', kick: 'none', fighter: 'none' };
/** Where a table's timing is filled when the game has not registered it: the module and its export. */
const FILL = { fighter: ['/src/progress/platformfighter.js', 'fillKeys'] };

export async function keySheet(out, want) {
  const VW = +(process.env.VW || 320), VH = +(process.env.VH || 420);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'));
  const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 5231, strictPort: false, hmr: false, watch: null } });
  await server.listen();
  const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'commit' });
  for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const rows = [];
  for (const w of want) {
    const [tool, list] = w.split(':');
    const got = await page.evaluate(async ({ tool, moves, labTool, fill }) => {
      document.getElementById('overlay')?.style.setProperty('display', 'none');
      const g = __game.game; await g.workbench.ready?.(); const wb = g.workbench;
      await g.clipPack?.social; wb.toggle(true); wb.show('models'); wb.root.style.display = 'none';
      if (!wb.model?.userData?.lab) await wb.loadModel('anim:lab');
      const lab = wb.model.userData.lab; await lab.ready;
      document.querySelectorAll('body > div').forEach((d) => { if (d.textContent.includes('recording') || d.className.includes('animlab')) d.style.display = 'none'; });
      if (lab.state.tool !== labTool) lab.setTool(labTool);
      clearTimeout(lab.pending);
      const { keysOf, KeyTrack } = await import('/src/courier/anim/keyposes.js');
      let table = null, filler = null; // (a table the game has not registered: read from its file, filled by the rule's own where it is there)
      try { table = (await import(`/src/courier/anim/keys/${tool}.js`)).KEYS; } catch { /* (none) */ }
      if (fill) try { filler = (await import(fill[0]))[fill[1]]; } catch { /* (the rule's module not on this branch: the table's own numbers) */ }
      const keysFor = (id) => keysOf(tool, id) || (table?.[id] ? (filler ? filler(id, table[id]) : table[id]) : null);
      const KT = new KeyTrack(g.character.clips), still = g.character.clips.pose();
      const M = lab.R.moveset, cv = g.renderer.domElement, W = cv.width, H = cv.height, res = [];
      for (const id of moves) {
        const keys = keysFor(id), slot = M?.string?.indexOf(id) ?? -1;
        const play = M && lab.plays.find((p) => p.id === (slot >= 0 ? `move:string.${slot + 1}` : `move:other.${id}`));
        if (!keys) { res.push({ id, missing: 'no keys' }); continue; }
        if (!play) { // (stills: each key's own pose on the lab's Courier, framed by the stance's take)
          lab.record(lab.plays.find((p) => p.id === 'stance:idleA')); clearTimeout(lab.pending); lab.state.playing = false; lab.seek(0);
          const ch = lab.R.rig, cells = [], at = ch.root.position.clone(), facing = ch.root.quaternion.clone(); // (where the lab pins the body)
          for (const K of keys) {
            const shots = [];
            for (const v of ['front', 'side']) {
              KT.keyPose(K, still); still.p[0] = 0; still.p[2] = 0; ch.resetPose(); ch.applyPose(still); // (the clip's travel left to the capsule, as the kit draws it)
               ch.root.position.copy(at); ch.root.quaternion.copy(facing); ch.root.updateMatrixWorld(true);
              lab.state.view = v; lab.applyShow(); g.post.render(wb.scene, lab.camera(v, W / H, { ui: false }));
              const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(cv, 0, 0); shots.push(c.toDataURL('image/png'));
            }
            cells.push({ pose: K.pose, clip: K.clip, frame: K.frame, hold: K.hold | 0, snap: K.snap | 0, active: !!K.active, plant: K.plant || '', live: false, at: 'still', shots });
          }
          const total = keys.reduce((n, K) => n + (K.hold | 0), 0);
          res.push({ id, cells, total, rate: 1, real: +(total / 60).toFixed(3) }); continue;
        }
        lab.record(play); clearTimeout(lab.pending); lab.state.playing = false;
        const T = lab.take, rate = M.def(id)?.rate || 1, cells = [];
        keys.forEach((K, i) => {
          let k = -1; // (the first frame the key stands fully snapped in: its own still)
          for (let f = 0; f < T.n; f++) { const s = T.info[f]?.key; if (s?.i === i && s.into >= Math.max(0, (K.snap | 0) - 1)) { k = f; break; } }
          if (k < 0) for (let f = 0; f < T.n; f++) if (T.info[f]?.key?.i === i) { k = f; break; }
          const shots = [];
          for (const v of ['front', 'side']) {
            if (k >= 0) { lab.seek(k); lab.state.view = v; lab.applyShow(); g.post.render(wb.scene, lab.camera(v, W / H, { ui: false })); }
            const c = document.createElement('canvas'); c.width = W; c.height = H; if (k >= 0) c.getContext('2d').drawImage(cv, 0, 0);
            shots.push(c.toDataURL('image/png'));
          }
          let live = false; for (let f = 0; f < T.n; f++) if (T.info[f]?.key?.i === i && T.info[f].strike) live = true;
          cells.push({ pose: K.pose, clip: K.clip, frame: K.frame, hold: K.hold | 0, snap: K.snap | 0, active: !!K.active, plant: K.plant || '', live, at: k, shots });
        });
        const total = keys.reduce((n, K) => n + (K.hold | 0), 0);
        res.push({ id, cells, total, rate, real: +(total / 60 / rate).toFixed(3) });
      }
      return res;
    }, { tool, moves: list.split(','), labTool: LAB_TOOL[tool] || tool, fill: FILL[tool] || null });
    for (const r of got) {
      if (r.missing) { console.log(`${tool}:${r.id}: ${r.missing}`); continue; }
      r.cells.forEach((c, j) => c.shots.forEach((u, v) => { const f = path.join(tmp, `${rows.length}-${j}-${v}.png`); fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64')); c.shots[v] = f; }));
      rows.push({ name: `${tool}:${r.id}`, ...r });
    }
  }
  await browser.close(); await server.close();
  if (errs.length) console.log('page errors:', errs.slice(0, 5));
  fs.writeFileSync(path.join(tmp, 'rows.json'), JSON.stringify(rows));
  execFileSync('python3', ['-I', '-c', `
import json,sys
from PIL import Image, ImageDraw
rows=json.load(open(sys.argv[1])); vw,vh=int(sys.argv[3]),int(sys.argv[4]); cap=58; head=20
cols=max(len(r['cells']) for r in rows)+1
sheet=Image.new('RGB',(vw*cols,(head+2*vh+cap)*len(rows)),(20,12,16)); d=ImageDraw.Draw(sheet)
for y,r in enumerate(rows):
  y0=y*(head+2*vh+cap); d.text((4,y0+4),r['name'],fill=(255,215,140))
  for x,c in enumerate(r['cells']):
    for v,f in enumerate(c['shots']):
      im=Image.open(f).convert('RGB').resize((vw,vh)); sheet.paste(im,(x*vw,y0+head+v*vh))
    t=y0+head+2*vh
    if c['live']: d.rectangle((x*vw,t,x*vw+vw-1,t+4),fill=(255,211,106))
    if c['active']: d.rectangle((x*vw,t+5,x*vw+vw-1,t+8),fill=(200,64,46))
    d.text((x*vw+4,t+11),f"{x+1}. {c['pose']}"+("  ACTIVE" if c['active'] else "")+(f"  plant {c['plant']}" if c['plant'] else ""),fill=(243,230,216))
    d.text((x*vw+4,t+25),f"{c['clip']} @ {c['frame']}",fill=(200,190,180))
    d.text((x*vw+4,t+39),f"hold {c['hold']}  snap {c['snap']}  (take f{c['at']})",fill=(200,190,180))
  x=len(r['cells']); d.text((x*vw+8,y0+head+8),f"{r['total']} frames\\nat rate {r['rate']}\\n= {r['real']} real s",fill=(255,215,140))
sheet.save(sys.argv[2])
`, path.join(tmp, 'rows.json'), out, String(VW), String(VH)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${out}: ${rows.length} moves`);
}
