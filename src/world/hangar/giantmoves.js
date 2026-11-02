// ---------------------------------------------------------------------------------------
// THE GIANTS' MOVES BY KIND (docs/plans/MECHS.md 5.3, 11.2; the numbers Dovina's, progress/mechs/giants.js GIANTS[id].moves): what a
// windup is, when it can begin, and what lands when it ends. Every windup goes through the creatures' windup machinery from giant.js
// exactly as the straw giant's; this module says what is in it and what follows.
//   melee  (the straw giant's own; a move with no kind) strikes the mech if it is in reach when the windup ends
//   ring   (the colossus's burrow) at the windup's start the mech's place is noted and a ring shown there (`giant.burrow.ring`, radius
//          `radius`); the giant sinks out of sight over `windup`, stays under until `sinks` real s in all, then erupts at the noted
//          place: the mech is hurt if within the ring then, and the giant stands there. Under, it can be neither hit nor collided with
//          (it is stashed far off: Giant.stash)
//   hurl   (a clod from 30 to 140 m) at the windup's end a clod (`giant.clod`) is thrown at the mech's place at that moment (its chest) at
//          `speed` m/s on a flat arc (the throw lobbed just enough to arrive there under gravity); it hurts the mech if it passes
//          within CLOD.hit m of its middle, and shatters where it lands (the ground, past it if it missed)
//   wave   (a cone of sand) at the windup's end the mech inside the cone (`reach` m, half-angle `angle` rad) is hurt and slowed `slow`
//          real s (SLOW: the mech's speed held to a share of its walk by clamping the pilot's velocity from here, the core of the
//          pilot untouched; its boosts are the way out)
// Placeholders for the art division: `giant.burrow.ring` (a flat ring and disc of ember on the ground), `giant.clod` (a lump of boxes in
// sand colours), `giant.wave` (a flat fan on the ground, fading), and the sand the voxel batch throws where a clod lands and a giant erupts.
//
// Prior art: Tremors' and Dune's worm (the ground rings before it erupts), Monster Hunter's ranged throw, Shadow of the Colossus
// (a giant read from far off), Zelda's Gohma-like burrowers.
//
//   const M = new GiantMoves(giant)   M.canStart(M, mech, d) -> bool   M.begin(id, mv, mech) -> { W, spec }   M.during(W, dt, mech)
//   M.land(W, mv, mech, d)   M.abort(W)   M.tick(dt, mech)   M.clear()   M.dispose()   M.slowFor(s)   CLOD   WAVE   SLOW
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
import { heightOf } from './mech.js';

/** The clod: how near it must pass the mech's middle to hurt (Dovina: about 6 m), its size (m), the chest height it is aimed and judged at
 *  (a share of the mech's height), where it leaves the giant's hand (a share of its height), and its gravity (m/s2). */
export const CLOD = { hit: 6, size: 3.2, chest: 0.5, from: 0.72, g: 9.81 };
/** The wave's placeholder fan: how long it shows (real s). */
export const WAVE = { show: 0.7 };
/** The wave's slow: the share of its walk the mech is held to (a placeholder for feel; Dovina's `slow` is the seconds). */
export const SLOW = { walk: 0.5 };
const R = stream('world/hangar/giant');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const SAND = [0xd8b878, 0xb88a4c, 0xe8cf94];

export class GiantMoves {
  constructor(giant) { this.g = giant; this.fx = []; this.ring = null; this.slowT = 0; this.geos = []; this.mats = {}; this.boxes = {}; this.t = 0; }
  /** A throwaway material of the sand's colour (kept for disposal). */
  mat(key, make) { return (this.mats[key] ||= make()); }
  slowFor(s) { this.slowT = Math.max(this.slowT, s); }

  /** Can this move begin: the mech in its range (reach from the body's edge for a blow and a cone; the centre's, between min and reach, for
   *  a clod and a burrow). */
  canStart(M, mech, d) {
    const R0 = this.g.radius;
    switch (M.kind) {
      case 'ring': return d <= M.reach;
      case 'hurl': return d >= M.min && d <= M.reach;
      case 'wave': return d - mech.radius <= M.reach;
      default: return d - mech.radius <= M.reach + R0;
    }
  }

  /** A windup begun: its state, and what the creatures' windup list is told (the area it lands on, how long it has). */
  begin(id, M, mech) {
    const g = this.g, kind = M.kind || 'melee', base = { kind: id, parry: false, read: false, type: 'impact', answer: M.answer };
    if (kind === 'ring') {
      const place = new THREE.Vector3(mech.pos.x, g.pos.y, mech.pos.z); this.showRing(place, M.radius);
      return { W: { move: id, kind, t: M.sinks, of: M.sinks, sink: M.windup, place }, spec: { ...base, at: place, radius: M.radius, eta: M.sinks } };
    }
    if (kind === 'hurl') return { W: { move: id, kind, t: M.windup, of: M.windup }, spec: { ...base, at: mech.pos, radius: CLOD.hit, eta: M.windup } }; // (the mech's own place, live)
    if (kind === 'wave') return { W: { move: id, kind, t: M.windup, of: M.windup }, spec: { ...base, at: g.pos, radius: M.reach, eta: M.windup } };
    return { W: { move: id, kind, t: M.windup, of: M.windup }, spec: { ...base, at: g.pos, radius: M.reach + g.radius, eta: M.windup } };
  }

  /** Each frame of a windup: a burrow sinks and its ring pulses toward the eruption. */
  during(W, dt, mech) {
    if (W.kind !== 'ring') return;
    const g = this.g, e = W.of - W.t;
    g.sink = Math.min(1, e / W.sink);
    if (g.sink >= 1 && !g.stashed) g.stash(g.pos); // (gone under: out of every reach)
    if (this.ring) { const k = e / W.of; this.ring.mat.opacity = 0.25 + 0.55 * k * (0.6 + 0.4 * Math.sin(this.t * (6 + 14 * k))); }
  }

  /** The windup's end: what lands. `d` is the giant-to-mech distance as the windup ends (garbage while the giant is stashed). */
  land(W, M, mech, d) {
    const g = this.g;
    switch (W.kind) {
      case 'ring': {
        g.unstash(W.place); this.clearRing(); // (erupted at the noted place, standing there; g.sink eases from 1 to 0)
        this.sandBurst(W.place, 70, M.radius * 0.5);
        if (mech && Math.hypot(mech.pos.x - W.place.x, mech.pos.z - W.place.z) <= M.radius) mech.hurt(M.region, M.k * g.armsK(W.move), 'creature');
        break;
      }
      case 'hurl': this.throwClod(M, mech); break;
      case 'wave': this.sweepWave(M, mech); break;
      default: if (d - mech.radius <= M.reach + g.radius) mech.hurt(M.region, M.k * g.armsK(W.move), 'creature');
    }
  }
  /** A windup broken off (a stagger, a felled giant, a grab): the ring taken away, the giant back up if it was going under. */
  abort(W) {
    if (W.kind !== 'ring') return;
    this.clearRing(); const g = this.g;
    g.unstash(); g.sink = 0; // (it comes up where it went down; the noted place was the mech's, not its own)
  }

  // ------------------------------------------------------------------ the placeholders
  showRing(at, r) {
    const g = this.g, into = g.into; if (!into) return;
    const grp = new THREE.Group(); grp.name = 'giant.burrow.ring'; grp.position.set(at.x, at.y + 0.25, at.z);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.RingGeometry(r - 1.2, r, 64), disc = new THREE.CircleGeometry(r - 1.2, 48); this.geos.push(ring, disc);
    for (const geo of [ring, disc]) { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; grp.add(m); }
    into.add(grp); this.ring = { grp, mat };
  }
  clearRing() { if (!this.ring) return; this.ring.grp.parent?.remove(this.ring.grp); this.ring.mat.dispose(); this.ring = null; }

  /** The clod thrown from the giant's hand at the mech's place now. */
  throwClod(M, mech) {
    const g = this.g, into = g.into; if (!into || !mech) return;
    const from = new THREE.Vector3(g.pos.x + Math.sin(g.yaw) * 4, g.pos.y + g.G.height * CLOD.from, g.pos.z + Math.cos(g.yaw) * 4);
    const to = new THREE.Vector3(mech.pos.x, mech.pos.y + heightOf(g.game.hangar.pilot.stats) * CLOD.chest, mech.pos.z), T = Math.max(0.3, from.distanceTo(to) / M.speed);
    const vel = to.clone().sub(from).divideScalar(T); vel.y += 0.5 * CLOD.g * T; // (arrives at the mech's chest at T, the arc as flat as that speed lets it be)
    const mesh = new THREE.Group(); mesh.name = 'giant.clod';
    const mt = this.mat('clod', () => new THREE.MeshStandardMaterial({ color: SAND[1], roughness: 1, flatShading: true }));
    const geo = this.geoBox(CLOD.size); for (const [x, y, z, s] of [[0, 0, 0, 1], [0.5, 0.4, 0.2, 0.6], [-0.5, -0.3, 0.3, 0.6]]) { const m = new THREE.Mesh(geo, mt); m.position.set(x * CLOD.size, y * CLOD.size, z * CLOD.size); m.scale.setScalar(s); m.castShadow = true; mesh.add(m); }
    mesh.position.copy(from); into.add(mesh);
    this.fx.push({ kind: 'clod', mesh, vel, M, floor: g.pos.y });
  }
  geoBox(s) { if (!this.boxes[s]) { this.boxes[s] = new THREE.BoxGeometry(s, s, s); this.geos.push(this.boxes[s]); } return this.boxes[s]; }

  /** The cone: hurt and slowed if the mech is inside; a flat fan shown for WAVE.show. */
  sweepWave(M, mech) {
    const g = this.g, into = g.into;
    if (into) {
      const geo = new THREE.CircleGeometry(M.reach, 32, Math.PI / 2 - M.angle, 2 * M.angle);
      const mat = new THREE.MeshBasicMaterial({ color: SAND[2], transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat); m.name = 'giant.wave'; m.position.set(g.pos.x, g.pos.y + 0.3, g.pos.z);
      m.rotation.set(Math.PI / 2, g.yaw, 0, 'YXZ'); // (the sector is centred on the geometry's +y; laid flat that is +z, turned to the giant's facing)
      into.add(m); this.fx.push({ kind: 'wave', mesh: m, mat, t: WAVE.show });
    }
    this.sandBurst(g.pos, 30, M.reach * 0.4);
    if (!mech) return;
    const dx = mech.pos.x - g.pos.x, dz = mech.pos.z - g.pos.z, d = Math.hypot(dx, dz) || 1e-3;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * Math.sin(g.yaw) + dz * Math.cos(g.yaw)) / d)));
    if (d <= M.reach + mech.radius * 0.5 && ang <= M.angle + Math.atan2(mech.radius, d)) { mech.hurt(M.region, M.k * g.armsK('wave'), 'creature'); this.slowFor(M.slow); }
  }

  /** Sand thrown up by the voxel batch (the toy city's, if there is one). */
  sandBurst(at, n, spread) {
    const V = this.g.game.hangar?.city?.voxels?.(); if (!V) return;
    for (let i = 0; i < n; i++) {
      _c.setHex(SAND[i % 3]); const a = R() * Math.PI * 2, s = R() * spread;
      V.emit(at.x + Math.cos(a) * s * 0.3, at.y + 0.6, at.z + Math.sin(a) * s * 0.3, Math.cos(a) * s * 0.6, 3 + R() * 9, Math.sin(a) * s * 0.6, 0.5 + R() * 0.9, _c.r, _c.g, _c.b, 1.2 + R() * 1.3, 0, null, 2 + R() * 4);
    }
  }

  // ------------------------------------------------------------------ each frame
  /** The clods in flight, the fan fading, the ring pulsing, the slow held on the mech. Runs whether the giant is up or down. */
  tick(dt, mech) {
    this.t += dt;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      if (f.kind === 'wave') { f.t -= dt; f.mat.opacity = 0.6 * Math.max(0, f.t / WAVE.show); if (f.t <= 0) { this.drop(f, i); } continue; }
      const p = f.mesh.position; f.vel.y -= CLOD.g * dt; p.addScaledVector(f.vel, dt); f.mesh.rotation.x += dt * 3; f.mesh.rotation.z += dt * 2;
      if (mech) { // (judged at the mech's chest as it is now: a clod aimed at a place the mech has left misses)
        _a.set(mech.pos.x, mech.pos.y + heightOf(this.g.game.hangar.pilot.stats) * CLOD.chest, mech.pos.z);
        if (_b.copy(p).sub(_a).length() <= CLOD.hit) { mech.hurt(f.M.region, f.M.k, 'creature'); this.shatter(f, i); continue; }
      }
      if (p.y <= f.floor + 0.5) { p.y = f.floor; this.shatter(f, i); }
    }
    this.slowTick(dt);
  }
  shatter(f, i) { this.sandBurst(f.mesh.position, 36, 12); this.drop(f, i); }
  drop(f, i) { f.mesh.parent?.remove(f.mesh); if (f.kind === 'wave') { f.mesh.geometry.dispose(); f.mat.dispose(); } this.fx.splice(i, 1); }

  /** The slow: while it lasts the pilot's walking speed is held to SLOW.walk of its top (assault and quick boosts left alone: the way out). */
  slowTick(dt) {
    if (this.slowT <= 0) return; this.slowT -= dt;
    const p = this.g.game.hangar?.pilot; if (!p || p.mode !== 'pilot' || p.assault || p.boostT > 0) return;
    const cap = p.stats.walkTop * SLOW.walk, sp = p.speed; if (sp > cap) p.vel.x *= cap / sp, p.vel.z *= cap / sp;
  }

  clear() { for (let i = this.fx.length - 1; i >= 0; i--) this.drop(this.fx[i], i); this.clearRing(); this.slowT = 0; }
  dispose() { this.clear(); for (const g of this.geos) g.dispose(); for (const k in this.mats) this.mats[k].dispose?.(); this.geos = []; this.mats = {}; this.boxes = {}; }
}
