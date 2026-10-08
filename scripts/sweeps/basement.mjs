// ---------------------------------------------------------------------------------------
// THE BASEMENT SWEEP: the basement (world/basement/) entered, driven and left headless, a screenshot at every step and a check for
// each thing that could go wrong there: the hub and its Index (F at the console, every room it lists picked by its own key, every
// page of the Index's window: only the Index's own list carries the CALIBRATION blocks), the course and its eight course stations
// (splits, a lap, a reset floor), the movement lab's wings (every tech station's checkpoint stands on solid ground), the lap circuits
// (the Braid, the Mill Race, the Spindle: armed, run gate by gate, fallen from, finished, left), and the siege (the god hand's arena:
// a raid begun and left mid-raid by every door a careless person would use). The careless person too: F and ~ spammed, a held key's
// repeat while the Index is open, Esc mid-raid, the viewport resized mid-window, travel away mid-run and back, leaks counted after
// many repeats (the scene's children, the renderer's memory, the clapperjars' list, the DOM).
// Prints one line a check (PASS / FAIL with what was measured) and exits non-zero on any FAIL. Dovina's (mechanical testing).
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/basement.mjs [--out dir] [--seed 1] [--quick]   (screenshots to <out>/shots, default <tmp>/sweeps/basement)
//
// Prior art: scripts/sweeps/garden.mjs (the first sweep: causes measured inside the page through window.__game) and its harness;
// scripts/stress.mjs (the page opened the same way, manual mode, the clock pinned: the casebook's rule 3); a QA team's smoke pass
// (every room entered, every window opened and shut) and its "monkey" pass (keys mashed, windows opened mid-action).
// ---------------------------------------------------------------------------------------
import { open } from './harness.mjs';
import path from 'path';

const S = await open('basement');
const W = 960, H = 600, REP = S.quick ? 6 : 16;

// ---- the page's side: this sweep's own measures (the harness's __sw has the shared ones)
await S.page.addScriptTag({ content: `
window.__bs = (() => {
  const G = __game, g = G.game, THREE = G.THREE;
  const v = (p) => p ? [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)] : null;
  window.__evs = []; g.events.on('*', (e) => window.__evs.push(e));
  // (who asks for the pointer while a window wants the cursor: counted, not prevented)
  const I = g.input, req = I.requestLock.bind(I); window.__lockAsks = [];
  I.requestLock = (...a) => { window.__lockAsks.push({ index: !!g.indexMenu?.open, codex: !!g.codex?.open, pneuka: !!g.pneukaUI?.open, god: g.god?.state }); return req(...a); };
  const B = {
    v,
    /** Set the Courier down (the course's own teleport: what the Index and the tuning panel's actions use). */
    tp(x, y, z, yaw = 0) { g.course.teleport(new THREE.Vector3(x, y, z), yaw); },
    evs(since = 0) { return window.__evs.slice(since).map((e) => { const o = { ...e }; delete o.t; return o; }); },
    nEvs() { return window.__evs.length; },
    log() { return g.log.lines.map((l) => l.text); },
    /** What could leak: the scene's children, the renderer's memory and programs, bodies, the clapperjars, the DOM. */
    snap() {
      const ri = G.renderer.info;
      return { scene: g.scene.children.length, geos: ri.memory.geometries, tex: ri.memory.textures, programs: ri.programs?.length ?? null,
        bodies: g.physics.world.bodies?.len?.() ?? null, clappers: g.clappers.list.length, raiders: g.clappers.list.filter((c) => c.alive && c.raider).length,
        dom: document.getElementsByTagName('*').length - (g.log?.root?.getElementsByTagName('*').length || 0), // (the log's own lines grow by design)
        styles: document.querySelectorAll('style').length, indexmenus: document.querySelectorAll('#indexmenu').length,
        baubles: g.baubles?.list?.length ?? g.baubles?.items?.length ?? null };
    },
    /** The basement's own screen furniture. */
    hud() {
      const disp = (id) => { const e = document.getElementById(id); return e ? getComputedStyle(e).display : 'none'; }; // (no element is no panel: #course and #circuit are gone, the owner's, 2026-10-07)
      const C = g.circuits;
      return { course: disp('course'), courseText: document.getElementById('course')?.textContent || '', circuit: disp('circuit'), circuitText: document.getElementById('circuit')?.textContent || '',
        god: disp('god'), cross: g.hud?.el?.cross?.style.display ?? null, shells: g.hud?.el?.shells?.style.display ?? null,
        beacons: C ? [...C.beacons.values()].filter((b) => b.g.visible).length : null, run: C?.run ? { id: C.run.def.id, stage: C.run.stage, started: C.run.started, done: C.run.done, penalty: C.run.penalty, clean: C.run.clean } : null };
    },
    course() { const c = g.course; return { current: c.current, running: c.running, lapT: c.lapT, t: +c.t.toFixed(2), lapRooms: [...c.lapRooms], best: { ...c.best } }; },
    god() { const D = g.god; return { state: D.state, active: D.active, jar: D.jar ? { alive: D.jar.alive, hp: D.jar.hp, shown: D.jar.group.visible, pos: v(D.jar.pos) } : null, wave: D.raids?.wave, t: +(D.raids?.t ?? 0).toFixed(1), here: D.raids?.here, handShown: D.hand?.root?.visible }; },
    worn() { return (g.belt?.tools || []).filter((t) => t.model).map((t) => ({ id: t.id, shown: t.model.visible })); },
    /** The Pneuka Jar on screen (normalised device coordinates), and where the hand's view is centred. */
    jarView() { const D = g.god, c = G.camera; c.updateMatrixWorld(); const q = D.jar.pos.clone().setY(D.jar.pos.y + 0.5).project(c); return { ndc: v(q), onScreen: Math.abs(q.x) < 1 && Math.abs(q.y) < 1 && q.z < 1, focus: v(D.cam.focus), focusToJar: +Math.hypot(D.cam.focus.x - D.jar.pos.x, D.cam.focus.z - D.jar.pos.z).toFixed(1), courierHidden: !!g.character.hidden, pointer: [g.input.mx, g.input.my], keysDown: [...g.input.down] }; },
    cam() { const c = G.camera; return { pos: v(c.position), aspect: +c.aspect.toFixed(3), toCourier: +c.position.distanceTo(g.player.pos).toFixed(2) }; },
    /** The Index's window as laid out: its box against the viewport. */
    menuBox() { const e = document.querySelector('#indexmenu .im'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, scrolls: e.scrollHeight > e.clientHeight + 1 }; },
    menuText() { return document.querySelector('#indexmenu')?.innerText || ''; },
    ledger(k) { return g.ledger?.get?.(k) ?? null; },
  };
  return B;
})();
` });
const bs = (expr) => S.page.evaluate(`__bs.${expr}`);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const shotName = (f) => path.basename(f);
/** Can the Courier be driven: W held for 40 ticks moves them. */
async function controllable(label) {
  await S.closeAll(); await S.ticks(2);
  const a = (await S.sw('state()')).player; await S.hold('KeyW', 40); const b = (await S.sw('state()')).player;
  const moved = Math.hypot(b[0] - a[0], b[2] - a[2]);
  return S.check(`${label}: the Courier walks on W`, moved > 0.8, `moved ${moved.toFixed(2)} m in 40 ticks (from ${JSON.stringify(a)})`);
}
const atIndex = async () => { await S.closeAll(); await S.go('index'); await S.ticks(4); };

// ================================================================== 1. the hub and its Index
S.phase = 'hub';
await atIndex();
await S.common('hub at the Index');

const chevAtIndex = await S.ev(() => ({ cur: __game.game.interact?.cur?.id || null, shown: !!__game.game.interact?.chevron?.group?.visible }));
S.check('hub Index: the interact chevron is offered at the console', chevAtIndex.cur != null && chevAtIndex.shown,
  `interact.cur=${chevAtIndex.cur}, chevron shown=${chevAtIndex.shown} (world/basement/basement.js update(): F is read from its own nearConsole test, never offered to courier/interact.js, so no chevron marks the console; the Throwing Room's Index offers 'testroom.index')`);

await S.press('KeyF', 3);
let d = await S.sw('dom()');
const f1 = await S.shot('index-open');
S.check('Index: F at the console opens it', d.index && !d.page, d);
S.check('Index: its own list carries the calibration', d.calibration === 2, `${d.calibration} CALIBRATION blocks under the list (the hub's own numbers: allowed here)`);
S.check('Index: the window is on top', /room|im|indexmenu|grp/.test(String(d.top)), `topmost at the centre: ${d.top}; ${shotName(f1)}`);
const askedOpen = await S.ev(() => window.__lockAsks.filter((a) => a.index).length);
S.check('Index: nothing asks for the pointer while it is open', askedOpen === 0, `${askedOpen} requestLock calls while open`);
const menuTxt = await bs('menuText()');
S.check('Index: no placeholder code ids in its text', !/\b(undefined|null|NaN|TODO|\[object)/.test(menuTxt), menuTxt.replace(/\s+/g, ' ').slice(0, 160));

// the viewport resized under it
await S.page.setViewportSize({ width: 480, height: 360 }); await S.ticks(2); await S.page.waitForTimeout(200);
const mb = await bs('menuBox()'); await S.shot('index-small-viewport');
S.check('Index: fits a 480 x 360 viewport', mb && mb.x >= 0 && mb.y >= 0 && mb.x + mb.w <= mb.vw && mb.y + mb.h <= mb.vh, mb);
await S.page.setViewportSize({ width: W, height: H }); await S.page.waitForTimeout(300); await S.ticks(2); // (the resize event lands on the wall clock)
const camA = await bs('cam()');
S.check('Index: the camera takes the viewport back', Math.abs(camA.aspect - W / H) < 0.01, `camera.aspect ${camA.aspect}, want ${(W / H).toFixed(3)}`);

// F closes it (and only closes it)
await S.press('KeyF', 4);
d = await S.sw('dom()');
S.check('Index: F closes it and it stays closed', !d.index, `open after F and 4 ticks: ${d.index} (the same F reaching basement.update's wasPressed('KeyF') would open it again)`);
// Esc closes it, and does not also open the pause menu
await S.closeAll(); await S.press('KeyF', 3);
await S.press('Escape', 4);
d = await S.sw('dom()');
S.check('Index: Esc closes it', !d.index, d);
S.check('Index: Esc does not also open the pause menu', !d.overlay, `overlay shown: ${d.overlay}`);
// the CLOSE button and the backdrop
await S.closeAll(); await S.press('KeyF', 3);
await S.page.click('#indexmenu .x'); await S.ticks(3);
S.check('Index: CLOSE closes it', !(await S.sw('dom()')).index, 'clicked #indexmenu .x');
await S.press('KeyF', 3);
await S.page.mouse.click(8, 8); await S.ticks(3);
S.check('Index: a click on the backdrop closes it', !(await S.sw('dom()')).index, 'clicked at 8,8');
// a held movement key's auto-repeat while it is open (a person walking up to the console with W still down)
await S.closeAll(); await atIndex();
const pRep0 = (await S.sw('state()')).player;
await S.page.keyboard.down('KeyW'); await S.page.keyboard.press('KeyF'); await S.ticks(1);
const openRep = (await S.sw('dom()')).index;
await S.page.keyboard.down('KeyW'); await S.page.keyboard.down('KeyW'); // (Playwright sends these as repeat keydowns, as a held key does)
await S.ticks(3); await S.page.keyboard.up('KeyW'); await S.settle(); await S.ticks(4);
const pRep1 = (await S.sw('state()')).player, dRep = await S.sw('dom()');
S.check('Index: a held key\'s repeat does not pick a room', !openRep || dist(pRep0, pRep1) < 3, `opened=${openRep}; Courier ${JSON.stringify(pRep0)} -> ${JSON.stringify(pRep1)} (${dist(pRep0, pRep1).toFixed(1)} m), Index open=${dRep.index} (feedback/indexmenu.js keydown: W is the Great Dunemaw's key, and e.repeat is not ignored)`);
// F spammed (measured against the Index once opened and shut: its window keeps its last list while hidden)
await S.closeAll(); await atIndex(); await S.press('KeyF', 2); await S.closeAll(); await S.ticks(200);
const hub0 = await bs('snap()'); // (settled: a sparkle or a burst is a passing child of the scene)
for (let i = 0; i < REP * 2; i++) { await S.page.keyboard.press('KeyF'); await S.ticks(1); }
await S.closeAll(); await atIndex(); await S.ticks(200);
const hub1 = await bs('snap()');
S.check('Index: F spammed leaves one window', hub1.indexmenus === 1, `#indexmenu elements: ${hub1.indexmenus}`);
S.check('Index: F spammed leaks nothing', hub1.scene <= hub0.scene && hub1.styles === hub0.styles && hub1.dom <= hub0.dom + 40, { before: hub0, after: hub1 });
await controllable('hub after the Index');

// ================================================================== 2. every room the Index lists, picked by its own key
S.phase = 'rooms';
const rooms = await S.ev(() => __game.game.course.rooms.map((r) => ({ id: r.id, code: r.code, name: r.name, spawn: r.spawn || null })));
const expect = { course: (s, x) => x.course.current === 0 && x.course.running, lab: (s) => s.layer === 'THE BASEMENT', braid: (s, x) => x.hud.run?.id === 'braid', millrace: (s, x) => x.hud.run?.id === 'mill', spindle: (s, x) => x.hud.run?.id === 'spindle',
  siege: (s, x) => x.inSiege, dunes: (s) => s.zone === 'dunes' || s.zone === 'beach', shore: (s) => s.zone === 'beach' || s.zone === 'dunes', dunemaw: (s) => s.zone === 'dunes' };
for (const r of rooms) {
  await atIndex();
  const p0 = (await S.sw('state()')).player;
  await S.press('KeyF', 3);
  await S.resume(); // (the pause cover can come up headless when the pointer lock is refused: it would swallow the key under test)
  await S.page.keyboard.press(r.code); await S.ticks(3); await S.settle(); await S.ticks(20);
  const c = await S.common(`Index ${r.id}`);
  const x = { course: await bs('course()'), hud: await bs('hud()'), inSiege: await S.ev(() => { const p = __game.game.player.pos; return p.x > -30 && p.x < 30 && p.z > -108 && p.z < -76 && p.y < -2; }) };
  const ok = expect[r.id] ? expect[r.id](c.state, x) : dist(p0, c.state.player) > 5;
  S.check(`Index ${r.id}: its key (${r.code}) takes the Courier there`, ok && dist(p0, c.state.player) > 3, `${r.name}: ${JSON.stringify(p0)} -> ${JSON.stringify(c.state.player)}, zone ${c.state.zone}, layer ${c.state.layer}, run ${x.hud.run?.id ?? '-'}, course station ${x.course.current}`);
  S.check(`Index ${r.id}: its key opens no second window`, !c.dom.index && !c.dom.pneuka && !c.dom.codex && !c.dom.map,
    `after picking with ${r.code}: index=${c.dom.index} pneuka=${c.dom.pneuka} codex=${c.dom.codex} map=${c.dom.map} (the keydown that picked is still pressed for main.js on the next tick)`);
  await S.closeAll();
}

// ================================================================== 3. the Index's pages: only its own list carries the calibration
S.phase = 'pages';
await S.go('throwing'); await S.ticks(4);
let tr = null;
for (const [dx, dz] of [[1, 0], [1, 0.6], [0.6, 1], [0, 1], [1.2, -0.6]]) {
  await S.ev(([dx, dz]) => __bs.tp(12.4 + dx, 0.02, -0.9 + dz, Math.atan2(dx, dz)), [dx, dz]); await S.ticks(8);
  tr = await S.ev(() => __game.game.interact?.cur?.id || null); if (tr === 'testroom.index') break;
}
await S.press('KeyF', 3);
d = await S.sw('dom()'); const fTr = await S.shot('page-throwing-room');
S.check('page the Throwing Room: opens on F at its lectern', d.index && d.page === 'the Throwing Room', `interact ${tr}; index=${d.index} page='${d.page}'`);
S.check('page the Throwing Room: no calibration under it', d.calibration === 0, `${d.calibration} CALIBRATION blocks under the page '${d.page}' (feedback/indexmenu.js render(): the calibration is drawn after every page, not only the list); ${shotName(fTr)}`);
await S.press('KeyF', 4);
S.check('page the Throwing Room: F closes it and it stays closed', !(await S.sw('dom()')).index, 'open after F and 4 ticks (world/testroom/room.js update() peeks the same F latch while interact.cur is testroom.index and calls showPage again)');
await S.closeAll();
const shrine = await S.ev(() => { const s = __game.game.shrines?.list?.[0]; return s ? { id: s.id, name: s.name, pos: __bs.v(s.pos), yaw: s.yaw } : null; });
if (shrine) {
  await S.go('workshop'); await S.ticks(4);
  let it = null;
  for (const [dx, dz] of [[0, 1.3], [1.3, 0], [0, -1.3], [-1.3, 0], [0.9, 0.9]]) {
    await S.ev(([p, dx, dz]) => __bs.tp(p[0] + dx, p[1] + 0.05, p[2] + dz, Math.atan2(-dx, -dz)), [shrine.pos, dx, dz]); await S.ticks(8);
    it = await S.ev(() => __game.game.interact?.cur?.id || null); if (it === 'shrine') break;
  }
  await S.press('KeyF', 3); await S.ticks(10);
  d = await S.sw('dom()'); const fSh = await S.shot('page-shrine');
  S.check(`page ${shrine.name}: opens on F`, d.index && !!d.page, `interact ${it}; index=${d.index} page='${d.page}'`);
  S.check(`page ${shrine.name}: no calibration under it`, d.calibration === 0, `${d.calibration} CALIBRATION blocks under the page '${d.page}'; ${shotName(fSh)}`);
  await S.press('Escape', 4);
  S.check(`page ${shrine.name}: Esc closes it`, !(await S.sw('dom()')).index, '');
  await S.closeAll();
} else S.note('page a Shrine', 'no Shrine built');

// ================================================================== 4. the course: eight course stations, splits, a lap, a reset floor
S.phase = 'course';
await atIndex(); await S.press('KeyF', 3); await S.page.keyboard.press('Digit1'); await S.ticks(3); await S.settle(); await S.ticks(10);
await S.closeAll();
const cps = await S.ev(() => __game.game.course.cps.map((c, i) => ({ i, station: c.room, name: c.name, tech: !!c.tech, v: __bs.v(c.v), zone: c.zone, yaw: c.yaw })));
const ring = cps.filter((c) => !c.tech);
S.check('course: eight course stations', ring.length === 8, ring.map((c) => `${c.station} ${c.name}`).join(', '));
const ev0 = await bs('nEvs()');
const touch = async (c, n = 30) => { const [x0, x1, z0, z1] = c.zone; await S.ev(([x, y, z, yaw]) => __bs.tp(x, y, z, yaw), [(x0 + x1) / 2, c.v[1] + 0.02, (z0 + z1) / 2, c.yaw]); await S.ticks(n); };
for (const c of [...ring.slice(1), ring[0]]) { await touch(c); if (c.station === 4 || c.station === 7) await S.common(`course station ${c.station}`); }
const evC = await bs(`evs(${ev0})`);
const splits = evC.filter((e) => e.name === 'course.split'), laps = evC.filter((e) => e.name === 'course.lap');
S.check('course: a split at every course station in order', splits.length === 8, `${splits.length} course.split: ${splits.map((e) => `${e.room}:${(+e.time).toFixed(2)}`).join(' ')}`);
S.check('course: the loop in order is a lap', laps.length === 1, `${laps.length} course.lap ${JSON.stringify(laps)}`);
const hc = await bs('hud()');
// (the owner, 2026-10-07: the course's timer is in the log, not on the screen)
const pageHas = await S.ev(() => ({ course: !!document.getElementById('course'), circuit: !!document.getElementById('circuit') }));
S.check('course: no timer on the screen (the log carries it)', hc.course === 'none' && !pageHas.course && !pageHas.circuit, `#course display ${hc.course}: "${hc.courseText}"`);
const saidC = await S.ev(() => __game.game.log.lines.map((l) => l.text).slice(-40));
S.check('course: the log says the laps and splits', saidC.some((t) => /Lap complete/.test(t)), saidC.slice(-6));
// out of order: no split
const ev1 = await bs('nEvs()');
await touch(ring[3]); await touch(ring[5]);
S.check('course: out of order is no split', !(await bs(`evs(${ev1})`)).some((e) => e.name === 'course.split'), 'touched course stations 4 then 6');
// a reset floor (under the gaps, course station 3)
const ev2 = await bs('nEvs()');
await S.ev(() => __bs.tp(28, -14 + 0.05, 0, 0)); await S.ticks(10);
const afterPit = await S.sw('state()'), rs = (await bs(`evs(${ev2})`)).filter((e) => e.name === 'course.reset');
S.check('course: a reset floor sends the Courier back to its course station', rs.length >= 1 && dist(afterPit.player, ring[2].v) < 1.5, `course.reset x${rs.length}; Courier at ${JSON.stringify(afterPit.player)}, course station 3 at ${JSON.stringify(ring[2].v)}`);
// travel away mid-lap and back
await touch(ring[0]); await touch(ring[1]);
await S.go('workshop'); await S.ticks(10);
const away = await bs('hud()');
S.check('course: its banner goes when the Courier leaves the basement', away.course === 'none', `#course display ${away.course}: "${away.courseText}"`);
await atIndex(); await S.ticks(10);
const back = await bs('hud()'), bc = await bs('course()');
S.check('course: back at the hub, no stale course station banner', back.course === 'none' && !bc.running, `#course display ${back.course} "${back.courseText}", course.running=${bc.running} (world/basement/basement.js:656 sets #course to block on every frame in the basement; :699 hides it only when running changes, so once a run ends the last banner stays up)`);
await controllable('course');

// ================================================================== 5. the movement lab's wings: every tech station stands on solid ground
S.phase = 'lab';
await S.go('lab'); await S.common('movement lab');
const tech = cps.filter((c) => c.tech), badStations = [], shotWings = new Set();
for (const c of tech) {
  const e0 = await bs('nEvs()');
  await S.ev((i) => __game.game.course.goTo(i), c.i); await S.ticks(S.quick ? 40 : 90);
  const st = await S.sw('state()'), resets = (await bs(`evs(${e0})`)).filter((e) => e.name === 'course.reset').length;
  const wing = String(c.station).replace(/\d+/, '');
  if (!shotWings.has(wing)) { shotWings.add(wing); await S.common(`lab wing ${wing} (${c.station} ${c.name})`); }
  if (st.nan || resets || Math.abs(st.player[1] - c.v[1]) > 1.2) badStations.push({ station: c.station, name: c.name, at: c.v, now: st.player, resets });
}
S.check('lab: every tech station\'s checkpoint stands on solid ground', !badStations.length, badStations.length ? badStations : `${tech.length} tech stations (${[...shotWings].join(', ')} wings), none fell or reset`);
await controllable('movement lab');

// ================================================================== 6. the lap circuits: armed, run gate by gate, a fall, finished, left
S.phase = 'circuits';
const defs = await S.ev(() => [...__game.game.circuits.defs.values()].map((d) => ({ id: d.id, name: d.name, stages: d.stages.map((s) => s[0].zone), bounds: d.bounds, resetY: d.resetY })));
for (const D of defs) {
  await S.closeAll();
  await S.ev((id) => __game.game.circuits.enter(id), D.id); await S.ticks(10);
  const h0 = await bs('hud()');
  S.check(`circuit ${D.id}: armed, its beacons shown and no panel on the screen`, h0.run?.id === D.id && h0.circuit === 'none' && h0.beacons > 0, h0);
  const saidE = await S.ev(() => __game.game.log.lines.map((l) => l.text).slice(-6));
  S.check(`circuit ${D.id}: the log says its medal times on entering`, saidE.some((t) => /Gold under/.test(t)), saidE);
  const e0 = await bs('nEvs()');
  // a fall, after the start line
  const z = D.stages[0];
  await S.ev(([x, y, z]) => __bs.tp(x, y, z, 0), [(z[0] + z[1]) / 2, z[2] + 0.05, (z[4] + z[5]) / 2]); await S.ticks(10);
  await S.ev(([x, y, z]) => { const g = __game.game; g.player.pos.set(x, y, z); g.player.prevPos.set(x, y, z); }, [(z[0] + z[1]) / 2, -14 + D.resetY - 0.5, (z[4] + z[5]) / 2]); await S.ticks(3);
  const hf = await bs('hud()');
  S.check(`circuit ${D.id}: a fall goes back to the last gate, +3 s`, hf.run && hf.run.penalty === 3 && !hf.run.clean, hf.run);
  // every gate in turn
  for (const g of D.stages.slice(1)) { await S.ev(([x, y, z]) => __bs.tp(x, y, z, 0), [(g[0] + g[1]) / 2, g[2] + 1.05, (g[4] + g[5]) / 2]); await S.ticks(6); }
  const hEnd = await bs('hud()'), evs = await bs(`evs(${e0})`);
  const fin = evs.find((e) => e.name === 'circuit.finish');
  const fEnd = await S.shot(`circuit-${D.id}-finished`);
  S.check(`circuit ${D.id}: every gate passed is a finish`, !!fin && hEnd.run?.done, fin ? `${fin.time?.toFixed?.(2)} s, ${fin.medal}, ${fin.gates} gates; ${shotName(fEnd)}` : `stage ${hEnd.run?.stage}/${D.stages.length}`);
  S.check(`circuit ${D.id}: the finished panel names no key that does nothing`, !/R to run it again|H hub/.test(hEnd.circuitText),
    `"${hEnd.circuitText.slice(-90)}" (world/basement/circuits.js draw(): R and H were moved to the tuning panel's actions; nothing binds KeyR or KeyH)`);
  // left by the tuning panel's "the hub"
  await S.ev(() => __game.game.course.toHub()); await S.ticks(6);
  const hl = await bs('hud()');
  S.check(`circuit ${D.id}: the hub ends the run, its panel and beacons go`, !hl.run && hl.circuit === 'none' && hl.beacons === 0, hl);
}
// travel away mid-run, and back
await S.ev(() => __game.game.circuits.enter('braid')); await S.ticks(6);
await S.go('workshop'); await S.ticks(6);
const hw = await bs('hud()');
S.check('circuit braid: travel away mid-run ends it', !hw.run && hw.circuit === 'none' && hw.beacons === 0, hw);
await S.common('workshop after a circuit');
// restarted fast, over and over (the tuning panel's "last checkpoint" on a circuit)
await S.ev(() => __game.game.circuits.enter('spindle')); await S.ticks(6);
const cs0 = await bs('snap()');
for (let i = 0; i < REP; i++) { await S.ev(() => __game.game.circuits.restart()); await S.ticks(2); }
await S.ticks(10);
const cs1 = await bs('snap()');
S.check('circuit spindle: restarted again and again leaks nothing', cs1.scene <= cs0.scene + 2 && cs1.geos <= cs0.geos + 4 && cs1.dom <= cs0.dom + 10, { before: cs0, after: cs1, restarts: REP });
await S.ev(() => __game.game.course.toHub()); await S.ticks(4);

// ================================================================== 7. the siege: the god hand's arena, a raid begun and left mid-raid
S.phase = 'siege';
await S.closeAll(); await S.go('siege'); await S.ticks(30);
await S.common('siege');
const hs0 = await bs('hud()'); await S.ticks(60); const hs1 = await bs('hud()'), cSiege = await bs('course()');
S.check('siege: no course station banner in the arena', hs1.course === 'none', `#course "${hs0.courseText}" then, 60 ticks on, "${hs1.courseText}" (course.running=${cSiege.running}, current=${cSiege.current}: world/basement/basement.js:656 shows #course on every frame in the basement, and :699 hides it only when running changes)`);
const sg0 = await bs('snap()'), worn0 = await bs('worn()');
/** Take the hand, and bring the first wave on now (the raid clock set to a second: the wave's own spawn is what is tested). */
const raid = async (label) => {
  await S.page.mouse.move(W / 2 + 3, H / 2 + 3, { steps: 3 }); // (a pointer resting in a corner edge-scrolls the hand's view: godhand.js updateView)
  await S.ev(([x, y]) => dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y })), [W / 2, H / 2]);
  await S.press('Backquote', 4); await S.ticks(90);
  await S.ev(() => { __game.game.god.raids.t = 1; }); await S.ticks(150);
  const g = await bs('god()'), sn = await bs('snap()');
  if (label) { const f = await S.shot(label); S.note(`${label}: the raid`, { god: g, raiders: sn.raiders, file: shotName(f) }); }
  return { g, sn };
};
const r1 = await raid('siege-raid');
S.check('siege: ~ takes the god hand', r1.g.state === 'on' && r1.g.jar?.shown, r1.g);
const jv1 = await bs('jarView()');
S.check('siege: the Pneuka Jar is in the hand\'s view', jv1.onScreen, jv1);
S.check('siege: a raid comes', r1.g.wave >= 1 && r1.sn.raiders > 0, `wave ${r1.g.wave}, ${r1.sn.raiders} raiders`);
const hg = await bs('hud()');
S.check('siege: the hand\'s HUD is up, the crosshair down', hg.god !== 'none' && hg.cross === 'none', { god: hg.god, cross: hg.cross });
// left mid-raid with ~: the raiders go, and are not counted as the Courier's
const down0 = await bs("ledger('clapper.down')"), e0 = await bs('nEvs()');
await S.press('Backquote', 4); await S.ticks(90);
const down1 = await bs("ledger('clapper.down')"), evL = await bs(`evs(${e0})`);
const dismissed = evL.filter((e) => e.name === 'clapper.down');
S.check('siege left mid-raid (~): no raider is left', (await bs('snap()')).raiders === 0, `${(await bs('snap()')).raiders} raiders alive`);
S.check('siege left mid-raid (~): the raiders sent off are not counted defeated', down1 === down0,
  `ledger clapper.down ${down0} -> ${down1}; events ${JSON.stringify(dismissed.slice(0, 3))} (creatures/clappers.js dismiss() calls hit(c, ..., 'shot'): main.js onClapper emits clapper.down, with no 'by', and the ledger and achievements cl1..cl5 count it)`);
S.check('siege: clapper.down says who caused it', dismissed.every((e) => e.by), `clapper.down payloads: ${JSON.stringify(dismissed.slice(0, 2))}`);
await S.ticks(Math.ceil(4 * 60)); // (T.clappers.respawn is 3.5 game seconds)
const snR = await bs('snap()');
S.check('siege: raiders sent off do not come back as clapperjars', snR.clappers <= sg0.clappers, `clapperjars ${sg0.clappers} before the raid -> ${snR.clappers} after (creatures/clappers.js hit(): every clapperjar downed, a dismissed raider too, queues fx.after(respawn) a new one out of the kiln on its floor, 0 for a raider (world/basement/raids.js: no clapperjar floor at the siege's height, so Math.max(0, -1)), the workshop's: every raid grows the workshop's clapperjars)`);
const gOff = await bs('god()'), hOff = await bs('hud()');
S.check('siege after ~: back to the Courier', gOff.state === 'off' && !gOff.handShown && !gOff.jar?.shown, gOff);
S.check('siege after ~: the HUD is the psygun\'s again', hOff.god === 'none' && hOff.cross !== 'none' && hOff.shells !== 'none', { god: hOff.god, cross: hOff.cross, shells: hOff.shells });
const worn1 = await bs('worn()');
S.check('siege after ~: the worn tools are shown again', worn1.every((t, i) => t.shown === (worn0[i]?.shown ?? t.shown)), { before: worn0, after: worn1 });
await S.common('siege after the hand');
await controllable('siege after the hand');
// left mid-raid by the tuning panel's "the hub" (the course's teleport, with the hand out)
await raid(null);
await S.ev(() => __game.game.course.toHub()); await S.ticks(60);
const gHub = await bs('god()'), jvHub = await bs('jarView()'), snHub = await bs('snap()');
await S.common('hub after leaving a raid', { courier: false });
S.check('siege left mid-raid (the hub): the raid stops', snHub.raiders === 0, `${snHub.raiders} raiders alive, god ${gHub.state}, raids here=${gHub.here}`);
S.check('siege left mid-raid (the hub): the Pneuka Jar is in view', gHub.state === 'off' || jvHub.onScreen,
  `god ${gHub.state}; Pneuka Jar at ${JSON.stringify(gHub.jar?.pos)} projects to ${JSON.stringify(jvHub.ndc)}; the hand's view is centred ${jvHub.focusToJar} m from it at ${JSON.stringify(jvHub.focus)} (world/basement/basement.js teleport() moves the Courier and the Pneuka Jar, never god.cam.focus, which the tether holds T.god.range = 36 m off)`);
S.check('siege left mid-raid (the hub): the Courier is not shown beside the Pneuka Jar', gHub.state === 'off' || jvHub.courierHidden,
  `god ${gHub.state}, character.hidden=${jvHub.courierHidden} (teleport() calls character.setHidden(false); godhand.js hides the Courier only while entering)`);
if (gHub.state !== 'off') { await S.press('Backquote', 4); await S.ticks(90); }
// Esc mid-raid, then the Codex mid-raid
await S.closeAll(); await S.go('siege'); await S.ticks(20);
await raid(null);
await S.press('Escape', 4);
const dEsc = await S.sw('dom()');
S.note('siege: Esc mid-raid', `overlay (the pause menu) shown: ${dEsc.overlay}`);
await S.resume(); await S.ticks(4);
await S.press('KeyB', 4);
const dB = await S.sw('dom()'), gB = await bs('god()');
S.note('siege: B mid-raid', { codex: dB.codex, god: gB.state });
await S.closeAll(); await S.ticks(4);
S.check('siege: Esc and the Codex mid-raid leave the hand working', (await bs('god()')).state === 'on', await bs('god()'));
await S.press('Backquote', 4); await S.ticks(90);
// ~ spammed, and taken and dropped many times: what is left over
await S.closeAll(); await S.ticks(10);
const sp0 = await bs('snap()');
for (let i = 0; i < REP; i++) { await S.page.keyboard.press('Backquote'); await S.ticks(i % 3 === 0 ? 1 : 40); }
await S.ticks(120);
let gS = await bs('god()');
if (gS.state === 'on') { await S.press('Backquote', 4); await S.ticks(120); gS = await bs('god()'); }
const sp1 = await bs('snap()');
S.check('siege: ~ spammed settles to the Courier', gS.state === 'off', gS);
S.check('siege: ~ spammed leaks nothing (the clapperjars apart)', sp1.scene - sp1.clappers <= sp0.scene - sp0.clappers + 2 && sp1.geos <= sp0.geos + 2 && sp1.raiders === 0 && sp1.dom <= sp0.dom + 20, { before: sp0, after: sp1 });
// the viewport resized while the hand is out
await S.press('Backquote', 4); await S.ticks(90);
await S.page.setViewportSize({ width: 640, height: 480 }); await S.page.waitForTimeout(300); await S.ticks(4); await S.shot('siege-hand-640x480');
const camS = await bs('cam()');
S.check('siege: the hand\'s view takes a resize', Math.abs(camS.aspect - 640 / 480) < 0.01, `camera.aspect ${camS.aspect}`);
await S.page.setViewportSize({ width: W, height: H }); await S.page.waitForTimeout(300); await S.ticks(4);
await S.press('Backquote', 4); await S.ticks(120);
const sg1 = await bs('snap()');
S.check('siege: after it all, nothing left over (the clapperjars apart)', sg1.raiders === 0 && sg1.scene - sg1.clappers <= sg0.scene - sg0.clappers + 3 , { before: sg0, after: sg1 });
await S.common('siege at the end');
await controllable('siege at the end');

// ================================================================== 8. what the whole sweep said
S.phase = 'words';
const all = await bs('evs(0)');
const outcomes = all.filter((e) => /\.(down|kill|killed|shatter|defeat|felled)$/.test(e.name) && !e.by);
S.check('events: every outcome says who caused it', !outcomes.length, outcomes.length ? [...new Set(outcomes.map((e) => e.name))].map((n) => `${n} x${outcomes.filter((e) => e.name === n).length}`) : 'none');
S.note('events seen', Object.entries(all.reduce((a, e) => ((a[e.name] = (a[e.name] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, n]) => `${k} ${n}`).join(', '));
const lines = await bs('log()');
const gendered = lines.filter((t) => /\b(she|he|her|his|him|herself|himself)\b/i.test(t) && !/Saggar|Raku|Prince/i.test(t));
S.check('the log: never "she" or "he" of the Courier', !gendered.length, gendered.slice(0, 4).join(' | ') || `${lines.length} lines, none`);
const ids = lines.filter((t) => /\b(undefined|NaN|null|\[object)\b|\b[a-z]+\.[a-z]+\.[a-z]+\b/.test(t));
S.check('the log: no code ids or placeholders said', !ids.length, ids.slice(0, 4).join(' | ') || 'none');
S.note('the log, last lines', lines.slice(-14));
await S.done();
