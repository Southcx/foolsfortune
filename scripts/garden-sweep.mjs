// ---------------------------------------------------------------------------------------
// THE GARDEN SWEEP: the Spirit Garden (world/garden/) entered, worked and left headless, with a screenshot at every step and a check
// for each thing the owner has seen go wrong there (the black screen on entry, the Pneuka Jar unseen, the interact chevron not
// pointing at the planetoid's heart, the calibration numbers under the garden's pages) and the stress the owner asked for (in and out
// twenty times, in mid-fight and with a tool out, menus mid-throw, a resize, hops off every planetoid, the hand spammed on the Jar).
// Prints one line a check (PASS / FAIL with what was measured) and exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/garden-sweep.mjs [--out dir] [--seed 1] [--quick]   (screenshots to <out>/shots, default <tmp>/garden-sweep)
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
      const V = g.god?.jar, grp = V?.group, J = R.jar, cam = G.camera; if (!grp) return null;
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
      const P = R.near?.planet || (R.near?.s ? R.near.s.hop.planet : null) || R.jar.planet;
      C.group.updateWorldMatrix(true, true);
      const tip = new THREE.Vector3(0, -1, 0).transformDirection(C.group.matrixWorld); // (the way it points: its point is at -Y in its own frame)
      const at = C.group.getWorldPosition(new THREE.Vector3()), toHeart = P.c.clone().sub(at).normalize();
      const feat = R.near?.pos, featUp = feat ? feat.clone().sub(P.c).normalize() : null;
      return { cur: cur.id, kind: R.near?.kind, planet: P.id, shown: C.group.visible, pos: v(at), points: v(tip), toHeart: v(toHeart),
        offDeg: +(Math.acos(Math.max(-1, Math.min(1, tip.dot(toHeart)))) * 180 / Math.PI).toFixed(1),
        offsetUpVsFeatureUpDeg: featUp ? +(Math.acos(Math.max(-1, Math.min(1, R.jar.up.dot(featUp)))) * 180 / Math.PI).toFixed(1) : null };
    },
    state() {
      const J = R.jar, P = g.player, cam = G.camera;
      return { active: R.active, named: R.name, jar: J ? { pos: v(J.pos), planet: J.planet?.id, grounded: J.grounded, held: J.held, flight: !!J.flight, alt: +(J.pos.distanceTo(J.planet.c) - J.planet.radiusAt(J.pos.clone().sub(J.planet.c).normalize()) - J.radius).toFixed(2), nan: !Number.isFinite(J.pos.x + J.pos.y + J.pos.z) } : null,
        cam: v(cam.position), camUp: v(cam.up), courierHidden: !!g.character?.hidden || g.character?.root?.visible === false, player: v(P.pos), zone: g.zones.current,
        fog: g.scene.fog ? { c: '#' + g.scene.fog.color.getHexString(), d: g.scene.fog.density } : null, bg: g.scene.background?.isColor ? '#' + g.scene.background.getHexString() : (g.scene.background ? 'texture' : null),
        music: g.music?.current?.title || null, roll: +(Math.asin(new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion).y) * 180 / Math.PI).toFixed(1),
        upperCells: g.cartography?.cells?.upper?.size ?? null, compassTape: !!g.wireCompass?.tape?.visible, layer: g.cartography?.layerOf(P.pos.y)?.name, inside: !!g.garden?.inside, spirits: R.spirits.length, god: g.god?.state, beltOut: g.belt?.tools?.filter((t) => t.wants || t.held).map((t) => t.id) || [] };
    },
    planets() { return R.place.planets.map((P) => ({ id: P.id, c: v(P.c), r: P.r })); },
    /** Put the Jar at a direction on a planetoid (a tester's teleport). */
    put(id, dir = [0, 1, 0], lift = 0.1) { const P = R.place.by[id], d = new THREE.Vector3(...dir).normalize(); R.jar.flight = null; R.jar.held = false; R.jar.vel.set(0, 0, 0); R.jar.pos.copy(P.c).addScaledVector(d, P.radiusAt(d) + R.jar.radius + lift); R.jar.planet = P; R.jar.up.copy(d); },
    /** Screen point of a world point. */
    screen(p) { const q = new THREE.Vector3(...p).project(G.camera); return [(q.x + 1) / 2 * innerWidth, (1 - q.y) / 2 * innerHeight, q.z]; },
    jarScreen() { return S.screen(v(R.jar.pos)); },
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
const gateD = await ev(() => { const R = __game.game.realm, gate = R.place.features.find((f) => f.kind === 'gate'); return +gate.pos.distanceTo(R.jar.pos).toFixed(2); });
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
const places = await ev(() => __game.game.realm.place.features.map((f, i) => ({ i, fi: f.i, kind: f.kind, planet: f.planet.id, pos: [f.pos.x, f.pos.y, f.pos.z], shown: !f.mesh || f.mesh.visible })));
const chevs = [];
for (const f of places.filter((f) => f.shown)) {
  await ev((f) => { const R = __game.game.realm, P = R.place.by[f.planet], T = __game.THREE, d = new T.Vector3(...f.pos).sub(P.c).normalize(); const side = new T.Vector3(0, 1, 0).cross(d); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); d.applyAxisAngle(side.normalize(), 1.2 / P.r); __sw.put(f.planet, [d.x, d.y, d.z]); R.cam.up.copy(d); }, f);
  await ticks(40);
  const c = await sw('chevron()');
  chevs.push({ kind: f.kind, planet: f.planet, ...c });
  if (['gate', 'shed', 'furnace', 'cocoon', 'peak'].includes(f.kind) || (f.kind === 'bed' && f.fi === 0)) await shot(`chevron-${f.kind}`);
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
    await ev(([id, dir]) => { __sw.put(id, dir); __game.game.realm.cam.up.set(...dir); __game.game.realm.lotusLock = null; }, [P.id, dir]);
    await ticks(30);
    if (k === 'top' || P.id === 'dantian') await shot(`planet-${P.id}-${k}`);
    await page.keyboard.down('KeyW'); await page.keyboard.down('KeyD'); await ticks(quick ? 120 : 300); await page.keyboard.up('KeyW'); await page.keyboard.up('KeyD');
    await ticks(60);
    const s = await sw('state()'); nan ||= s.jar.nan; endPlanet = s.jar.planet;
    if (!s.jar.flight) worstAlt = Math.max(worstAlt, Math.abs(s.jar.alt));
  }
  check(`rim: ${P.id} hopped round, comes to rest`, !nan && worstAlt < 0.5, `worst rest height ${worstAlt} m over the ground as sculpted; ends on ${endPlanet}`);
}
const lot = await ev(() => __game.game.realm.place.lotuses.map((l) => ({ i: l.i, from: l.planet.id, to: l.toPlanet.id, pos: [l.pos.x, l.pos.y, l.pos.z] })));
const lotBad = [];
for (const L of lot) {
  const r = await ev((L) => { const R = __game.game.realm, P = R.place.by[L.from], T = __game.THREE; const d = new T.Vector3(...L.pos).sub(P.c).normalize(); R.lotusLock = null; __sw.put(L.from, [d.x, d.y, d.z], 0.02); R.jar.grounded = true; __sw.tick(5); const fl = !!R.jar.flight; __sw.tick(150); return { fl, planet: R.jar.planet.id, alt: +(R.jar.pos.distanceTo(R.jar.planet.c) - R.jar.planet.radiusAt(R.jar.pos.clone().sub(R.jar.planet.c).normalize()) - R.jar.radius).toFixed(2) }; }, L);
  if (!r.fl || r.planet !== L.to || Math.abs(r.alt) > 1) lotBad.push({ ...L, ...r });
}
const needle = await ev(() => { const R = __game.game.realm, T = __game.THREE, P = R.place.by.peak; let mx = 0, top = null; for (let i = 0; i < 4000; i++) { const d = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); const r = P.radiusAt(d); if (r > mx) { mx = r; top = d; } } R.jar.flight = null; R.jar.vel.set(0, 0, 0); R.jar.pos.copy(P.c).addScaledVector(top, mx + 0.6); __sw.tick(180); const J = R.jar, n = J.pos.clone().sub(P.c).normalize(); return { needleTop: +mx.toFixed(1), r: P.r, collideWithin: P.r + 4, jarFromHeart: +J.pos.distanceTo(P.c).toFixed(2), groundThere: +P.radiusAt(n).toFixed(2), planet: J.planet.id }; });
check('the Chimney\'s needle is solid to the Jar', needle.jarFromHeart >= needle.groundThere + 0.3, needle);
check('lotus: every one flies to its neighbour', !lotBad.length, lotBad.length ? lotBad.slice(0, 4) : `${lot.length} lotuses`);

// ================================================================== 6. the hand: grab, throw, spam, menus mid-throw
phase = 'hand';
await ev(() => { __sw.put('dantian', [0.2, 1, 0.3]); __game.game.realm.cam.up.set(0.2, 1, 0.3).normalize(); }); await ticks(40);
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
const orbit = await ev(() => { const R = __game.game.realm, T = __game.THREE, J = R.jar; __sw.put('dantian', [0, 1, 0], 6); const t = new T.Vector3(1, 0, 0); J.release(t.multiplyScalar(26)); const path = []; let landed = null; for (let k = 0; k < 60 * 40; k++) { __sw.tick(1); if (k % 120 === 0) path.push([+(k / 60).toFixed(0), J.planet.id, +(J.pos.distanceTo(J.planet.c) - J.planet.r).toFixed(1)]); if (J.grounded && landed == null) { landed = +(k / 60).toFixed(2); break; } } return { landed, path }; });
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
const census = () => ev(() => ({ children: __game.scene.children.length, garden: __game.game.realm.place.group.children.length, geos: __game.renderer.info.memory.geometries, textures: __game.renderer.info.memory.textures, progs: __game.renderer.info.programs?.length }));
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
const sp = await ev(() => { const R = __game.game.realm; return { spirits: R.spirits.length, at: R.spirits[0] ? R.spirits[0].hop.planet.id : null }; });
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

// ================================================================== the page's errors
phase = 'end';
check('no page errors', errors.length === 0, errors.length ? [...new Set(errors)].slice(0, 12) : 'none');
note('console warnings', warnings.length ? [...new Set(warnings)].slice(0, 12) : 'none');
const fails = results.filter((r) => r.ok === false).length, passes = results.filter((r) => r.ok === true).length;
console.log(`\n${passes} passed, ${fails} failed; screenshots in ${SHOTS}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, errors, warnings }, null, 1));
await browser.close();
process.exit(fails ? 1 : 0);
