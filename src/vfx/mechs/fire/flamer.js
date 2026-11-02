// ---------------------------------------------------------------------------------------
// THE FLAMER'S CONE (plain name; the city's fire's look, vfx/mechs/fire/; the back part `flamer` Dovina's, held on G): while it fires,
// a cone of flame thrown from the nozzle on its arm over the right shoulder (its look parts/backs.js BACK_LOOKS.flamer) along the
// frame's facing: flame cards (flames.js) laid down the cone's axis, widening from FIRE_LOOK.flamer.r0 to r1 over its length, hung on
// the back mount so the frame's pose carries them (written once as it lights, never a frame), and the library's `mech.flamer.fire`
// held at the nozzle (heat haze down the cone, flame thrown, sparks, smoke at its end). A frame without the part shows nothing.
// Prior art: the flamethrowers of Armored Core's back units and Metal Gear's mechs, Far Cry 2's flamethrower (a cone of soft flame
// with a white root), the crossed-card fire every sixth-generation game drew.
//
//   const F = new FlamerLook(game)   F.set(on)   F.update(dt)   F.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK } from './table.js';
import { FlameCards } from './flames.js';

const FL = FIRE_LOOK.flamer;
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, -0.12, 1).normalize(), _p = new THREE.Vector3(), _q = new THREE.Vector3(), _d = new THREE.Vector3();

export class FlamerLook {
  constructor(game) { this.game = game; this.on = false; this.cards = null; this.mount = null; this.h = null; this.k = 0; }
  set(on) { this.on = !!on; }
  body() { const B = this.game.hangar?.pilot?.mech; return B?.sel?.back === 'flamer' && B.joints?.backMount ? B : null; }

  update(dt) {
    const B = this.body(), on = this.on && !!B;
    this.k = Math.max(0, Math.min(1, this.k + (on ? dt * 6 : -dt * 4)));
    if (!B || this.k <= 0) { this.drop(); return; }
    const M = B.joints.backMount;
    if (this.mount !== M) { this.drop(); this.mount = M; this.lay(M); }
    this.cards.mesh.visible = this.k > 0.05;
    this.cards.mesh.scale.setScalar(0.3 + 0.7 * this.k); // (the cone grows out of the nozzle as it lights; its foot at the nozzle)
    M.updateMatrixWorld(true); M.localToWorld(_p.fromArray(FL.nozzle)); M.localToWorld(_q.fromArray(FL.nozzle).add(AY)); _d.subVectors(_q, _p).normalize();
    if (on && !this.h) { try { this.h = this.game.vfx?.play('mech.flamer.fire', { pos: _p, dir: _d }) || null; } catch { this.h = null; } }
    if (this.h) { this.h.pos.copy(_p); this.h.dir.copy(_d); if (!on) { this.h.stop(); this.h = null; } }
  }
  /** The cone's cards on the mount, its foot at the nozzle (the mesh's origin, so a scale grows it out of the nozzle). */
  lay(M) {
    const n = FL.cards; this.cards = new FlameCards(M, n, 'fire.flamer.cone');
    this.cards.mesh.position.fromArray(FL.nozzle);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), at = u * FL.length * 0.82, r = FL.r0 + (FL.r1 - FL.r0) * Math.pow(u, 0.8), seg = FL.length / n * 2.2;
      _p.copy(AY).multiplyScalar(at);
      this.cards.setBasis(i, AX, AY, _p, r * 2, seg + r, i * 0.37, u * 0.4, 0.15);
    }
    this.cards.commit(n);
  }
  drop() { this.cards?.dispose(); this.cards = null; this.mount = null; if (this.h) { this.h.stop(); this.h = null; } }
  clear() { this.on = false; this.k = 0; this.drop(); }
}
