// ---------------------------------------------------------------------------------------
// THE EMOCEAN SWEEP: the crossing driven headless as a person would and as a careless one would, with a screenshot at every step and
// one PASS/FAIL line a check. What it sweeps (docs/plans/RAIL.md, its contract taken as checks): the pier at the jetty's end (the
// interact chevron on it, F: the node map as a list and the mounts, F and Esc to close it, F spammed, a resize, a refusal with an empty
// purse, a mount taken ashore); boarding (the fuel paid, the seam, the Courier aboard and hidden, the foot HUD stepped out); a crossing
// to Margarite's dock (the rail: every act's view and every swing, a bar long and on a bar line with nothing entering during it; the
// lock-on; the barrel roll and its two charges; the parry, a whiff and an outlined shot sent home; polarity and an absorbed shot; a hit
// and its mercy; the set piece's first beat and its end said in the log; the tally before "You make port"); careless play aboard (the
// windows' keys, F, a resize, /goto mid-crossing); making port (the Courier set down on the far pier, shown, standing,
// the rail's things gone); Margarite's dock (the Purser's posted board, Letty Marque, the Pearl Shrine, the dock's pier and its page);
// the crossing back under /crossing pirates with a continue offered, taken, offered again dearer and declined (made whole at the last
// Shrine); a crossing under /crossing leviathan to Anagami's jetty; and boarding and making port many times over, the scene and the
// renderer's memory counted before and after. Every rail.* and emocean.* event must carry `by` and never `name` or `t`; no log line
// may call the Courier she or he. Exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/emocean.mjs [--out dir] [--seed 1] [--quick] [--only places,pier,crossing,dock,back,leviathan,repeat]
//   (shots to <out>/shots, default <tmp>/sweeps/emocean; --quick sails at half the ticks and repeats four times, not twelve)
//
// A crossing is 100 bars, 150 real seconds, and is sailed tick by tick (the stage keeps its own clock when no cue plays: stage.js
// clock); the forced set pieces come from the chat line's /crossing, as a tester would. Not here: the pause (the harness's manual mode
// skips it: main.js overlayUp) and a reload mid-crossing (each page is a fresh browser context, so the save does not carry). Measures are read inside the page through
// window.__game (game.emocean, game.voyage, game.pier, game.margarite).
//
// Prior art: scripts/sweeps/garden.mjs and dunes.mjs (the harness, the page measured from inside), scripts/rail.mjs (the crossing's
// rules as a simulator: here they are checked in the running game), scripts/stress.mjs (manual mode, the clock pinned: the casebook's
// rule 3), an arcade operator's test mode (every input, every screen, the coin mechanism fed and refused), and a QA team's smoke pass.
// Dovina's (mechanical testing: the owner, 2026-10-07).
// ---------------------------------------------------------------------------------------
import path from 'path';
import { open, args } from './harness.mjs';

const S = await open('emocean');
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const part = (id) => !only || only.has(id);
const quick = S.quick;
const REPS = quick ? 4 : 12, DT = quick ? 1 / 30 : 1 / 60;

// ---- the page's side: what this sweep measures beyond the harness's
const EM_JS = `
window.__em = (() => {
  const G = __game, g = G.game, THREE = G.THREE, v = __sw.v, E = g.emocean;
  const seen = [], spawns = [];
  { const B = g.events, emit = B.emit; B.emit = function (n, d = {}) { seen.push({ name: n, keys: Object.keys(d || {}), by: d && 'by' in d ? d.by : undefined, bar: E.stage.active ? +E.bar.toFixed(3) : null, d: /^(rail|emocean)\\./.test(n) ? JSON.parse(JSON.stringify(d || {})) : null }); return emit.call(this, n, d); }; }
  const M = g.indexMenu, cnt = { show: 0, close: 0 };
  { const s = M.showPage.bind(M), c = M.close.bind(M); M.showPage = (...a) => { cnt.show++; return s(...a); }; M.close = (...a) => { if (M.open) cnt.close++; return c(...a); }; }
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const D = {
    seen, spawns, cnt,
    mark() { return { ev: seen.length, log: g.log.lines.length, show: cnt.show, close: cnt.close }; },
    eventsSince(m) { return seen.slice(m.ev); },
    logSince(m) { return g.log.lines.slice(m.log).map((l) => l.text); },
    logAll() { return g.log.lines.map((l) => l.text); },
    gendered(lines) { return lines.filter((t) => /\\b(Courier|Couriers?'s?)\\b[^.]*\\b(she|he|her|him|his|hers|himself|herself)\\b/i.test(t) || /^(She|He) /.test(t)); },
    /** A code id, an empty value or a raw number where a person reads words. */
    rawIds(t) { return (t.match(/\\b(cask|mat|setpiece|rail|emocean)\\.[a-z]+\\b|\\bundefined\\b|\\bNaN\\b|\\bnull\\b|\\[object/g) || []); },
    win() {
      const ov = document.getElementById('overlay');
      return { pause: ov.style.display !== 'none', index: !!M.open, page: M.page?.name || null, codex: !!g.codex?.open, pneuka: !!g.pneukaUI?.open, map: !!g.cartography?.open,
        dialogue: !!g.dialogue?.open, shop: g.shops?.cur || null, shopUI: !!g.shopUI?.open, god: g.god?.state || null, enabled: !!G.input.enabled, locked: !!document.pointerLockElement };
    },
    menuText() { return document.getElementById('indexmenu').innerText; },
    menuBox() { const b = document.querySelector('#indexmenu .im')?.getBoundingClientRect(); return b ? { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: innerWidth, h: innerHeight } : null; },
    counts() { let n = 0; g.scene.traverse(() => n++); const i = G.renderer.info; return { objects: n, top: g.scene.children.length, geometries: i.memory.geometries, textures: i.memory.textures }; },
    chevron() { const I = g.interact, C = I.chevron, cur = I.cur; return { cur: cur?.id || null, ref: typeof cur?.ref === 'string' ? cur.ref : null, at: cur ? v(cur.pos) : null, shown: C.group.visible, chev: v(C.group.position), off: cur ? +C.group.position.distanceTo(cur.pos).toFixed(2) : null }; },
    stand(p, yaw = 0) { const ok = !!g.places.stand(new THREE.Vector3(...p), yaw); g.player.yaw = yaw; return ok; },
    pos() { return v(g.player.pos); },
    /** A pier's end (the pier's own registry), and the Courier stood a metre inside it, facing out to sea. */
    pierEnd(island) { const j = g.pier.piers.get(island)?.(); return j ? { end: v(j.end), top: +j.top.toFixed(2), yaw: j.yaw } : null; },
    standPier(island) { const j = g.pier.piers.get(island)(); const p = j.end.clone(); p.x -= 1; p.y = j.top + 0.1; return D.stand(v(p), -Math.PI / 2); },
    standSpot(id, back = 1.4) { const s = g.margarite.spot(id); const f = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)); const p = s.pos.clone().addScaledVector(f, back); p.y += 0.1; return D.stand(v(p), s.yaw + Math.PI); },
    standBoard() { const b = g.margarite.board; return D.stand([b.x + 1.2, g.margarite.top + 0.1, b.z], -Math.PI / 2); },
    /** The stage as the person meets it. */
    stage() {
      const r = E.run, sh = E.ship, V = g.voyage, cam = G.camera, st = E.stage;
      const hud = Object.fromEntries(['compass', 'speed', 'crosshair', 'toolstrip'].map((id) => { const e = document.getElementById(id); return [id, e ? +getComputedStyle(e).opacity : null]; }));
      return { active: st.active, boarding: !!E.boarding, offering: !!E.offering, ending: !!E.ending, t: +E.t.toFixed(2), bar: +E.bar.toFixed(2), seconds: st.seconds, setPieces: st.setPieces, piece: E.piece ? E.pieceId : null,
        run: r && { hits: r.hits, bears: r.bears, score: r.score, downed: r.downed, spawned: r.spawned, parried: r.parried, absorbed: r.absorbed, rolls: r.rolls, end: r.end },
        ship: { shown: !!sh.sloop?.group.visible, shownTree: sh.sloop ? shown(sh.sloop.group) : null, local: v(sh.local), aspect: sh.aspect, home: sh.home, charges: sh.charges, rollT: +sh.rollT.toFixed(2), parryT: +sh.parryT.toFixed(2), recover: +sh.recover.toFixed(2), mercy: +sh.mercy.toFixed(2), locks: sh.locks.length, reticles: !!(sh.near?.visible || sh.far?.visible), marks: sh.marks?.filter((m) => m.visible).length ?? 0, keel: sh.sloop?.keelMat ? '#' + sh.sloop.keelMat.color.getHexString() : null },
        foes: E.waves.foes.filter((f) => f.alive).length, foesAll: E.waves.foes.length, sea: !!E.sea?.mesh.visible, swinging: !!E.swinging,
        sailing: V.sailing ? { from: V.sailing.from, to: V.sailing.to, setPieces: V.sailing.setPieces, continues: V.sailing.continues || 0 } : null, at: V.at, cubes: g.cubes.balance,
        aboard: document.body.classList.contains('aboard'), hidden: !!g.character.hidden, zone: g.zones.current, player: v(g.player.pos), cam: v(cam.position), camToShip: sh.sloop ? +cam.position.distanceTo(sh.sloop.group.position).toFixed(2) : null,
        camFwdY: +new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).y.toFixed(2), hud, pool: g.lachryma?.value ?? null, aspect: cam.aspect, wh: innerWidth / innerHeight };
    },
    /** The camera against the view's rig (courier/ship/views.js VIEW_RIGS: offsets in the rail frame from the rail point, part following
     *  the ship), as the rail frame: x across (world -X), y up, z along. */
    camLocal() { const Q = E.rail.Q, c = G.camera.position; return [+(Q.x - c.x).toFixed(2), +(c.y - Q.y).toFixed(2), +(c.z - Q.z).toFixed(2)]; },
    plan() { const p = E.plan; return p && { bars: p.bars, seconds: p.seconds, setPieces: p.setPieces, acts: p.acts.map((a) => ({ id: a.id, from: a.from, to: a.to, view: a.view, leg: a.leg })), swings: p.swings, beats: p.beats.map((b) => ({ bar: b.bar, beat: b.beat, view: b.view })), waveBars: p.waves.map((w) => w.bar) }; },
    /** Step the stage n ticks, keeping when each wave entered (and whether a swing was under way). */
    hull: false,
    sail(n, dt) { for (let i = 0; i < n; i++) { if (D.hull && E.run && !E.offering) E.run.hits = 0; const was = E.run?.spawned ?? 0; G.tick(dt); if (E.stage.active && E.run && E.run.spawned > was) spawns.push({ bar: +E.bar.toFixed(3), n: E.run.spawned - was, swinging: !!E.swinging || !!E.swingAt(E.bar) }); } },
    /** A foe's shot set at the ship (the rail frame): plain of a feeling, or outlined. */
    shoot({ aspect = null, outlined = false, ahead = 1.2 } = {}) {
      const sh = E.ship, p = sh.local.clone(); p.z += ahead; const vel = new THREE.Vector3(0, 0, -6);
      const from = E.waves.foes.find((f) => f.alive) || null;
      E.shots.foe(p, vel, { aspect, outlined, from });
    },
    paintSweep(n, dt, k0 = 0) { for (let i = 0; i < n; i++) { const k = k0 + i; G.input.down.add('Mouse2'); G.input.dx = 60 * Math.cos(k * 0.12); G.input.dy = 14 * Math.sin(k * 0.05); G.tick(dt); } },
    keys: { down: (k) => G.input.down.add(k), up: (k) => G.input.down.delete(k) },
    resize() { G.renderer.setSize?.(innerWidth, innerHeight); },
  };
  return D;
})();
`;
await S.page.addScriptTag({ content: EM_JS });
const em = (expr) => S.page.evaluate(`__em.${expr}`);
const st = () => em('stage()');
const sail = async (n) => { for (let k = 0; k < n; k += 60) await em(`sail(${Math.min(60, n - k)}, ${DT})`); };
/** Sail until the stage clock reaches a bar (or the stage ends). */
const sailTo = async (bar) => { for (let i = 0; i < 400; i++) { const s = await st(); if (!s.active || s.offering || s.bar >= bar) return s; await sail(Math.min(60, Math.max(2, Math.ceil((bar - s.bar) * 1.5 / DT)))); } return st(); };
const sailOut = async () => { for (let i = 0; i < 400; i++) { const s = await st(); if (!s.active && !s.ending) return s; if (s.offering) return s; await sail(60); } return st(); };
const W0 = 960, H0 = 600;
const events = (m) => S.ev((mm) => __em.eventsSince(mm), m);

// ---------------------------------------------------------------- the places
if (part('places')) {
  S.phase = 'places';
  // the jetty's end, by travel (the place's own way there): the Courier set down on the planks, and still standing a second later
  await S.go('jetty');
  const end = await em("pierEnd('anagami')"), p0 = await em('pos()');
  await S.ticks(60); const p1 = await em('pos()');
  const dEnd = Math.hypot(p1[0] - end.end[0], p1[2] - end.end[2]);
  S.check('jetty: travel sets the Courier on the jetty\'s end', Math.abs(p0[1] - end.top) < 0.6 && Math.abs(p1[1] - end.top) < 0.6 && dEnd < 3, { top: end.top, setDown: p0, aSecondLater: p1, fromEnd: +dEnd.toFixed(2) });
  await S.common('jetty (by travel)');
  await S.go('shore'); await S.common('shore');
  // Margarite's dock: the place, the folk on it
  for (const id of ['margarite', 'folk.purser', 'folk.letty']) {
    await S.go(id); await S.ticks(90);
    const s = await st(), top = await S.ev(() => __game.game.margarite.top);
    S.check(`${id}: stood on Margarite's dock`, s.zone === 'margarite' && Math.abs(s.player[1] - top) < 0.6, { zone: s.zone, player: s.player, deck: +top.toFixed(2) });
    await S.common(id);
  }
}

// ---------------------------------------------------------------- the pier at the jetty's end
const toJetty = async () => { await S.go('shore'); await em("standPier('anagami')"); await S.ticks(30); };
if (part('pier') || part('crossing')) { await toJetty(); }
if (part('pier')) {
  S.phase = 'pier';
  await S.ev(() => { const c = __game.game.cubes; c.spend(c.balance, 'test'); }); // (an empty purse first: the refusal)
  const ch = await em('chevron()'), end = await em("pierEnd('anagami')");
  S.check('pier: the interact chevron is on the jetty\'s end', ch.cur === 'pier' && ch.ref === 'anagami' && ch.shown && ch.off < 0.6 && Math.hypot(ch.at[0] - end.end[0], ch.at[2] - end.end[2]) < 0.5, ch);
  let m = await em('mark()');
  await S.press('KeyF', 4);
  let w = await em('win()'), c = await em('cnt');
  S.check('pier: F opens the pier\'s page, once', w.index && w.page === 'pier' && c.show - m.show === 1 && !w.pause, { win: w, opened: c.show - m.show });
  S.check('pier: the cursor is free while its page is open', !w.locked, { locked: w.locked });
  const txt = await em('menuText()'), f1 = await S.shot('pier-page-empty-purse');
  S.check('pier: the page lists the node map and the mounts', /FROM ANAGAMI/.test(txt) && /Margarite/.test(txt) && /MOUNTS|WEAR A TOOL/.test(txt), txt.replace(/\n+/g, ' | ').slice(0, 300));
  S.check('pier: an empty purse says what the crossing burns', /burns \d+ cubes of fuel/.test(txt), { file: path.basename(f1) });
  S.check('pier: no code ids or empty values on the page', !(await S.ev((t) => __em.rawIds(t), txt)).length, await S.ev((t) => __em.rawIds(t), txt));
  m = await em('mark()');
  await S.page.click('#indexmenu .room >> text=Margarite').catch(() => {}); await S.ticks(4);
  let s = await st();
  S.check('pier: a refused crossing does not board', !s.sailing && !s.active && !s.boarding, { sailing: s.sailing, active: s.active });
  // F closes the page (its own "F closes"): and it stays closed
  m = await em('mark()');
  await S.press('KeyF', 4); await S.ticks(6);
  w = await em('win()'); c = await em('cnt');
  S.check('pier: F closes the pier\'s page and it stays closed', !w.index && c.show - m.show === 0, { open: w.index, closed: c.close - m.close, reopened: c.show - m.show });
  await S.closeAll(); await S.ticks(4);
  // Esc closes it, and the pause menu does not open under it
  await S.press('KeyF', 4); await S.press('Escape', 4);
  w = await em('win()');
  S.check('pier: Esc closes the pier\'s page, no pause under it', !w.index && !w.pause, w);
  await S.closeAll(); await S.ticks(4);
  // F spammed: one window at most, never two, never the pause
  m = await em('mark()');
  let worst = 0, pauses = 0;
  for (let i = 0; i < REPS + 8; i++) { await S.page.keyboard.press('KeyF'); await S.ticks(1); const cc = await em('cnt'), ww = await em('win()'); worst = Math.max(worst, (cc.show - m.show) - (cc.close - m.close)); if (ww.pause) pauses++; }
  S.check('pier: F spammed never stacks two pages', worst <= 1 && pauses === 0, { mostOpenAtOnce: worst, pauses });
  await S.closeAll(); await S.ticks(4);
  // a resize with the page open: the window stays inside the viewport
  await S.ev(() => __game.game.cubes.earn(400, 'test'));
  await S.press('KeyF', 4);
  await S.page.setViewportSize({ width: 480, height: 360 }); await S.ticks(4);
  await S.shot('pier-page-small'); const box = await em('menuBox()');
  S.check('pier: its page fits a small viewport', box && box.l >= 0 && box.t >= 0 && box.r <= box.w && box.b <= box.h, box);
  await S.page.setViewportSize({ width: W0, height: H0 }); await S.ticks(4);
  // the mounts: one taken ashore by a click, the choice kept when the page is opened again
  const before = await S.ev(() => __game.game.pier.mounts().chosen.slice());
  if (before.length) {
    await S.ev((t) => { const rows = [...document.querySelectorAll('#indexmenu .room')]; rows.find((r) => r.querySelector('.n')?.textContent === '1')?.click(); }, null); await S.ticks(2);
    const after = await S.ev(() => __game.game.pier.mounts().chosen.slice());
    S.check('pier: a click takes a mount ashore', after.length === before.length - 1 && !after.includes(before[0]), { before, after });
    await S.ev(() => { const rows = [...document.querySelectorAll('#indexmenu .room')]; rows.find((r) => r.querySelector('.n')?.textContent === '·' && /ashore/.test(r.textContent))?.click(); }); await S.ticks(2);
    const again = await S.ev(() => __game.game.pier.mounts().chosen.slice());
    S.check('pier: never more than two mounts aboard', again.length <= 2, { chosen: again });
  } else S.note('pier: mounts', 'no tool worn that can be mounted');
  const txt2 = await em('menuText()');
  S.check('pier: with fuel, Margarite shows its fuel', /fuel: \d+ cubes/.test(txt2), txt2.replace(/\n+/g, ' | ').slice(0, 200));
  await S.shot('pier-page');
  await S.closeAll(); await S.ticks(4);
  await S.common('pier: closed');
}

// ---------------------------------------------------------------- a crossing to Margarite's dock (the shoal)
/** Board from the pier's page by a click, as a person does. */
const board = async (island, to, setPieces) => {
  await S.ev(({ sp }) => { const g = __game.game; g.cubes.earn(600, 'test'); g.chat.run(`/crossing ${sp}`); }, { sp: setPieces });
  await em(`standPier('${island}')`); await S.ticks(20);
  await S.closeAll(); await S.press('KeyF', 4);
  const w = await em('win()');
  if (!(w.index && w.page === 'pier')) return { ok: false, why: 'no pier page', w };
  await S.page.click(`#indexmenu .room >> text=${to}`);
  await S.ticks(2); await S.settle(); await S.ticks(4);
  return { ok: true };
};
let crossed = false;
if (part('crossing')) {
  S.phase = 'crossing';
  const pool0 = await S.ev(() => __game.game.cubes.balance);
  const m0 = await em('mark()'), cnt0 = await em('counts()'), dist0 = await S.ev(() => __game.game.ledger.get('dist.total') || 0);
  await S.ev(() => { const g = __game.game; g.cubes.earn(600, 'test'); g.chat.run('/crossing shoal'); });
  const cubes0 = await S.ev(() => __game.game.cubes.balance);
  await S.press('KeyF', 4);
  await S.page.click('#indexmenu .room >> text=Margarite');
  const mid = await st();
  S.check('board: a seam covers casting off', mid.boarding && (await S.ev(() => !!__game.game.seam.busy)), { boarding: mid.boarding });
  await S.ticks(2); await S.settle(); await S.ticks(4);
  await S.page.waitForTimeout(700); // (the HUD's fade is a CSS transition on the wall clock: vfx/cinema.js)
  let s = await st();
  const hop = (await events(m0)).find((e) => e.name === 'emocean.hop');
  S.check('board: the fuel is paid', hop && cubes0 - s.cubes === hop.d.fuel, { fuel: hop?.d.fuel, paid: cubes0 - s.cubes });
  S.check('board: aboard (stage on, Courier hidden, the rail\'s zone)', s.active && s.hidden && s.zone === 'emocean' && s.aboard && s.ship.shown, { active: s.active, hidden: s.hidden, zone: s.zone, aboard: s.aboard, ship: s.ship.shown });
  S.check('board: the foot HUD steps out aboard', Object.values(s.hud).every((o) => o == null || o === 0), s.hud);
  S.check('board: the forced set piece is the one sailed', JSON.stringify(s.setPieces) === '["shoal"]', s.setPieces);
  S.check('board: the camera rides the ship', s.camToShip != null && s.camToShip < 20, { camToShip: s.camToShip });
  const plan = await em('plan()');
  S.note('crossing: the plan', { bars: plan.bars, acts: plan.acts.map((a) => `${a.id}:${a.from}-${a.to}:${a.view}`).join(' '), swings: plan.swings.map((x) => `${x.bar}:${x.from}>${x.to}`).join(' ') });
  S.check('crossing: every swing and wave on a bar line', plan.swings.every((x) => Number.isInteger(x.bar)) && plan.waveBars.every(Number.isInteger) && plan.beats.every((b) => Number.isInteger(b.bar)), { swings: plan.swings.map((x) => x.bar), waves: plan.waveBars.filter((b) => !Number.isInteger(b)) });
  await S.common('crossing: launch', { courier: false });
  await S.ev(() => { __em.hull = true; }); // (a tester's hull while the acts are looked at: nothing breaks the ship but the checks that mean to)

  // the lock-on: RMB held over a wave paints at most eight, a lock event each; released, a volley
  s = await st();
  const waveAhead = plan.waveBars.filter((b) => b >= 9 && b < 26)[0];
  if (s.active && waveAhead != null) {
    s = await sailTo(waveAhead + 0.5);
    const ml = await em('mark()'), pool = s.pool;
    await em("keys.down('Mouse2')"); let most = 0;
    for (let i = 0; i < 8; i++) { await em(`paintSweep(20, ${DT}, ${i * 20})`); most = Math.max(most, (await st()).ship.locks); } // (the mouse swept across the screen, as a person paints a line)
    await em("keys.up('Mouse2')"); await sail(90);
    const le = await events(ml), locks = le.filter((e) => e.name === 'rail.lock'), vol = le.filter((e) => e.name === 'rail.volley');
    S.check('verbs: the lock-on paints at most eight, one lock event each', most <= 8 && locks.length >= most && locks.every((e) => e.by === 'courier'), { mostPainted: most, lockEvents: locks.length });
    if (most > 0) S.check('verbs: released, the locks fly as one volley', vol.length >= 1 && vol[0].d.locks === most, { volleys: vol.map((e) => e.d), poolSpent: pool != null ? pool - (await st()).pool : null });
    else S.note('verbs: the volley', 'nothing painted over this wave (the far reticle rested away from it)');
  }
  // every act: its view held (the camera against the rig's offsets), a screenshot
  const RIG = { chase: [0, 2.2, -7.5], above: [0, 30, -9], side: [24, 1.5, 3], free: [0, 1.6, -10], astern: [0, 2.6, 9] };
  for (const a of plan.acts.filter((x) => x.view && x.id !== 'arrive')) {
    s = await sailTo(Math.min(a.to - 1, a.from + 3));
    if (!s.active) break;
    const cl = await em('camLocal()'), want = RIG[a.view], sl = s.ship.local;
    const f = { chase: 0.35, above: 0.12, side: 0.1, free: 0.25, astern: 0.35 }[a.view];
    const exp = [want[0] + sl[0] * f, want[1] + 3 + (sl[1] - 3) * f, want[2] + sl[2] * f], off = Math.hypot(cl[0] - exp[0], cl[1] - exp[1], cl[2] - exp[2]);
    S.check(`crossing: ${a.id} (bar ${a.from}) holds the ${a.view} view`, off < 3, { bar: s.bar, cam: cl, rig: exp.map((x) => +x.toFixed(2)), off: +off.toFixed(2) });
    await S.common(`crossing: ${a.id} in the ${a.view} view`, { courier: false });
    if (a.id === 'setpiece') S.note('crossing: the shoal round the ship', await S.ev(() => { const E = __game.game.emocean, fish = E.waves.foes.filter((f) => f.alive && f.role === 'glint'); if (!fish.length) return 'no glints'; const c = fish.reduce((o, f) => o.add(f.local), new __game.THREE.Vector3()).multiplyScalar(1 / fish.length); return { glints: fish.length, bar: +E.bar.toFixed(1), centreFromShip: __sw.v(c.sub(E.ship.local)) }; }));
  }
  // the verbs, in the breather or wherever the clock is (no threats needed for most)
  s = await st();
  if (s.active) {
    // the barrel roll: two charges, refused while rolling and when spent
    await S.ticks(40);
    const r0 = (await st()).run.rolls, ch0 = (await st()).ship.charges;
    await S.press('KeyE', 2); const a1 = await st();
    await S.press('KeyE', 2); const a2 = await st();
    await S.ticks(30); await S.press('KeyE', 2); const a3 = await st();
    await S.ticks(30); await S.press('KeyE', 2); const a4 = await st();
    S.check('verbs: E rolls, once a press, two charges', a1.run.rolls === r0 + 1 && a2.run.rolls === r0 + 1 && a3.run.rolls === r0 + Math.min(2, ch0) && a4.run.rolls === a3.run.rolls, { charges0: ch0, rolls: [a1.run.rolls, a2.run.rolls, a3.run.rolls, a4.run.rolls].map((x) => x - r0), charges: [a1.ship.charges, a2.ship.charges, a3.ship.charges, a4.ship.charges] });
    // polarity: Q flips to the opposite and back; the keel shows it; the event carries by
    const mq = await em('mark()');
    await S.press('KeyQ', 2); const q1 = await st(); await S.press('KeyQ', 2); const q2 = await st();
    const pe = (await events(mq)).filter((e) => e.name === 'rail.polarity');
    S.check('verbs: Q flips polarity and back', q1.ship.aspect !== q1.ship.home && q2.ship.aspect === q2.ship.home && q1.ship.keel !== q2.ship.keel && pe.length === 2 && pe.every((e) => e.by === 'courier'), { home: q1.ship.home, flipped: q1.ship.aspect, back: q2.ship.aspect, keel: [q1.ship.keel, q2.ship.keel], events: pe.length });
    // an absorbed shot: one of the ship's own feeling, drunk
    await S.ticks(70);
    const ab0 = (await st()).run.absorbed, h0 = (await st()).run.hits;
    await S.ev(() => __em.shoot({ aspect: __game.game.emocean.ship.aspect })); await S.ticks(30);
    let x = await st();
    S.check('verbs: a shot of the ship\'s feeling is absorbed, not a hit', x.run.absorbed === ab0 + 1 && x.run.hits === h0, { absorbed: x.run.absorbed - ab0, hits: x.run.hits - h0 });
    // a hit: one of another feeling; then the mercy (a second shot inside it does not count)
    const mh = await em('mark()');
    await S.ev(() => { const g = __game.game; __em.shoot({ aspect: g.emocean.ship.aspect === 'dread' ? 'wonder' : 'dread' }); }); await S.ticks(20);
    x = await st();
    await S.ev(() => { const g = __game.game; __em.shoot({ aspect: g.emocean.ship.aspect === 'dread' ? 'wonder' : 'dread' }); }); await S.ticks(20);
    const y = await st(), he = (await events(mh)).filter((e) => e.name === 'rail.hit');
    S.check('verbs: a shot of another feeling is a hit, the mercy holds the next', x.run.hits === h0 + 1 && y.run.hits === h0 + 1 && he.length === 1 && he[0].by === 'creature', { hits: [x.run.hits - h0, y.run.hits - h0], mercy: x.ship.mercy, events: he.map((e) => e.by) });
    // the parry: a whiff costs a breath (V spammed does not parry through it); an outlined shot is sent home
    await S.ticks(80);
    await S.press('KeyV', 2); const v1 = await st();
    await S.ticks(16); const v2 = await st(); await S.press('KeyV', 1); const v3 = await st();
    S.check('verbs: a parry into nothing costs a breath', v1.ship.parryT > 0 && v2.ship.recover > 0 && v3.ship.parryT <= 0, { parryT: v1.ship.parryT, recover: v2.ship.recover, mashed: v3.ship.parryT });
    await S.ticks(40);
    const mp = await em('mark()'), p0 = (await st()).run.parried, hp = (await st()).run.hits;
    await S.ev(() => __em.shoot({ outlined: true, ahead: 1.6 })); await S.ticks(1); await S.press('KeyV', 20);
    const pz = await st(), pev = (await events(mp)).filter((e) => e.name === 'move.parry');
    S.check('verbs: V sends an outlined shot home', pz.run.parried === p0 + 1 && pz.run.hits === hp && pev.length === 1 && pev[0].by === 'courier', { parried: pz.run.parried - p0, hits: pz.run.hits - hp, events: pev.map((e) => e.by) });
  }
  // careless aboard: the windows' keys, F, Esc to the pause and back, a resize, the chat line's /goto
  s = await st();
  if (s.active) {
    const opened = {};
    const god0 = (await em('win()')).god;
    for (const k of ['KeyB', 'KeyP', 'Backquote', 'KeyM', 'KeyF']) {
      await S.press(k, 4); const ww = await em('win()');
      const what = ['codex', 'pneuka', 'map', 'index', 'dialogue'].filter((kk) => ww[kk]);
      if (ww.god !== god0) what.push(`god hand ${ww.god}`);
      opened[k] = what.length ? what.join(',') : null;
      await S.closeAll(); await S.ticks(2);
    }
    S.check('careless aboard: no window opens on its key mid-crossing', Object.values(opened).every((x) => !x), opened);
    await S.resume(); await S.ticks(10);
    await S.page.setViewportSize({ width: 640, height: 400 }); await S.ticks(6);
    let rz = await st();
    S.check('careless aboard: a resize keeps the camera\'s aspect', Math.abs(rz.aspect - rz.wh) < 0.02, { aspect: rz.aspect, viewport: +rz.wh.toFixed(3) });
    await S.common('careless aboard: resized', { courier: false });
    await S.page.setViewportSize({ width: W0, height: H0 }); await S.ticks(6);
    const mg = await em('mark()');
    await S.ev(() => __game.game.chat.run('/goto workshop')); await S.ticks(30); await S.settle(); await S.ticks(10);
    const gz = await st(), f = await S.shot('careless-aboard-goto');
    const clean = (gz.active && gz.hidden && gz.aboard && gz.zone === 'emocean') || (!gz.active && !gz.aboard && !gz.hidden && gz.zone !== 'emocean');
    S.check('careless aboard: /goto mid-crossing is refused or ends it cleanly', clean, { active: gz.active, courierHidden: gz.hidden, aboard: gz.aboard, zone: gz.zone, player: gz.player, log: await S.ev((mm) => __em.logSince(mm), mg), file: path.basename(f) });
    await S.ev(() => { const g = __game.game; if (g.emocean.stage.active) g.character.setHidden(true); }); // (put back as the stage holds it, so the rest of the crossing is judged on its own)
  }
  // the set piece: its first beat said, the end said, the tally before "You make port"
  const mt = await em('mark()');
  await S.ev(() => { __em.hull = true; });
  s = await sailOut();
  if (s.offering) { S.note('crossing: the ship broke on its own', s.run); await S.ev(() => __game.game.emocean.decline()); await S.settle(); }
  await S.settle(); await S.ticks(10);
  await S.ev(() => { __em.hull = false; });
  s = await st();
  const lines = await S.ev((mm) => __em.logSince(mm), mt), evs = await events(mt);
  const beat = (await events(m0)).find((e) => e.name === 'rail.beat' && e.d.beat === 'boil'), stage = evs.find((e) => e.name === 'emocean.stage');
  S.check('crossing: the shoal\'s first beat is said', !!beat && (await S.ev((mm) => __em.logSince(mm), m0)).some((t) => /The crude boils/.test(t)), { beat: beat ? beat.bar : null });
  const iTally = lines.findIndex((t) => /^The crossing: /.test(t)), iPort = lines.findIndex((t) => /make port/i.test(t));
  S.check('crossing: the tally is said before "You make port"', iTally >= 0 && (iPort < 0 || iTally < iPort), { tally: lines[iTally] || null, port: lines[iPort] || null });
  S.check('crossing: the stage result carries rank, medal and where you came to', stage && stage.d.rank && 'medal' in stage.d && stage.d.at === 'margarite' && stage.by === 'courier', stage?.d && { rank: stage.d.rank, medal: stage.d.medal, at: stage.d.at, passed: stage.d.passed, score: stage.d.score, end: stage.d.end });
  // making port: on the far pier, shown, standing, the rail's things gone
  const land = await em("pierEnd('margarite')");
  await S.ticks(90); await S.page.waitForTimeout(700); const s2 = await st();
  const dLand = Math.hypot(s2.player[0] - land.end[0], s2.player[2] - land.end[2]);
  S.check('port: set down on Margarite\'s pier, standing', s2.zone === 'margarite' && dLand < 3 && Math.abs(s2.player[1] - land.top) < 0.6, { zone: s2.zone, player: s2.player, pierEnd: land.end, fromEnd: +dLand.toFixed(2) });
  S.check('port: the Courier shown and the foot HUD back', !s2.hidden && !s2.aboard && Object.values(s2.hud).every((o) => o == null || o > 0), { hidden: s2.hidden, aboard: s2.aboard, hud: s2.hud });
  S.check('port: the rail\'s things are gone', !s2.active && !s2.ship.shown && !s2.ship.reticles && s2.ship.marks === 0 && s2.foesAll === 0, { active: s2.active, ship: s2.ship.shown, reticles: s2.ship.reticles, marks: s2.ship.marks, foes: s2.foesAll });
  S.check('port: the voyage is at Margarite', s2.at === 'margarite' && !s2.sailing, { at: s2.at, sailing: s2.sailing });
  S.check('port: the camera follows the Courier again', Math.hypot(s2.cam[0] - s2.player[0], s2.cam[2] - s2.player[2]) < 12, { cam: s2.cam, player: s2.player });
  await S.common('port: Margarite\'s dock');
  const dist1 = await S.ev(() => __game.game.ledger.get('dist.total') || 0);
  S.check('ledger: sailing the rail is not distance travelled', dist1 - dist0 < 50, { metres: +(dist1 - dist0).toFixed(0), railSpeed: await S.ev(() => __game.game.emocean.rail.speed), footsore: await S.ev(() => !!__game.game.achievements?.done?.('dt1')) });
  const cnt1 = await em('counts()');
  S.note('crossing: the scene before and after one crossing', { before: cnt0, after: cnt1 });
  crossed = true;
}

// ---------------------------------------------------------------- Margarite's dock: the Purser's posted board, Letty Marque, the Pearl Shrine, its pier
if (part('dock')) {
  S.phase = 'dock';
  if (!crossed) { await S.go('margarite'); await S.ticks(30); }
  // the posted board: F at it opens the Purser's counter; F spammed opens one; it can be shut
  await em('standBoard()'); await S.ticks(60); // (the chevron eases onto its thing)
  let ch = await em('chevron()');
  S.check('dock: the chevron is on the posted board', ch.cur === 'purser' && ch.shown && ch.off < 0.6, ch);
  await S.press('KeyF', 6); let w = await em('win()'); await S.shot('dock-purser');
  S.check('dock: F at the posted board opens the Purser\'s counter', w.shop === 'purser' || w.shopUI, { shop: w.shop, shopUI: w.shopUI, pause: w.pause });
  S.check('dock: the cursor is free at the counter', !w.locked, { locked: w.locked });
  const shopText = await S.ev(() => document.querySelector('#shop, .shop, #shopui')?.innerText || [...document.querySelectorAll('div')].filter((d) => d.offsetParent && /Purser/i.test(d.innerText || '')).map((d) => d.innerText).sort((a, b) => a.length - b.length)[0] || '');
  S.check('dock: no code ids or empty values at the counter', !(await S.ev((t) => __em.rawIds(t), shopText)).length, (await S.ev((t) => __em.rawIds(t), shopText)).slice(0, 6));
  await S.press('Escape', 4); w = await em('win()');
  S.check('dock: Esc shuts the counter, no pause under it', !w.shop && !w.shopUI && !w.pause, w);
  await S.closeAll(); await S.ev(() => __game.game.shops?.close?.()); await S.ticks(4);
  let most = 0, pauses = 0;
  for (let i = 0; i < REPS + 8; i++) { await S.page.keyboard.press('KeyF'); await S.ticks(2); const ww = await em('win()'); most = Math.max(most, [ww.shopUI || !!ww.shop, ww.index, ww.dialogue].filter(Boolean).length); if (ww.pause) pauses++; }
  S.check('dock: F spammed at the board opens one window at most', most <= 1 && pauses === 0, { mostAtOnce: most, pauses });
  await S.ev(() => __game.game.shops?.close?.()); await S.closeAll(); await S.ticks(4);
  // Letty Marque: F talks, the box can be left, F spammed opens one
  await em("standSpot('letty')"); await S.ticks(20);
  ch = await em('chevron()');
  const ml = await em('mark()');
  await S.press('KeyF', 6); w = await em('win()'); await S.shot('dock-letty');
  S.check('dock: F at Letty Marque opens the dialogue box', w.dialogue, { chevron: ch.cur, ref: ch.ref, dialogue: w.dialogue });
  await S.press('Escape', 6);
  S.note('dock: Esc in Letty\'s dialogue box', (await em('win()')).dialogue ? 'stays open (the box has no Esc: npc/dialogue.js reads F, Space, Enter, a click and the digits)' : 'closes it');
  // left as a person leaves it: F through her lines to the choices, then "Goodbye." by its digit; it stays shut
  let opts = null;
  for (let i = 0; i < 16 && !opts; i++) { await S.press('KeyF', 40); opts = await S.ev(() => __game.game.dialogue.open ? __game.game.dialogue.opts?.map((o) => o.text) || null : []); }
  const bye = (opts || []).findIndex((t) => /goodbye/i.test(t));
  if (bye >= 0) await S.press(`Digit${bye + 1}`, 6);
  for (let i = 0; i < 6 && (await em('win()')).dialogue; i++) await S.press('KeyF', 40); // (a last line after the goodbye)
  await S.ticks(30); w = await em('win()');
  S.check('dock: Letty\'s dialogue box is left by "Goodbye." and stays shut', bye >= 0 && !w.dialogue, { goodbye: bye >= 0 ? opts[bye] : null, choices: opts, open: w.dialogue });
  const said = await S.ev((mm) => __em.logSince(mm), ml);
  S.check('dock: what Letty says never calls the Courier she or he', !(await S.ev((l) => __em.gendered(l), said)).length, (await S.ev((l) => __em.gendered(l), said)));
  await S.closeAll(); await S.resume(); await S.ticks(4);
  // the Pearl Shrine: found and rested at with F, its page shut
  await em("standSpot('shrine')"); await S.ticks(20);
  ch = await em('chevron()');
  await S.press('KeyF', 6); w = await em('win()'); await S.shot('dock-shrine');
  const sh = await S.ev(() => ({ last: __game.game.shrines.last, found: __game.game.shrines.found.has('pearl') }));
  S.check('dock: F at the Pearl Shrine rests there and opens its page', sh.last === 'pearl' && sh.found && w.index, { chevron: ch.cur, ...sh, page: w.page });
  await S.press('KeyF', 6); w = await em('win()');
  S.check('dock: F closes the Shrine\'s page and it stays closed', !w.index, w);
  await S.closeAll(); await S.ticks(4);
  // the dock's pier: its page, from Margarite
  await em("standPier('margarite')"); await S.ticks(20);
  ch = await em('chevron()');
  await S.press('KeyF', 4); w = await em('win()');
  const txt = await em('menuText()');
  S.check('dock: F at the dock\'s pier opens its page, from Margarite', ch.cur === 'pier' && ch.ref === 'margarite' && w.page === 'pier' && /FROM MARGARITE/.test(txt) && /Anagami/.test(txt), { chevron: ch.cur, ref: ch.ref, page: w.page, text: txt.replace(/\n+/g, ' | ').slice(0, 160) });
  await S.shot('dock-pier-page');
  await S.closeAll(); await S.ticks(4);
  await S.common('dock: after');
}

// ---------------------------------------------------------------- the crossing back: the pirates, a continue taken, a second dearer, declined
if (part('back')) {
  S.phase = 'back';
  if (!crossed) { await S.go('margarite'); await S.ticks(30); }
  await S.ev(() => { const g = __game.game; for (let i = 0; i < 4; i++) g.pneuka.add('cask.mirth', 'test'); });
  const casks0 = await S.ev(() => __game.game.voyage.casks());
  const b = await board('margarite', 'Anagami', 'pirates');
  let s = await st();
  S.check('back: boarded at Margarite\'s pier for Anagami', b.ok && s.active && s.sailing?.to === 'anagami' && JSON.stringify(s.setPieces) === '["pirates"]', { ok: b.ok, active: s.active, sailing: s.sailing });
  if (s.active) {
    const pl = await em('plan()'), sp = pl.acts.find((a) => a.id === 'setpiece');
    const mt = await em('mark()');
    await S.ev(() => { __em.hull = true; }); // (a tester's hull to the set piece: the ship is broken below on purpose)
    s = await sailTo(sp.from + 2);
    await S.ev(() => { __em.hull = false; });
    const said = await S.ev((mm) => __em.logSince(mm), mt);
    S.check('back: the Wreckers\' first beat is said', said.some((t) => /Sails astern/.test(t)), said.slice(-4));
    await S.common('back: the pirates', { courier: false });
    // the ship borne all it can: the continue
    const mc = await em('mark()');
    await S.ev(() => { const E = __game.game.emocean; E.ship.mercy = 0; E.wound(E.run.bears - E.run.hits, { by: 'creature', what: 'test' }); }); await S.ticks(4);
    s = await st(); let w = await em('win()');
    const cost1 = await S.ev(() => { const E = __game.game.emocean; return __game.game.voyage.continueCost(Math.min(1, E.t / E.stage.seconds)); });
    const t1 = await em('menuText()'), fC = await S.shot('back-continue');
    S.check('continue: offered when the ship can bear no more', s.offering && w.page === 'continue' && new RegExp(`${cost1} cubes`).test(t1), { offering: s.offering, page: w.page, cost: cost1, text: t1.replace(/\n+/g, ' | ').slice(0, 200), file: path.basename(fC) });
    S.check('continue: the cursor is free on the coin\'s page', !w.locked, { locked: w.locked });
    const t1a = (await st()).t; await S.ticks(60);
    S.check('continue: the stage waits while it is offered', Math.abs((await st()).t - t1a) < 0.05, { before: t1a, after: (await st()).t });
    const cubesA = (await st()).cubes;
    await S.page.click('#indexmenu .room >> text=Continue'); await S.ticks(4);
    s = await st(); w = await em('win()');
    const ce = (await events(mc)).filter((e) => e.name === 'emocean.continue');
    S.check('continue: taken, paid, mended, the page shut', cubesA - s.cubes === cost1 && s.run.hits === 0 && !s.offering && !w.index && s.active && ce.length === 1 && ce[0].by === 'courier', { paid: cubesA - s.cubes, cost: cost1, hits: s.run.hits, offering: s.offering, page: w.page, events: ce.map((e) => e.d) });
    // a second: dearer, and declined by Esc (the page closed unanswered: the ship breaks up)
    await sail(150);
    await S.ev(() => { const E = __game.game.emocean; E.ship.mercy = 0; E.wound(E.run.bears - E.run.hits, { by: 'creature', what: 'test' }); }); await S.ticks(4);
    const cost2 = await S.ev(() => { const E = __game.game.emocean; return __game.game.voyage.continueCost(Math.min(1, E.t / E.stage.seconds)); });
    const base2 = await S.ev(() => { const E = __game.game.emocean, V = __game.game.voyage, c = V.s.sailing.continues; V.s.sailing.continues = 0; const b0 = V.continueCost(Math.min(1, E.t / E.stage.seconds)); V.s.sailing.continues = c; return b0; });
    S.check('continue: the second costs double', (await st()).offering && Math.abs(cost2 - 2 * base2) <= 1, { second: cost2, firstAtThisShare: base2 });
    const md = await em('mark()'), last = await S.ev(() => __game.game.shrines.last);
    await S.press('Escape', 4); await S.ticks(2); await S.settle(); await S.ticks(60);
    s = await st(); w = await em('win()');
    const de = await events(md), stg = de.find((e) => e.name === 'emocean.stage');
    const home = await S.ev(() => { const r = __game.game.shrines.reformAt(); return __sw.v(r.pos); });
    const dHome = Math.hypot(s.player[0] - home[0], s.player[2] - home[2]);
    const island = { bisque: 'anagami', lamp: 'anagami', float: 'anagami', pearl: 'margarite' }[last];
    S.check('continue: declined, made whole at the last Shrine', !s.active && !s.aboard && !s.hidden && dHome < 3 && s.at === island && !w.index && !w.pause, { last, at: s.at, player: s.player, shrine: home, fromShrine: +dHome.toFixed(2), page: w.page, pause: w.pause });
    S.check('continue: a broken crossing never medals, ranks C at best', stg && stg.d.passed === false && !stg.d.medal && stg.d.continues === 1 && !'SAB'.includes(stg.d.rank), stg?.d && { passed: stg.d.passed, rank: stg.d.rank, medal: stg.d.medal, continues: stg.d.continues });
    const casks1 = await S.ev(() => __game.game.voyage.casks());
    S.check('continue: declined, a quarter of the cargo is lost (or it spills)', casks1 === casks0 - Math.floor(casks0 / 4) || casks1 === 0, { before: casks0, after: casks1, lost: stg?.d.lost, spilled: stg?.d.spilled });
    await S.common('continue: declined, made whole');
  }
}

// ---------------------------------------------------------------- Old Nobody, home to Anagami's jetty
if (part('leviathan')) {
  S.phase = 'leviathan';
  const at = await S.ev(() => __game.game.voyage.at);
  if (at !== 'margarite') { await S.ev(() => { const g = __game.game; g.voyage.s.at = 'margarite'; }); await S.go('margarite'); await S.ticks(20); }
  const b = await board('margarite', 'Anagami', 'leviathan');
  let s = await st();
  S.check('leviathan: boarded with Old Nobody forced', b.ok && s.active && JSON.stringify(s.setPieces) === '["leviathan"]', { ok: b.ok, setPieces: s.setPieces });
  if (s.active) {
    const pl = await em('plan()'), sp = pl.acts.find((a) => a.id === 'setpiece'), mt = await em('mark()');
    await S.ev(() => { __em.hull = true; }); // (a tester's hull: the set piece is sailed to its end, not broken)
    s = await sailTo(sp.from + 3); await S.common('leviathan: Old Nobody', { courier: false });
    const piece = await sailTo(sp.from + 18); await S.common('leviathan: mid set piece', { courier: false });
    s = await sailOut(); await S.settle(); await S.ticks(90);
    await S.ev(() => { __em.hull = false; });
    s = await st();
    const said = await S.ev((mm) => __em.logSince(mm), mt), evs = await events(mt);
    S.check('leviathan: its first beat is said', said.some((t) => /The sea heaves/.test(t)), said.slice(0, 4));
    const end = evs.find((e) => e.name === 'rail.end'), stg = evs.find((e) => e.name === 'emocean.stage');
    S.check('leviathan: how it ended is an event with by', !end || end.by != null, end ? { end: end.d } : 'no rail.end (the set piece ran out)');
    S.note('leviathan: the stage', stg?.d && { end: stg.d.end, score: stg.d.score, rank: stg.d.rank, shards: stg.d.shards });
    const land = await em("pierEnd('anagami')");
    const dLand = Math.hypot(s.player[0] - land.end[0], s.player[2] - land.end[2]);
    S.check('leviathan: made port on Anagami\'s jetty, standing', !s.active && dLand < 3 && Math.abs(s.player[1] - land.top) < 0.6 && !s.hidden && s.at === 'anagami', { player: s.player, jettyEnd: land.end, top: land.top, fromEnd: +dLand.toFixed(2), at: s.at });
    await S.common('leviathan: home at the jetty');
  }
}

// ---------------------------------------------------------------- boarding and making port, many times over
if (part('repeat')) {
  S.phase = 'repeat';
  await toJetty(); await S.ev(() => { __game.game.voyage.s.at = 'anagami'; });
  // a crossing begun and ended once first (what is made on first need is made), then counted
  const once = async (from, label) => { const b = await board(from, label, 'shoal'); if (!b.ok) return false; await sail(120); await S.ev(() => __game.game.emocean.finish(true)); await S.ticks(2); await S.settle(); await S.ticks(20); return true; };
  await once('anagami', 'Margarite'); await once('margarite', 'Anagami');
  const c0 = await em('counts()');
  let fails = 0, stuck = [];
  for (let i = 0; i < REPS; i++) {
    const [from, label] = i % 2 ? ['margarite', 'Anagami'] : ['anagami', 'Margarite'];
    if (!(await once(from, label))) { fails++; continue; }
    const s = await st(); if (s.active || s.aboard || s.hidden || s.ship.shown) stuck.push({ i, active: s.active, aboard: s.aboard, hidden: s.hidden, ship: s.ship.shown });
  }
  const c1 = await em('counts()');
  S.check(`repeat: ${REPS} crossings boarded and ended cleanly`, !fails && !stuck.length, { fails, stuck: stuck.slice(0, 4) });
  S.check(`repeat: nothing left behind after ${REPS} crossings`, c1.objects - c0.objects <= 2 && c1.geometries - c0.geometries <= 4 && c1.textures - c0.textures <= 2, { before: c0, after: c1 });
  // boarded and left at once: the clock run out before the seam is done (a crossing finished while still casting off)
  const b = await board('anagami', 'Margarite', 'shoal');
  if (b.ok) { await S.ev(() => __game.game.emocean.finish(true)); await S.ev(() => __game.game.emocean.finish(true)); await S.ticks(2); await S.settle(); await S.ticks(20); }
  const s = await st();
  S.check('repeat: finished twice in a row, ended once', !s.active && !s.aboard && !s.hidden, { active: s.active, aboard: s.aboard, hidden: s.hidden, at: s.at });
  await S.common('repeat: after');
}

// ---------------------------------------------------------------- what the whole sweep heard
S.phase = 'end';
const all = await S.ev(() => __em.seen.filter((e) => /^(rail|emocean)\./.test(e.name)).map((e) => ({ name: e.name, by: e.by, keys: e.keys })));
const noBy = [...new Set(all.filter((e) => e.by == null).map((e) => e.name))], badKeys = [...new Set(all.filter((e) => e.keys.includes('name') || e.keys.includes('t')).map((e) => e.name))];
S.check('events: every rail.* and emocean.* event carries by', !noBy.length, noBy.length ? noBy : `${all.length} events`);
S.check('events: no payload uses name or t', !badKeys.length, badKeys.length ? badKeys : 'none');
const spawns = await em('spawns');
const inSwing = spawns.filter((x) => x.swinging);
S.check('crossing: nothing enters during a swing', !inSwing.length, inSwing.length ? inSwing.slice(0, 6) : `${spawns.length} entries`);
const late = spawns.filter((x) => x.bar - Math.floor(x.bar) > 0.1);
S.check('crossing: every wave enters on a bar line', !late.length, late.length ? late.slice(0, 6) : `${spawns.length} entries`);
const log = await em('logAll()');
S.check('log: never calls the Courier she or he', !(await S.ev((l) => __em.gendered(l), log)).length, await S.ev((l) => __em.gendered(l), log));
const words = log.filter((t) => /\blachryma\b/.test(t) || /\ba key\b/i.test(t));
S.check('log: Lachryma capitalised, a Possibilikey never "a key"', !words.length, words.length ? [...new Set(words)].slice(0, 4) : 'none');
S.check('log: no code ids or empty values said', !(await S.ev((l) => l.flatMap((t) => __em.rawIds(t)), log)).length, await S.ev((l) => l.filter((t) => __em.rawIds(t).length).slice(0, 6), log));
await S.done();
