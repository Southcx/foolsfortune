// ---------------------------------------------------------------------------------------
// A FLARE'S REVEAL OUTLINE: what the Bombardier's flare found (tools/psygun/variantplay.js sets `c.revealed` on every creature within its
// 6 m, for its 8 s) drawn as an outline through walls in the flare's ember, held while `c.revealed` holds and gone with it (Dovina's
// ruling, OVERLAY.md 19: the tag shows as at the lock-on, vfx/creaturetags.js `choose()`; the outline is the look). It marks scouting, not
// a hit: a thin hull seen only where the creature is hidden (in plain view its tag says enough), never the MARK shell's hot rim. No words.
// It borrows the shells' see-through hull (render/outline.js `makeGlowOutline(.., true)`: GreaterDepth, its program 'glow-xray' already
// warmed), so it adds no shader program; one material for every revealed creature, its glow easing in, and out over the last second.
//
// Prior art: Far Cry's and Horizon Zero Dawn's tagged enemies (an outline seen through cover while the tag lasts), Metal Gear Solid V's
// marking, and the game's own MARK shell (the same hull, in its own colour).
//
//   const R = new FlareReveal(game)   R.update()   (each frame, beside the other world marks: main.js)   R.shown -> how many are outlined
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { makeGlowOutline } from '../render/outline.js';

const EMBER = 0xffb04a, WIDTH = 0.012, PEAK = 0.5; // (the flare's gold; the hull's push in m; its opacity, additive)

export class FlareReveal {
  constructor(game) {
    this.game = game; this.on = new Map(); this.t = 0;
    this.mat = makeGlowOutline(EMBER, WIDTH, true); this.mat.opacity = 0;
  }
  get shown() { return this.on.size; }

  /** The see-through hulls over one creature's meshes (skinned or not), as the MARK shell's are made (creatures/clappers.js `stun`). */
  dress(c) {
    const out = [];
    (c.root || c.body || c.model || c.mesh)?.traverse?.((o) => {
      if (!o.isMesh || o.userData.isOutline || o.userData.flareReveal || !o.geometry?.attributes?.position) return;
      let m;
      if (o.isSkinnedMesh) { m = new THREE.SkinnedMesh(o.geometry, this.mat); m.bind(o.skeleton, o.bindMatrix); m.bindMode = o.bindMode; o.parent.add(m); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); }
      else { m = new THREE.Mesh(o.geometry, this.mat); o.add(m); }
      m.userData.flareReveal = true; m.userData.isOutline = true; m.renderOrder = 10; m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
      out.push(m);
    });
    return out;
  }

  update() {
    const g = this.game, dt = g.rawDt ?? 1 / 60; this.t += dt;
    for (const [c, hulls] of this.on) if (!c.alive || !c.revealed) { hulls.forEach((m) => m.parent?.remove(m)); this.on.delete(c); }
    for (const c of g.creatures?.list || []) if (c.revealed && c.alive && !this.on.has(c)) this.on.set(c, this.dress(c));
    // (the ease: in over 0.25 s from the first find, out over the last second the flare has left: play.revealed holds the seconds)
    let left = 0; for (const s of (g.weapon?.play?.revealed?.values?.() || [])) left = Math.max(left, +s || 0);
    const want = this.on.size ? PEAK * Math.min(1, left || 1) : 0;
    this.mat.opacity += (want - this.mat.opacity) * Math.min(1, dt * 8);
  }
}
