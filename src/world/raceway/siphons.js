// ---------------------------------------------------------------------------------------
// THE SIPHONS (working name, Espada's to rule; the owner, 2026-10-15: "have your Lachryma pool drain upon passing through a gate of sorts"):
// an arch across a track that drinks the pool down to a quarter of its max as you pass under it, a hazard of the world (CLAUDE.md's law:
// the base never changes; what changes it has a source you can see). Each stands just before a vein lane, so the two make a PIT STRETCH:
// drained, then the lane to fill again or the line to keep the pace. It drains the pool you already have (the same pool everywhere);
// never its max, never its regen. The Pit lane licence runs through the Sun Circuit's.
// Event: skiff.siphon { took, left } (with `by: 'environment'`). The arch's look is a placeholder (Calissa's: two dark pillars and a
// lintel, Lachryma drawn up into it).
//
// Prior art: F-Zero's energy-draining zones and Wipeout's, the drain gates of the racers' pit lanes, Zelda's Like Likes (a thing that
// takes what you carry, and you see it coming).
//
//   SIPHONS { [track]: [s] }   const S = new Siphons(raceway)   S.build()   S.update(dt)   SIPHON (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';

/** Where they stand (m along each track's line: a few metres before its second vein lane). */
export const SIPHONS = { sun: [1960], gorge: [2380], coaster: [1530] };
/** The share of the max it leaves you, metres either side of the running surface it reaches, the arch's height (m). */
export const SIPHON = { keep: 0.25, reach: 2, height: 9 };

export class Siphons {
  constructor(R) { this.R = R; this.prev = null; }
  get game() { return this.R.game; }
  build() {
    const R = this.R, g = this.game, group = new THREE.Group(); group.userData.zone = 'raceway';
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a1438, roughness: 0.7, emissive: 0x3a1a66, emissiveIntensity: 0.4 });
    for (const [id, list] of Object.entries(SIPHONS)) {
      const T = R.trackOf(id); if (!T) continue;
      for (const s of list) {
        const F = T.frame(s), yaw = Math.atan2(F.fx, F.fz), w = F.w + 1.5, H = SIPHON.height;
        for (const side of [-1, 1]) { const x = RW.x + F.x - F.fz * w * side, z = RW.z + F.z + F.fx * w * side, m = new THREE.Mesh(new THREE.BoxGeometry(1.2, H, 1.2), mat); m.position.set(x, R.heightAt(x, z) + H / 2, z); m.rotation.y = yaw; group.add(m); }
        const top = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + 1.2, 1, 1.4), mat), x = RW.x + F.x, z = RW.z + F.z; top.position.set(x, R.heightAt(x, z) + H, z); top.rotation.y = yaw; group.add(top);
      }
    }
    g.scene.add(group); this.group = group;
  }
  /** Passing under one (the place on the line crossing it, on the running surface): the pool drunk down to SIPHON.keep of its max. */
  update() {
    const R = this.R, g = this.game, L = g.lachryma, list = SIPHONS[R.track?.id];
    if (!L || !list || R.line !== 'main') { this.prev = null; return; }
    const s = R.s, p = this.prev; this.prev = s; if (p == null || s - p <= 0 || s - p > 30) return;
    for (const bs of list) {
      if (!(p < bs && s >= bs) || R.d > R.track.frame(bs).w + SIPHON.reach) continue;
      const took = Math.max(0, L.value - L.max * SIPHON.keep); if (took > 0) L.drain(took, 'siphon');
      g.events?.emit('skiff.siphon', { took: Math.round(took), left: Math.round(L.value), by: 'environment' });
    }
  }
}
