// ---------------------------------------------------------------------------------------
// THE WHEEL: what a Lockheart's odds look like, put up in the air over it when it is opened. A ring of sectors, each an outcome's colour
// and as wide as its chance (tools/lockheart/table.js: the keys on the ring have already changed them, so an INVERTED gambler's wheel is
// nearly all jackpot), a pointer at the top, and the wheel spun: fast, then slowing, ticking past each sector's edge, to stop on what was
// drawn (the draw is made first; the wheel only shows it: the honest kind of roulette animation). A mark in the world, not words.
//
// Prior art: the gacha banner's spin and the prize wheel of the game show (Wheel of Fortune), the slot reel's ease-out and its ticks,
// and Persona's arcana roulette after a battle (the odds shown as you watch).
//
//   const w = new Wheel(scene)   w.spin(rates, chosenId, pos, face, onStop, size = 1)   w.update(dt)   w.busy   (a rate may carry its own `color`:
//   the catch's two sectors, caught and free, are no outcome of the table)
//   w.show(rates, pos, face) / w.fold()   the wheel put up still, its sectors the odds as they stand, while the Opening's hold is held
//   (OVERLAY.md 19.8: the rates readable before you commit), and folded away; `w.still` while it is up
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OUTCOMES } from './table.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/lockheart/wheel'); // (the simulation's chance: core/rng.js, the same twice)

const R0 = 0.32, R1 = 0.62, DUR = 2.1, HOLD = 0.9;

export class Wheel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); this.group.visible = false;
    this.disc = new THREE.Group(); this.group.add(this.disc);
    // the pointer (at the top), a rim and a hub
    const brass = new THREE.MeshBasicMaterial({ color: 0xd9b048 });
    const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 3), brass); ptr.rotation.z = Math.PI; ptr.position.set(0, R1 + 0.06, 0.02); this.group.add(ptr);
    const rim = new THREE.Mesh(new THREE.RingGeometry(R1, R1 + 0.025, 48), brass); this.group.add(rim);
    const hub = new THREE.Mesh(new THREE.CircleGeometry(R0 - 0.02, 24), new THREE.MeshBasicMaterial({ color: 0x1a0f0a })); hub.position.z = 0.002; this.group.add(hub);
    for (const m of [ptr, rim, hub]) m.renderOrder = 6;
    scene.add(this.group);
    this.t = -1;
  }
  get busy() { return this.t >= 0; }

  /** Put the wheel up still: the odds as they stand, no spin (the Opening's hold). */
  show(rates, pos, face) {
    if (this.busy) return;
    this.lay(rates, null); this.size = 1; this.disc.rotation.z = 0;
    this.group.position.copy(pos); this.group.quaternion.copy(face);
    if (!this.still) this.group.scale.setScalar(0.01);
    this.group.visible = true; this.still = true; this.foldT = -1;
  }
  /** Fold the still wheel away (let go short of the open, or the open refused). */
  fold() {
    if (!this.still) return;
    this.still = false; this.foldT = 0;
  }

  /** The sectors laid out (best last, clockwise from the top); where in `chosen`'s sector the pointer will stop. */
  lay(rates, chosen) {
    for (const c of [...this.disc.children]) { c.geometry.dispose(); c.material.dispose(); this.disc.remove(c); }
    let a = 0, target = 0;
    for (const r of rates) {
      const len = r.p * Math.PI * 2;
      if (len < 1e-4) continue;
      const m = new THREE.Mesh(new THREE.RingGeometry(R0, R1, Math.max(2, Math.ceil(len * 12)), 1, Math.PI / 2 - a - len, len), new THREE.MeshBasicMaterial({ color: r.color ?? OUTCOMES[r.id]?.color ?? 0xffffff, side: THREE.DoubleSide }));
      m.renderOrder = 5; this.disc.add(m);
      if (r.id === chosen) target = a + len * (0.2 + 0.6 * simRand()); // (somewhere in its sector, not always the middle)
      a += len;
    }
    this.edges = []; let e = 0; for (const r of rates) { e += r.p * Math.PI * 2; this.edges.push(e); }
    return target;
  }

  /** Lay the sectors out and spin to land on `chosen`. */
  spin(rates, chosen, pos, face, onStop, size = 1) {
    this.size = size; // (the opening puts it up in the sky, enormous: tools/lockheart/ultimate.js)
    const up = this.still; // (put up still by the hold: it spins from where it stands, no second rise)
    this.still = false; this.foldT = -1;
    const target = this.lay(rates, chosen);
    // turns: several whole ones, then the sector under the pointer (the disc turns clockwise: the pointer reads `angle` from the top)
    this.from = 0; this.to = Math.PI * 2 * (5 + Math.floor(simRand() * 2)) + target;
    this.t = 0; this.onStop = onStop; this.lastEdge = 0;
    this.group.position.copy(pos);
    this.group.quaternion.copy(face);
    this.rise = !up; this.group.visible = true; if (!up) this.group.scale.setScalar(0.01);
  }

  update(dt) {
    if (this.still) { this.group.scale.setScalar(Math.min(1, this.group.scale.x + dt / 0.18)); return; } // (up, still)
    if (this.foldT >= 0) { this.foldT += dt; this.group.scale.setScalar(Math.max(0.01, 1 - this.foldT / 0.2)); if (this.foldT >= 0.2) { this.foldT = -1; this.group.visible = false; } return; }
    if (this.t < 0) return;
    this.t += dt;
    const u = Math.min(1, this.t / DUR), k = 1 - Math.pow(1 - u, 3.2); // (an ease-out: it slows into its stop)
    const ang = this.from + (this.to - this.from) * k;
    this.disc.rotation.z = ang;
    this.group.scale.setScalar(this.size * (this.rise ? Math.min(1, this.t / 0.18) : 1));
    // a tick each time a sector's edge passes the pointer
    const turn = ang % (Math.PI * 2), edge = this.edges.findIndex((x) => x > turn);
    if (edge !== this.lastEdge) { this.lastEdge = edge; sfx.wheelTick?.(1 - u); }
    if (this.t >= DUR && !this.stopped) { this.stopped = true; this.onStop?.(); }
    if (this.t >= DUR + HOLD) { this.group.scale.setScalar(this.size * Math.max(0.01, 1 - (this.t - DUR - HOLD) / 0.2)); if (this.t >= DUR + HOLD + 0.2) { this.t = -1; this.stopped = false; this.group.visible = false; } }
  }
}
