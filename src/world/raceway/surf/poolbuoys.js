// ---------------------------------------------------------------------------------------
// THE POOL'S BUOY RUN (wave riding's slalom; docs/ref/WAVE-RIDING.md 2): Wave Race 64's buoys floated in the wave pool's deep end, on its
// swell, judged as the Raceway's own buoys are (world/raceway/buoys.js: a red one kept on your left, a yellow one on your right; each
// passed right raises the board's power a step, one missed drops it to nothing). Not a second meter: it moves the Raceway's one
// (`raceway.buoys.power`, its `skiff.buoy` event), only the run's place differs: the pool lies on no track's line, so a buoy is judged as
// the board crosses its gate (the line across the pool through it) going down the pool, by which side of it the board is.
// The floats ride the swell (the pool's own surface) and lean with it; their look is the house's placeholder pole and float (Calissa's
// to dress further).
//
// Prior art: Wave Race 64's buoy runs on open swell (Sunny Beach, Drake Lake), the Raceway's buoys (Dovina's rule, unchanged).
//
//   POOL_BUOYS [[u, v, pass]]   const B = new PoolBuoys(surfPool)   B.build()   B.update(dt)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from '../track.js';
import { BUOY } from '../buoys.js';

/** The run, in the pool's frame: u along its length (m), v across (m from the beach), the side to pass it ('right': keep it on your left,
 *  red). Out in the deep water past the reef, where the swell is biggest, a slalom down the pool's length. */
export const POOL_BUOYS = [[90, 112, 'right'], [150, 128, 'left'], [210, 110, 'right'], [270, 130, 'left'], [330, 112, 'right'], [390, 128, 'left'], [450, 110, 'right'], [510, 130, 'left']];
/** How far either side of a buoy across the pool its gate judges (m), and how far the float sits under the swell. */
export const POOL_BUOY = { reach: 16, sink: 0.25 };

export class PoolBuoys {
  constructor(surf) { this.surf = surf; this.prev = null; this.group = null; this.floats = []; }
  get R() { return this.surf.R; }
  get game() { return this.surf.R.game; }
  /** The world point of a buoy (park-local u, v to the world). */
  world(u, v) { const S = this.surf.S, P = S.POOL, a = S.axes, du = u - P.L / 2, dv = v - P.W / 2; return { x: RW.x + P.x + du * a.ux + dv * a.vx, z: RW.z + P.z + du * a.uz + dv * a.vz }; }
  build() {
    if (this.group) return;
    const g = this.game, group = (this.group = new THREE.Group()); group.userData.zone = 'raceway';
    const pole = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6).translate(0, 1.2, 0), ball = new THREE.SphereGeometry(0.6, 12, 8).translate(0, 2.4, 0), base = new THREE.CylinderGeometry(0.7, 0.85, 0.5, 10).translate(0, 0.1, 0);
    const red = new THREE.MeshStandardMaterial({ color: 0xd8442e, roughness: 0.55 }), yellow = new THREE.MeshStandardMaterial({ color: 0xf0c43a, roughness: 0.55 }), grey = new THREE.MeshStandardMaterial({ color: 0x6a5a50, roughness: 0.8 });
    for (const [u, v, pass] of POOL_BUOYS) {
      const p = this.world(u, v), node = new THREE.Group();
      for (const [geo, mat] of [[base, grey], [pole, grey], [ball, pass === 'right' ? red : yellow]]) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; node.add(m); }
      node.position.set(p.x, RW.y + this.surf.S.POOL.y, p.z); group.add(node); this.floats.push(node);
    }
    g.scene.add(group);
  }
  dispose() { if (!this.group) return; this.group.parent?.remove(this.group); this.group.traverse((o) => o.geometry?.dispose?.()); this.group = null; this.floats = []; }
  /** The floats on the swell; the board judged as it crosses a gate going down the pool. */
  update() {
    const S = this.surf.S, t = this.surf.t;
    if (this.group) for (let i = 0; i < this.floats.length; i++) {
      const n = this.floats[i], lx = n.position.x - RW.x, lz = n.position.z - RW.z, y = S.surfaceY(lx, lz, t);
      if (y == null) continue;
      n.position.y = RW.y + y - POOL_BUOY.sink;
      const nn = S.normalAt(lx, lz, t, _n); n.rotation.set(Math.atan2(nn.z, nn.y) * 0.8, 0, -Math.atan2(nn.x, nn.y) * 0.8);
    }
    const g = this.game, sk = g.techs?.active?.id === 'skiff' ? g.techs.active : null, P = g.player;
    if (!sk || sk.phase !== 'ride' || !P || !this.surf.inPool(P.pos.x, P.pos.z)) { this.prev = null; return; }
    const lx = P.pos.x - RW.x, lz = P.pos.z - RW.z, u = S.toU(lx, lz), v = S.toV(lx, lz), p = this.prev;
    this.prev = u; if (p == null || u - p <= 0 || u - p > 30) return; // (down the pool, a step at a time)
    const B = this.R.buoys;
    for (const [bu, bv, pass] of POOL_BUOYS) {
      if (!(p < bu && u >= bu) || Math.abs(v - bv) > POOL_BUOY.reach) continue;
      // going down the pool (+u), the board's right is the deep wall's side (v larger: the skiff's right, (-cos h, sin h), is +v here):
      // passing right of a red buoy keeps it on your left
      const hit = pass === 'right' ? v > bv : v < bv;
      if (B) B.power = hit ? Math.min(BUOY.max, B.power + 1) : 0;
      g.events?.emit('skiff.buoy', { hit, power: B ? B.power : 0, by: 'courier' });
    }
  }
}
const _n = { x: 0, y: 1, z: 0 };
