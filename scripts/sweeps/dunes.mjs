// ---------------------------------------------------------------------------------------
// THE DUNES SWEEP: Anagami's sand sea driven headless as a person would and as a careless one would, with a screenshot at every step
// and one PASS/FAIL line a check. What it sweeps: every place in the Dunes (the oasis and the Weir, Old Grog's pier, the shore, the
// waterline and the jetty, the Gnomon, the mouth of the Great Dunemaw, the Lamp Shrine and the Float Shrine); the Weir's ground (no
// key help painted on the sand: CLAUDE.md, marks in the world are not text); the busker's mat (F without the Crucibelle worn, then with
// it: the rhythm mode begun, Esc, F spammed, travel away mid-song, begun and quit many times); the Solar Skiff (Y to mount, sail, a hop,
// a trick and a wobble landing that is a bail, Y to dismount, Y spammed, travel away mid-ride and back, a resize mid-ride); the Solar
// Skiffing trial at the Gnomon (begun, its rings lit, the course run in order and out of order, refused at night, left by leaving the
// Dunes, begun and left many times); a slip geyser's launch; a crystal struck with the Dreamvane's pick until it gives; the Shrines
// (found with F, rested at, their page opened and closed, F spammed, fast travel between the found ones); the pier's page at the jetty's
// end; and the weather as the game hour moves (night, dawn, a storm: the pall, and noon again), with the frame watched for a flash.
// Every event seen is kept; the Dunes' own events without `by` fail. Exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/dunes.mjs [--out dir] [--seed 1] [--quick] [--only places,weir,busk,...]   (shots to <out>/shots, default <tmp>/sweeps/dunes)
//   parts: places weir busk skiff solar geyser crystal shrines jetty weather   (--only runs some, in that order)
//
// The game hour is moved by the replay's own clock (game.replay.header.wall: debug/replay.js, the calendar reads game.wallNow), so the
// rest of the world turns with it as it would in play; it is put back to the pinned noon at the end of the weather part.
//
// Prior art: scripts/sweeps/garden.mjs and workshop.mjs (the page measured from inside through window.__game, the harness), scripts/
// stress.mjs (manual mode, the clock pinned: the casebook's rule 3), a QA team's smoke pass (every place entered, every window opened
// and shut, every trial begun and abandoned), and speedrunners' route-breaking (a ring course is run backwards first: the oldest
// exploit of a checkpoint race, Mario Kart's and Pilotwings' included).
// Dovina's (mechanical testing: the owner, 2026-10-07).
// ---------------------------------------------------------------------------------------
import path from 'path';
import { open, args } from './harness.mjs';

const S = await open('dunes');
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const part = (id) => !only || only.has(id);
const quick = S.quick;
const REPS = quick ? 4 : 12;

// ---- the page's side: what this sweep measures beyond the harness's
const DS_JS = `
window.__ds = (() => {
  const G = __game, g = G.game, THREE = G.THREE, v = __sw.v;
  const seen = [];
  { const E = g.events, emit = E.emit; E.emit = function (n, d = {}) { if (n !== 'skiff.tick') seen.push({ name: n, keys: Object.keys(d || {}), by: d && 'by' in d ? d.by : undefined }); return emit.call(this, n, d); }; } // (the payload as sent, before the bus adds its own; the skiff's per-step telemetry left out)
  const skiff = () => g.techs.list.find((t) => t.id === 'skiff');
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const D = {
    seen,
    mark() { return { ev: seen.length, log: g.log.lines.length }; },
    eventsSince(m) { return seen.slice(m.ev); },
    logSince(m) { return g.log.lines.slice(m.log).map((l) => l.text); },
    logTail(n = 6) { return g.log.lines.slice(-n).map((l) => l.text); },
    /** Every window and hold a person could be in. */
    win() {
      const ov = document.getElementById('overlay');
      return { pause: ov.style.display !== 'none', index: !!g.indexMenu?.open, page: g.indexMenu?.page?.name || null, codex: !!g.codex?.open, pneuka: !!g.pneukaUI?.open,
        map: !!g.cartography?.open, dialogue: !!g.dialogue?.open, rhythm: !!g.rhythm?.active, busk: g.busk?.playing || null, solar: !!g.solar?.running,
        tech: g.techs?.active?.id || null, realm: !!g.realm?.active, god: g.god?.state || null, enabled: !!G.input.enabled, freeze: !!g.player.freeze };
    },
    closeAll() {
      if (g.rhythm?.active) g.rhythm.end(false);
      if (g.dialogue?.open) g.dialogue.end();
      g.pneukaUI?.open && g.pneukaUI.close(); g.codex?.open && g.codex.close?.(); g.cartography?.open && g.cartography.hide?.(); g.indexMenu?.open && g.indexMenu.close();
      document.getElementById('overlay').style.display = 'none'; G.input.enabled = true;
    },
    /** What is in the world: objects in the scene, the renderer's own counts. */
    counts() { let n = 0; g.scene.traverse(() => n++); const i = G.renderer.info; return { objects: n, top: g.scene.children.length, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length ?? null }; },
    /** The interact chevron against the thing it is on. */
    chevron() { const I = g.interact, C = I.chevron, cur = I.cur; return { cur: cur?.id || null, ref: typeof cur?.ref === 'string' ? cur.ref : null, at: cur ? v(cur.pos) : null, shown: C.group.visible, chev: v(C.group.position), off: cur ? +C.group.position.distanceTo(cur.pos).toFixed(2) : null }; },
    stand(p, yaw = 0) { const ok = !!g.places.stand(new THREE.Vector3(...p), yaw); g.player.yaw = yaw; return ok; },
    /** Stand on the sand at (x, z), facing a yaw. */
    standOn(x, z, yaw = 0, lift = 0.1) { return D.stand([x, g.dunes.heightAt(x, z) + lift, z], yaw); },
    pos() { return v(g.player.pos); },
    /** A line that calls the Courier he or she (the game says "you"). */
    gendered(lines) { return lines.filter((t) => /\\b(Courier|Couriers?'s?)\\b[^.]*\\b(she|he|her|him|his|hers|himself|herself)\\b/i.test(t) || /^(She|He) /.test(t)); },
    // ---- the Solar Skiff
    skiff() { const K = skiff(); return { tech: g.techs.active?.id || null, want: !!K.want, shown: !!K.skiff.group.visible, sail: +K.L.toFixed(2), speed: +(K.speed || 0).toFixed(1), air: !!K.air, spin: +K.spin.toFixed(2), cross: g.hud.el.cross?.style.display ?? null, sfxLoop: !!K.sfxLoop, pos: v(g.player.pos) }; },
    // ---- the Solar Skiffing trial
    solar() { const s = g.solar; return { running: s.running, next: s.next, missed: s.missed, t: +(s.t || 0).toFixed(1), lit: s.lit, rings: s.rings.length, shown: s.rings.filter((R) => R.look.group.visible).length, taken: s.rings.filter((R) => R.taken).length }; },
    /** Set down a few metres before ring i on its line, facing along it (where a person would be lining up to pass it). */
    beforeRing(i, back = 3) { const R = g.solar.rings[i], p = R.pos.clone().addScaledVector(R.dir, -back), yaw = Math.atan2(R.dir.x, R.dir.z); return D.standOn(p.x, p.z, yaw); },
    // ---- the Weir's ground: a floor label carrying a second line (the key help a sign would have said: basement.js label's sub)
    paintedHelp() {
      const out = [], P = g.player.pos;
      g.scene.traverse((o) => {
        const m = o.isMesh && o.material, im = m?.map?.image;
        if (!im || im.width !== 512 || im.height !== 160 || !(im instanceof HTMLCanvasElement)) return; // (basement.js labelTexture: the one canvas of this size)
        const wp = o.getWorldPosition(new THREE.Vector3()); if (wp.distanceTo(P) > 120 || !shown(o)) return;
        const px = im.getContext('2d').getImageData(0, 108, 512, 40).data; let ink = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 40) ink++;
        out.push({ pos: v(wp), subInk: ink });
      });
      return { labels: out.length, withHelp: out.filter((o) => o.subInk > 200).length, at: out.filter((o) => o.subInk > 200).map((o) => o.pos).slice(0, 4) };
    },
    // ---- the clock (the replay's header: debug/replay.js wallNow)
    clockShift(ms) { const h = g.replay.header; h.wall += ms - g.wallNow(); return g.weather.sky(); },
    findTime(kind, from = null) { const now = from ?? g.wallNow(), W = g.weather; for (let k = 0; k < 24 * 60; k++) { const ms = now + k * 75000, w = W.at('anagami', ms);
      if (kind === 'night' ? w.dayPhase === 'night' && w.phase > 0.9 : kind === 'dawn' ? w.dayPhase === 'dawn' : kind === 'storm' ? w.aspect === 'dread' && w.strength > 0.4 && w.dayPhase === 'day' && W.at('anagami', ms + 120000).aspect === 'dread' : false) return ms + 60000; } return null; },
    sky() { const L = g.weatherLook, w = g.weather.here(g.player.pos); return { phase: w.dayPhase, aspect: w.aspect, strength: w.strength, amt: L.amt ? Object.fromEntries(Object.entries(L.amt).filter(([, a]) => a > 0.01).map(([k, a]) => [k, +a.toFixed(2)])) : null, lift: +(L.lift || 0).toFixed(3), bg: g.scene.background?.isColor ? '#' + g.scene.background.getHexString() : 'texture', fog: g.scene.fog ? '#' + g.scene.fog.color.getHexString() : null }; },
  };
  return D;
})();
`;
const install = async () => { await S.page.addScriptTag({ content: DS_JS }); };
await install();
const ds = (expr) => S.page.evaluate(`__ds.${expr}`);
const F = async (n = 6) => S.press('KeyF', n);
const closeAll = async () => { await ds('closeAll()'); await S.ticks(4); };
const moveTest = async () => { const a = await ds('pos()'); await S.hold('KeyW', 40); const b = await ds('pos()'); return +Math.hypot(b[0] - a[0], b[2] - a[2]).toFixed(2); };
const name = (f) => path.basename(f);
const wrap = (o) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, x]));
/** The sound, as the start button would (the overlay's click: main.js start -> sfx.unlock). Headless, the rhythm mode needs it. */
const unlockAudio = async () => { await S.ev(() => __game.player.sfx.unlock()); await S.page.keyboard.press('ShiftLeft'); await S.page.waitForTimeout(200); await S.ev(() => __game.player.sfx.unlock()); await S.page.waitForTimeout(200); return S.ev(() => __game.player.sfx.ctx?.state ?? null); };

/** Travel, then on foot: arriving in the Dunes can put the Courier back on the skiff unasked (checked in the skiff part), and the other
 *  parts want them walking. */
const goFoot = async (p) => { const r = await S.go(p); if (await S.ev(() => __game.game.techs.active?.id === 'skiff')) await S.press('KeyY', 12); return r; };
/** A part, run to its end or failed with what stopped it; a page reloaded under it (the shared dev server's HMR) is opened again. */
async function run(id, fn, retry = true) {
  if (!part(id)) return;
  S.phase = id;
  try { await fn(); }
  catch (e) {
    const alive = await S.page.evaluate('!!window.__ds && !!window.__sw && !!window.__game?.game').catch(() => false);
    if (!alive) { // (the shared dev server reloaded the page under the part: opened again, and the part run once more)
      S.note(`${id}: the page reloaded under the part (opened again)`, String(e.message || e).slice(0, 120));
      await S.page.close().catch(() => {}); await S.openPage(); await install();
      if (retry) return run(id, fn, false);
    }
    S.check(`${id}: ran to its end`, false, String(e.message || e).split('\n')[0].slice(0, 200));
  }
  try { await closeAll(); } catch { /* the next part opens what it needs */ }
}

// ================================================================== 1. every place in the Dunes, entered and seen
await run('places', async () => {
  const want = ['dunes', 'weir', 'folk.grog', 'tithe', 'shore', 'jetty', 'well.mouth'];
  const have = new Set((await S.sw('places()')).map((p) => p.id));
  S.check('places: the Dunes\' places are registered', want.every((p) => have.has(p)), { missing: want.filter((p) => !have.has(p)) });
  const dunesPos = await S.ev(() => __game.game.places.pos('dunes')?.toArray()), weirPos = await S.ev(() => __game.game.places.pos('weir')?.toArray());
  S.note('places: "dunes" and "weir" are one point', { dunes: dunesPos?.map((x) => +x.toFixed(1)), weir: weirPos?.map((x) => +x.toFixed(1)), same: JSON.stringify(dunesPos) === JSON.stringify(weirPos) });
  // the landmarks the game has no place for: the Gnomon, the Shrines, the busker's mat (an agent cannot be sent there by name)
  S.note('places: Dunes landmarks with no place id', ['gnomon', 'shrine.lamp', 'shrine.float', 'busk.weir'].filter((p) => !have.has(p)));
  for (const p of want) {
    const r = await S.go(p);
    S.check(`places: travel to ${p} accepted`, r?.ok !== false, r);
    const c = await S.common(`place-${p}`);
    const st = c.state;
    S.check(`places ${p}: in the Dunes' zones`, ['dunes', 'beach'].includes(st.zone), { zone: st.zone, layer: st.layer });
    await S.ticks(90);
    const after = await ds('pos()');
    S.check(`places ${p}: stands where set down (no fall, no slide)`, Math.abs(after[1] - st.player[1]) < 1.5 && Math.hypot(after[0] - st.player[0], after[2] - st.player[2]) < 1.5, { at: st.player, after1_5s: after });
  }
  // the world is controllable after every travel
  const d = await moveTest();
  S.check('places: the Courier walks after the travels', d > 1, { metres: d });
  // the Courier never called he or she in what the log said
  const g1 = await ds('gendered(__ds.logTail(60))');
  S.check('places: the log never calls the Courier she or he', !g1.length, g1.length ? g1 : 'none');
});

// ================================================================== 2. the Weir's ground: no key help painted on the sand
await run('weir', async () => {
  await goFoot('weir');
  await S.ticks(10);
  const p = await ds('paintedHelp()');
  await S.ev(() => { const g = __game.game; g.player.pitch = -0.9; });
  await S.ticks(2);
  const f = await S.shot('weir-ground-help');
  S.check('weir: no key help painted on the oasis\'s ground', p.withHelp === 0,
    { ...p, file: name(f), cause: 'tools/sondelass/angling/weir.js T(): label() subs ("Q draw · 2 the rod ...", "1 cutlass · LMB combo ...", "F open ...")' });
  S.note('weir: floor labels with words near the oasis (marks in the world carry no words)', p.labels);
});

// ================================================================== 3. the busker's mat on Old Grog's pier
await run('busk', async () => {
  await goFoot('weir');
  const mat = await S.ev(() => __game.game.busk?.built.get('weir')?.pos.toArray() || null);
  S.check('busk: the mat on Old Grog\'s pier is laid', !!mat, mat);
  if (!mat) return;
  await ds(`stand([${mat[0]}, ${mat[1] + 0.05}, ${mat[2] - 0.6}], 0)`); await S.ticks(40);
  const ch = await ds('chevron()');
  S.check('busk: the chevron is on the mat', ch.cur === 'busk' && ch.off < 0.6, ch);
  // without the Crucibelle worn
  await S.ev(() => __game.game.belt.takeOff('crucibelle', true));
  let m = await ds('mark()');
  await F(6);
  let w = await ds('win()');
  const said = await ds(`logSince(${JSON.stringify(m)})`);
  S.check('busk: F without the Crucibelle worn says why, and begins nothing', !w.rhythm && said.some((t) => /Crucibelle/.test(t)), { rhythm: w.rhythm, said });
  // with it
  await S.ev(() => __game.game.belt.wear('crucibelle'));
  await S.ticks(4);
  const audio = await unlockAudio();
  S.note('busk: the sound unlocked (headless)', audio);
  m = await ds('mark()');
  await F(8);
  w = await ds('win()');
  const f1 = await S.shot('busk-song');
  S.check('busk: F with the Crucibelle worn begins the rhythm mode', w.rhythm && w.busk === 'weir', { ...wrap(w), file: name(f1) });
  if (!w.rhythm) return;
  S.check('busk: the song holds the Courier (the rhythm tech)', w.tech === 'rhythm', { tech: w.tech });
  const ev1 = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('busk: busk.start and rhythm.start say by', ['busk.start', 'rhythm.start'].every((n) => ev1.some((e) => e.name === n && e.by === 'courier')), ev1.map((e) => `${e.name}:${e.by}`));
  // F spammed mid-song: no second song, no window
  const r0 = await S.ev(() => __game.game.events.counts['rhythm.start'] || 0);
  for (let i = 0; i < 10; i++) await F(2);
  const r1 = await S.ev(() => __game.game.events.counts['rhythm.start'] || 0);
  w = await ds('win()');
  S.check('busk: F spammed mid-song begins no second song', r1 === r0 && w.rhythm && !w.index, { started: r1 - r0, rhythm: w.rhythm, index: w.index });
  // walk off: the body is held by the song, so walking cannot end it (busk.js says "walk off the mat's pier ... the song stops")
  const walked = await moveTest();
  S.note('busk: metres walked with W held mid-song (the rhythm tech holds the body; busk.js LEAVE=6 is reachable only by travel)', walked);
  // Esc ends it, and the world is given back
  m = await ds('mark()');
  await S.press('Escape', 6); await S.resume(); await S.ticks(6);
  w = await ds('win()');
  const ev2 = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('busk: Esc ends the song (rhythm.quit, by courier)', !w.rhythm && !w.busk && ev2.some((e) => e.name === 'rhythm.quit' && e.by === 'courier'), { rhythm: w.rhythm, busk: w.busk, ev: ev2.map((e) => e.name) });
  S.check('busk: after the song the Courier walks', (await moveTest()) > 1, 'W held 40 ticks');
  // travel away mid-song ends it
  await ds(`stand([${mat[0]}, ${mat[1] + 0.05}, ${mat[2] - 0.6}], 0)`); await S.ticks(20); await F(8);
  const playing = (await ds('win()')).rhythm;
  await S.go('workshop');
  w = await ds('win()');
  S.check('busk: travel away mid-song ends it', playing && !w.rhythm && !w.busk && w.tech !== 'rhythm', { begun: playing, after: wrap(w) });
  await S.common('busk-after-travel');
  // begun and quit many times: nothing left behind
  await goFoot('weir'); await ds(`stand([${mat[0]}, ${mat[1] + 0.05}, ${mat[2] - 0.6}], 0)`); await S.ticks(20);
  const c0 = await ds('counts()');
  let begun = 0;
  for (let i = 0; i < REPS; i++) { await F(6); if ((await ds('win()')).rhythm) begun++; await S.press('Escape', 4); await S.resume(); await S.ticks(4); }
  const c1 = await ds('counts()');
  w = await ds('win()');
  S.check(`busk: begun and quit ${REPS} times, it ends quit`, begun === REPS && !w.rhythm && w.tech !== 'rhythm', { begun, rhythm: w.rhythm, tech: w.tech });
  S.check(`busk: begun and quit ${REPS} times, nothing leaks`, c1.geometries - c0.geometries <= 4 && c1.textures - c0.textures <= 2, { before: c0, after: c1 });
  // a resize mid-song
  await F(6);
  await S.page.setViewportSize({ width: 640, height: 400 }); await S.ticks(10);
  const f2 = await S.shot('busk-resized');
  const hw = await S.ev(() => { const H = __game.game.rhythm.highway, c = H.canvas; const r = c?.getBoundingClientRect?.(); return c ? { w: c.width, h: c.height, css: r ? [Math.round(r.width), Math.round(r.height), Math.round(r.right), Math.round(r.bottom)] : null } : null; });
  S.check('busk: resized mid-song, the highway stays inside the view', !hw?.css || (hw.css[2] <= 640 && hw.css[3] <= 400), { ...hw, file: name(f2) });
  await S.page.setViewportSize({ width: 960, height: 600 }); await S.ticks(6);
  await S.press('Escape', 4); await S.resume();
});

// ================================================================== 4. the Solar Skiff
await run('skiff', async () => {
  await S.go('dunes'); await S.ticks(10);
  const m0 = await ds('mark()');
  await S.press('KeyY', 12);
  let k = await ds('skiff()');
  S.check('skiff: Y mounts the Solar Skiff', k.tech === 'skiff', k);
  await S.hold('KeyW', 150);
  k = await ds('skiff()');
  const f1 = await S.shot('skiff-sailing');
  S.check('skiff: W hoists the sail and it sails', k.sail > 0.9 && k.speed > 4 && k.shown, { ...k, file: name(f1) });
  await S.common('skiff-sailing-common');
  // a hop and a trick (a whole turn, landed square), then a wobble (most of a turn): a wobble landing is a bail (progress/combat/moves.js: 'skiff.bail')
  const hop = async (steer) => { await S.page.keyboard.down('Space'); await S.ticks(40); await S.page.keyboard.up('Space'); await S.ticks(2); await S.page.keyboard.down('KeyA'); await S.ticks(steer); await S.page.keyboard.up('KeyA'); await S.ticks(90); };
  let m = await ds('mark()');
  await hop(48);
  let ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('skiff: a whole turn landed square is a trick', ev.some((e) => e.name === 'skiff.trick'), ev.map((e) => e.name));
  m = await ds('mark()');
  await hop(22);
  ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  const wob = ev.some((e) => e.name === 'skiff.wobble');
  S.note('skiff: the wobble landing happened', wob);
  if (wob) S.check('skiff: a wobble landing is a bail (skiff.bail, by courier)', ev.some((e) => e.name === 'skiff.bail' && e.by === 'courier'),
    { seen: ev.map((e) => e.name), cause: 'courier/skiff/skiff.js land(): a wobble emits skiff.wobble only; nothing in src emits skiff.bail (tracking/moves.js and the "Eat Sand" achievement wait on it)' });
  // Y dismounts; the world is given back
  await S.press('KeyY', 12);
  k = await ds('skiff()');
  S.check('skiff: Y dismounts (the skiff hidden, the reticle back, its sound stopped)', !k.tech && !k.shown && k.cross === '' && !k.sfxLoop, k);
  S.check('skiff: on foot again, the Courier walks', (await moveTest()) > 1, 'W held 40 ticks');
  // Y spammed: an even number of presses ends where it began
  for (let i = 0; i < 20; i++) await S.press('KeyY', 1);
  await S.ticks(20);
  k = await ds('skiff()');
  S.check('skiff: Y pressed 20 times ends on foot', !k.tech && !k.shown, k);
  if (k.tech) { await S.press('KeyY', 12); }
  // travel away mid-ride and back: the skiff gone in the workshop, and on foot on return (skiff.js update: leaving the Dunes drops the want)
  await S.press('KeyY', 12); await S.hold('KeyW', 30);
  await S.go('workshop');
  k = await ds('skiff()');
  const fw = await S.shot('skiff-travelled-workshop');
  S.check('skiff: travel to the workshop mid-ride ends the ride', !k.tech && !k.shown && k.cross === '', { ...k, file: name(fw) });
  await S.go('dunes');
  k = await ds('skiff()');
  S.check('skiff: back in the Dunes, the Courier arrives on foot (no ride asked for)', !k.tech, { ...k, cause: k.tech ? 'courier/skiff/skiff.js: the tech ended by the travel before its update saw the Dunes inactive, so want stayed true and canStart() mounts it again on arrival' : null });
  if (k.tech) await S.press('KeyY', 12);
  // a resize mid-ride
  await S.press('KeyY', 12); await S.hold('KeyW', 30);
  await S.page.setViewportSize({ width: 640, height: 400 }); await S.ticks(20);
  const rs = await S.ev(() => ({ cw: __game.renderer.domElement.clientWidth, ch: __game.renderer.domElement.clientHeight, aspect: +__game.camera.aspect.toFixed(3) }));
  await S.shot('skiff-resized');
  S.check('skiff: resized mid-ride, the canvas and camera follow', rs.cw === 640 && rs.ch === 400 && Math.abs(rs.aspect - 1.6) < 0.01, rs);
  await S.page.setViewportSize({ width: 960, height: 600 }); await S.ticks(10);
  // mounted and stowed many times: nothing leaks
  await S.press('KeyY', 12);
  const c0 = await ds('counts()');
  for (let i = 0; i < REPS; i++) { await S.press('KeyY', 8); await S.hold('KeyW', 8); await S.press('KeyY', 8); }
  const c1 = await ds('counts()');
  S.check(`skiff: mounted and stowed ${REPS} times, nothing leaks`, c1.geometries - c0.geometries <= 4 && c1.textures - c0.textures <= 2, { before: c0, after: c1 });
  const all = await ds(`eventsSince(${JSON.stringify(m0)})`);
  const noBy = [...new Set(all.filter((e) => /^skiff\./.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.check('skiff: its events say by (a trick counts toward records)', !noBy.length, noBy.join(' ') || 'all carry by');
});

// ================================================================== 5. the Solar Skiffing trial at the Gnomon
await run('solar', async () => {
  await goFoot('dunes');
  const G = await S.ev(() => __game.game.dunes.gnomon?.toArray());
  S.check('solar: the Gnomon stands', !!G, G);
  if (!G) return;
  const atFoot = () => ds(`standOn(${G[0] + 15}, ${G[2] + 5}, ${-Math.PI / 2})`);
  await atFoot(); await S.ticks(30);
  const ch = await ds('chevron()');
  S.check('solar: the chevron is on the Gnomon at its foot', ch.cur === 'solar' && ch.off < 0.6, ch);
  await S.common('solar-gnomon');
  let m = await ds('mark()');
  await F(8);
  let s = await ds('solar()');
  const f1 = await S.shot('solar-begun');
  S.check('solar: F at the Gnomon\'s foot by day begins the trial, its rings shown', s.running && s.shown === s.rings && s.rings === 24, { ...s, file: name(f1) });
  S.check('solar: trial.solar.start says by', (await ds(`eventsSince(${JSON.stringify(m)})`)).some((e) => e.name === 'trial.solar.start' && e.by === 'courier'), 'trial.solar.start');
  // F spammed while it runs: begins nothing more
  const n0 = await S.ev(() => __game.game.events.counts['trial.solar.start'] || 0);
  for (let i = 0; i < 10; i++) await F(2);
  const n1 = await S.ev(() => __game.game.events.counts['trial.solar.start'] || 0), sAfter = await ds('solar()');
  S.check('solar: F spammed mid-trial begins no second trial', n1 === n0, { starts: n1 - n0, running: sAfter.running, t: sAfter.t, next: sAfter.next, cause: n1 !== n0 ? 'world/dunes/solar.js update() starts on interact.cur \'solar\' + F, and start() does not refuse while running; courier/interact.js keeps the last offer up to 0.24 s after offer() returns null, so an F in that window restarts the clock' : null });
  // the course run backwards first: the last ring is the nearest to the Gnomon. Through it, on foot, the trial must not finish
  const d = await S.ev(() => { const g = __game.game, P = g.player.pos; return g.solar.rings.map((R, i) => [i, +R.pos.distanceTo(P).toFixed(1)]).sort((a, b) => a[1] - b[1]).slice(0, 3); });
  S.note('solar: the rings nearest the Gnomon\'s foot (index, metres)', d);
  m = await ds('mark()');
  const cubes0 = await S.ev(() => __game.game.ledger.get?.('cube.earned') ?? null);
  await ds('beforeRing(23)'); await S.ticks(4);
  await S.hold('KeyW', 90);
  s = await ds('solar()');
  const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  const fin = ev.find((e) => e.name === 'trial.solar');
  const said = await ds(`logSince(${JSON.stringify(m)})`);
  const cubes1 = await S.ev(() => __game.game.ledger.get?.('cube.earned') ?? null);
  await S.shot('solar-last-ring-first');
  S.check('solar: through the last ring first (on foot, 23 rings skipped) does not finish the course', !fin && s.running,
    { running: s.running, next: s.next, missed: s.missed, t: s.t, finished: !!fin, said: said.slice(-4), cubesPaid: cubes0 != null && cubes1 != null ? cubes1 - cubes0 : null,
      cause: 'world/dunes/solar.js update(): any later ring is taken (next = i + 1), the skipped lit rings cost 2 s each (23 x 2 = 46 s, under gold\'s 60), and next >= 24 finishes' });
  // the trial is Solar Skiffing: a ring passed on foot should not count
  if (!s.running) { await atFoot(); await S.ticks(10); await F(8); }
  s = await ds('solar()');
  if (s.running) {
    await ds(`beforeRing(${s.next})`); await S.ticks(4); await S.hold('KeyW', 90);
    const s2 = await ds('solar()');
    S.check('solar: a ring passed on foot does not count (the trial is ridden on the skiff)', s2.taken === s.taken, { before: s.taken, after: s2.taken, onFoot: true });
  }
  // left by leaving the Dunes: its rings go, trial.solar.end says why and by
  m = await ds('mark()');
  await S.go('workshop');
  s = await ds('solar()');
  const ev3 = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('solar: leaving the Dunes ends the trial and hides its rings', !s.running && s.shown === 0, s);
  S.check('solar: trial.solar.end { why: left } says by', ev3.some((e) => e.name === 'trial.solar.end' && e.by === 'courier'), ev3.map((e) => `${e.name}:${e.by}`));
  // begun on the skiff (the way it is meant), Esc mid-trial and a window over it, then many times begun and left
  await goFoot('dunes'); await atFoot(); await S.ticks(10);
  await S.press('KeyY', 12);
  const onSkiff = (await ds('skiff()')).tech === 'skiff';
  await F(8);
  s = await ds('solar()');
  const it = await S.ev(() => ({ cur: __game.game.interact.cur?.id || null, offer: !!__game.game.solar.offer() }));
  S.check('solar: F at the Gnomon\'s foot begins it while riding the skiff', !onSkiff || s.running, { onSkiff, running: s.running, ...it, cause: onSkiff && !s.running ? 'courier/interact.js update(): every offer is hidden while the skiff tech is active, so the solar source (and its F) never reaches the rider' : null });
  await S.press('KeyM', 6); await S.shot('solar-map-over'); await S.press('KeyM', 6);
  await closeAll();
  const c0 = await ds('counts()');
  for (let i = 0; i < Math.ceil(REPS / 2); i++) { await S.go('workshop'); await goFoot('dunes'); await atFoot(); await S.ticks(6); await F(8); }
  await S.go('workshop');
  const c1 = await ds('counts()');
  S.check(`solar: begun and left ${Math.ceil(REPS / 2)} times, nothing leaks`, c1.geometries - c0.geometries <= 8 && c1.textures - c0.textures <= 2, { before: c0, after: c1 });
  if ((await ds('skiff()')).tech) await S.press('KeyY', 12);
});

// ================================================================== 6. a slip geyser's launch
await run('geyser', async () => {
  await goFoot('dunes');
  // the one nearest its eruption (a person waits by the one that rumbles): its index, where it stands, the seconds until its column
  const G0 = await S.ev(() => { const L = __game.game.geysers?.list || []; if (!L.length) return null;
    const until = (G) => G.look.state === 'rumble' ? G.look.left : G.look.state === 'dormant' ? G.look.left + 2 : G.look.state === 'erupt' ? 0 : G.look.left + 40;
    const i = L.map((G, i) => [i, until(G)]).sort((a, b) => a[1] - b[1])[0][0]; return { i, pos: L[i].pos.toArray(), until: +until(L[i]).toFixed(1), state: L[i].look.state }; });
  S.check('geyser: the slip geysers stand', !!G0, G0);
  if (!G0) return;
  await ds(`standOn(${G0.pos[0] + 1}, ${G0.pos[2]}, 0)`);
  const m = await ds('mark()');
  let launched = null;
  for (let i = 0; i < Math.ceil((G0.until + 6) * 6) && !launched; i++) {
    await S.ticks(10);
    const st = await S.ev((k) => { const g = __game.game, Gy = g.geysers.list[k]; return { state: Gy.look.state, launching: !!Gy.look.launching, y: g.player.pos.y, vy: g.player.vel.y }; }, G0.i);
    if (st.launching) { await S.ticks(20); const y = await S.ev(() => __game.game.player.pos.y); launched = { ...st, rise: +(y - G0.pos[1]).toFixed(1) }; }
  }
  const f = await S.shot('geyser-launch');
  S.check('geyser: standing in its ring when it erupts throws the Courier up', !!launched && launched.rise > 3, { launched, file: name(f) });
  const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('geyser: geyser.launch says by', ev.some((e) => e.name === 'geyser.launch' && e.by), ev.filter((e) => /geyser/.test(e.name)).map((e) => `${e.name}:${e.by}`));
  await S.ticks(180);
  await S.common('geyser-landed');
});

// ================================================================== 7. a crystal struck with the Dreamvane's pick
await run('crystal', async () => {
  await goFoot('dunes');
  await S.ev(() => __game.game.belt.wear('dreamvane'));
  const c = await S.ev(() => { const g = __game.game, P = g.player, THREE = __game.THREE; const L = g.crystals.list.filter((e) => !e.veiled && e.hp > 0).sort((a, b) => a.ground.distanceTo(P.pos) - b.ground.distanceTo(P.pos)); const e = L[0]; if (!e) return null;
    const p = e.ground.clone().add(new THREE.Vector3(e.r + 1, 0, 0)); p.y = g.dunes.heightAt(p.x, p.z) + 0.1; const yaw = Math.atan2(e.ground.x - p.x, e.ground.z - p.z); g.places.stand(p, yaw); P.yaw = yaw; P.pitch = -0.2;
    return { i: g.crystals.list.indexOf(e), hp: e.hp, kind: e.tune.kind }; });
  S.check('crystal: a whole crystal in the Dunes', !!c, c);
  if (!c) return;
  await S.ticks(10);
  await S.press('KeyK', 50);
  S.check('crystal: K draws the Dreamvane', (await S.ev(() => __game.game.belt.inHand?.id ?? null)) === 'dreamvane', 'belt.inHand');
  const m = await ds('mark()');
  const hp = [];
  for (let k = 0; k < c.hp + 3 && hp[hp.length - 1] !== 0; k++) { await S.page.mouse.down(); await S.ticks(3); await S.page.mouse.up(); await S.ticks(80); hp.push(await S.ev((i) => __game.game.crystals.list[i].hp, c.i)); }
  const f = await S.shot('crystal-struck');
  const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('crystal: the pick takes it a blow at a time until it gives', hp[hp.length - 1] === 0 && ev.some((e) => e.name === 'crystal.harvest'), { hp, file: name(f) });
  const noBy = [...new Set(ev.filter((e) => /^(crystal|cube|bauble)\./.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.check('crystal: what it pays says by (cube.earn, cube.spill)', !noBy.length, { noBy, cause: noBy.length ? 'world/treasure/cubes.js earn(): emits cube.earn { n, why } with no by' : null });
  await S.press('KeyK', 30);
});

// ================================================================== 8. the Shrines: found, rested at, their page, fast travel
await run('shrines', async () => {
  await goFoot('dunes'); await S.ticks(4);
  const built = await S.ev(() => __game.game.shrines.list.map((s) => s.id));
  S.check('shrines: the Lamp Shrine and the Float Shrine are built', built.includes('dunemaw') && built.includes('pier'), built);
  const before = (id) => S.ev((id) => { const g = __game.game, s = g.shrines.get(id), f = [Math.sin(s.yaw), 0, Math.cos(s.yaw)]; g.places.stand(new __game.THREE.Vector3(s.pos.x + f[0] * 1.4, s.pos.y + 0.05, s.pos.z + f[2] * 1.4), s.yaw + Math.PI); g.player.yaw = s.yaw + Math.PI; return true; }, id);
  for (const [id, label] of [['dunemaw', 'the Lamp Shrine'], ['pier', 'the Float Shrine']]) {
    await before(id); await S.ticks(30);
    const ch = await ds('chevron()');
    S.check(`shrines ${label}: the chevron is on it`, ch.cur === 'shrine' && ch.ref === id && ch.off < 0.6, ch);
    const m = await ds('mark()');
    await F(8);
    const w = await ds('win()');
    const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
    S.check(`shrines ${label}: F finds it, rests and opens its page`, w.index && w.page === id && ev.some((e) => e.name === 'shrine.rest'), { page: w.page, ev: ev.map((e) => `${e.name}:${e.by}`) });
    await S.common(`shrine-${id}-page`);
    const text = await S.ev(() => document.getElementById('indexmenu')?.innerText || '');
    S.check(`shrines ${label}: its page carries no movement calibration`, !/CALIBRATION/.test(text), /CALIBRATION/.test(text) ? 'feedback/indexmenu.js render(): the calibration is appended under every page, a Shrine\'s too' : 'none');
    S.check(`shrines ${label}: its page shows no code id`, !/\b(dunemaw|pier|workshop|margarite)\b/.test(text.split('\n').slice(0, 12).join(' ')), text.split('\n').slice(0, 6));
    // F closes it, and does not reopen it (indexmenu.js closes on keydown; the same F is still latched for shrines.update)
    const r0 = await S.ev(() => __game.game.events.counts['shrine.rest'] || 0);
    await F(8);
    const w2 = await ds('win()');
    const r1 = await S.ev(() => __game.game.events.counts['shrine.rest'] || 0);
    S.check(`shrines ${label}: F closes its page (and does not rest again)`, !w2.index && r1 === r0, { index: w2.index, restsByThatF: r1 - r0, cause: w2.index ? 'feedback/indexmenu.js:58 closes the page on keydown F; P.latch(KeyF) is still set, and world/shrines.js update() (interact offers again once the menu is shut) rests and opens it again' : null });
    await closeAll();
    // Esc closes it, and the Courier walks after
    await F(8); await S.press('Escape', 6); await S.resume(); await S.ticks(4);
    const w3 = await ds('win()');
    S.check(`shrines ${label}: Esc closes its page`, !w3.index, { index: w3.index });
    await closeAll();
    S.check(`shrines ${label}: after the page the Courier walks`, (await moveTest()) > 1, 'W held 40 ticks');
  }
  // fast travel: from the Float Shrine's page to the Lamp Shrine (a click on the row, as a person would)
  await before('pier'); await S.ticks(20); await F(8);
  const m = await ds('mark()');
  const clicked = await S.ev(() => { const row = [...document.querySelectorAll('#indexmenu .room')].find((r) => /the Lamp Shrine/.test(r.textContent)); if (!row) return false; row.click(); return true; });
  await S.ticks(4); await S.settle(); await S.ticks(20);
  const at = await S.ev(() => { const g = __game.game, s = g.shrines.get('dunemaw'); return { d: +Math.hypot(g.player.pos.x - s.pos.x, g.player.pos.z - s.pos.z).toFixed(2), last: g.shrines.last, index: g.indexMenu.open }; });
  const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  S.check('shrines: the Float Shrine\'s page travels to the Lamp Shrine', clicked && at.d < 3 && !at.index && ev.some((e) => e.name === 'shrine.travel' && e.by === 'courier'), { clicked, ...at, ev: ev.map((e) => e.name) });
  await S.common('shrine-travelled-lamp');
  // travelled there and back many times: nothing leaks, the Courier stands
  const c0 = await ds('counts()');
  for (let i = 0; i < Math.ceil(REPS / 2); i++) for (const to of ['pier', 'dunemaw']) { await S.ev((to) => __game.game.shrines.travel(to), to); await S.ticks(4); await S.settle(); await S.ticks(6); }
  const c1 = await ds('counts()');
  S.check(`shrines: travelled between them ${Math.ceil(REPS / 2) * 2} times, nothing leaks`, c1.geometries - c0.geometries <= 4 && c1.textures - c0.textures <= 2, { before: c0, after: c1 });
  await S.common('shrine-travel-stress');
  const noBy = [...new Set((await ds('seen')).filter((e) => /^shrine\./.test(e.name) && !e.by).map((e) => e.name))];
  S.check('shrines: their events say by', !noBy.length, noBy.join(' ') || 'all carry by');
});

// ================================================================== 9. the shore, the waterline and the jetty's end (the pier's page)
await run('jetty', async () => {
  await S.go('shore');
  await S.common('shore');
  // walked into the crude: the wall stands a step out past the waterline (beach.js SHORE.wall 2.5 m)
  const sea = await S.ev(() => { const g = __game.game, B = g.dunes.beach, P = g.player.pos; const d = new __game.THREE.Vector3(P.x - B.center.x, 0, P.z - B.center.z).normalize(); const yaw = Math.atan2(d.x, d.z); g.player.yaw = yaw; return { yaw, shore: +B.shoreAt(P.x, P.z).toFixed(1) }; });
  await S.hold('KeyW', quick ? 240 : 420);
  const out = await S.ev(() => { const g = __game.game, B = g.dunes.beach, P = g.player.pos; return { shore: +B.shoreAt(P.x, P.z).toFixed(2), y: +P.y.toFixed(2), seaY: +B.seaY.toFixed(2) }; });
  await S.shot('shore-waterline');
  S.check('jetty: walked out to sea, the wall holds the Courier (never past a step into the crude)', out.shore > -4, { from: sea, stopped: out });
  S.note('jetty: where the walk to sea stopped, metres from the waterline (+ dry, - in the crude; the wall stands 2.5 m out)', out.shore);
  await S.go('jetty');
  const deck = await S.ev(() => { const g = __game.game, B = g.dunes.beach; return { y: +g.player.pos.y.toFixed(2), top: +B.jetty.top.toFixed(2), sand: +g.dunes.heightAt(B.jetty.end.x, B.jetty.end.z).toFixed(2), seaY: +B.seaY.toFixed(2) }; });
  await S.ticks(90);
  const deck2 = await S.ev(() => ({ y: +__game.game.player.pos.y.toFixed(2), zone: __game.game.zones.current }));
  S.check('jetty: travel to the jetty sets the Courier on its deck (not under the crude)', Math.abs(deck.y - deck.top) < 1.5 && Math.abs(deck2.y - deck.top) < 1.5,
    { setDownAt: deck, after1_5s: deck2, cause: 'world/places.js travel(): a place whose whole is the dunes is set at dunes.heightAt (the sea floor under the jetty), not on the jetty\'s deck; they sink through the crude and the floor to killY' });
  if (Math.abs(deck2.y - deck.top) > 1.5) await S.ev(() => { const g = __game.game, B = g.dunes.beach, e = B.jetty.end; g.places.stand(new __game.THREE.Vector3(e.x - 1.6, B.jetty.top + 0.1, e.z), Math.PI / 2); g.player.yaw = Math.PI / 2; }); // (set down on the deck by hand, to go on)
  await S.ticks(30);
  const ch = await ds('chevron()');
  S.check('jetty: the chevron is on the jetty\'s end', ch.cur === 'pier' && ch.off < 0.6, ch);
  await F(8);
  let w = await ds('win()');
  S.check('jetty: F at its end opens the pier\'s page', w.index && w.page === 'pier', { page: w.page });
  const text = await S.ev(() => document.getElementById('indexmenu')?.innerText || '');
  await S.common('jetty-pier-page');
  S.check('jetty: the pier\'s page carries no movement calibration', !/CALIBRATION/.test(text), /CALIBRATION/.test(text) ? 'feedback/indexmenu.js render()' : 'none');
  await F(8);
  w = await ds('win()');
  S.check('jetty: F closes the pier\'s page (and does not reopen it)', !w.index, { index: w.index, page: w.page, cause: w.index ? 'feedback/indexmenu.js closes the page on keydown F; the same press stays latched, and world/emocean/pier.js update() opens it again (as world/shrines.js does)' : null });
  await closeAll();
  S.check('jetty: after the page the Courier stands on the jetty', (await S.ev(() => { const g = __game.game; return g.player.pos.y > g.dunes.beach.seaY; })), await ds('pos()'));
});

// ================================================================== 10. the weather as the game hour moves
await run('weather', async () => {
  await goFoot('dunes');
  const noon = await S.ev(() => __game.game.wallNow());
  const m = await ds('mark()');
  for (const kind of ['night', 'dawn', 'storm']) {
    const at = await ds(`findTime('${kind}', ${noon})`);
    if (!at) { S.note(`weather ${kind}: none found within 60 game days`, null); continue; }
    await ds(`clockShift(${at})`);
    await S.ticks(300); // (5 s: the look eases in at 0.6 a second)
    const sky = await ds('sky()');
    // the frame watched for a flash: the canvas's mean light, every third tick for a second and a half
    const L = []; for (let i = 0; i < 30; i++) { await S.ticks(3); L.push((await S.sw('lum()')).mean); }
    const jump = Math.max(...L.slice(1).map((x, i) => Math.abs(x - L[i])));
    const c = await S.common(`weather-${kind}`);
    S.check(`weather ${kind}: the hour is what was set`, kind === 'storm' ? sky.aspect === 'dread' : sky.phase === kind, sky);
    S.check(`weather ${kind}: no flash on the screen (frame to frame)`, jump < 18, { maxJump: +jump.toFixed(1), lum: [Math.min(...L), Math.max(...L)].map((x) => +x.toFixed(1)), lift: sky.lift });
    if (kind === 'storm') S.note('weather storm: the pall as drawn (the sky against fair noon\'s #b7d3e7)', { bg: sky.bg, fog: sky.fog, amt: sky.amt, file: name(c.file) });
    if (kind === 'night') {
      // the Solar Skiffing trial is closed at night, and says so
      const G = await S.ev(() => __game.game.dunes.gnomon?.toArray());
      await ds(`standOn(${G[0] + 15}, ${G[2] + 5}, ${-Math.PI / 2})`); await S.ticks(20);
      const m2 = await ds('mark()');
      await F(8);
      const s = await ds('solar()'), said = await ds(`logSince(${JSON.stringify(m2)})`);
      S.check('weather night: the Solar Skiffing trial is closed, and the log says so', !s.running && s.shown === 0 && said.some((t) => /night/i.test(t)), { running: s.running, said });
      await goFoot('dunes');
    }
  }
  await ds(`clockShift(${noon})`); await S.ticks(300);
  const back = await ds('sky()');
  S.check('weather: the clock put back, it is daytime and fair again', back.phase === 'day', back);
  await S.common('weather-noon-again');
  const ev = await ds(`eventsSince(${JSON.stringify(m)})`);
  const noBy = [...new Set(ev.filter((e) => /^(weather|day)\./.test(e.name) && !e.by).map((e) => e.name))];
  S.check('weather: day.phase and weather.change say by', ev.some((e) => e.name === 'day.phase') && !noBy.length, { seen: [...new Set(ev.filter((e) => /^(weather|day)\./.test(e.name)).map((e) => e.name))], noBy });
});

// ================================================================== the end: what the log said, the events without by
{
  S.phase = 'end-checks';
  const lines = await ds('logTail(400)').catch(() => []);
  const raw = lines.filter((t) => /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|\b(?:mat|cask|cube|npc|shrine|trial|skiff|key)\.[a-z]+\b/.test(t));
  S.check('log: no code ids or undefined in what it said', !raw.length, raw.slice(0, 6));
  S.check('log: the article fits the word ("a Apprentice")', !lines.some((t) => /\ba [AEIOU]/.test(t)), lines.filter((t) => /\ba [AEIOU]/.test(t)).slice(0, 3));
  const g = await ds('gendered(__ds.logTail(400))').catch(() => []);
  S.check('log: never calls the Courier she or he', !g.length, g.length ? g : 'none');
  const all = await ds('seen').catch(() => []);
  const ours = /^(skiff|cube|crystal|geyser|trial\.solar|busk|rhythm|shrine|pier|weather|day)\b/;
  const noBy = [...new Set(all.filter((e) => ours.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.check('events: the Dunes\' events all say by', !noBy.length, noBy.join(' ') || 'all carry by');
  S.note('events: every name seen', [...new Set(all.map((e) => e.name))].join(' '));
}
await S.done();
