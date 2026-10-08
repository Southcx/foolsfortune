// ---------------------------------------------------------------------------------------
// THE GARDEN SWEEP: the Spirit Garden (world/garden/) entered, worked and left headless, with a screenshot at every step and a check
// for each thing the owner has seen go wrong there (the black screen on entry, the Pneuka Jar unseen, the interact chevron not
// pointing at the planetoid's heart, the calibration numbers under the garden's pages) and the stress the owner asked for (in and out
// twenty times, in mid-fight and with a tool out, menus mid-throw, a resize, hops off every planetoid, the hand spammed on the Jar).
// Prints one line a check (PASS / FAIL with what was measured) and exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/garden.mjs [--out dir] [--seed 1] [--quick]   (screenshots to <out>/shots, default <tmp>/garden-sweep)
//
// Prior art: scripts/stress.mjs and scripts/playtest/game.mjs (the page opened the same way, manual mode, the clock pinned: the
// casebook's rule 3), Playwright's screenshot assertions.
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => { if (x.startsWith('--')) a.push([x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return a; }, []));
const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'garden-sweep')), SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const url = process.env.URL || 'http://127.0.0.1:5173/', seed = +args.seed || 1, quick = !!args.quick;
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 960, H = 600;

const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [], warnings = [];
let phase = 'boot', page;
async function openPage() {
page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => errors.push(`[${phase}] ${e.message}`));
page.on('console', (m) => {
  const t = m.text().slice(0, 300);
  if (m.type() === 'error' && !/Failed to load resource/.test(t)) errors.push(`[${phase}] ${t}`);
  else if (m.type() === 'warning' && !/authored (ladderUp|poleSlide)|KHR_parallel_shader_compile/.test(t)) warnings.push(`[${phase}] ${t}`);
});
await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
const clock = process.env.CLOCK === 'now' ? '' : `&clock=${process.env.CLOCK || 1791160275000}`; // (a game noon: rule 3)
await page.goto(`${url}?seed=${seed}${clock}`, { waitUntil: 'commit' });
for (let i = 0; i < 150; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
await page.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true;`);
await page.addScriptTag({ content: PAGE_JS });
}
// ---- the page's side: stepping, drawing and measuring
const PAGE_JS = `
window.__sw = (() => {
  const G = __game, g = G.game, THREE = G.THREE, R = g.realm;
  const v = (p) => p ? [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)] : null;
  const S = {
    tick(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) G.tick(dt); },
    draw() { G.draw(); },
    /** n ticks, drawn at the end (what a screenshot sees). */
    run(n, dt = 1 / 60) { S.tick(n, dt); S.draw(); },
    // ---- what is on screen, beyond the canvas: the covers and windows a person would see
    dom() {
      const seam = document.getElementById('seam'), im = document.getElementById('indexmenu'), ov = document.getElementById('overlay'), pk = g.pneukaUI?.root;
      const topAt = (x, y) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className || e.tagName) : null; };
      return {
        seam: seam ? +getComputedStyle(seam).opacity : null, seamPhase: g.seam?.job?.phase || null,
        index: !!g.indexMenu?.open, page: g.indexMenu?.page?.name || null, overlay: ov ? ov.style.display !== 'none' : null,
        pneuka: !!g.pneukaUI?.open, codex: !!g.codex?.open, map: !!g.cartography?.open,
        calibration: [...(im?.querySelectorAll('.grp') || [])].map((e) => e.textContent).filter((t) => /CALIBRATION/.test(t)),
        top: topAt(innerWidth / 2, innerHeight / 2), cursor: getComputedStyle(G.renderer.domElement).cursor,
        hudCross: g.hud?.el?.cross?.style.display ?? null, compass: document.getElementById('compass')?.style.visibility ?? null,
      };
    },
    // ---- the Pneuka Jar, as drawn
    jar() {
      const V = g.god?.jar, grp = V?.group, J = R.jarBody, cam = G.camera; if (!grp) return null;
      grp.updateWorldMatrix(true, true);
      const wp = grp.getWorldPosition(new THREE.Vector3()), ws = grp.getWorldScale(new THREE.Vector3());
      const ndc = wp.clone().project(cam);
      const meshes = []; grp.traverse((o) => { if (o.isMesh) meshes.push(o); });
      const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
      const box = new THREE.Box3().setFromObject(grp);
      return {
        own: grp.visible, zoneOff: !!grp.zoneOff, parked: !!grp.parked, parent: grp.parent?.type + (grp.parent === G.scene ? '(scene)' : ':' + grp.parent?.name),
        pos: v(wp), body: J ? v(J.pos) : null, scale: v(ws), dist: +wp.distanceTo(cam.position).toFixed(2), ndc: v(ndc), inFrustum: frustum.intersectsBox(box), box: v(box.getSize(new THREE.Vector3())),
        layers: grp.layers.mask, camLayers: cam.layers.mask, zone: g.zones.place?.(grp), zonesCurrent: g.zones.current, zonesVisible: [...g.zones.visible],
        meshes: meshes.length, meshesShown: meshes.filter(shown).length,
        mats: meshes.slice(0, 6).map((m) => { const M = Array.isArray(m.material) ? m.material[0] : m.material; return { n: m.name, vis: m.visible, op: M?.opacity, tr: M?.transparent, side: M?.side, cull: m.frustumCulled, clip: !!M?.clippingPlanes }; }),
        clipConst: g.god?.clipPlane?.constant, alive: V.alive, regrow: V.regrow,
      };
    },
    hand() { const h = g.god?.hand?.root; if (!h) return null; const p = h.getWorldPosition(new THREE.Vector3()); return { own: h.visible, zoneOff: !!h.zoneOff, pos: v(p), ndc: v(p.clone().project(G.camera)), art: R.hand.art, held: R.hand.held?.kind || null }; },
    // ---- the interact chevron against the planetoid it is over
    chevron() {
      const I = g.interact, C = I.chevron, cur = I.cur; if (!cur || cur.id !== 'garden') return { cur: cur?.id || null, shown: C.group.visible };
      const P = R.near?.planet || (R.near?.s ? R.near.s.body.planet : null) || R.jarBody.planet;
      C.group.updateWorldMatrix(true, true);
      const tip = new THREE.Vector3(0, -1, 0).transformDirection(C.group.matrixWorld); // (the way it points: its point is at -Y in its own frame)
      const at = C.group.getWorldPosition(new THREE.Vector3()), toHeart = P.c.clone().sub(at).normalize();
      const feat = R.near?.pos, featUp = feat ? feat.clone().sub(P.c).normalize() : null;
      return { cur: cur.id, kind: R.near?.kind, planet: P.id, shown: C.group.visible, pos: v(at), points: v(tip), toHeart: v(toHeart),
        offDeg: +(Math.acos(Math.max(-1, Math.min(1, tip.dot(toHeart)))) * 180 / Math.PI).toFixed(1),
        offsetUpVsFeatureUpDeg: featUp ? +(Math.acos(Math.max(-1, Math.min(1, R.jarBody.up.dot(featUp)))) * 180 / Math.PI).toFixed(1) : null };
    },
    state() {
      const J = R.jarBody, P = g.player, cam = G.camera;
      return { active: R.active, named: R.name, jar: J ? { pos: v(J.pos), planet: J.planet?.id, grounded: J.grounded, held: J.held, flight: !!J.flight, alt: +(J.pos.distanceTo(J.planet.c) - J.planet.radiusAt(J.pos.clone().sub(J.planet.c).normalize()) - J.radius).toFixed(2), nan: !Number.isFinite(J.pos.x + J.pos.y + J.pos.z) } : null,
        cam: v(cam.position), camUp: v(cam.up), courierHidden: !!g.character?.hidden || g.character?.root?.visible === false, player: v(P.pos), zone: g.zones.current,
        fog: g.scene.fog ? { c: '#' + g.scene.fog.color.getHexString(), d: g.scene.fog.density } : null, bg: g.scene.background?.isColor ? '#' + g.scene.background.getHexString() : (g.scene.background ? 'texture' : null),
        music: g.music?.current?.title || null, roll: +(Math.asin(new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion).y) * 180 / Math.PI).toFixed(1),
        upperCells: g.cartography?.cells?.upper?.size ?? null, compassTape: !!g.wireCompass?.tape?.visible, layer: g.cartography?.layerOf(P.pos.y)?.name, inside: !!g.garden?.inside, spirits: R.spirits.length, god: g.god?.state, beltOut: g.belt?.tools?.filter((t) => t.wants || t.held).map((t) => t.id) || [] };
    },
    planets() { return R.site.planets.map((P) => ({ id: P.id, c: v(P.c), r: P.r })); },
    /** Put the Jar at a direction on a planetoid (a tester's teleport). */
    put(id, dir = [0, 1, 0], lift = 0.1) { const P = R.site.by[id], d = new THREE.Vector3(...dir).normalize(); R.jarBody.flight = null; R.jarBody.held = false; R.jarBody.vel.set(0, 0, 0); R.jarBody.pos.copy(P.c).addScaledVector(d, P.radiusAt(d) + R.jarBody.radius + lift); R.jarBody.planet = P; R.jarBody.up.copy(d); },
    /** Screen point of a world point. */
    screen(p) { const q = new THREE.Vector3(...p).project(G.camera); return [(q.x + 1) / 2 * innerWidth, (1 - q.y) / 2 * innerHeight, q.z]; },
    jarScreen() { return S.screen(v(R.jarBody.pos)); },
    /** The renderer's own pixels (what the canvas holds): mean luminance and how much is near black. */
    lum() { const c = G.renderer.domElement, gl = G.renderer.getContext(); S.draw(); const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4 * 64 * 64); let sum = 0, dark = 0, n = 0;
      for (let k = 0; k < 4; k++) { gl.readPixels(Math.floor(w * (0.2 + 0.2 * k)) - 32, Math.floor(h / 2) - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let i = 0; i < px.length; i += 4) { const L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; sum += L; if (L < 8) dark++; n++; } }
      return { mean: +(sum / n).toFixed(1), dark: +(dark / n).toFixed(2), w, h }; },
  };
  return S;
})();
`;
await openPage();

// ---- the Node side: checks, shots, input
const results = [];
const check = (id, ok, what) => { results.push({ id, ok: !!ok, what }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(40)} ${typeof what === 'string' ? what : JSON.stringify(what)}`); };
const note = (id, what) => { results.push({ id, ok: null, what }); console.log(`note ${id.padEnd(40)} ${typeof what === 'string' ? what : JSON.stringify(what)}`); };
const ev = (fn, a) => page.evaluate(fn, a);
const sw = (expr) => page.evaluate(`__sw.${expr}`);
let shotN = 0;
const shot = async (name) => { await page.waitForTimeout(400); await sw('draw()'); // (a window's CSS opening runs on the wall clock)
  const f = path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); return f; };
/** Mean luminance of the screenshot as composited (the DOM covers included): decoded in the page. */
const shotLum = async (file) => ev(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = 160; c.height = 100; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 160, 100); const d = x.getImageData(0, 0, 160, 100).data; let s = 0, dark = 0; for (let i = 0; i < d.length; i += 4) { const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += L; if (L < 10) dark++; } return { mean: +(s / (d.length / 4)).toFixed(1), dark: +(dark / (d.length / 4)).toFixed(2) }; }, fs.readFileSync(file).toString('base64'));
const ticks = async (n) => { for (let k = 0; k < n; k += 30) await sw(`tick(${Math.min(30, n - k)})`); };
const hold = async (key, n) => { await page.keyboard.down(key); await ticks(n); await page.keyboard.up(key); };
const press = async (key, n = 2) => { await page.keyboard.press(key); await ticks(n); };
const enter = () => ev(() => { const g = __game.game; return g.realm.enter(g.shrines?.get?.(g.shrines.last) || null); });
const settle = async () => { for (let i = 0; i < 20 && await ev(() => __game.game.seam.busy); i++) await ticks(6); }; // (the seam's dip and return: about 0.6 s)
const resume = () => page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
const closeAll = () => page.evaluate(() => { const g = __game.game; g.pneukaUI.open && g.pneukaUI.close(); g.codex.open && g.codex.close?.(); g.cartography.open && g.cartography.hide?.(); g.indexMenu.open && g.indexMenu.close(); document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
const logSince = (n) => ev((n) => [...document.querySelectorAll('#gamelog .line, #log .line, .gamelog .line')].slice(n).map((e) => e.textContent), n);
const logLines = () => ev(() => (__game.game.log.lines || __game.game.log.entries || []).map((l) => l.text || l.msg || String(l)));

// ================================================================== 1. the first entry (the realm not yet named)
phase = 'entry';
const sBefore = await sw('state()');
check('enter() accepted', await enter(), 'game.realm.enter(shrine)');
const entryShots = [];
for (const [label, n] of [['0s', 0], ['0.5s', 30], ['2s', 90], ['5s', 180]]) {
  await ticks(n);
  const f = await shot(`entry-${label}`), L = await shotLum(f), d = await sw('dom()');
  entryShots.push({ label, file: path.basename(f), lum: L, seam: d.seam, seamPhase: d.seamPhase, index: d.index, page: d.page, top: d.top });
}
note('entry frames', entryShots);
const e5 = entryShots.at(-1);
check('entry: not black at 5 s', e5.lum.dark < 0.9, `screen ${Math.round(e5.lum.dark * 100)}% near-black, seam cover opacity ${e5.seam} (${e5.seamPhase}), index page '${e5.page}', topmost at centre: ${e5.top}`);
check('entry: no window hidden under the seam', !(e5.index && e5.seam > 0.5), `index open=${e5.index}, seam opacity=${e5.seam}`);
const d0 = await sw('dom()');
check('naming page: no calibration under it', d0.calibration.length === 0, d0.calibration.length ? `the page '${d0.page}' carries: ${d0.calibration.join(' | ')}` : 'none');
await page.evaluate(() => document.querySelector('#indexmenu .room')?.click()); // (named as a player would: the first name)
await ticks(2);
for (const [label, n] of [['named+0s', 0], ['named+0.5s', 30], ['named+2s', 90]]) { await ticks(n); const f = await shot(`entry-${label}`); note(`entry ${label}`, { file: path.basename(f), lum: await shotLum(f), seam: (await sw('dom()')).seam }); }
const s1 = await sw('state()');
check('entry: the realm is named', !!s1.named, s1.named);
check('entry: the camera is in the garden zone', s1.zone === 'garden', `zones.current=${s1.zone} cam=${JSON.stringify(s1.cam)}`);
const lum1 = await sw('lum()');
check('entry: the render is not black', lum1.dark < 0.9, lum1);
note('entry: the music', `music.current=${s1.music} (headless has no audio: not judged here)`);
note('garden state', s1);

// ================================================================== 2. the Pneuka Jar
phase = 'jar';
await ticks(30);
const j1 = await sw('jar()');
note('jar measured', j1);
check('jar: drawn (own, zone, parents)', j1 && j1.own && !j1.zoneOff && j1.meshesShown > 0, { own: j1?.own, zoneOff: j1?.zoneOff, meshesShown: j1?.meshesShown, of: j1?.meshes });
check('jar: on screen', j1 && j1.inFrustum && Math.abs(j1.ndc[0]) < 1 && Math.abs(j1.ndc[1]) < 1 && j1.ndc[2] < 1, { ndc: j1?.ndc, dist: j1?.dist });
check('jar: model where its body is', j1 && Math.hypot(...j1.pos.map((x, i) => x - j1.body[i])) < 1.5, { model: j1?.pos, body: j1?.body });
check('jar: full size (this session never used ~)', j1 && j1.scale.every((x) => x > 0.5), { scale: j1?.scale, worldBox: j1?.box });
const gateD = await ev(() => { const R = __game.game.realm, gate = R.site.features.find((f) => f.kind === 'gate'); return +gate.pos.distanceTo(R.jarBody.pos).toFixed(2); });
note('jar: distance to the gate at entry (it stands in front of the torii, the same red-brown)', `${gateD} m; the camera faces the gate through the Jar`);
note('hand measured', await sw('hand()'));
await shot('jar-standing');
const sIn = await sw('state()');
note('in the garden, the world systems', { layer: sIn.layer, compassTape: sIn.compassTape, upperCells: sIn.upperCells, upperCellsBefore: sBefore.upperCells });

// ================================================================== 3. hopping with WASD, the camera, Q/E, the wheel
phase = 'hop';
const p0 = (await sw('state()')).jar.pos;
await hold('KeyW', 90); await shot('hop-W');
await hold('KeyD', 60); await hold('KeyA', 30); await hold('KeyS', 30);
await page.keyboard.down('KeyW'); await ticks(20); await page.keyboard.press('Space'); await ticks(10); await shot('hop-jump'); await ticks(40); await page.keyboard.up('KeyW');
await ticks(40);
const s3 = await sw('state()');
const moved = Math.hypot(...s3.jar.pos.map((x, i) => x - p0[i]));
check('hop: WASD moves the Jar', moved > 2, `moved ${moved.toFixed(2)} m on ${s3.jar.planet}`);
check('hop: the Jar stays on its planetoid', Math.abs(s3.jar.alt) < 2.5 && !s3.jar.nan, s3.jar);
await hold('KeyE', 40); await shot('turn-E'); await hold('KeyQ', 40);
await page.mouse.move(W / 2, H / 2); await page.mouse.wheel(0, 300); await ticks(4); await shot('zoom-out'); await page.mouse.wheel(0, -600); await ticks(4);
const lines = await logLines();
const wrongRoom = lines.filter((t) => /You enter (UPPER FLOOR|GROUND FLOOR|WORKSHOP|THE BASEMENT)/.test(t)).slice(-3);
const sHop = await sw('state()');
check('in the garden, the log does not name a workshop room', !lines.slice(-12).some((t) => /You enter UPPER FLOOR/.test(t)) , `cartography.layerOf(the Jar's y=${sHop.jar.pos[1]}) = '${sHop.layer}'; last 'You enter' lines: ${JSON.stringify(wrongRoom)}`);
check('in the garden, the map is not charted from the Jar', sHop.upperCells === sBefore.upperCells, `upper floor cells ${sBefore.upperCells} -> ${sHop.upperCells}`);
const led = await ev(() => ({ total: +__game.game.ledger.get('dist.total').toFixed(1), up: +__game.game.ledger.get('dist.up').toFixed(1) }));
check('in the garden, the Jar\'s hops are not the Courier\'s distance', led.total < 5, `ledger after ~4 s of hopping: dist.total ${led.total} m, dist.up ${led.up} m (feedback/tracking.js:755 reads player.pos, which realm.js:201 sets to the Jar's)`);
check('in the garden, the wire compass is not drawn', !sHop.compassTape, `wireCompass.tape.visible=${sHop.compassTape} (the DOM #compass is hidden, its 3D tape is not)`);

// ================================================================== 4. the chevron at each place
phase = 'chevron';
const places = await ev(() => __game.game.realm.site.features.map((f, i) => ({ i, fi: f.i, kind: f.kind, planet: f.planet.id, pos: [f.pos.x, f.pos.y, f.pos.z], shown: !f.mesh || f.mesh.visible })));
const chevs = [];
for (const f of places.filter((f) => f.shown)) {
  await ev((f) => { const R = __game.game.realm, P = R.site.by[f.planet], T = __game.THREE, d = new T.Vector3(...f.pos).sub(P.c).normalize(); const side = new T.Vector3(0, 1, 0).cross(d); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); d.applyAxisAngle(side.normalize(), 1.2 / P.r); __sw.put(f.planet, [d.x, d.y, d.z]); R.camera.up.copy(d); }, f);
  await ticks(40);
  const c = await sw('chevron()');
  chevs.push({ kind: f.kind, planet: f.planet, ...c });
  if (['gate', 'shed', 'athanor', 'cocoon', 'tribulationMat'].includes(f.kind) || (f.kind === 'bed' && f.fi === 0)) await shot(`chevron-${f.kind}`);
}
note('chevrons', chevs.map((c) => `${c.kind}@${c.planet}: cur=${c.cur} off ${c.offDeg} deg (offer's up vs feature's up ${c.offsetUpVsFeatureUpDeg})`));
const worst = chevs.filter((c) => c.cur === 'garden').reduce((a, c) => (c.offDeg > (a?.offDeg ?? -1) ? c : a), null);
check('chevron: points at the planetoid heart', worst && worst.offDeg < 10, worst ? `worst ${worst.kind}@${worst.planet}: points ${JSON.stringify(worst.points)} (world down, always) vs to-heart ${JSON.stringify(worst.toHeart)}, ${worst.offDeg} deg` : 'no garden chevron offered');
check('chevron: offered at every shown place', chevs.every((c) => c.cur === 'garden'), chevs.filter((c) => c.cur !== 'garden').map((c) => `${c.kind}@${c.planet} -> ${c.cur}`).join(', ') || 'all');

// ================================================================== 5. each planetoid: a shot, hops off every edge, the lotuses
phase = 'planetoids';
const planets = await sw('planets()');
for (const P of planets) {
  let worstAlt = 0, nan = false, endPlanet = null;
  for (const [k, dir] of [['top', [0, 1, 0]], ['side', [1, 0, 0]], ['under', [0, -1, 0]]]) {
    await ev(([id, dir]) => { __sw.put(id, dir); __game.game.realm.camera.up.set(...dir); __game.game.realm.lotusLock = null; }, [P.id, dir]);
    await ticks(30);
    if (k === 'top' || P.id === 'dantian') await shot(`planet-${P.id}-${k}`);
    await page.keyboard.down('KeyW'); await page.keyboard.down('KeyD'); await ticks(quick ? 120 : 300); await page.keyboard.up('KeyW'); await page.keyboard.up('KeyD');
    await ticks(60);
    const s = await sw('state()'); nan ||= s.jar.nan; endPlanet = s.jar.planet;
    if (!s.jar.flight) worstAlt = Math.max(worstAlt, Math.abs(s.jar.alt));
  }
  check(`rim: ${P.id} hopped round, comes to rest`, !nan && worstAlt < 0.5, `worst rest height ${worstAlt} m over the ground as sculpted; ends on ${endPlanet}`);
}
const lot = await ev(() => __game.game.realm.site.lotuses.map((l) => ({ i: l.i, from: l.planet.id, to: l.toPlanet.id, pos: [l.pos.x, l.pos.y, l.pos.z] })));
const lotBad = [];
for (const L of lot) {
  const r = await ev((L) => { const R = __game.game.realm, P = R.site.by[L.from], T = __game.THREE; const d = new T.Vector3(...L.pos).sub(P.c).normalize(); R.lotusLock = null; __sw.put(L.from, [d.x, d.y, d.z], 0.02); R.jarBody.grounded = true; __sw.tick(5); const fl = !!R.jarBody.flight; __sw.tick(150); return { fl, planet: R.jarBody.planet.id, alt: +(R.jarBody.pos.distanceTo(R.jarBody.planet.c) - R.jarBody.planet.radiusAt(R.jarBody.pos.clone().sub(R.jarBody.planet.c).normalize()) - R.jarBody.radius).toFixed(2) }; }, L);
  if (!r.fl || r.planet !== L.to || Math.abs(r.alt) > 1) lotBad.push({ ...L, ...r });
}
const needle = await ev(() => { const R = __game.game.realm, T = __game.THREE, P = R.site.by.chimney; let mx = 0, top = null; for (let i = 0; i < 4000; i++) { const d = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); const r = P.radiusAt(d); if (r > mx) { mx = r; top = d; } } R.jarBody.flight = null; R.jarBody.vel.set(0, 0, 0); R.jarBody.pos.copy(P.c).addScaledVector(top, mx + 0.6); __sw.tick(180); const J = R.jarBody, n = J.pos.clone().sub(P.c).normalize(); return { needleTop: +mx.toFixed(1), r: P.r, collideWithin: P.r + 4, jarFromHeart: +J.pos.distanceTo(P.c).toFixed(2), groundThere: +P.radiusAt(n).toFixed(2), planet: J.planet.id }; });
check('the Chimney\'s needle is solid to the Jar', needle.jarFromHeart >= needle.groundThere + 0.3, needle);
check('lotus: every one flies to its neighbour', !lotBad.length, lotBad.length ? lotBad.slice(0, 4) : `${lot.length} lotuses`);

// ================================================================== 6. the hand: grab, throw, spam, menus mid-throw
phase = 'hand';
await ev(() => { __sw.put('dantian', [0.2, 1, 0.3]); __game.game.realm.camera.up.set(0.2, 1, 0.3).normalize(); }); await ticks(40);
await press('Digit1');
let [jx, jy] = await sw('jarScreen()');
await page.mouse.move(jx, jy); await ticks(2);
await page.mouse.down(); await ticks(10);
const grabbed = (await sw('hand()')).held;
await page.mouse.move(jx + 120, jy - 140, { steps: 4 }); await ticks(6); await shot('hand-holding-jar');
check('hand: grabs the Jar under the cursor', grabbed === 'jar', `held=${grabbed} (cursor at the Jar's screen point ${jx.toFixed(0)},${jy.toFixed(0)})`);
await page.mouse.move(jx + 400, jy - 300, { steps: 2 }); await ticks(1); await page.mouse.up(); await ticks(3); await shot('hand-throw');
await ticks(60); await shot('hand-throw-1s');
await ticks(240);
const st2 = await sw('state()');
check('hand: a thrown Jar lands on a planetoid', st2.jar.grounded && Math.abs(st2.jar.alt) < 0.5 && !st2.jar.nan, st2.jar);
// the hardest throw the hand allows (26 m/s), sideways along the ground: does it ever come down?
const orbit = await ev(() => { const R = __game.game.realm, T = __game.THREE, J = R.jarBody; __sw.put('dantian', [0, 1, 0], 6); const t = new T.Vector3(1, 0, 0); J.release(t.multiplyScalar(26)); const path = []; let landed = null; for (let k = 0; k < 60 * 40; k++) { __sw.tick(1); if (k % 120 === 0) path.push([+(k / 60).toFixed(0), J.planet.id, +(J.pos.distanceTo(J.planet.c) - J.planet.r).toFixed(1)]); if (J.grounded && landed == null) { landed = +(k / 60).toFixed(2); break; } } return { landed, path }; });
check('hand: a full-strength sideways throw comes down', orbit.landed != null && orbit.landed < 10, orbit.landed != null ? `landed after ${orbit.landed} s` : `still flying after 40 s: [s, planetoid, height] ${JSON.stringify(orbit.path.slice(0, 12))}`);
await ev(() => { __sw.put('dantian', [0.2, 1, 0.3]); }); await ticks(30);
// Esc while holding the Jar
[jx, jy] = await sw('jarScreen()'); await page.mouse.move(jx, jy); await page.mouse.down(); await ticks(6);
await page.keyboard.press('Escape'); await ticks(4); await shot('esc-mid-hold');
const dEsc = await sw('dom()'), hEsc = await sw('hand()');
await page.mouse.up(); await ticks(2);
note('Esc mid-hold', { overlay: dEsc.overlay, handHeld: hEsc.held });
// BEGIN on the pause menu, in the garden: is the pointer taken (it must stay free: the hand is the cursor)?
const lockAsked = await ev(() => { const I = __game.input; let asked = 0; const was = I.requestLock; I.requestLock = function (...a) { asked++; return was.apply(this, a); }; document.getElementById('overlay').dispatchEvent(new MouseEvent('click', { bubbles: true })); I.requestLock = was; return asked; });
await ticks(3);
check('pause BEGIN in the garden leaves the cursor free', lockAsked === 0, `input.requestLock() called ${lockAsked}x by the overlay's start() (main.js asks !god.active, not !cursorFree())`);
await resume(); await ticks(2);
// P, P
[jx, jy] = await sw('jarScreen()'); await page.mouse.move(jx, jy); await page.mouse.down(); await ticks(6);
await page.keyboard.press('KeyP'); await ticks(3); await shot('pneuka-mid-hold');
const dP = await sw('dom()'); await page.mouse.up();
check('P opens the Pneuka Box in the garden', dP.pneuka, { pneuka: dP.pneuka });
await page.keyboard.press('KeyP'); await ticks(3);
const dP2 = await sw('dom()');
check('P again closes the Pneuka Box', !dP2.pneuka, `open after the second P: ${dP2.pneuka}`);
await closeAll(); await ticks(3);
// the hand spammed on the Jar: 40 grabs and flings
phase = 'spam';
for (let k = 0; k < 40; k++) { [jx, jy] = await sw('jarScreen()'); await page.mouse.move(jx, jy); await page.mouse.down(); await ticks(2); await page.mouse.move(jx + (k % 2 ? 300 : -300), jy - 200, { steps: 1 }); await ticks(1); await page.mouse.up(); await ticks(3); }
await ticks(600);
const sSpam = await sw('state()');
check('spam: the Jar comes to rest within 10 s', !sSpam.jar.nan && sSpam.jar.grounded && Math.abs(sSpam.jar.alt) < 0.5, sSpam.jar);
await shot('after-spam');
await ev(() => __sw.put('dantian', [0.2, 1, 0.3])); await ticks(20);

// ================================================================== 7. the windows
phase = 'menus';
const windows = [];
for (const [key, name, closeKey] of [['Escape', 'pause', null], ['KeyP', 'pneuka', 'KeyP'], ['KeyP', 'pneuka(Esc)', 'Escape'], ['KeyB', 'codex', 'KeyB'], ['KeyB', 'codex(Esc)', 'Escape'], ['KeyM', 'map', 'KeyM'], ['KeyM', 'map(Esc)', 'Escape'], ['Tab', 'tuning', 'Tab'], ['Enter', 'chat(Esc)', 'Escape']]) {
  await page.keyboard.press(key); await ticks(3);
  const f = await shot(`menu-${name.replace(/[()]/g, '-')}`), d = await sw('dom()');
  const tuning = await page.evaluate(() => { const e = document.querySelector('.lil-gui'); return e ? getComputedStyle(e).display !== 'none' && e.offsetParent !== null : false; });
  const typing = await ev(() => !!__game.game.log?.typing);
  const opened = { overlay: d.overlay, pneuka: d.pneuka, codex: d.codex, map: d.map, tuning, typing };
  if (closeKey) { await page.keyboard.press(closeKey); await ticks(3); }
  const a = await sw('dom()'), typing2 = await ev(() => !!__game.game.log?.typing);
  const left = { overlay: a.overlay, pneuka: a.pneuka, codex: a.codex, map: a.map, index: a.index, typing: typing2 };
  windows.push({ name, file: path.basename(f), opened, after: closeKey ? left : null });
  if (closeKey) check(`window ${name}: ${closeKey} closes it, and nothing else opens`, !Object.values(left).some(Boolean), Object.entries(left).filter(([, v]) => v).map(([k]) => k).join(', ') || 'clean');
  await closeAll(); await ticks(2);
}
note('windows', windows.map((w) => `${w.name}: ${w.file} opened ${JSON.stringify(w.opened)}`));
const helpGarden = await ev(() => [...document.querySelectorAll('#help .hl div')].map((e) => e.textContent).filter((t) => /GARDEN|REALM|JAR/i.test(t)));
check('pause menu: a page on how the garden is played', helpGarden.length > 0, helpGarden.length ? helpGarden : 'no help page names the garden: its keys (WASD hop, Space, Q/E turn, wheel, 1-6 arts, F, P) are written nowhere but the log');
// the garden's own pages (the index window)
const pages = [];
for (const [kind, fn] of [['athanor', 'athanor()'], ['cocoon', 'cocoon()'], ['place', 'hand.choose(R.plots.plots[0])']]) {
  await ev((fn) => { const R = __game.game.realm; eval('R.' + fn); }, fn);
  await ticks(2); await shot(`page-${kind}`); const d = await sw('dom()');
  pages.push({ kind, page: d.page, calibration: d.calibration });
  await ev(() => __game.game.indexMenu.close()); await ticks(2);
}
const calPages = pages.filter((p) => p.calibration.length);
check('garden pages: no calibration under them', !calPages.length, calPages.map((p) => `${p.page}: ${p.calibration.length} calibration blocks`).join('; ') || 'none');
await ev(() => __game.game.realm.athanor()); await ticks(2);
await page.keyboard.press('Escape'); await ticks(3);
const dE = await sw('dom()');
check('Esc on a garden page closes only the page', !dE.index && !dE.overlay, { index: dE.index, overlay: dE.overlay });
await closeAll(); await ticks(2);
// a resize, mid-garden
phase = 'resize';
await page.setViewportSize({ width: 640, height: 900 }); await ticks(4); await shot('resize-portrait');
const rz = await ev(() => ({ aspect: +__game.camera.aspect.toFixed(3), want: +(innerWidth / innerHeight).toFixed(3) }));
check('resize: the camera follows the window', Math.abs(rz.aspect - rz.want) < 0.01, rz);
const jR = await sw('jar()'); check('resize: the Jar still on screen', jR.inFrustum && Math.abs(jR.ndc[0]) < 1 && Math.abs(jR.ndc[1]) < 1, { ndc: jR.ndc });
await page.setViewportSize({ width: W, height: H }); await ticks(4);

// ================================================================== 8. out by the gate, and the world restored
phase = 'leave';
await ev(() => __game.game.realm.leave()); await ticks(60);
const sL = await sw('state()'), dL = await sw('dom()'), jL = await sw('jar()'), hL = await sw('hand()');
await shot('left-garden');
check('leave: the realm is closed', !sL.active && !sL.inside, { active: sL.active, inside: sL.inside });
check('leave: the camera is back in the world', sL.zone !== 'garden', `zone=${sL.zone} cam=${JSON.stringify(sL.cam)}`);
check('leave: camera.up is world +Y again', Math.abs(sL.camUp[1] - 1) < 1e-3, `camera.up=${JSON.stringify(sL.camUp)} (was ${JSON.stringify(sBefore.camUp)}); roll ${sL.roll} deg`);
check('leave: the Courier is shown', !sL.courierHidden, sL.courierHidden);
check('leave: HUD cross and compass back', dL.hudCross === '' && dL.compass === '', { cross: dL.hudCross, compass: dL.compass });
check('leave: the Jar and the hand put away', !jL?.own && !hL?.own, { jar: jL?.own, hand: hL?.own });
check('leave: the scene background is the world\'s again', sL.bg === sBefore.bg, `before ${sBefore.bg}, after ${sL.bg}`);
check('leave: the Courier where they stood', Math.hypot(...sL.player.map((x, i) => x - sBefore.player[i])) < 1.5, { before: sBefore.player, after: sL.player });
const lumL = await sw('lum()'); check('leave: the world is drawn', lumL.dark < 0.9, lumL);

// ================================================================== 9. stress: in and out twenty times quickly
phase = 'in-out x20';
const census = () => ev(() => ({ children: __game.scene.children.length, garden: __game.game.realm.site.group.children.length, geos: __game.renderer.info.memory.geometries, textures: __game.renderer.info.memory.textures, progs: __game.renderer.info.programs?.length }));
const before = await census();
const lost = [];
for (let k = 0; k < 20; k++) {
  const a = await enter(); await ticks(k % 3 === 0 ? 3 : 45);
  if (await ev(() => __game.game.indexMenu.open)) await ev(() => __game.game.indexMenu.close());
  const busy = await ev(() => __game.game.seam.busy);
  await ev(() => __game.game.realm.leave()); await ticks(50);
  const s = await sw('state()'); if (s.active) { lost.push({ k, enterTook: a, seamBusyAtLeave: busy }); await settle(); await ev(() => __game.game.realm.leave()); await ticks(50); }
}
await settle(); await ticks(30);
const after = await census(), sIO = await sw('state()');
check('in-out x20: ends out', !sIO.active && sIO.zone !== 'garden', { active: sIO.active, zone: sIO.zone });
check('in-out x20: a leave() is never dropped', !lost.length, lost.length ? `${lost.length} of 20 leaves dropped (seam busy: Seam.cross refuses a second job, realm.leave ignores the refusal): ${JSON.stringify(lost.slice(0, 4))}` : 'none');
check('in-out x20: no leak', after.children - before.children <= 2 && after.garden - before.garden <= 2 && after.geos - before.geos <= 4, { before, after });

// ================================================================== 10. stress: in with a tool out, in mid-fight, with a spirit bound
phase = 'tool out';
await ev(() => { const s = __game.game.techs.get?.('sondelass'); if (s) s.drawTarget = 1; __sw.tick(40); }); // (the Sondelass drawn, as Q would)
const drew = await ev(() => __game.game.belt.tools.filter((t) => t.wants || t.drawT > 0.05).map((t) => t.id));
note('tool drawn before entry', drew);
await enter(); await ticks(40); await settle();
const sT = await sw('state()'); await shot('entered-with-tool');
check('tool out: stowed on entry', sT.beltOut.length === 0, `wanting out: ${JSON.stringify(sT.beltOut)} (drawn before: ${JSON.stringify(drew)})`);
await ev(() => __game.game.realm.leave()); await ticks(40); await settle();
const toolAfter = await ev(() => __game.game.belt.tools.filter((t) => t.wants || t.drawT > 0.05).map((t) => [t.id, +t.drawT.toFixed(2)]));
note('tools after leaving', toolAfter);
phase = 'mid-fight';
const fight = await ev(() => { const g = __game.game, P = g.player.pos; try { const c = g.jellies.spawn(P.clone().add(new __game.THREE.Vector3(2.5, 0.3, 0)), { cls: 1 }); __sw.tick(120); return { spawned: !!c, alive: c?.alive, engaged: g.combat?.engaged, foe: c?.foe ? 'courier' : null, pos: c?.pos ? [c.pos.x, c.pos.y, c.pos.z].map((x) => +x.toFixed(1)) : null }; } catch (e) { return { err: e.message }; } });
note('a fight begun', fight);
const okF = await enter(); await ticks(60); await settle(); await shot('entered-mid-fight');
await ticks(300);
const sF2 = await sw('state()'), fight2 = await ev(() => { const g = __game.game; return { courierPos: [g.player.pos.x, g.player.pos.y, g.player.pos.z].map((x) => +x.toFixed(1)), vessel: g.vessel?.hp ?? g.vesselDamage?.total ?? null, shattered: !!g.death?.active }; });
note('entered mid-fight', { accepted: okF, active: sF2.active, after5s: fight2 });
check('mid-fight: entered, the Jar safe in the garden', sF2.active && !sF2.jar.nan && !fight2.shattered, { active: sF2.active, jar: sF2.jar, shattered: fight2.shattered });
await ev(() => __game.game.realm.leave()); await ticks(60); await settle();
const sF3 = await sw('state()'); await shot('left-mid-fight');
note('back in the fight', { player: sF3.player, zone: sF3.zone });
phase = 'spirit';
await ev(() => __game.game.bound.add({ kind: 'slipjelly', name: null, cls: 1, from: 'test', emo: 0.4, mind: 0.5, traits: null, at: 0 }));
await enter(); await ticks(30); await settle();
const sp = await ev(() => { const R = __game.game.realm; return { spirits: R.spirits.length, at: R.spirits[0] ? R.spirits[0].body.planet.id : null }; });
note('a bound spirit in the Grove', sp);
await ev(() => { const R = __game.game.realm, s = R.spirits[0]; if (s) R.raising.page(s); }); await ticks(2); await shot('page-spirit');
const dS = await sw('dom()');
check('spirit page: no calibration under it', !dS.calibration.length || !dS.index, { page: dS.page, calibration: dS.index ? dS.calibration.length : 0 });
await closeAll(); await ticks(2);
await ev(() => __game.game.realm.leave()); await ticks(60); await settle();

// ================================================================== 11. a second session: the god hand (~) used first, then the garden
phase = 'god then garden';
await page.close();
await openPage();
const gods = await ev(() => { const g = __game.game, god = g.god; __sw.tick(60); god.toggle(); __sw.tick(100); const on = god.state; god.toggle(); __sw.tick(100); return { on, after: god.state, jarScale: +god.jar.group.scale.x.toFixed(3) }; });
note('~ in and out', gods);
await ev(() => __game.game.realm.setName('TEST')); await enter(); await ticks(40); await settle(); await ticks(30);
const jG = await sw('jar()');
await shot('god-then-garden');
const hopBase = await ev(() => __game.game.realm.jarLook?.base?.toArray());
check('after ~: the Jar is full size in the garden', jG.scale.every((x) => x > 0.5), `~ ${gods.on}->${gods.after}, PneukaJar scale left at ${gods.jarScale}; in the garden its world scale ${JSON.stringify(jG.scale)}, JarHop base ${JSON.stringify(hopBase)}`);
await ev(() => __game.game.realm.leave()); await ticks(60); await settle();
await ev(() => { const god = __game.game.god; god.toggle(); __sw.tick(90); god.toggle(); __sw.tick(90); }); // (and ~ again: the jar's scale back to 1 there, but the hop's base stays)
await enter(); await ticks(40); await settle(); await ticks(30);
const jG2 = await sw('jar()');
check('after ~, the second visit: the Jar full size', jG2.scale.every((x) => x > 0.5), { scale: jG2.scale });

// ================================================================== 12. the views and terraforming (SPIRIT-GARDEN.md section 7, items 1, 2, 5, 8, 10)
phase = 'terraform';
await enter(); await ticks(40); await settle(); await closeAll(); await ticks(10);
const view = () => ev(() => __game.game.realm.camera?.view);
check('views: the garden opens behind the Jar', (await view()) === 'behind', await view());
await press('Backquote', 4);
const ov = await ev(() => { const R = __game.game.realm, c = __game.camera, d = new __game.THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion), down = R.jarBody.up.clone().negate(); return { view: R.camera.view, offDeg: +(Math.acos(Math.max(-1, Math.min(1, d.dot(down)))) * 180 / Math.PI).toFixed(1) }; });
check('views: ` gives the overhead view, straight down on the Jar', ov.view === 'overhead' && ov.offDeg < 5, ov);
const jw0 = await ev(() => __game.game.realm.jarBody.pos.toArray().map((x) => +x.toFixed(2))); await hold('KeyW', 60); const jw1 = await ev(() => __game.game.realm.jarBody.pos.toArray().map((x) => +x.toFixed(2)));
check('views: overhead, W moves the view and not the Jar', Math.hypot(jw1[0] - jw0[0], jw1[1] - jw0[1], jw1[2] - jw0[2]) < 0.3, { before: jw0, after: jw1 });
await shot('overhead');
// a press with the hand, then undo: the ground under the stroke goes down, and comes back exactly
await press('Digit3', 4);
const art = await ev(() => __game.game.realm.hand.art);
check('terraform: 3 is the press', art === 'press', art);
await page.mouse.move(480 + 60, 300 + 40); await ticks(6);
const at = await ev(() => { const R = __game.game.realm, h = R.hand.hit; if (!h) return null; const d = h.point.clone().sub(h.planet.c).normalize(); window.__dig = { id: h.planet.id, d }; return { planet: h.planet.id, h: +R.clays[h.planet.id].heightAt(d).toFixed(3) }; });
check('terraform: the hand finds the ground under the pointer', !!at, at);
if (at) {
  await page.mouse.down(); await ticks(60); await page.mouse.up(); await ticks(4);
  const h1 = await ev(() => +__game.game.realm.clays[__dig.id].heightAt(__dig.d).toFixed(3));
  check('terraform: a press digs the ground', h1 < at.h - 0.3, { before: at.h, after: h1 });
  await shot('pressed');
  await page.keyboard.down('Control'); await press('KeyZ', 4); await page.keyboard.up('Control');
  const h2 = await ev(() => +__game.game.realm.clays[__dig.id].heightAt(__dig.d).toFixed(3));
  check('terraform: Ctrl+Z puts the ground back exactly', Math.abs(h2 - at.h) < 0.01, { before: at.h, pressed: h1, undone: h2 });
}
// water: poured into a pit round the Jar, it pools there, and the Jar floats in it
// (the ground under a standing thing is held still, so the pit is pressed beside the Jar, and the Jar set in it)
await page.mouse.move(480 + 60, 300 + 40); await ticks(6);
const h0 = await ev(() => { const R = __game.game.realm, h = R.hand.hit; if (!h) return null; window.__pit = h.point.clone().sub(h.planet.c).normalize(); return R.clays[h.planet.id].heightAt(__pit); });
await page.mouse.down(); await ticks(150); await page.mouse.up(); await ticks(30);
const fl = h0 === null ? null : await ev((h0) => { const R = __game.game.realm, J = R.jarBody, P = J.planet, W = R.waterworks?.water?.(P) || R.waterworks?.waters?.[P.id]; if (!W) return null; const pit = +(R.clays[P.id].heightAt(__pit) - h0).toFixed(2);
  J.vel.set(0, 0, 0); J.pos.copy(P.c).addScaledVector(__pit, P.radiusAt(__pit) + J.radius + 0.1); J.up.copy(__pit); // (the Jar set in the pit)
  W.pour(__pit, 60, 'wonder'); W.wake?.(); return { planet: P.id, pit }; }, h0);
check('water: the waterworks has the Jar\'s planetoid', !!fl, fl);
if (fl) {
  await ticks(600);
  const w = await ev(() => { const R = __game.game.realm, J = R.jarBody, W = R.waterworks.waters[J.planet.id], dir = J.pos.clone().sub(J.planet.c).normalize(); return { total: +W.total.toFixed(1), depthAtPit: +W.depthAt(__pit).toFixed(2), depthAtJar: +W.depthAt(dir).toFixed(2), jarMoved: +(dir.angleTo(__pit) * J.planet.r).toFixed(2), swim: J.swim, pit: 0 }; });
  check('water: poured water stays (no loss but evaporation)', w.total > 40, w);
  check('water: the Jar floats in a pool deeper than itself', w.swim >= 0.9, w);
  await shot('afloat');
}
await press('Backquote', 4); await press('KeyZ', 4);
check('views: Z gives first person', (await view()) === 'first', await view());
await press('KeyZ', 4);
check('views: Z again comes back', (await view()) !== 'first', await view());
await ev(() => __game.game.realm.leave()); await ticks(60); await settle();
const out = await sw('state()');
check('terraform: leaving restores the world camera up', Math.abs(out.camUp[1] - 1) < 0.01, out.camUp);

// ================================================================== 13. the features of section 7 (items 3, 31, 6, 7, 11, 13, 30, 15, 17b, 17c, 19)
// Hooks as the code has them (src/world/garden/): races.offer(planet, path) takes a planetoid and a path of directions (Petra's header says
// offer(stroke)); the vein ends are site.links[i].ends[planetId]; the camera's arm is camera.arm; a planetoid is reset by realm.resetPlanetoid(P).
phase = 'features';
const guard = async (id, fn) => { try { await fn(); } catch (e) { check(id, false, `threw: ${String(e?.message || e).slice(0, 240)}`); } };
const evn = (n) => ev((n) => __game.game.events.counts[n] || 0, n);
const ledgerOf = (k) => ev((k) => __game.game.ledger.get(k), k);
const cubesNow = () => ev(() => __game.game.cubes.balance);
await enter(); await ticks(40); await settle(); await closeAll(); await ticks(10);
await ev(() => {
  const g = __game.game, T = __game.THREE;
  const R = () => g.realm;
  { const NX = 128, NY = 64, a = new Float32Array(NX * NY * 3); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const lon = (i / NX) * Math.PI * 2, lat = ((j + 0.5) / NY - 0.5) * Math.PI; a.set([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)], (j * NX + i) * 3); } window.__cellDirs = a; } // (clay.js CELL_DIRS, worked again here: the page cannot import it)
  window.__s13 = {
    /** A direction on a planetoid with the most room round it (clear of features, lotuses, plots), away from `from` by `arc` metres. */
    spot(id, from = null, arc = 0) {
      const P = R().site.by[id], clay = R().clays[id], out = [];
      for (let k = 0; k < 3000; k++) {
        const y = 1 - 2 * (k + 0.5) / 3000, rad = Math.sqrt(1 - y * y), th = k * 2.39996; if (Math.abs(y) > 0.7) continue;
        const d = new T.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad); if (from && P.r * d.angleTo(new T.Vector3(...from)) < arc) continue;
        let m = 1e9; for (const q of clay.kept) m = Math.min(m, P.r * d.angleTo(q.d) - q.r); out.push([m, d]);
      }
      out.sort((a, b) => b[0] - a[0]); return out[0][1];
    },
    dig(id, d, n = 30, r = 4) { const P = R().site.by[id]; for (let i = 0; i < n; i++) R().clays[id].brush(d, 'press', 0.3, r); R().reshape(P, true); R().waterworks.disturb(P); },
    pour(id, d, vol, feeling) { const W = R().waterworks.water(R().site.by[id]); W.pour(d, vol, feeling); W.wake(); },
    margin() { const c = __game.camera.position; let m = 1e9; for (const P of R().site.planets) { const d = c.distanceTo(P.c); m = Math.min(m, d - P.radiusAt(c.clone().sub(P.c).divideScalar(d || 1))); } return m; },
    wetDepth(id, d) { return R().waterworks.waters[id]?.depthAt(d) ?? 0; },
    cleanAll() { const M = __game.game.courierMind; if (M) M.mind = 0; for (const P of R().site.planets) R().resetPlanetoid(P); R().hand.undos.length = 0; }, // (the mind at Balanced: no rain falls into what is measured, v112's keeper)
  };
  window.__s13.cleanAll();
});
await ticks(10);

// ---- item 3: the camera and the ground
await guard('camera: a hill behind the Jar', async () => {
  const a = await ev(() => {
    const g = __game.game, R = g.realm, T = __game.THREE, P = R.site.by.dantian, H = __s13.spot('dantian');
    const f = R.camera.fwd.clone().projectOnPlane(H); if (f.lengthSq() < 0.1) f.set(0, 1, 0).cross(H); f.normalize();
    const ax = H.clone().cross(f).normalize(), Jd = H.clone().applyAxisAngle(ax, 6 / P.r); // (the Jar 6 m in front of the hill's centre, the camera looking along f)
    R.lotusLock = null; __sw.put('dantian', Jd.toArray()); R.camera.up.copy(Jd); R.camera.fwd.copy(f).projectOnPlane(Jd).normalize(); window.__hill = H;
    __sw.tick(40); return { arm: +R.camera.arm.toFixed(2), margin: +__s13.margin().toFixed(2), view: R.camera.view };
  });
  const b = await ev(() => {
    const g = __game.game, R = g.realm, P = R.site.by.dantian; for (let i = 0; i < 40; i++) R.clays.dantian.brush(__hill, 'pull', 0.3, 3); R.reshape(P, true); R.waterworks.disturb(P);
    let min = 1e9, armMin = 1; for (let i = 0; i < 6; i++) { __sw.tick(10); min = Math.min(min, __s13.margin()); armMin = Math.min(armMin, R.camera.arm); }
    return { hill: +R.clays.dantian.heightAt(__hill).toFixed(2), armBefore: 1, armAfter: +armMin.toFixed(2), minHeightOverGround: +min.toFixed(2), jarAlt: +(R.jarBody.pos.distanceTo(P.c) - P.radiusAt(R.jarBody.pos.clone().sub(P.c).normalize())).toFixed(2) };
  });
  await shot('camera-hill');
  check('camera: a hill 6 m behind the Jar is raised', b.hill > 2, { flat: a, hill: b.hill });
  check('camera: the hill shortens the arm', b.armAfter < 1, { arm: a.arm, armAfter: b.armAfter });
  check('camera: stays above the ground behind a hill', b.minHeightOverGround > 0.2, `lowest the camera came over the ground in 60 ticks: ${b.minHeightOverGround} m (flat ground ${a.margin} m); arm ${b.armAfter}`);
});
await guard('camera: overhead zoomed far', async () => {
  const r = await ev(() => {
    const g = __game.game, R = g.realm, T = __game.THREE, out = []; let worst = 1e9;
    for (const P of R.site.planets.filter((p) => !p.bought)) {
      const Q = R.site.planets.filter((q) => q !== P && !q.bought).sort((x, y) => x.c.distanceTo(P.c) - y.c.distanceTo(P.c))[0], d = Q.c.clone().sub(P.c).normalize(); // (toward the nearest neighbour: the view looks across the gap)
      R.lotusLock = null; __sw.put(P.id, d.toArray()); R.camera.up.copy(d); if (!R.camera.over) R.camera.toggleOverhead(); R.camera.over.dist = 70;
      let m = 1e9; for (let i = 0; i < 4; i++) { __sw.tick(8); m = Math.min(m, __s13.margin()); }
      out.push(`${P.id}->${Q.id}: ${m.toFixed(1)} m`); worst = Math.min(worst, m); R.camera.toggleOverhead();
    }
    return { worst: +worst.toFixed(2), out };
  });
  check('camera: overhead, zoomed far, inside no planetoid', r.worst > 0, `lowest over any planetoid's ground ${r.worst} m: ${r.out.join('; ')}`);
});
await ev(() => __s13.cleanAll()); await ticks(10);

// ---- item 31: the water's frame budget
await guard('waterworks: cost', async () => {
  const pit = await ev(() => { const d = __s13.spot('dantian'); window.__pitD = d; __s13.dig('dantian', d, 30, 4); __s13.pour('dantian', d, 80, 'wonder'); return d.toArray(); });
  const costs = [];
  for (let k = 0; k < 10; k++) { await ticks(30); costs.push(await ev(() => { __s13.pour('dantian', __pitD, 6, 'wonder'); const W = __game.game.realm.waterworks; return [+W.cost.toFixed(2), W.every, +W.waters.dantian.total.toFixed(1)]; })); }
  const late = costs.slice(2), worst = Math.max(...late.map((c) => c[0])), total = costs.at(-1)[2];
  note('waterworks: measured', `cost (ms a fixed step, averaged) per half-second while pouring on the Dantian: ${costs.map((c) => c[0]).join(' ')}; steps folded ${costs.at(-1)[1]}; budget 2 ms (Petra measured 1.29; SwiftShader here)`);
  check('waterworks: water is running on the Dantian', total > 20, `${total} cubic metres standing`);
  check('waterworks: a pour costs under 4 ms a step (budget 2)', worst < 4, `worst ${worst} ms after warm-up, budget 2, ceiling here 4`);
});
await ev(() => __s13.cleanAll()); await ticks(10);

// ---- item 6: paint
await guard('paint', async () => {
  await ev(() => { const R = __game.game.realm, d = __s13.spot('dantian'); R.lotusLock = null; __sw.put('dantian', d.toArray()); R.camera.up.copy(d); if (!R.camera.over) R.camera.toggleOverhead(); R.hand.setArt('paint'); });
  await ticks(20);
  const art = await ev(() => __game.game.realm.hand.art); check('paint: 0 / setArt gives the paint art', art === 'paint', art);
  const GR = ['moss', 'ash', 'loam', 'slate', 'silt'];
  const g0 = await ev(() => __game.game.realm.hand.ground), seq = [];
  for (let k = 0; k < 5; k++) { await press('KeyR', 3); seq.push(await ev(() => __game.game.realm.hand.ground)); }
  const want = Array.from({ length: 5 }, (_, k) => GR[(GR.indexOf(g0) + k + 1) % 5]);
  check('paint: R turns moss, ash, loam, slate, silt in turn', JSON.stringify(seq) === JSON.stringify(want), { from: g0, got: seq, want });
  const c0 = await cubesNow(), spots = [[480, 300], [280, 300], [680, 300], [480, 150], [480, 450]];
  for (let k = 0; k < 5; k++) {
    const gr = GR[k]; for (let t = 0; t < 5 && (await ev(() => __game.game.realm.hand.ground)) !== gr; t++) await press('KeyR', 3);
    const n0 = await ledgerOf(`garden.paint.${gr}`), e0 = await evn('garden.paint'), [x, y] = spots[k];
    await page.mouse.move(x, y); await ticks(6); await page.mouse.down(); await ticks(14);
    const h = await ev(() => { const hit = __game.game.realm.hand.hit; if (!hit) return null; const d = hit.point.clone().sub(hit.planet.c).normalize(); window.__ph = { id: hit.planet.id, d }; return { id: hit.planet.id }; });
    await page.mouse.up(); await ticks(4);
    const res = h ? await ev(() => { const R = __game.game.realm; return { ground: R.clays[__ph.id].groundOf(__ph.d), plant: R.plants.at(R.site.by[__ph.id], __ph.d), last: __game.game.events.last('garden.paint') }; }) : null;
    const n1 = await ledgerOf(`garden.paint.${gr}`), e1 = await evn('garden.paint');
    check(`paint: ${gr} lays ${gr} under the hand, said and counted`, !!res && res.ground === gr && n1 === n0 + 1 && e1 === e0 + 1 && res.last?.planetoid === h.id && res.last?.ground === gr, { hit: h, groundOf: res?.ground, ledger: [n0, n1], events: [e0, e1], last: res?.last && { planetoid: res.last.planetoid, ground: res.last.ground } });
    if (gr === 'moss') check('paint: moss painted is moss growing (plants seeded)', !!res && res.plant >= 1, `plants.at the stroke = ${res?.plant}`);
  }
  await shot('painted');
  check('paint: costs nothing (cubes unchanged)', (await cubesNow()) === c0, `cubes ${c0} -> ${await cubesNow()}`);
  await ev(() => { const R = __game.game.realm; R.hand.setArt('grab'); R.camera.over && R.camera.toggleOverhead(); __s13.cleanAll(); });
  await page.mouse.move(480, 300); await ticks(10);
});

// ---- item 7: moving a placed feature
await guard('plots: move', async () => {
  const r = await ev(() => {
    const g = __game.game, R = g.realm, D = R.site.by.dantian, free = R.plots.plots.filter((p) => p.planet === D && !p.placed);
    if (free.length < 2) return { err: `only ${free.length} free plots on the Dantian` };
    const [a, b, c] = free, c0 = g.cubes.balance, m0 = g.events.counts['garden.move'] || 0;
    const placed = R.plots.place(a, 'lantern', 'wonder', { free: true }), c1 = R.plots.place(c, 'lantern', 'mirth', { free: true });
    const onto = R.plots.move(a, c), fromEmpty = R.plots.move(b, a); // (onto a taken plot, and from an empty one: refused)
    const ok = R.plots.move(a, b), e = g.events.last('garden.move');
    return { placed: placed.ok && c1.ok, onto, fromEmpty, ok, aEmpty: !a.placed, bFeature: b.placed?.feature, bFeeling: b.placed?.feeling, bGroup: !!b.group, aGroup: !!a.group, atB: b.group ? +b.group.position.distanceTo(b.pos).toFixed(3) : null, events: (g.events.counts['garden.move'] || 0) - m0, ev: e && { from: e.from, to: e.to, planetoid: e.planetoid, feature: e.feature }, ids: [a.id, b.id], cubes: [c0, g.cubes.balance] };
  });
  check('plots: a placed feature moves to a free plot, free', !r.err && r.placed && r.ok && r.aEmpty && r.bFeature === 'lantern' && r.bFeeling === 'wonder' && r.bGroup && !r.aGroup && r.atB < 0.01 && r.cubes[0] === r.cubes[1], r);
  check('plots: a move onto a taken plot or from an empty one is refused', !r.err && r.onto === false && r.fromEmpty === false, { onto: r.onto, fromEmpty: r.fromEmpty });
  check('plots: a move says garden.move once, with both plots', !r.err && r.events === 1 && r.ev?.from === r.ids[0] && r.ev?.to === r.ids[1] && r.ev?.planetoid === 'dantian', { events: r.events, ev: r.ev, ids: r.ids });
});

// ---- item 11: water keeps a feeling
await guard('water: feeling', async () => {
  const r = await ev(() => {
    const g = __game.game, R = g.realm, P = R.site.by.mulberryGrove, A = __s13.spot('mulberryGrove'), B = __s13.spot('mulberryGrove', A.toArray(), 12), C = __s13.spot('mulberryGrove', A.toArray(), 12);
    __s13.dig('mulberryGrove', A, 30, 4); __s13.dig('mulberryGrove', B, 30, 4); window.__fA = A; window.__fB = B; window.__fC = C.clone();
    __s13.pour('mulberryGrove', A, 60, 'grief'); __s13.pour('mulberryGrove', B, 40, 'wonder'); __s13.pour('mulberryGrove', B, 40, 'grief'); __sw.tick(240);
    const W = R.waterworks, dry = __s13.spot('mulberryGrove', A.toArray(), 20);
    return { A: [W.feelingAt(P, A), +__s13.wetDepth('mulberryGrove', A).toFixed(2)], B: [W.feelingAt(P, B), +__s13.wetDepth('mulberryGrove', B).toFixed(2)], dry: [W.feelingAt(P, dry), +__s13.wetDepth('mulberryGrove', dry).toFixed(2)] };
  });
  check('water: grief poured into a pit is grief there', r.A[0] === 'grief' && r.A[1] >= 0.05, { feelingAt: r.A[0], depth: r.A[1] });
  check('water: wonder and grief mixed in one pit cancel to fair water', r.B[0] === null && r.B[1] >= 0.05, { feelingAt: r.B[0], depth: r.B[1] });
  check('water: dry ground has no feeling', r.dry[0] === null, r.dry);
});
await ev(() => __s13.cleanAll()); await ticks(10);

// ---- item 13: the veins follow a ridge
await guard('veins: ridge', async () => {
  const r = await ev(() => {
    const g = __game.game, R = g.realm, T = __game.THREE, S = R.site, L = S.links.find((l) => l.a.r >= 12) || S.links[0], P = L.a, Q = L.b, clay = R.clays[P.id];
    const to = Q.c.clone().sub(P.c).normalize(), before = L.ends[P.id].clone(), ref = Math.abs(to.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0), u = ref.cross(to).normalize();
    let best = null, bm = -1e9;
    for (let k = 0; k < 16; k++) { const perp = u.clone().applyAxisAngle(to, (k / 16) * Math.PI * 2), d = to.clone().applyAxisAngle(perp, 20 * Math.PI / 180); let m = 1e9; for (const q of clay.kept) m = Math.min(m, P.r * d.angleTo(q.d) - q.r); if (m > bm) { bm = m; best = d; } }
    const k0 = clay.cellOf(best); for (let i = 0; i < 40; i++) clay.brush(best, 'pull', 0.3, 3);
    // the ridge's highest cell within 4 m of its centre
    let peak = -1, ph = -1e9; const d3 = new T.Vector3();
    for (let k = 0; k < clay.h.length; k++) { d3.fromArray(window.__cellDirs, k * 3); if (P.r * d3.angleTo(best) < 4 && clay.groundAt(k) > ph) { ph = clay.groundAt(k); peak = k; } }
    R.reshape(P, true); R.plots.veins(P);
    const after = L.ends[P.id], endK = clay.cellOf(after), peakDir = new T.Vector3().fromArray(window.__cellDirs, peak * 3);
    return { link: `${P.id}-${Q.id}`, clearance: +bm.toFixed(1), ridgeHeight: +clay.heightAt(best).toFixed(2), movedM: +(P.r * before.angleTo(after)).toFixed(1), beforeToPeakM: +(P.r * before.angleTo(peakDir)).toFixed(1), afterToPeakM: +(P.r * after.angleTo(peakDir)).toFixed(1), endHeight: +clay.groundAt(endK).toFixed(2), peakHeight: +ph.toFixed(2), endInConeDeg: +(after.angleTo(to) * 180 / Math.PI).toFixed(1) };
  });
  check('veins: a ridge raised in the cone draws the vein\'s end to its crest', r.ridgeHeight > 2 && r.movedM > 1 && r.afterToPeakM < r.beforeToPeakM && r.afterToPeakM <= 4 && r.endInConeDeg <= 35.5, r);
});
await ev(() => __s13.cleanAll()); await ticks(10);

// ---- item 30: a planetoid put back to its rest shape (Ctrl+Backspace twice), and Ctrl+Z
await guard('reset', async () => {
  const set = await ev(() => {
    const g = __game.game, R = g.realm, P = R.site.by.terraces, d = __s13.spot('terraces'); window.__rd = d;
    R.lotusLock = null; __sw.put('terraces', d.toArray()); R.camera.up.copy(d); if (!R.camera.over) R.camera.toggleOverhead(); R.hand.setArt('grab');
    __s13.dig('terraces', d, 25, 3); R.clays.terraces.paint(d, 'ash', 3); R.reshape(P, true); __s13.pour('terraces', d, 30, 'mirth'); R.plants.seed(P, d, 2); __sw.tick(30); R.hand.undos.length = 0;
    return { dug: +R.clays.terraces.heightAt(d).toFixed(2), ground: R.clays.terraces.groundOf(d), water: +R.waterworks.waters.terraces.total.toFixed(1), plant: R.plants.at(P, d) };
  });
  check('reset: set up (a pit, ash, water and green on the Terraces)', set.dug < -0.3 && set.ground === 'ash' && set.water > 1 && set.plant >= 1, set);
  await page.mouse.move(480, 300); await ticks(10);
  await ev(() => { const M = __game.game.courierMind; if (M) { M.mind = 0; M.brimming = false; } }); // (no rain into what the reset must clear)
  const hitP = await ev(() => __game.game.realm.hand.hit?.planet.id || null);
  const r0 = await evn('garden.reset'), a0 = await evn('garden.reset.ask');
  await page.keyboard.down('Control'); await press('Backspace', 4);
  const once = await ev(() => ({ h: +__game.game.realm.clays.terraces.heightAt(__rd).toFixed(2) }));
  const asked = (await evn('garden.reset.ask')) - a0, resetAfterOne = (await evn('garden.reset')) - r0;
  await press('Backspace', 4); await page.keyboard.up('Control'); await ticks(2);
  const res = await ev(() => { const R = __game.game.realm, P = R.site.by.terraces, d = __rd, e = __game.game.events.last('garden.reset'); return { h: +R.clays.terraces.heightAt(d).toFixed(3), ground: R.clays.terraces.groundOf(d), painted: R.clays.terraces.painted, water: +(R.waterworks.waters.terraces?.total || 0).toFixed(2), plant: R.plants.at(P, d), ev: e && { planetoid: e.planetoid, by: e.by } }; });
  const r1 = (await evn('garden.reset')) - r0;
  check('reset: the hand was over the Terraces', hitP === 'terraces', hitP);
  check('reset: Ctrl+Backspace once only asks', asked === 1 && resetAfterOne === 0 && once.h < -0.3, { asked, reset: resetAfterOne, heightAfterOne: once.h });
  check('reset: Ctrl+Backspace twice puts the clay back (heightAt 0 where it was dug)', Math.abs(res.h) < 0.01 && r1 === 1 && res.ev?.planetoid === 'terraces', { heightAt: res.h, resets: r1, ev: res.ev });
  check('reset: the paint, the water and the green go with it', res.ground === null && res.painted === 0 && res.water === 0 && res.plant === 0, res);
  await page.keyboard.down('Control'); await press('KeyZ', 4); await page.keyboard.up('Control');
  const back = await ev(() => { const R = __game.game.realm; return { h: +R.clays.terraces.heightAt(__rd).toFixed(2), ground: R.clays.terraces.groundOf(__rd) }; });
  check('reset: Ctrl+Z undoes it (the pit and the ash come back)', Math.abs(back.h - set.dug) < 0.02 && back.ground === 'ash', { before: set, back });
  await ev(() => { const R = __game.game.realm; R.camera.over && R.camera.toggleOverhead(); __s13.cleanAll(); });
});
await ticks(10);

// ---- item 15: plants spread only on wet moss, loam and silt
await guard('plants', async () => {
  const r = await ev(() => {
    const g = __game.game, R = g.realm, T = __game.THREE, out = {};
    const setup = (id, ground, pour) => { const P = R.site.by[id], d = __s13.spot(id), clay = R.clays[id]; __s13.dig(id, d, 30, 4); clay.paint(d, ground, 3); R.reshape(P, true); R.plants.seed(P, d, 2); if (pour) __s13.pour(id, d, 80, 'wonder'); return d; };
    window.__pm = setup('pavilions', 'moss', true); window.__pa = setup('terraces', 'ash', true); window.__pd = setup('athanor', 'moss', false);
    __sw.tick(240);
    const count = (id) => R.plants.grids[id].reduce((a, v) => a + (v ? 1 : 0), 0);
    out.start = { moss: R.plants.at(R.site.by.pavilions, __pm), ash: R.plants.at(R.site.by.terraces, __pa), dry: R.plants.at(R.site.by.athanor, __pd), depthMoss: +__s13.wetDepth('pavilions', __pm).toFixed(2), depthAsh: +__s13.wetDepth('terraces', __pa).toFixed(2), n0: count('pavilions') };
    R.plants.tick(6); R.plants.update();
    out.after6 = { moss: R.plants.at(R.site.by.pavilions, __pm), ash: R.plants.at(R.site.by.terraces, __pa), dry: R.plants.at(R.site.by.athanor, __pd) };
    R.plants.tick(10);
    const G = R.plants.grids.pavilions, clay = R.clays.pavilions; let bad = 0, n = 0; for (let k = 0; k < G.length; k++) if (G[k]) { n++; if (clay.ground[k] !== 1) bad++; } // (ground 1 is moss)
    out.spread = { before: out.start.n0, after: n, onOtherGround: bad };
    return out;
  });
  check('plants: the wet moss pit holds water', r.start.depthMoss >= 0.05 && r.start.depthAsh >= 0.05, { moss: r.start.depthMoss, ash: r.start.depthAsh });
  check('plants: wet moss grows to full in game hours', r.start.moss === 1 && r.after6.moss === 3, { seeded: r.start.moss, after6GameHours: r.after6.moss });
  check('plants: they spread to bare wet moss round them', r.spread.after > r.spread.before, r.spread);
  check('plants: they spread only onto moss, loam or silt (here: moss only)', r.spread.onOtherGround === 0, r.spread);
  check('plants: on painted ash with water, none', r.start.ash === 1 && r.after6.ash === 0, { seeded: r.start.ash, after6GameHours: r.after6.ash });
  check('plants: on dry moss they hold what they have', r.start.dry === 1 && r.after6.dry === 1, { seeded: r.start.dry, after6GameHours: r.after6.dry });
});
await ev(() => __s13.cleanAll()); await ticks(10);

// ---- item 17b: sparring, and 17c: tracks and races (two spirits bound and put in the Grove)
await ev(() => { const g = __game.game; for (let i = 0; i < 2; i++) g.bound.add({ kind: 'slipjelly', name: null, cls: 1, from: 'test', emo: 0.4, mind: 0.5, traits: null, at: 0 }); g.realm.respawn(); });
await ticks(30);
const nSp = await ev(() => __game.game.realm.spirits.length);
if (nSp < 2) note('spar and race', `could not bind two spirits (${nSp} in the garden): not checked`);
else {
  await guard('spar', async () => {
    const sum = () => ev(() => __game.game.realm.spirits.slice(0, 2).reduce((a, s) => a + Object.values(s.e.sp.stats).reduce((x, y) => x + y, 0), 0));
    const s0 = await sum(), l0 = await ledgerOf('spirit.spar'), e0 = await evn('spirit.spar'), st0 = await evn('spirit.spar.start');
    const began = await ev(() => { const R = __game.game.realm, [a, b] = R.spirits; return R.raising.spar(a, b); });
    const again = await ev(() => { const R = __game.game.realm; return R.raising.spar(R.spirits[0], R.spirits[1]); }); // (one spar at a time)
    await ticks(10); await ev(() => { for (const s of __game.game.realm.spirits.slice(0, 2)) s.e.sp.fatigue = 100; }); await ticks(10);
    const s1 = await sum(), l1 = await ledgerOf('spirit.spar'), e1 = await evn('spirit.spar'), ev1 = await ev(() => { const e = __game.game.events.last('spirit.spar'); return e && { stats: e.stats, by: e.by }; });
    check('spar: begins, one at a time', began === true && again === false && (await evn('spirit.spar.start')) === st0 + 1, { began, again });
    check('spar: ends, each gains SPAR.gain (6) in its strongest stat', e1 === e0 + 1 && s1 - s0 === 12, { statSum: [s0, s1], ev: ev1 });
    check('spar: the ledger counts spirit.spar', l1 === l0 + 1, { ledger: [l0, l1] });
  });
  await guard('race', async () => {
    const setup = await ev(() => {
      const g = __game.game, R = g.realm, T = __game.THREE, P = R.spirits[0].body.planet, c = P.c.clone().sub(P.c).add(new T.Vector3(0.3, 0.9, 0.2)).normalize();
      const ring = (arcM, n, close = true) => { const al = Math.min(1.2, arcM / P.r), u = new T.Vector3(0, 1, 0).cross(c).normalize(), v = c.clone().cross(u), pts = []; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * Math.PI * 2 * (close ? 1 : 0.6); pts.push(c.clone().multiplyScalar(Math.cos(al)).addScaledVector(u, Math.sin(al) * Math.cos(t)).addScaledVector(v, Math.sin(al) * Math.sin(t)).normalize()); } return pts; };
      const open = R.races.offer(P, ring(9, 72, false)), tiny = R.races.offer(P, ring(2, 40)), t0 = g.events.counts['garden.track'] || 0, l0 = g.ledger.get('garden.track');
      const T1 = R.races.offer(P, ring(9, 72));
      return { planet: P.id, open: !!open, tiny: !!tiny, made: !!T1, metres: T1 && Math.round(T1.len), tracks: R.races.tracks.length, evTrack: (g.events.counts['garden.track'] || 0) - t0, ledTrack: g.ledger.get('garden.track') - l0 };
    });
    check('race: an open stroke and a tiny loop are no track', setup.open === false && setup.tiny === false, setup);
    check('race: a closed carved loop of 40 m or more is a track, said and counted', setup.made && setup.metres >= 40 && setup.evTrack === 1 && setup.ledTrack === 1, setup);
    const b0 = await ev(() => __game.game.realm.spirits.slice(0, 2).map((s) => s.e.sp.bond)), r0 = await evn('spirit.race'), rl0 = await ledgerOf('spirit.race'), rs0 = await evn('spirit.race.start');
    const started = await ev(() => { const R = __game.game.realm; return R.races.start(R.races.tracks.at(-1), R.spirits.slice(0, 2)); });
    const running = await ev(() => !!__game.game.realm.races.running);
    let done = false; for (let k = 0; k < 40 && !done; k++) { await ticks(60); done = !(await ev(() => __game.game.realm.races.running)); }
    const fin = await ev(() => { const R = __game.game.realm, e = __game.game.events.last('spirit.race'); return { bonds: R.spirits.slice(0, 2).map((s) => s.e.sp.bond), held: R.spirits.slice(0, 2).map((s) => s.body.held), e: e && { winner: e.winner, seconds: e.seconds, runners: e.runners, metres: e.metres } }; });
    check('race: starts on the track with the spirits on its planetoid', started === true && running && (await evn('spirit.race.start')) === rs0 + 1, { started, running });
    check('race: runs to a finish, a winner named', done && fin.e?.winner && fin.e.seconds > 0 && fin.e.runners === 2 && fin.held.every((h) => !h), { done, fin });
    check('race: the winner gains RACE.bond (2) of bond', fin.bonds.reduce((a, x) => a + x, 0) - b0.reduce((a, x) => a + x, 0) === 2, { before: b0, after: fin.bonds });
    check('race: the ledger counts spirit.race', (await evn('spirit.race')) === r0 + 1 && (await ledgerOf('spirit.race')) === rl0 + 1, { events: [r0, await evn('spirit.race')], ledger: [rl0, await ledgerOf('spirit.race')] });
  });
}

// ---- the spirit press's view: the garden greys round the bath and comes back (SOUL-ALCHEMY.md 4.3, 4.22; Calissa's look)
await guard('press: the grey surround', async () => {
  const rgb = () => ev(() => { const g = __game.game, c = g.scene.fog.color; return { fog: [c.r, c.g, c.b], grey: g.realm.site.sky.grey, hud: document.body.classList.contains('ui1'), log: document.body.classList.contains('uilog') }; });
  const r0 = await rgb(); await ev(() => __game.game.realm.press.enter()); await ticks(60);
  const r1 = await rgb(), chroma = Math.max(...r1.fog) - Math.min(...r1.fog);
  await ev(() => __game.game.realm.press.leave('sweep')); await ticks(45);
  const r2 = await rgb(), back = Math.max(...r2.fog.map((v, i) => Math.abs(v - r0.fog[i])));
  check('press: the press view greys the sky and the fog, the HUD out', r1.grey === 1 && chroma < 0.01 && r1.hud && r1.log, { grey: r1.grey, chroma: +chroma.toFixed(4), hud: r1.hud, log: r1.log });
  check('press: left, the sky, the fog and the HUD come back', r2.grey === 0 && back < 0.01 && !r2.hud, { grey: r2.grey, fogBack: +back.toFixed(4), hud: r2.hud });
});

// ---- item 19: a bought planetoid sits on the ring round the Dantian
await guard('orbit', async () => {
  const refusal = await ev(() => __game.game.realm.orbit.buy());
  note('orbit: buy() with no cubes and no Firing', refusal);
  check('orbit: buy() refuses (a reason, nothing taken)', typeof refusal === 'string' && refusal.length > 0, refusal);
  const r = await ev(() => {
    const g = __game.game, R = g.realm, T = __game.THREE, O = R.orbit, D = R.site.by.dantian, free = O.slots().filter((s) => s.free), s = free[Math.min(2, free.length - 1)];
    const e0 = g.events.counts['garden.planetoid'] || 0, ok = O.release('moon', s.pos.clone().add(new T.Vector3(3, 3, 3))), P = R.site.by.moon, e = g.events.last('garden.planetoid');
    if (!P) return { ok, err: 'no planetoid made' };
    const rel = P.c.clone().sub(D.c), dist = rel.length(), elev = Math.asin(rel.y / dist) * 180 / Math.PI, az = ((Math.atan2(rel.x, rel.z) * 180 / Math.PI) + 360) % 360;
    const near = R.site.planets.filter((q) => q !== P && !q.bought).sort((a, b) => a.c.distanceTo(P.c) - b.c.distanceTo(P.c)).slice(0, 2).map((q) => q.id).sort();
    const links = R.site.links.filter((l) => l.a === P).map((l) => l.b.id).sort();
    const clay = R.clays.moon, d = new T.Vector3(0, 1, 0), h0 = clay.heightAt(d), moved = clay.brush(d, 'pull', 0.3, 3);
    return { ok, slot: e?.slot, chosen: s.n, dist: +dist.toFixed(2), elev: +elev.toFixed(1), az: +az.toFixed(1), plots: R.plots.plots.filter((p) => p.planet === P).length, near, links, lotuses: R.site.lotuses.filter((l) => l.planet === P).length, hasEnds: R.site.links.filter((l) => l.a === P).every((l) => !!l.ends[P.id]), sculpts: moved, slotTaken: !O.slots()[s.n].free, ev: (g.events.counts['garden.planetoid'] || 0) - e0 };
  });
  check('orbit: a seed let go in the sky takes the free slot nearest, said once', r.ok === true && r.slot === r.chosen && r.ev === 1 && r.slotTaken, r);
  const slotAngle = await ev((n) => 360 / 10 * n, r.slot ?? 0), slotTilt = r.slot % 2 ? -12 : 12;
  check('orbit: it sits 95 m from the Dantian\'s heart', Math.abs(r.dist - 95) < 0.5, { dist: r.dist });
  check('orbit: 12 degrees above or below the equator by turn, at its slot\'s angle', Math.abs(r.elev - slotTilt) < 0.5 && Math.abs(((r.az - slotAngle + 540) % 360) - 180) < 0.5, { elev: r.elev, wantElev: slotTilt, az: r.az, wantAz: slotAngle });
  check('orbit: it is clay with a vein and lotuses to its two nearest', r.sculpts === true && JSON.stringify(r.links) === JSON.stringify(r.near) && r.lotuses >= 2 && r.hasEnds, { sculpts: r.sculpts, links: r.links, near: r.near, lotuses: r.lotuses, ends: r.hasEnds });
  check('orbit: the Moonflower Moon has the 4 plots BOUGHT says', r.plots === 4, `${r.plots} plots (orbit.js BOUGHT moon plots: 4; plots.addPlanet places fewer when its golden spiral cannot fit them)`);
  const want = { dantian: 6, terraces: 6, athanor: 3, pavilions: 5, mulberryGrove: 8, chimney: 2 }, have = await ev(() => { const o = {}; for (const p of __game.game.realm.plots.plots) o[p.planet.id] = (o[p.planet.id] || 0) + 1; return o; });
  const short = Object.entries(want).filter(([k, n]) => have[k] !== n).map(([k, n]) => `${k} ${have[k]}/${n}`);
  check('plots: each of the first six planetoids has the plots PLANETOID_PLOTS says', !short.length, short.length ? short.join(', ') : 'all');
  await ticks(30); await shot('orbit');
});

await ev(() => __game.game.realm.leave()); await ticks(60); await settle();

// ================================================================== the page's errors
phase = 'end';
check('no page errors', errors.length === 0, errors.length ? [...new Set(errors)].slice(0, 12) : 'none');
note('console warnings', warnings.length ? [...new Set(warnings)].slice(0, 12) : 'none');
const fails = results.filter((r) => r.ok === false).length, passes = results.filter((r) => r.ok === true).length;
console.log(`\n${passes} passed, ${fails} failed; screenshots in ${SHOTS}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, errors, warnings }, null, 1));
await browser.close();
process.exit(fails ? 1 : 0);
