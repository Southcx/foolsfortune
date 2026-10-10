// ---------------------------------------------------------------------------------------
// AFTERIMAGES: the Courier's body left behind, a ghost of the pose on show that fades where it was left. One look for every feat of the
// Courier's speed (the owner, 2026-10-10: "use the same afterimage effect that Blink Dash does"): Blink Dash's (courier/moves/blink.js),
// the stinger's (tools/sondelass/cutlass.js) and the paid cut's (tools/moveset.js) are this one module, so the three read as one.
// The ghost is the character's skinned pose baked to a mesh (`character.snapshot`) in an additive, unlit material; it fades as the
// square of what is left of its life and walks the oil film's hues as it fades (`featTint`, vfx/oxidation.js: a feat of the Courier's
// power reads as Lachryma), drifting a little if asked. No words, no numbers.
//
//   const A = new Afterimages(game, { opacity, life })   A.leave({ ph, drift, opacity, life }) -> bool   A.update(dt)   A.clear()
//   `ph`: the hue's start on the film (the caller's own chance stream: a look never draws from the simulation's); `drift`: m/s.
//   Each owner ticks its own (Blink Dash in its tick, a tool in its frame); `clear()` when the owner is put away.
//
// Prior art: Devil May Cry's and Bayonetta's dodge and cancel afterimages (a still of the pose, additive, fading in a fraction of a
// second), Sonic's and Mega Man X's dash echoes, and the motion-blur "ghosts" of Ninja Gaiden's Izuna drop.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { featTint } from './oxidation.js';

export class Afterimages {
  constructor(game, { opacity = 0.45, life = 0.4, walk = 0.5 } = {}) {
    this.game = game; this.opacity = opacity; this.life = life; this.walk = walk;
    this.list = [];
  }

  /** Leave one ghost of the pose on show. False when the body is hidden (a blink's flash) or there is none. */
  leave({ ph = 0, drift = null, opacity = this.opacity, life = this.life } = {}) {
    const ch = this.game.character;
    if (!ch || ch.hidden) return false;
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
    featTint(ph, mat.color); // (its hue's start on Lachryma's film)
    const obj = ch.snapshot(mat);
    this.game.scene.add(obj);
    this.list.push({ obj, mat, age: 0, ph, life, opacity, drift: drift ? drift.clone() : null });
    return true;
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const g = this.list[i];
      g.age += dt;
      const k = 1 - g.age / g.life;
      if (k <= 0) { this.drop(i); continue; }
      g.mat.opacity = g.opacity * k * k;
      featTint(g.ph + (1 - k) * this.walk, g.mat.color); // (the film's hues walked as it fades)
      if (g.drift) g.obj.position.addScaledVector(g.drift, dt);
    }
  }

  drop(i) {
    const g = this.list[i];
    this.game.scene.remove(g.obj);
    g.obj.traverse((o) => o.geometry?.dispose());
    g.mat.dispose();
    this.list.splice(i, 1);
  }

  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.drop(i); }
}
