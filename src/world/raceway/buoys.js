// ---------------------------------------------------------------------------------------
// THE BUOYS (docs/plans/SKIFF-RACING.md section 12): Wave Race 64's, on the sand. A run of buoys stood in a stretch of a track, each to
// be passed on its side: a red one kept on your left (go right of it), a yellow one on your right. Each passed right raises the board's
// POWER a step (to five: a little more top speed each); one missed drops it to nothing. So a buoy run is a slalom you are paid to keep,
// and a lapse costs the lap. Ridden whenever you are on that track, in a race or out. Event: skiff.buoy { hit, power } (with `by`).
// The buoys' look is a placeholder (Calissa's: a pole and a float).
//
// Prior art: Wave Race 64 (buoys passed on their side; each right raises the power meter, a miss resets it; missed five, disqualified),
// Excitebike 64's and Jet Moto's slaloms.
//
//   BUOYS { [track]: [[s, lat, pass]] }   const B = new Buoys(raceway)   B.build()   B.update(dt)   B.mult(key)   B.power   BUOY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';

/** The buoy runs: each [s (m along the line), lat (m right of it), the side to pass it ('right': keep it on your left: red)]. */
export const BUOYS = {
  sun: [[2420, -4, 'right'], [2460, 4, 'left'], [2500, -4, 'right'], [2540, 4, 'left']],
  gorge: [[3010, -4, 'right'], [3060, 4, 'left'], [3110, -4, 'right'], [3200, 4, 'left'], [3250, -4, 'right']],
  coaster: [[1470, 4, 'left'], [1520, -4, 'right'], [1570, 4, 'left'], [1620, -4, 'right']],
};
/** The most power, top speed's share a step, metres either side of the line a buoy is judged within. */
export const BUOY = { max: 5, top: 0.02, reach: 14 };

export class Buoys {
  constructor(R) { this.R = R; this.power = 0; this.prev = null; }
  get game() { return this.R.game; }
  mult(key) { return key === 'top' ? 1 + BUOY.top * this.power : 1; }
  build() {
    const R = this.R, g = this.game, group = new THREE.Group(); group.userData.zone = 'raceway';
    const pole = new THREE.CylinderGeometry(0.12, 0.12, 3, 6).translate(0, 1.5, 0), ball = new THREE.SphereGeometry(0.55, 10, 8).translate(0, 3, 0);
    const red = new THREE.MeshStandardMaterial({ color: 0xd8442e, roughness: 0.6 }), yellow = new THREE.MeshStandardMaterial({ color: 0xf0c43a, roughness: 0.6 }), grey = new THREE.MeshStandardMaterial({ color: 0x6a5a50 });
    for (const [id, list] of Object.entries(BUOYS)) {
      const T = R.trackOf(id); if (!T) continue;
      for (const [s, lat, pass] of list) { const F = T.frame(s), x = RW.x + F.x - F.fz * lat, z = RW.z + F.z + F.fx * lat, y = R.rideHeight(x, z);
        for (const [geo, mat] of [[pole, grey], [ball, pass === 'right' ? red : yellow]]) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; group.add(m); } }
    }
    g.scene.add(group); this.group = group;
  }
  /** As the Courier's place on their track's line passes a buoy's, which side they are on. */
  update() {
    const R = this.R, g = this.game, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null, list = BUOYS[R.track?.id];
    if (!S || S.phase !== 'ride' || !list || R.line !== 'main' || R.d > BUOY.reach) { this.prev = null; return; }
    const s = R.s, p = this.prev; this.prev = s; if (p == null || s - p <= 0 || s - p > 30) return; // (forward, a step at a time)
    for (const [bs, lat, pass] of list) {
      if (!(p < bs && s >= bs)) continue;
      const hit = pass === 'right' ? R.lat > lat : R.lat < lat;
      this.power = hit ? Math.min(BUOY.max, this.power + 1) : 0;
      g.events?.emit('skiff.buoy', { hit, power: this.power, by: 'courier' });
    }
  }
}
