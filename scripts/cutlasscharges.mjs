// ---------------------------------------------------------------------------------------
// THE CUTLASS'S CHARGES, TRACED: the Sondelass's cutlass driven headless frame by frame (60 Hz, `__game` manual, the clock and seed
// pinned: casebook 3) through LMB's press, its hold and its release, and RMB's, printing for each trace the moves begun (`cut.swing`),
// the frame each move's strike went live, and what the run ended in. It measures only (docs/plans/SONDELASS-FEEL.md 14):
//   tap4      LMB down 4 frames          -> [c1], live on the frame it was before the charge's gate (released after the gate: on release)
//   hold8     LMB down 8 frames          -> [c1], live one frame after the release
//   hold40    LMB down 40 frames         -> [burst] only, nothing live before the release
//   unlocked  W + LMB tapped, no lock    -> the string as it was
//   rmbTap / rmbHold40                   -> the stinger on release / the spin's charge and its turn
//   lockW / lockD                        -> with the lock on a slip jelly: W + LMB, D + LMB (the lock's directions)
//
//   CHROMIUM=/path/to/chrome node scripts/cutlasscharges.mjs [only,ids]      (prints JSON)
//
// Prior art: scripts/sondelassframes.mjs (the engine read in the game itself), scripts/poseaudit.run.js (the input held per tick).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';

const only = process.argv[2] ? process.argv[2].split(',') : null;
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 5243, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let code = 0;
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(`${server.resolvedUrls.local[0]}?clock=1791160275000&seed=7`, { waitUntil: 'commit' });
  for (let i = 0; i < 240; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const out = await page.evaluate(async (only) => {
    const G = __game, g = G.game, I = G.input, P = g.player, THREE = G.THREE;
    document.getElementById('overlay').style.display = 'none'; I.enabled = true;
    const C = g.character.clips.clips;
    for (let i = 0; i < 60 && !C.Sond_Combo1; i++) await new Promise((r) => setTimeout(r, 500));
    try { g.lend?.set?.('moves', true); } catch { /* (STORY) */ }
    const held = new Set(); let taps = [];
    const tick = () => { G.tick(1 / 60); for (const x of taps) if (!held.has(x)) I.down.delete(x); taps = []; };
    const hold = (...k) => { for (const x of k) { if (!held.has(x)) I.pressed.add(x); held.add(x); I.down.add(x); } };
    const free = (...k) => { for (const x of k) { held.delete(x); I.down.delete(x); } };
    const press = (...k) => { for (const x of k) { I.pressed.add(x); I.down.add(x); taps.push(x); } };
    const S = g.techs.get('sondelass'), cut = S.cutlass, M = cut.moves;
    const reset = () => { free(...held); I.down.clear(); I.pressed.clear(); cut.cancel(); g.lock?.release?.('test'); for (let i = 0; i < 90; i++) tick(); };
    const STAGE = new THREE.Vector3(-10, -14, -10);
    g.places.stand(STAGE.clone(), Math.PI / 2); for (let i = 0; i < 40; i++) tick();
    if (!g.belt.isMain('sondelass')) { g.belt.equip('sondelass', 'main', { quiet: true }); for (let i = 0; i < 4; i++) tick(); }
    press('KeyX'); for (let i = 0; i < 150 && S.drawT < 0.999; i++) tick();
    for (let i = 0; i < 40; i++) tick();
    const swings = [], specials = [], spins = [], waves = [];
    g.events.on('cut.swing', (e) => swings.push({ move: e.move, f: F }));
    g.events.on('cut.stinger', () => specials.push({ move: 'stinger', f: F }));
    g.events.on('move.special', (e) => specials.push({ move: e.special, f: F }));
    g.events.on('cut.spin', (e) => spins.push({ beat: e.beat, k: e.k && +e.k.toFixed(2), f: F }));
    g.events.on('cut.wave', (e) => waves.push({ beat: e.beat, k: e.k && +e.k.toFixed(2), f: F }));
    let F = 0;
    /** One trace: `plan(f)` called each frame before the tick (press and free there), `n` frames; what began, when each went live. */
    const trace = (id, n, plan, setup) => {
      reset(); g.lachryma.value = g.lachryma.max ?? 100; setup?.();
      swings.length = 0; specials.length = 0; spins.length = 0; waves.length = 0;
      const live = []; let was = null;
      for (F = 0; F < n; F++) {
        plan(F); tick();
        const c = M.cur, tr = c?.def.track, on = !!(c && tr && c.t >= tr.strike[0] && c.tPrev < tr.strike[1] && c.kind !== 'charge-hold');
        const key = c ? `${c.id}` : null;
        if (on && was !== key) live.push({ move: c.id, kind: c.kind, f: F });
        was = on ? key : (c ? was : null);
      }
      const dbg = { drawT: +S.drawT.toFixed(2), form: S.form, inHand: g.belt.inHand?.id, en: I.enabled, techs: g.techs.active?.id, pos: P.pos.toArray().map((v) => +v.toFixed(1)), grounded: P.grounded };
      return { id, dbg, swings: swings.map((s) => `${s.move}@${s.f}`), live: live.map((l) => `${l.move}@${l.f}`), specials: specials.map((s) => `${s.move}@${s.f}`), spins: spins.map((s) => `${s.beat}${s.k != null ? `(${s.k})` : ''}@${s.f}`), waves: waves.map((s) => `${s.beat}${s.k != null ? `(${s.k})` : ''}@${s.f}`), stinging: cut.stinging };
    };
    const lmb = (down) => (f) => { if (f === 0) hold('Mouse0'); if (f === down) free('Mouse0'); };
    const rmb = (down) => (f) => { if (f === 0) hold('Mouse2'); if (f === down) free('Mouse2'); };
    const lockOn = () => { // (a slip jelly in front, locked)
      const j = (g.creatures.list || []).filter((c) => c.alive && c.kind === 'slipjelly' && !c.ally).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos))[0];
      if (!j) return false;
      const at = j.pos.clone().add(new THREE.Vector3(0, 0, 4)); g.places.stand(at, Math.PI); for (let i = 0; i < 20; i++) tick();
      g.lock.acquire(); for (let i = 0; i < 10; i++) tick(); return !!g.lock.active;
    };
    const T = [];
    const want = (id) => !only || only.includes(id);
    if (want('tap4')) T.push(trace('tap4', 70, lmb(4)));
    if (want('hold8')) T.push(trace('hold8', 70, lmb(8)));
    if (want('hold40')) T.push(trace('hold40', 120, lmb(40)));
    if (want('unlocked')) T.push(trace('unlocked', 70, (f) => { if (f === 0) hold('KeyW', 'Mouse0'); if (f === 3) free('Mouse0'); if (f === 30) free('KeyW'); }));
    if (want('rmbTap')) T.push(trace('rmbTap', 70, rmb(4)));
    if (want('rmbHold40')) T.push(trace('rmbHold40', 160, rmb(70)));
    if (want('lockW') || want('lockD')) {
      g.places.travel?.('weir'); for (let i = 0; i < 400 && g.seam?.busy; i++) tick(); for (let i = 0; i < 60; i++) tick();
      const ok = lockOn();
      T.push({ id: 'lock', ok, target: g.lock.target?.ref?.kind });
      if (ok && want('lockW')) T.push(trace('lockW', 70, (f) => { if (f === 0) hold('KeyW', 'Mouse0'); if (f === 3) free('Mouse0'); if (f === 20) free('KeyW'); }, lockOn));
      if (ok && want('lockD')) T.push(trace('lockD', 70, (f) => { if (f === 0) hold('KeyD', 'Mouse0'); if (f === 3) free('Mouse0'); if (f === 20) free('KeyD'); }, lockOn));
    }
    return T;
  }, only);
  if (errs.length) console.error('page errors:', errs.slice(0, 5).join(' | '));
  console.log(JSON.stringify(out, null, 1));
} catch (e) { console.error(e); code = 1; }
await browser.close(); await server.close();
process.exit(code);
