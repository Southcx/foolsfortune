// ---------------------------------------------------------------------------------------
// THE MARKS ON THE CLOTH, ONE LOOK (vfx/tablemarks.js; Calissa's casino clarity pass, task E): a seated table view drawn headless over a
// fixed fake state (four seats, the acting one ringed, a hand of cards with legal / chosen / dim, dice and chips), the scene at 480
// lines upscaled bilinearly as present.js does it, and the programs counted before and after the marks join. Dev server up (URL=...).
//
//   URL=http://127.0.0.1:5673/ OUT=/path/E-marks.png node scripts/tablemarkslook.mjs
//
// Prior art: scripts/seachartlooktest.mjs (a blank page of the dev server's origin so /src/ modules import).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';

const base = process.env.URL || 'http://127.0.0.1:5673/', out = process.env.OUT || 'E-marks.png', exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SRC = '../src/vfx/tablemarks.js'; // (the module under the look)
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errors = [];
page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**/__tablemarkslook.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"></body>' }));
await page.goto(`${base}__tablemarkslook.html`);
const res = await page.evaluate(`(async () => {
  const threeUrl = (await (await fetch('/src/vfx/oxidation.js')).text()).match(/from "([^"]*three[^"]*)"/)[1]; // (the dev server's own copy of three, so instanceof holds)
  const THREE = await import(threeUrl), M = await import('${SRC.replace('..', '')}'), P = await import('/src/vfx/bazaarpieces.js');
  const W = 1280, H = 720, LINES = 480, r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(Math.round(LINES * W / H), LINES, false);
  const cv = r.domElement; cv.style.cssText = 'width:' + W + 'px;height:' + H + 'px;image-rendering:auto;display:block'; document.body.appendChild(cv);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0810);
  scene.add(new THREE.HemisphereLight(0xffe6c8, 0x201830, 1.6)); const sun = new THREE.DirectionalLight(0xfff0d8, 1.8); sun.position.set(1, 3, 2); scene.add(sun);
  const R = 1.1, cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 40); cam.position.set(0, 1.5, R * 0.9); cam.lookAt(-0.3, 0, R * 0.2);
  const mats = P.bazaarMaterials(), frame = new THREE.Group(); scene.add(frame);
  const pb = new P.PieceBatch(mats); frame.add(pb.mesh); const one = new THREE.Vector3(1, 1, 1), I = new THREE.Quaternion();
  const mat = (x, y, z, q = I) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, one);
  const lay = (id) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, id === 't1' ? 0.1 : 0, 'YXZ')), spots = {};
  const hand = [[-0.32, 0.34], [-0.1, 0.34], [0.12, 0.34], [0.34, 0.34], [0.56, 0.34]], trick = [[-0.2, -0.1], [0.05, -0.1]], chipAt = [[0.45, -0.1], [0.55, -0.02], [0.5, 0.05]];
  const dice = [[-0.55, -0.05, 6, 4], [-0.45, 0.08, 20, 17]], cardSize = { w: P.PIECE.card.w, d: P.PIECE.card.h };
  hand.forEach(([x, z], k) => { spots['c' + k] = { pos: new THREE.Vector3(x, 0, z), size: cardSize }; });
  trick.forEach(([x, z], k) => { spots['t' + k] = { pos: new THREE.Vector3(x, 0, z), size: cardSize, yaw: 0 }; });
  chipAt.forEach(([x, z], k) => { spots['ch' + k] = { pos: new THREE.Vector3(x, 0, z), size: P.PIECE.chip.r * 2, round: true }; });
  dice.forEach(([x, z], k) => { spots['d' + k] = { pos: new THREE.Vector3(x, 0, z), size: P.PIECE.die * 1.6, round: true }; });
  let marks = null;
  const build = () => {
    pb.clear(); pb.add(P.clothTpl('zodiac', R - 0.17), mat(0, 0, 0), 0, 'cloth');
    const up = (id) => (marks ? marks.lift(id) + marks.sink(id) : 0);
    hand.forEach(([x, z], k) => pb.add(P.cardTpl(5 + k * 7), mat(x, 0.002 + up('c' + k), z, lay('c' + k)), 0, 'c' + k));
    trick.forEach(([x, z], k) => pb.add(P.cardTpl(30 + k), mat(x, 0.002 + up('t' + k), z, lay('t' + k)), 0, 't' + k));
    chipAt.forEach(([x, z], k) => pb.add(P.chipTpl(['1', '5', '25'][k]), mat(x, 0.002, z), 1, 'ch' + k));
    dice.forEach(([x, z, s, v], k) => { const q = new THREE.Quaternion(), h = P.dieRest(s, v, 0.6 * k, q); pb.add(P.dieTpl(s), mat(x, h + 0.002 + up('d' + k), z, q), 1, 'd' + k); });
    pb.write(); scene.updateMatrixWorld();
  };
  build(); r.render(scene, cam); const before = r.info.programs.length;
  marks = new M.TableMarks(frame, { clothY: 0 });
  const seats = [{ seat: 0, colour: 'Red', at: new THREE.Vector3(0.05, 0, 0.62), owns: ['c0', 'c1', 'c2', 'c3', 'c4'] }, { seat: 1, colour: 'Yellow', at: new THREE.Vector3(-0.75, 0, 0.1), owns: ['d0'] },
    { seat: 2, colour: 'Blue', at: new THREE.Vector3(0, 0, -0.62), owns: ['t0'] }, { seat: 3, colour: 'Black', at: new THREE.Vector3(0.75, 0, 0), owns: ['ch0', 'ch1', 'ch2'] }];
  marks.set({ turnSeat: 0, seats, legal: ['c0', 'c1', 'c4', 't0'], chosen: ['c2'], dim: ['c3', 'd1', 't1'] }, (id) => spots[id] || null);
  for (let i = 0; i < 90; i++) marks.update(1 / 30);
  build(); r.render(scene, cam);
  return { before, after: r.info.programs.length, calls: r.info.render.calls, marks: marks.batch.list.length, lift: marks.lift('c2'), sink: marks.sink('c3'), shade: marks.shade('c3'), lines: r.domElement.height };
})()`);
console.log(JSON.stringify(res), errors.length ? 'ERRORS ' + errors.slice(0, 3).join(' | ') : 'no errors');
await page.screenshot({ path: out });
await browser.close();
