// ---------------------------------------------------------------------------------------
// THE PAINT RANGE: the Throwing Room's floor marks for painting at range (docs/plans/LACHRYMA-LOOP.md section 6, step 3: the QAIS range
// test at 3, 6 and 9 m). A stand mark on the north side of the room, facing down the room (+x), and three rings on the floor at 3, 6 and
// 9 m. After every hold of paint (`brush.paint`), the share of each ring the paint covers is read from the paint map and said
// (`paintrange.read { three, six, nine, by }`: the QAIS test's evidence, a log line). Measured, never earned: the Throwing Room's rule.
//
// Prior art: Splatoon's test range (the lines on the floor at a weapon's range, the targets at set distances), the archery range's
// butts at marked distances.
//
//   const R = new PaintRange(game)   R.stand -> { pos, yaw }   R.rings [{ m, pos, r }]   (game.events: brush.paint -> paintrange.read)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const STAND = new THREE.Vector3(14, 0, 6), RANGES = [3, 6, 9], R_OUT = 0.6, R_IN = 0.48, Y = 0.025;

export class PaintRange {
  constructor(game) {
    this.game = game;
    this.stand = { pos: STAND.clone(), yaw: Math.PI / 2 }; // (facing +x)
    const mat = new THREE.MeshBasicMaterial({ color: 0xf4efe6, transparent: true, opacity: 0.85, depthWrite: false });
    this.group = new THREE.Group(); this.group.name = 'paint-range'; this.group.userData.zone = 'testroom';
    const flat = (geo, x, z) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, Y, z); m.renderOrder = 2; this.group.add(m); return m; };
    flat(new THREE.PlaneGeometry(0.7, 0.7), STAND.x, STAND.z); // (the stand mark: where the drill is measured from)
    this.rings = RANGES.map((m) => ({ m, pos: new THREE.Vector3(STAND.x + m, 0, STAND.z), r: R_OUT, mesh: flat(new THREE.RingGeometry(R_IN, R_OUT, 40), STAND.x + m, STAND.z) }));
    game.scene?.add(this.group);
    game.events?.on('brush.paint', (e) => { if (e.by === 'courier') this.read(); });
  }

  /** The share of each ring's disc the paint covers (paint only: not crude, not a slick), said if any is touched. */
  read() {
    const pm = this.game.paintmap; if (!pm) return null;
    const share = this.rings.map((R) => { const n = pm.count(R.pos.x, 0, R.pos.z, R.r, false), all = Math.max(1, Math.round((Math.PI * R.r * R.r) / 0.0625)); return Math.min(1, n / all); });
    if (!share.some((s) => s > 0.02)) return null;
    const out = { three: +share[0].toFixed(2), six: +share[1].toFixed(2), nine: +share[2].toFixed(2), by: 'courier' };
    this.game.events?.emit('paintrange.read', out);
    return out;
  }
}
