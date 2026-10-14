// ---------------------------------------------------------------------------------------
// THE RACEWAY'S DRIVER (Dovina's diagnostic, the owner 2026-10-14: "do you need better diagnostic tooling for when running your headless
// races?"): the game headless (vite on :5173), the Courier on the Solar Skiff, an autopilot racing a track (or riding one of its rails),
// and a report: laps, gates, bails and why, respawns, grinds, the combo, the top speed, the fastest and slowest stretches; and a trace
// (JSON: frames [x, y, z, speed, s], marks [{ kind, x, z, ... }]) that scripts/raceway/map.mjs draws over the park.
//   node scripts/raceway/drive.mjs [--track sun|gorge|coaster] [--laps 1] [--cave (lap 2 through the cavern)] [--rail <id> (onto that
//   coaster rail at its start, and ride it out)] [--trace out.json] [--secs 400] [--clock ms]
// The autopilot steers at a point ahead on the line (on the sand A / D, gliding Q / E), runs the sail full, never spins in the air: a
// test of the course, not of a player.
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const cfg = { track: opt('track', 'sun'), laps: +opt('laps', 1), cave: !!opt('cave', false), rail: opt('rail', null), trace: opt('trace', null), secs: +opt('secs', 400), clock: opt('clock', '1791160275000') };
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 640, height: 400 } }), errs = [];
p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
await p.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
await p.goto(`http://localhost:5173/?seed=1&clock=${cfg.clock}`, { waitUntil: 'commit' });
for (let i = 0; i < 150; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await p.evaluate('!!window.__ready').catch(() => false)) break; }
await p.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true;`);
const r = await p.evaluate(async (cfg) => {
  const G = __game, g = G.game, P = g.player, keys = new Set(), ev = {}, marks = [], frames = [], log = [];
  g.input.isDown = (c) => keys.has(c);
  const watch = ['race.start', 'race.go', 'race.gate', 'race.lap', 'race.finish', 'race.end', 'race.respawn', 'skiff.bail', 'skiff.glide', 'skiff.landhard', 'skiff.plate', 'skiff.carve', 'skiff.wobble', 'skiff.trick',
    'skiff.grind', 'skiff.grind.end', 'skiff.ring', 'skiff.combo.bank', 'skiff.combo.drop', 'raceway.branch', 'raceway.pit', 'skiff.land.slope', 'geyser.launch'];
  for (const n of watch) g.events.on(n, (e) => {
    ev[n] = (ev[n] || 0) + 1; const R = g.raceway, at = { x: +(P.pos.x - 6000).toFixed(1), z: +P.pos.z.toFixed(1), y: +(P.pos.y + 420).toFixed(1), s: Math.round(R.s), track: R.track?.id, line: R.line };
    if (/bail|respawn|pit|grind.end|branch|lap|finish/.test(n)) { marks.push({ kind: n.replace('skiff.', '').replace('race.', ''), ...at, ...Object.fromEntries(Object.entries(e).filter(([k]) => !['name', 't', 'by'].includes(k))) }); }
  });
  const t0 = performance.now(); g.course.goRoom('raceway'); const build = performance.now() - t0;
  for (let i = 0; i < 30; i++) G.tick(1 / 60);
  const R = g.raceway, T = R.trackOf(cfg.track), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let t = 0, maxV = 0, air = 0, grindT = 0, railRide = null;
  if (cfg.rail) { // onto a coaster rail's start, mounted, moving along it at a coaster's speed, and locked
    const Rl = R.rails.find((x) => x.id === cfg.rail || x.track === cfg.rail && x.coaster); if (!Rl) return { error: `no rail ${cfg.rail}` };
    const a = Rl.pts[2], b2 = Rl.pts[6], yaw = Math.atan2(b2.x - a.x, b2.z - a.z);
    g.course.teleport(a.clone().setY(a.y + 1.2), yaw); P.techs.get('skiff').mount(); for (let i = 0; i < 70; i++) G.tick(1 / 60);
    const S = P.techs.get('skiff'); S.v.set(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(22); S.heading = yaw; P.pos.copy(a).setY(a.y + 0.9); S.air = true; P.vel.y = -1;
    railRide = { len: Math.round(Rl.len), maxRun: 0, minUpY: 1 };
  } else g.race.start(cfg.track);
  for (let i = 0; i < cfg.secs * 60; i++) {
    const S = P.techs.get('skiff'); keys.clear();
    if (S && g.techs.active?.id === 'skiff' && S.phase === 'ride' && !cfg.rail) {
      const Bn = T.branch, cave = cfg.cave && g.race.lap === 2 && Bn, fz = Bn ? ((R.s - Bn.from) % T.length + T.length) % T.length : 1e9;
      const into = cave && (R.line === 'cavern' ? R.sb < Bn.length - 15 : (fz > T.length - 50 || fz < 5));
      const ahead = into ? Bn.frame((R.line === 'cavern' ? R.sb : 0) + 18 + S.v.length() * 0.4) : T.frame(R.s + 22 + S.v.length() * 0.5);
      const want = Math.atan2(ahead.x - (P.pos.x - 6000), ahead.z - P.pos.z), err = wrap(want - S.heading);
      if (!S.gliding) keys.add('KeyW'); else if (P.pos.y - R.heightAt(P.pos.x, P.pos.z) > 10) keys.add('KeyW');
      if (S.gliding) { if (err < -0.05) keys.add('KeyE'); else if (err > 0.05) keys.add('KeyQ'); }
      else if (!S.air) { if (err < -0.04) keys.add('KeyD'); else if (err > 0.04) keys.add('KeyA'); }
      if (S.grind.on) { if (S.grind.lean > 0.15) keys.add('KeyD'); else if (S.grind.lean < -0.15) keys.add('KeyA'); } // (the balance answered)
      if (g.race.state === 'grid' && g.race.count < 1.05) keys.add('KeyW');
    }
    if (cfg.rail && S?.grind?.on) { keys.add('KeyW'); if (S.grind.lean > 0.15) keys.add('KeyD'); else if (S.grind.lean < -0.15) keys.add('KeyA'); railRide.maxRun = Math.max(railRide.maxRun, Math.round(S.grind.run)); railRide.minUpY = Math.min(railRide.minUpY, +S.grind.up.y.toFixed(2)); }
    else if (S?.parked && g.techs.active?.id !== 'skiff') keys.add('KeyF');
    G.tick(1 / 60); t += 1 / 60;
    if (S) { maxV = Math.max(maxV, S.speed || 0); if (S.air) air++; if (S.grind?.on) grindT++; }
    if (i % 6 === 0) frames.push([+(P.pos.x - 6000).toFixed(1), +(P.pos.y + 420).toFixed(1), +P.pos.z.toFixed(1), +(S?.speed || 0).toFixed(1), Math.round(R.s)]);
    if (cfg.rail && t > 3 && !S?.grind?.on && ev['skiff.grind.end']) { for (let k = 0; k < 120; k++) G.tick(1 / 60); break; }
    if (!cfg.rail && g.race.lap > cfg.laps && g.race.running) { g.race.end('test'); break; }
    if (!cfg.rail && !g.race.running && ev['race.finish']) break;
  }
  return { build: Math.round(build), t: +t.toFixed(1), track: T.id, laps: g.race.laps, ev, marks: marks.slice(0, 60), maxV: +maxV.toFixed(1), airS: +(air / 60).toFixed(1), grindS: +(grindT / 60).toFixed(1), railRide, frames, cond: R.condition?.key };
}, cfg);
if (cfg.trace && r.frames) writeFileSync(cfg.trace, JSON.stringify({ frames: r.frames, marks: r.marks }));
delete r.frames; console.log(JSON.stringify(r, null, 1)); console.log('errors', errs.slice(0, 8)); await b.close();
