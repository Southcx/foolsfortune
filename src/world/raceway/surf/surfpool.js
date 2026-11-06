// ---------------------------------------------------------------------------------------
// THE WAVE POOL AT RUNTIME (plain name, South's ask 2026-11-06; docs/ref/WAVE-RIDING.md 1): the Raceway park's wave pool as the board
// and the look meet it. It owns the pool's clock `t` (game seconds, advanced in raceway.update), the one water function (wavePool(),
// surf/wavepool.js) and the answers the Raceway gives the board while it is over the basin: the moving surface as the height a board
// rides at (`rideY`, read by raceway.rideHeight in place of the park's still water), the wave's normal (`waterNormal`, the ride's slope
// in place of UP on water), the water's own velocity (`carry`) and how fast the surface rises under a board moving over it (`riseAt`).
// The basin's bed is cut into the park's ground by park.js (its heightAt takes the bed inside the pool; its waterAt says the still level),
// so the terrain, the physics field and the map all hold the same hole. Off the basin every answer is null or nothing: the park as it was.
// The pool is a place (`wavepool`, /goto): the Raceway is arrived at as the Index does it, then you are set down on the beach.
//
// Coordinates: park-local x, z (park.js's frame); the world is RW + local, and y local over RW.y (world/raceway/track.js).
// Prior art: the house's Raceway answering as the Dunes (one surface asked by a few calls), Surf Ranch's foil pass (wavepool.js).
//
//   raceway.surf = new SurfPool(raceway)   .S (wavePool())   .t   .update(dt)   .inPool(wx, wz)   .rideY(wx, wz) -> world y | null
//   .waterNormal(wx, wz, out) -> out | null   .carry(wx, wz, out) -> out (world x, z m/s)   .riseAt(wx, wz) -> m/s   .frame(wx, wz)
//   .push(wx, wz)   .barrel(wx, wy, wz)   .place(places)   .beach() -> Vector3   .dip ({ x, z, depth }: the submarine's board under, courier/skiff/surf.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from '../track.js';
import { wavePool, POOL } from './wavepool.js';

/** The dive's hole: metres round the board the surface is pressed down for the submarine (a look of the ride, never the water's). */
const DIP = { r: 3.5 };
const _n = { x: 0, y: 1, z: 0 }, _c = { x: 0, z: 0 };

export class SurfPool {
  constructor(R) {
    this.R = R; this.S = wavePool(); this.t = 0;
    this.dip = { x: 0, z: 0, depth: 0 };
  }
  get game() { return this.R.game; }
  /** The pool's clock: game seconds, so a slowed world slows the wave with it (the lip's ease: courier/skiff/barrelcam.js). */
  update(dt) { this.t += dt; }
  inPool(wx, wz) { return this.S.inPool(wx - RW.x, wz - RW.z); }
  /** The moving surface, world y, where the basin's water is over its bed; else null (the park's own water then). */
  rideY(wx, wz) {
    const lx = wx - RW.x, lz = wz - RW.z, y = this.S.surfaceY(lx, lz, this.t);
    if (y == null) return null;
    let h = RW.y + y;
    const D = this.dip;
    if (D.depth > 0.01) { const dx = wx - D.x, dz = wz - D.z, d2 = dx * dx + dz * dz; if (d2 < DIP.r * DIP.r) h -= D.depth * (1 - d2 / (DIP.r * DIP.r)); }
    return h;
  }
  /** The wave's normal at world x, z (into `out`, a Vector3 or { x, y, z }), or null off the basin's water. */
  waterNormal(wx, wz, out = new THREE.Vector3()) {
    const lx = wx - RW.x, lz = wz - RW.z;
    if (!this.S.inPool(lx, lz)) return null;
    const bed = this.S.bedAt(lx, lz), y = this.S.surfaceY(lx, lz, this.t);
    if (bed == null || y == null || y <= bed) return null; // (the beach's dry sand: its own normal)
    this.S.normalAt(lx, lz, this.t, _n);
    if (out.set) out.set(_n.x, _n.y, _n.z); else { out.x = _n.x; out.y = _n.y; out.z = _n.z; }
    return out;
  }
  /** The water's velocity at the surface (world x, z m/s; the pool's frame is the park's, unrotated in the world). */
  carry(wx, wz, out = { x: 0, z: 0 }) { this.S.carry(wx - RW.x, wz - RW.z, this.t, _c); out.x = _c.x; out.z = _c.z; return out; }
  /** How fast the surface under a body carried by the water rises (m/s): the surface's own change in time, and its slope met by the
   *  water's carry. The board's own speed over the slope is the skiff's (its vyT); this is what the moving water adds to it. */
  riseAt(wx, wz) {
    const lx = wx - RW.x, lz = wz - RW.z, S = this.S, e = 0.02;
    const a = S.surfaceY(lx, lz, this.t + e), b = S.surfaceY(lx, lz, this.t - e);
    if (a == null || b == null) return 0;
    S.normalAt(lx, lz, this.t, _n); S.carry(lx, lz, this.t, _c);
    const gx = -_n.x / Math.max(0.2, _n.y), gz = -_n.z / Math.max(0.2, _n.y);
    return (a - b) / (2 * e) + gx * _c.x + gz * _c.z;
  }
  /** The wave's power at world x, z (wavepool.js push: a unit way along the crest toward the shoulder, world x and z, and k 0..1). */
  push(wx, wz) { return this.S.push(wx - RW.x, wz - RW.z, this.t); }
  /** Where on the wave a world point is (wavepool.js frameAt), or null off the basin. */
  frame(wx, wz) { return this.S.frameAt(wx - RW.x, wz - RW.z, this.t); }
  /** The barrel test for a body at world (x, y, z) (wavepool.js barrelAt, its y park-local). */
  barrel(wx, wy, wz) { return this.S.barrelAt(wx - RW.x, wy - RW.y, wz - RW.z, this.t); }
  /** Where you are set down: on the beach's sand at the pool's middle, facing the water. */
  beach() { const lx = POOL.x, lz = POOL.z - POOL.W / 2 - POOL.beach - 6; return new THREE.Vector3(RW.x + lx, this.R.heightAt(RW.x + lx, RW.z + lz) + 0.05, RW.z + lz); }
  /** The pool as a place (world/places.js calls it): the Raceway arrived at its own way, then set down on the beach. */
  place(P) {
    const R = this.R, g = this.game;
    P.add('wavepool', {
      name: 'the wave pool', at: () => this.beach(), note: 'the Raceway park\'s wave pool: a wave a pass, the barrel behind its break; ride it on the Solar Skiff',
      via: () => {
        const go = () => { const b = this.beach(); g.course.teleport(b, 0); }; // (yaw 0: facing +z, the water)
        if (R.built && R.active) { go(); return true; }
        const off = g.events?.on?.('raceway.enter', () => { off?.(); go(); });
        R.arrive();
        return true;
      },
    });
  }
}
