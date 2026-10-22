// ---------------------------------------------------------------------------------------
// THE REFIT SWEEP: the showcase crossing's hull swap covered (Petra's showcase.hull { hull, k }, world/emocean/triprun.js: the new hull's look
// swaps visibility with the old one in the turn between legs, no cover of its own). A hoop of light the hull's girth passes from bow to
// stern over the new hull in 0.7 real s, a bright plane inside it, so the change reads as a refit made, never a pop. Drawn with the
// rail's plain additive look (MeshBasicMaterial, additive: a program the lights to lock already compile), kept true under the storm's veil.
//
// Prior art: the scan-line "materialise" of the Gummi ship's garage (KH2) and Star Fox's wing repair, the classic hologram build-up
// sweep; the Gate's gate-out bands (vfx/gatering.js) as its sibling on foot.
//
//   const R = new RefitSweep(game)   R.build(scene)   R.update(raw, look)   (look: the hull sailing, shipLook's API: group, length, beam)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { keepTrue } from './stormwarp.js';

const SWEEP = { time: 0.7, girth: 1.25, ring: 0xbff3ff, plane: 0x9fd8ff, ringAlpha: 0.95, planeAlpha: 0.35 };
const _p = new THREE.Vector3(), _q = new THREE.Quaternion();

export class RefitSweep {
  constructor(game) {
    this.game = game; this.t = Infinity;
    game.events?.on?.('showcase.hull', (e) => { if ((e?.k ?? 0) > 0) this.t = 0; }); // (the first hull is boarded at the pier: no sweep)
  }
  build(scene) {
    const add = (geo, color, opacity) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, forceSinglePass: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      keepTrue(m.material); m.visible = false; m.renderOrder = 55; m.frustumCulled = false; m.userData.zoneFree = true; scene.add(m); return m;
    };
    this.ring = add(new THREE.TorusGeometry(1, 0.035, 6, 40), SWEEP.ring, SWEEP.ringAlpha); // (in its XY plane: faces along the hull)
    this.plane = add(new THREE.CircleGeometry(1, 32), SWEEP.plane, SWEEP.planeAlpha);
  }
  parked() { return [this.ring, this.plane]; }
  /** Once a frame: the sweep down the hull sailing, bow to stern, while it runs. */
  update(raw, look) {
    if (!this.ring) return;
    const on = this.t < SWEEP.time && !!look?.group?.visible;
    this.ring.visible = this.plane.visible = on;
    if (!on) return;
    this.t += raw;
    const k = Math.min(1, this.t / SWEEP.time), e = k * k * (3 - 2 * k), g = look.group;
    const L = (look.length ?? 7), B = (look.beam ?? 2.4), r = Math.max(B, L * 0.18) * 0.5 * SWEEP.girth;
    g.updateWorldMatrix(true, false);
    const s = g.getWorldScale(_p).x;
    _p.set(0, r * 0.6, L * (0.55 - 1.1 * e)).applyMatrix4(g.matrixWorld); // (the bow (+Z) to the stern, centred a little above the waterline)
    g.getWorldQuaternion(_q);
    for (const m of [this.ring, this.plane]) { m.position.copy(_p); m.quaternion.copy(_q); m.scale.setScalar(r * s); }
    const fade = Math.sin(Math.PI * k);
    this.ring.material.opacity = SWEEP.ringAlpha * fade; this.plane.material.opacity = SWEEP.planeAlpha * fade * (1 - k * 0.5);
  }
}
