// ---------------------------------------------------------------------------------------
// FIRE IN THE TOY CITY, THE RUNTIME (docs/plans/MECHS.md 12; South, 2026-11-02: "a veritable lack of fire as a mechanic"; the rules are
// Dovina's, progress/mechs/fire.js, and this module only runs them). Owned by the ToyCity as `city.fire`: it lights the city's cells (a
// shot, the beam, the flamer's cone, a burning chunk landing), steps every building that burns a few times a real second (fire.js
// stepFire, on a seeded stream), and answers what the step changed: cells burned away or glass burst by heat go the way a fist's carve goes
// (city.js settle: the collapse run, chunks flown, the building felled), so a burning building comes down under its own weight. Water and
// a Ground Pound put it out. Bodies feel it: the straw giant alight (giant.js light) or the dune colossus vitrified (giant.js glaze) in the
// flamer's cone or beside a burning building, and the mech's heat (battery drained, legs cracked at full heat).
//
// Prior art: Far Cry 2's fire (a weapon you start, spreading by material), Minecraft's fire tick (a burning block lights its flammable
// neighbours by chance and burns away), Noita and the falling-sand games (fire as a cell rule), Breath of the Wild (fire climbs, water
// ends it), Red Faction Guerrilla (a weakened structure falls under its own weight).
//
//   const F = new CityFire(city)   F.update(rawDt)   F.reset()   (stepped from ToyCity.update; city.fire)
//   F.igniteAt(point, r, chance, cause, by) -> cells lit   F.igniteRay(from, dir, chance, cause, by) -> cells lit   F.flame(from, dir, range, angle, dt, by)
//   F.cells (Float32Array, x y z a burning cell, world)   F.n   F.ver (bumped each fire step)   CELLS
//   F.douseAt(point, r, cause, by) -> cells put out (a water tower's burst also a burning giant in reach)   F.burningNear(point, r, h?) -> bool   F.heat (the mech's, 0..1)
//   points are world (x, y, z); causes 'shot' | 'beam' | 'flame' | 'giant' | 'chunk'; by 'courier' | 'environment' | ...
//   events (all with `by`, the building's fire's: b.fire.by): city.ignite { building, lot, at, cause }, city.burn { building, lot, cells, k, at } (about 1 Hz),
//   city.char { building, lot, cells, at }, city.break { ..., cause: 'heat' | 'fire' } (glass burst by heat, chunks cut loose by a burn), city.felled { ..., cause: 'fire' }
//   (city.js), city.out { building, lot }, city.douse { building, lot, cells, cause }, mech.heat { k, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
import { FIRE, HEAT, GIANT_FIRE, STATE, newFire, stepFire, igniteNear, igniteRay, douse, heatStep } from '../../progress/mechs/fire.js';
import { MECH_BODY, heightOf } from './mech.js';

/** The most burning cells the look's buffer holds (city.fire.cells: a burning shop row peaks about 170, the whole street a few thousand). */
export const CELLS = 4096;
const _gw = new THREE.Vector3();

/** The flame's reach (m along the cone) of each point it lights from, and the radius it lights round one (clamped: the cone's own, 5 m at most). */
const CONE = { at: [2.5, 6, 10, 14, 18, 22, 26, 30], rMin: 1.2, rMax: 5 };
const _p = new THREE.Vector3(), _g = new THREE.Vector3(), _w = new THREE.Vector3();
const r1 = (v) => Math.round(v);

export class CityFire {
  constructor(city) { this.city = city; this.game = city.game; this.R = stream('world/hangar/cityfire'); this.reset(); }
  reset() { this.acc = 0; this.heat = 0; this.said = 0; this.crackT = 0; this.n = 0; this.ver = 0; this.cells = this.cells || new Float32Array(CELLS * 3); }
  /** The burning cells' centres in world metres (x, y, z each), `n` of them, `ver` bumped each fire step: what a look's instanced draw
   *  re-reads when `ver` changes (Petra, 2026-11-02: no array carried on an event each step). At most CELLS. */
  gather() {
    let n = 0; const out = this.cells, C = this.city, v = _gw;
    for (const rec of C.recs) {
      if (!rec.fx.on) continue; const b = rec.b, st = b.fire?.state; if (!st) continue;
      for (let i = 0; i < st.length && n < CELLS; i++) {
        if (st[i] !== STATE.burning || !b.mat[i]) continue;
        const x = i % b.w, q = (i - x) / b.w, z = q % b.d; C.cellWorld(rec, x, (q - z) / b.d, z, v);
        out[n * 3] = v.x; out[n * 3 + 1] = v.y; out[n * 3 + 2] = v.z; n++;
      }
    }
    this.n = n; this.ver++;
  }
  say(name, payload) { this.game.events?.emit(name, payload); }
  pt(p) { return [r1(p.x), r1(p.y), r1(p.z)]; }
  /** The middle of cells (indices) of a building, in the world, rounded. */
  at(rec, list) { const [x, y, z] = this.city.centreOf(rec.b, list); return this.pt(this.city.cellWorld(rec, x, y, z, _w)); }

  // ------------------------------------------------------------------ lighting
  /** A building caught: asked to be stepped, and said once if it was not burning. */
  caught(rec, p, cause, by) {
    const fx = rec.fx, was = fx.on; fx.on = true; fx.burnT = 0; rec.dirty = true;
    if (!was) this.say('city.ignite', { building: rec.id, lot: rec.i, at: this.pt(p), cause, by: rec.b.fire?.by || by });
  }
  /** Each burnable cell within `r` m of a world point catches with `chance` x its burn. Returns how many caught. */
  igniteAt(p, r, chance, cause, by = 'courier') {
    const C = this.city; if (!C.built || !(chance > 0)) return 0; let total = 0;
    for (const rec of C.recs) {
      if (!C.near(rec, p.x, p.z, r) || p.y + r < rec.y0 || p.y - r > rec.y1) continue;
      const n = igniteNear(rec.b, C.toCell(rec, p.x, p.y, p.z), r, chance, this.R, by);
      if (n) { total += n; this.caught(rec, p, cause, by); }
    }
    return total;
  }
  /** Along a world ray (the charged beam): each burnable cell it passes catches with `chance` x its burn. */
  igniteRay(from, dir, chance, cause, by = 'courier') {
    const C = this.city; if (!C.built || !(chance > 0)) return 0; let total = 0;
    const S = { kind: 'ray', at: from, dir, r: 1 };
    for (const rec of C.recs) {
      if (!C.reaches(rec, S)) continue;
      const cs = C.cellShape(rec, S), n = igniteRay(rec.b, cs.at, cs.dir, chance, this.R, by);
      if (n) { total += n; this.caught(rec, from, cause, by); }
    }
    return total;
  }
  /** The flamer's cone for `dt` real s (the mech's back unit, mechweapons.js): points along it from the nozzle, stopped at the first wall,
   *  each lighting what is within its radius; a giant in the cone is lit (the straw giant) or glazed (the dune colossus). */
  flame(from, dir, range, angle, dt, by = 'courier') {
    const C = this.city, hit = C.built ? C.raycast(from, dir, range) : null, reach = hit ? Math.min(range, hit.t + 1) : range, chance = FIRE.light.flame * dt, tan = Math.tan(angle);
    for (const s of CONE.at) {
      if (s > reach) break;
      this.igniteAt(_p.copy(from).addScaledVector(dir, s), Math.min(CONE.rMax, Math.max(CONE.rMin, s * tan)), chance, 'flame', by);
    }
    if (hit && hit.t <= range) this.igniteAt(hit.point, CONE.rMin + 0.8, chance, 'flame', by);
    const G = C.hangar.giant; if (!G?.c?.alive || G.down > 0 || G.under || G.air) return;
    const to = _g.copy(G.c.center(_w)).sub(from), d = to.length() || 1e-3;
    if (d - G.radius > range || (hit && hit.t < d - G.radius)) return;
    if (Math.acos(Math.max(-1, Math.min(1, to.dot(dir) / d))) > angle + Math.atan2(G.radius, d)) return;
    if (GIANT_FIRE[G.G.id]?.burns) { if (this.R() < chance) G.light(by); } else G.glaze(dt, by);
  }

  // ------------------------------------------------------------------ putting out
  /** Water or a smother: every burning cell within `r` m of a world point goes out (wet a while), said per building. A water tower's burst
   *  (cause 'water') also puts out a burning giant within that reach. Returns the cells put out. */
  douseAt(p, r, cause, by = 'courier') {
    const C = this.city; if (!C.built) return 0; let total = 0;
    for (const rec of C.recs) {
      if (!C.near(rec, p.x, p.z, r) || p.y + r < rec.y0 || p.y - r > rec.y1) continue;
      const n = douse(rec.b, C.toCell(rec, p.x, p.y, p.z), r);
      if (!n) continue;
      total += n; rec.fx.watch = true; rec.dirty = true;
      this.say('city.douse', { building: rec.id, lot: rec.i, cells: n, cause, by });
    }
    const G = C.hangar.giant;
    if (cause === 'water' && G?.burn && Math.hypot(G.pos.x - p.x, G.pos.z - p.z) <= r + G.radius) G.douse(by);
    return total;
  }

  // ------------------------------------------------------------------ asking
  /** The first burning building with a burning cell within `r` m of a world point (a sphere; with `h`, a column from a metre under the
   *  point up `h` m, the footprint of a body), or null. */
  nearRec(p, r, h = null) {
    const C = this.city; if (!C.built) return null;
    for (const rec of C.recs) {
      if (!rec.fx.on || !C.near(rec, p.x, p.z, r)) continue;
      const b = rec.b, f = b.fire, [px, py, pz] = C.toCell(rec, p.x, p.y, p.z);
      for (let i = 0; i < b.mat.length; i++) {
        if (f.state[i] !== STATE.burning || !b.mat[i]) continue;
        const x = i % b.w, q = (i - x) / b.w, z = q % b.d, y = (q - z) / b.d;
        if (h === null ? Math.hypot(x - px, y - py, z - pz) <= r : Math.hypot(x - px, z - pz) <= r && y >= py - 1 && y <= py + h) return rec;
      }
    }
    return null;
  }
  burningNear(p, r, h = null) { return !!this.nearRec(p, r, h); }

  // ------------------------------------------------------------------ each frame
  /** Fire on real time: the automaton at FIRE.hz, the giants, the mech's heat. */
  update(raw) {
    if (!this.city.built) return;
    const dt = 1 / FIRE.hz; this.acc = Math.min(this.acc + raw, dt * 2);
    while (this.acc >= dt) { this.acc -= dt; for (const rec of this.city.recs) if (rec.fx.on || rec.fx.watch) this.step(rec, dt); this.giants(dt); this.gather(); }
    this.heatTick(raw);
  }

  /** One automaton step of one building, and what it changed. */
  step(rec, dt) {
    const C = this.city, b = rec.b, f = b.fire || newFire(b), fx = rec.fx;
    const r = stepFire(b, dt, this.R), by = f.by || 'courier';
    if (r.away.length || r.glass.length) { // (cells burned away, glass burst by heat: the collapse a fist's carve runs, and what it threw)
      const all = r.away.concat(r.glass), at = this.at(rec, all);
      if (r.away.length) this.say('city.char', { building: rec.id, lot: rec.i, cells: r.away.length, at, by });
      C.chips(rec, r.away, null, { tint: C.look.fire.char, every: 3 }); C.chips(rec, r.glass, null, { tint: C.look.colour.glass });
      C.settle(rec, all, { by, cause: 'fire', chips: false, brk: { cells: r.glass.length, at, cause: r.glass.length ? 'heat' : 'fire' } });
    }
    let burn = 0, wet = 0, solid = 0, sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < b.mat.length; i++) {
      if (!b.mat[i]) { if (f.state[i] === STATE.burning) f.state[i] = STATE.none; continue; }
      solid++; const st = f.state[i];
      if (st === STATE.wet) wet++;
      else if (st === STATE.burning) { burn++; const x = i % b.w, q = (i - x) / b.w, z = q % b.d; sx += x; sz += z; sy += (q - z) / b.d; }
    }
    fx.watch = wet > 0; fx.tick++; rec.dirty = true; // (re-meshed: the cells' states are its look)
    if (burn > 0) {
      fx.burnT += dt;
      if (fx.burnT >= 1) { fx.burnT = 0; this.say('city.burn', { building: rec.id, lot: rec.i, cells: burn, k: +(burn / Math.max(1, solid)).toFixed(2), at: this.pt(C.cellWorld(rec, sx / burn, sy / burn, sz / burn, _w)), by }); }
    } else if (fx.on) { // (nothing burning: out, whether it burned out or was carved away)
      fx.on = false; fx.burnT = 0; f.lit = 0; f.by = null;
      this.say('city.out', { building: rec.id, lot: rec.i, by });
    }
  }

  /** A building burning beside the straw giant lights it by chance (FIRE.light.giant a real second, within GIANT_FIRE.touch of its footprint). */
  giants(dt) {
    const G = this.city.hangar.giant, F = G?.c?.alive && G.down <= 0 ? GIANT_FIRE[G.G.id] : null;
    if (!F?.burns) return;
    const rec = this.nearRec(G.pos, G.radius + F.touch, G.G.height);
    if (rec && this.R() < FIRE.light.giant * dt) G.light(rec.b.fire?.by || 'courier');
  }

  /** The mech's heat: up while a burning cell is within HEAT.near of its footprint, down out of it; the battery drained by it; at full heat
   *  its legs cracked every HEAT.crack.every real s (through its own hurt path, by 'environment'). Said when it moves 0.1 or crosses 0 or 1. */
  heatTick(raw) {
    const H = this.city.hangar, M = H.pilot, on = M?.mode === 'pilot' && this.game.cradles?.sealed === H.cradle;
    const inFire = on && this.burningNear(M.pos, HEAT.near + MECH_BODY.radius, heightOf(M.stats));
    this.heat = heatStep(this.heat, inFire, raw);
    if (on && this.heat > 0) {
      M.spend(HEAT.drainKW * this.heat * raw);
      if (this.heat >= 1) { this.crackT += raw; if (this.crackT >= HEAT.crack.every) { this.crackT = 0; M.hurt(HEAT.crack.region, HEAT.crack.k, 'environment'); } } else this.crackT = 0;
    } else this.crackT = 0;
    const k = this.heat, s = this.said;
    if (Math.abs(k - s) >= 0.1 || (k === 0 && s > 0) || (k >= 1 && s < 1)) { this.said = k; this.say('mech.heat', { k: +k.toFixed(2), by: 'environment' }); }
  }
}
