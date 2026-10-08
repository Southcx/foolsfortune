// ---------------------------------------------------------------------------------------
// THE SHOT FIELD, CHECKED headless (src/world/emocean/shotfield.js, patternplayer.js, legrunner.js; the split with Petra, 2026-10-08):
// every leg played whole at 60 frames a second into the field against a stand-in ship that weaves, and the rules held one by one. One
// PASS/FAIL line a check, as the sweeps. `node scripts/shotfield.mjs`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ShotField, CAP } from '../src/world/emocean/shotfield.js';
import { PatternPlayer } from '../src/world/emocean/patternplayer.js';
import { LegRunner } from '../src/world/emocean/legrunner.js';
import { LEGS } from '../src/progress/rail/legs.js';

let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const rail = { toWorld: (l, out) => out.copy(l), dirWorld: (v, out) => out.copy(v) };
const lcg = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const ship = (form = 'astral') => ({ local: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(), form, turning: false, hurtR: 0.35, hits: 0, drunk: 0, back: 0,
  hit() { this.hits++; return true; }, absorb() { this.drunk++; }, returned() { this.back++; } });
/** A stand-in for the waves' roll: foes that come down the rail and hold, enough for the runner and the player to find throwers. */
function stubWaves() {
  return { foes: [], spawned: 0, struck: 0,
    spawn(w) { for (let i = 0; i < w.count; i++) this.foes.push({ role: w.role, alive: true, t: 0, local: new THREE.Vector3((i - w.count / 2) * 2.4, 4, w.role === 'heavy' ? 40 : 80) }); this.spawned += w.count; },
    add(spec) { const f = { ...spec, alive: true, t: 0, local: spec.local.clone() }; this.foes.push(f); return f; },
    step(dt) { for (const f of this.foes) { if (!f.alive) continue; f.t += dt; if (f.tick) { if (f.tick(dt, f) === false) f.alive = false; continue; } f.local.z = Math.max(f.role === 'heavy' ? 30 : -20, f.local.z - 14 * dt); if (f.local.z <= -20 || f.t > 24) f.alive = false; } this.foes = this.foes.filter((f) => f.alive); },
    hitAt(p, r) { return this.foes.find((f) => f.alive && f.local.distanceTo(p) < 1 + r) || null; },
    strike(f) { this.struck++; f.alive = false; } };
}

// ---- every leg, stormed, played whole
const BAR = 1.5, dt = 1 / 60;
for (const type of Object.keys(LEGS)) {
  const field = new ShotField({ rail }), player = new PatternPlayer(field, { rng: lcg(3) }), waves = stubWaves(), S = ship();
  const run = new LegRunner({ waves, player, object: () => waves.foes.find((f) => f.role === 'heavy' && f.alive) || null, onDirector: () => {} });
  run.begin({ type, strength: 2, feel: 'grief', storm: true });
  let t = 0, leak = false;
  while (!run.done || player.playing || field.live) {
    t += dt; const bar = t / BAR;
    S.local.set(Math.sin(t * 0.9) * 6, Math.cos(t * 0.6) * 2, 0); S.vel.set(Math.cos(t * 0.9) * 5.4, 0, 0);
    run.update(bar); waves.step(dt); player.update(dt, S); field.update(dt, { ship: S, waves });
    if (field.live < 0 || field.live > CAP || field.free.length + field.live !== CAP) leak = true;
    if (t > run.plan.bars * BAR + 30) break;
  }
  check(`${type}: played whole, the pool never leaks, nothing dropped`, !leak && field.live === 0 && field.counts.dropped === 0, { fired: field.counts.fired, peak: field.peak, hits: S.hits, drunk: S.drunk, dropped: field.counts.dropped, seconds: +t.toFixed(1) });
}

// ---- the rules one by one
{ const F = new ShotField({ rail }), S = ship('astral');
  F.fire({ pos: [0, 0, 10], dir: [0, 0, -1], speed: 20, kind: 'astral', motion: { type: 'straight' } });
  F.fire({ pos: [0.1, 0, 12], dir: [0, 0, -1], speed: 20, kind: 'umbral', motion: { type: 'straight' } });
  for (let i = 0; i < 90; i++) F.update(dt, { ship: S });
  check('a shot of the ship\'s form is drunk, the other kind hurts', S.drunk === 1 && S.hits === 1, { drunk: S.drunk, hits: S.hits }); }
{ const F = new ShotField({ rail }), S = ship('umbral'); F.fire({ pos: [0, 0, 8], dir: [0, 0, -1], speed: 12, kind: 'gift', motion: { type: 'straight' } }, { ship: S });
  for (let i = 0; i < 90; i++) F.update(dt, { ship: S });
  check('a gift takes the ship\'s form when fired, and is drunk', S.drunk === 1 && S.hits === 0); }
{ const F = new ShotField({ rail }), S = ship('astral'), thrower = { alive: true, local: new THREE.Vector3(0, 0, 20) }, W = stubWaves(); W.foes.push(thrower);
  S.turning = true; F.fire({ pos: [0, 0, 6], dir: [0, 0, -1], speed: 14, kind: 'umbral', outlined: true, motion: { type: 'straight' } }, { from: thrower });
  for (let i = 0; i < 120; i++) F.update(dt, { ship: S, waves: W });
  check('the roll sends an outlined shot home to its thrower', S.back === 1 && W.struck === 1 && S.hits === 0, { back: S.back, struck: W.struck }); }
{ const F = new ShotField({ rail }), S = ship('astral'); S.turning = true;
  F.fire({ pos: [0, 0, 6], dir: [0, 0, -1], speed: 14, kind: 'umbral', motion: { type: 'straight' } });
  for (let i = 0; i < 90; i++) F.update(dt, { ship: S });
  check('the roll turns a plain shot of the other kind aside', S.hits === 0 && F.counts.turned === 1); }
{ const F = new ShotField({ rail }), S = ship('astral'); S.local.set(12, 0, 0);
  const x = F.fire({ pos: [0, 0, 30], dir: [0, 0, -1], speed: 12, kind: 'umbral', motion: { type: 'homing', turn: 80 * Math.PI / 180, life: 2.2, N: 3.5 } });
  let worst = 0, prev = x.dir.clone();
  for (let i = 0; i < 200 && x.on; i++) { F.update(dt, { ship: S }); worst = Math.max(worst, Math.acos(Math.min(1, prev.dot(x.dir))) / dt); prev.copy(x.dir); }
  check('a homer turns no faster than its cap (80 degrees a second)', worst <= 80 * Math.PI / 180 + 1e-3, `${(worst * 180 / Math.PI).toFixed(1)} deg/s`); }
{ const F = new ShotField({ rail }), S = ship('astral'); S.local.set(0, 0, 0);
  F.fire({ pos: [0, 0, 20], dir: [0, 0, -1], speed: 0, kind: 'umbral', motion: { type: 'laser', warn: 0.75, burn: 2, from: -0.3, to: 0.3, reach: 60 } });
  let warnHits = 0; for (let i = 0; i < 40; i++) { F.update(dt, { ship: S }); warnHits = S.hits; }
  for (let i = 0; i < 180; i++) F.update(dt, { ship: S });
  check('a laser warns harmlessly, then its beam hurts once', warnHits === 0 && S.hits === 1, { warnHits, hits: S.hits }); }
{ const F = new ShotField({ rail }), P = new PatternPlayer(F, { rng: lcg(5) }), S = ship(), thrower = { alive: true, local: new THREE.Vector3(0, 4, 40) };
  P.play('spiral', {}, { from: thrower, kind: 'umbral' }); for (let i = 0; i < 30; i++) P.update(dt, S);
  const before = F.counts.fired; thrower.alive = false; for (let i = 0; i < 300; i++) P.update(dt, S);
  check('a thrower downed takes its unfired volleys with it', F.counts.fired === before && P.playing === 0, { firedBefore: before, after: F.counts.fired }); }
{ const F = new ShotField({ rail }); for (const motion of [{ type: 'decel', T: 0.5, burst: 10, childSpeed: 9 }, { type: 'split', T: 0.5, m: 5, spread: 40, childSpeed: 9 }]) F.fire({ pos: [0, 0, 40], dir: [0, 0, -1], speed: 10, kind: 'astral', motion });
  for (let i = 0; i < 40; i++) F.update(dt, {});
  check('a decelerating shell bursts into a ring, a splitting one into a fan', F.live === 15, `${F.live} live`); }
{ const F = new ShotField({ rail, cap: 8 }); for (let i = 0; i < 12; i++) F.fire({ pos: [0, 0, 40], dir: [0, 0, -1], speed: 1, kind: 'astral' });
  check('a full pool drops a shot and says so, never grows', F.live === 8 && F.counts.dropped === 4); }

console.log(fails ? `shotfield: ${fails} FAILED` : 'shotfield: all passed'); process.exitCode = fails ? 1 : 0;
