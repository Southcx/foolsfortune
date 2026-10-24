// ---------------------------------------------------------------------------------------
// THE WORLD SHELLS' DRAW (docs/plans/CASTER-SHELLS.md section 7; Dovina's rules in progress/combat/worldshells.js): a tier V shell is
// paid by the place, so at the trigger this reads the ambient Lachryma round the aim point (the predicted landing for a lob), hands it
// to `drawOf`, and takes what was drawn: paint and crude on the paint map thinned cell by cell by the fraction taken, a blot taken
// whole washed (and counted, as the mop's), loose baubles drunk, the weather there DRAWN THIN for a game hour. Liquid Lachryma (a pool
// of it, the shore, a Rift's spring) fills a shell to its cap and is never drawn down. Nothing comes from the pool or the vessel.
//
// The thin modifier is the place's, never the weather's base (CLAUDE.md: base change bad): a list of patches, each a radius, the share
// of the weather taken and its game hour, easing back over the last quarter; `weatherK(pos)` is what is left there (0 at Calm's fair).
// The weather's look reads it (vfx/weather.js); the rules' `Weather.here` may (Dovina's). A Rift's spring is a patch of its own kind.
//
// Prior art: Final Fantasy XI's Geomancy (the ground under a spell is its strength), Okami's brush drawing on the world, Machinations'
// pool and drain (a source that empties as it is used and refills at its own rate: the thin patch's game hour).
//
//   game.worldDraw = new WorldDraw(game)   .aimOf(row, ctx) -> point   .sources(at) -> [{ kind, amount, feeling, ref }]
//   .measure(row, ctx | at) -> drawOf's result + { at }   .take(row, ctx) -> { k, feeling, at, dry } (emits shell.draw / nothing if dry)
//   .weatherK(pos) -> 0..1   .fair(at, r, dur)   .spring(at, dur)   .springs   .update(dt)   .clear()
//   GAME_HOUR (real s)   PREFER (a row's preferred source)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DAY_MS } from '../../core/calendar.js';
import { DRAW, drawOf } from '../../progress/combat/worldshells.js';
import { ASPECTS } from '../../progress/weather.js';

/** A game hour in real seconds (a game day is an hour of real time: core/calendar.js). */
export const GAME_HOUR = DAY_MS / 24 / 1000;
/** The source a row takes first (CASTER-SHELLS.md 7.1: Calm the weather). */
export const PREFER = { calm: ['weather'] };
/** The lob's flight for the predicted landing (shellrunner.js CARRIER.lob and lobPart: the same numbers). */
const LOB = { speed: 18, lift: 3, grav: 9.81, life: 3, step: 1 / 30 };
const CELL = 0.25, CELL_M2 = CELL * CELL, NEAR = 0.8;
const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3();

export class WorldDraw {
  constructor(game) {
    this.game = game;
    this.thin = []; // ({ x, z, r, take, dur, left, fair }): the place drawn thin
    this.springs = []; // ({ pos, r, left, dur }): a Rift's spring, liquid Lachryma for a game hour
  }

  // ---------------------------------------------------------------- where
  /** Where a row's shell will land from the trigger: a lob's predicted landing (its arc stepped against the world), else the aim's hit. */
  aimOf(row, { ray, muzzle } = {}) {
    const g = this.game; if (!ray) return g.player?.pos?.clone() ?? new THREE.Vector3();
    const skip = g.player?.collider, solid = (k) => !k.isSensor();
    if (['lob', 'deploy'].includes(row.carrier) && muzzle) {
      const pos = _p.copy(muzzle), vel = _v.copy(ray.dir).multiplyScalar(LOB.speed); vel.y += LOB.lift;
      for (let t = 0; t < LOB.life; t += LOB.step) {
        _d.copy(vel).multiplyScalar(LOB.step); const len = _d.length();
        const hit = len > 1e-4 && g.physics?.raycast?.(pos, _d.clone().normalize(), len, skip, undefined, solid);
        if (hit) return hit.point.clone();
        pos.add(_d); vel.y -= LOB.grav * LOB.step;
      }
      return pos.clone();
    }
    const hit = g.physics?.raycast?.(ray.origin, ray.dir, 60, skip, undefined, solid);
    return hit ? hit.point.clone() : ray.origin.clone().addScaledVector(ray.dir, 20);
  }

  // ---------------------------------------------------------------- what is there
  /** The ambient Lachryma within DRAW.r of `at`, as drawOf's sources (paint per feeling and crude in m² at full, a blot by its growth,
   *  slicks as a count (a slick about a m²), baubles a count, the weather by what is left of its strength there, liquid any amount). */
  sources(at) {
    const g = this.game, r = DRAW.r, out = [];
    // liquid: a pool of Lachryma reaching into the circle, or a Rift's spring
    for (const s of this.springs) if (Math.hypot(s.pos.x - at.x, s.pos.z - at.z) < r + s.r) { out.push({ kind: 'liquid', amount: 1, feeling: null, ref: s }); return out; }
    for (const v of g.water?.volumes || []) {
      if ((v.kind || 'water') !== 'lachryma' || Math.abs(v.surface - at.y) > 4) continue;
      const cx = Math.max(v.x0, Math.min(v.x1, at.x)), cz = Math.max(v.z0, Math.min(v.z1, at.z));
      if (Math.hypot(cx - at.x, cz - at.z) < r) { out.push({ kind: 'liquid', amount: 1, feeling: null, ref: v }); return out; }
    }
    // the paint map: each feeling's paint, crude not under a blot, slicks
    const pm = g.paintmap, blots = (g.stains?.list || []).filter((s) => Math.hypot(s.x - at.x, s.z - at.z) < r + 3 && Math.abs(s.y - at.y) < 3);
    if (pm?.k) {
      const N = Math.round(Math.sqrt(pm.k.length)), paint = {}; let crude = 0, slick = 0;
      this.cells(pm, at, r, (n, x, z) => {
        const kind = pm.crude[n];
        if (kind === 0 && pm.asp[n] >= 0) { const a = ASPECTS[pm.asp[n]]; paint[a] = (paint[a] || 0) + pm.k[n] * CELL_M2; }
        else if (kind === 2) slick += pm.k[n] * CELL_M2;
        else if (kind === 1 && !blots.some((s) => Math.hypot(s.x - x, s.z - z) < g.stains.reach(s))) crude += pm.k[n] * CELL_M2;
      }, N);
      for (const a in paint) out.push({ kind: 'paint', amount: paint[a], feeling: a, ref: a });
      if (crude > 0) out.push({ kind: 'crude', amount: crude, feeling: null, ref: 'crude' });
      if (slick > 0) out.push({ kind: 'slick', amount: slick, feeling: null, ref: 'slick' }); // (a slick is about a m² of crude: its measure here is m²)
    }
    for (const s of blots) if (Math.hypot(s.x - at.x, s.z - at.z) < r) out.push({ kind: 'blot', amount: (g.stains.stageOf(s) + 1) / 4, feeling: null, ref: s }); // (a full-grown blot, stage 3, is 1)
    const baubles = (g.baubles?.near?.(at, r) || []).filter((b) => b.state === 'loose');
    if (baubles.length) out.push({ kind: 'bauble', amount: baubles.length, feeling: null, ref: baubles });
    const w = g.weather?.here?.(at);
    if (w?.aspect && w.exposure !== 'roofed') { // (the open, and a Well's own weather in its deep; nothing falls under a roof)
      const s = (w.strength || 0) * this.weatherK(at);
      if (s > 0.01) out.push({ kind: 'weather', amount: s, feeling: w.aspect, ref: w });
    }
    return out;
  }

  /** Walk the paint map's cells within r of `at` at its height: fn(cell index, x, z). */
  cells(pm, at, r, fn, N = Math.round(Math.sqrt(pm.k.length))) {
    const c = Math.ceil(r / CELL), ci = Math.floor((at.x - pm.x0) / CELL), cj = Math.floor((at.z - pm.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (pm.k[n] <= 0.02 || Math.abs(pm.h[n] - at.y) > NEAR) continue;
      const x = pm.x0 + (i + 0.5) * CELL, z = pm.z0 + (j + 0.5) * CELL;
      if (Math.hypot(x - at.x, z - at.z) <= r) fn(n, x, z);
    }
  }

  // ---------------------------------------------------------------- the draw
  /** What the row would draw from here now (the cylinder's plate asks it under the hammer): drawOf's result and the point. */
  measure(row, ctxOrAt) {
    const at = ctxOrAt?.isVector3 ? ctxOrAt : this.aimOf(row, ctxOrAt), src = this.sources(at);
    return { ...drawOf(row.n.need ?? 1, src, { prefer: PREFER[row.id] || [] }), at, src };
  }

  /** At the trigger: draw, take what was drawn, thin the place, and say so (`shell.draw`). Dry: nothing taken, `{ dry: true }`. */
  take(row, ctx) {
    const g = this.game, m = this.measure(row, ctx);
    if (m.dry) return { dry: true, k: m.k, at: m.at, feeling: null };
    const from = {};
    for (const { i, amount } of m.take) {
      const s = m.src[i], f = s.amount > 0 ? Math.min(1, amount / s.amount) : 0;
      from[s.kind] = (from[s.kind] || 0) + amount * (DRAW.units[s.kind] === Infinity ? 0 : DRAW.units[s.kind]);
      this.drain(s, f, m.at);
    }
    if (m.src.some((s) => s.kind === 'liquid')) from.liquid = m.drawn;
    const e = { id: row.id, k: Math.round(m.k * 100) / 100, need: row.n.need ?? 1, drawn: Math.round(m.drawn * 100) / 100, feeling: m.feeling, from, by: 'courier' };
    g.events?.emit('shell.draw', e);
    this.last = { ...e, at: m.at.clone(), src: m.src, take: m.take, t: 0 }; // (the draw's look reads this: vfx/worldshells.js)
    return { dry: false, k: m.k, at: m.at, feeling: m.feeling, src: m.src, take: m.take };
  }

  /** Take fraction f of one source. */
  drain(s, f, at) {
    const g = this.game, pm = g.paintmap; if (f <= 0) return;
    const keep = 1 - f;
    if (s.kind === 'paint' || s.kind === 'crude' || s.kind === 'slick') {
      const kind = s.kind === 'paint' ? 0 : s.kind === 'crude' ? 1 : 2, a = s.kind === 'paint' ? ASPECTS.indexOf(s.feeling) : -2;
      this.cells(pm, at, DRAW.r, (n) => {
        if (pm.crude[n] !== kind || (a !== -2 && pm.asp[n] !== a)) return;
        pm.k[n] *= keep; if (pm.k[n] <= 0.02) { pm.k[n] = 0; pm.asp[n] = -1; pm.crude[n] = 0; }
      });
      pm.dirty = true;
    } else if (s.kind === 'blot') {
      if (f > 0.95) g.stains?.wash?.(s.ref, 'courier'); // (taken whole: washed, and counted as the mop's would be)
      else { this.cells(pm, _p.set(s.ref.x, s.ref.y, s.ref.z), g.stains.reach(s.ref), (n) => { if (pm.crude[n] === 1) pm.k[n] *= keep; }); pm.dirty = true; }
    } else if (s.kind === 'bauble') {
      const n = Math.round(s.ref.length * f); for (let i = 0; i < n; i++) g.baubles?.steal?.(s.ref[i]);
    } else if (s.kind === 'weather') {
      this.thin.push({ x: at.x, z: at.z, r: DRAW.r, take: f, dur: GAME_HOUR * DRAW.thinFor, left: GAME_HOUR * DRAW.thinFor });
    }
  }

  // ---------------------------------------------------------------- the place drawn thin, and given back
  /** What is left of the weather's strength at `pos` (1 untouched; each thin patch takes its share, easing back over its last quarter). */
  weatherK(pos) {
    let k = 1;
    for (const p of this.thin) {
      if (Math.hypot(p.x - pos.x, p.z - pos.z) > p.r) continue;
      const ease = Math.min(1, p.left / (p.dur * 0.25)); // (full until its last quarter, then back)
      k *= 1 - (p.fair ? 1 : p.take) * ease;
    }
    return k;
  }
  /** Calm's fair: the weather gone within r for dur real s (a thin patch that takes it all). */
  fair(at, r = DRAW.r, dur = GAME_HOUR) { this.thin.push({ x: at.x, z: at.z, r, take: 1, fair: true, dur, left: dur }); }
  /** A Rift's spring: liquid Lachryma where the hole was, a source at the cap for the next World shell, for dur real s. */
  spring(at, dur = GAME_HOUR, r = 1.6) { const s = { pos: at.clone(), r, left: dur, dur }; this.springs.push(s); this.game.events?.emit('shell.spring', { at: [at.x, at.y, at.z], by: 'courier' }); return s; }

  update(dt) {
    for (let i = this.thin.length - 1; i >= 0; i--) if ((this.thin[i].left -= dt) <= 0) this.thin.splice(i, 1);
    for (let i = this.springs.length - 1; i >= 0; i--) if ((this.springs[i].left -= dt) <= 0) this.springs.splice(i, 1);
    if (this.last) this.last.t += dt;
  }
  clear() { this.thin.length = 0; this.springs.length = 0; this.last = null; }
}
