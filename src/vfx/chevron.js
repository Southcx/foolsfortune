// ---------------------------------------------------------------------------------------
// THE CHEVRON: the prism the target mark is drawn as (vfx/targetmark.js, which says where and in which state). Two inverted
// pentagonal pyramids, one nested in the other, the outer wide, tall and translucent and the inner small and brighter, turning
// against each other and bobbing, each coming to a point at the bottom (it points at the thing); drawn through everything (a marker
// has to be found: casebook 162's `throughWalls`, the reason the player sees is that it is the System's sight) with a bright edge on
// each. It pops in with a little overshoot and eases from target to target rather than jumping. Where up is not the world's (a
// planetoid in the Spirit Garden), a source gives its `up` and the chevron stands along it and bobs along it (the garden sweep's #4:
// it was off the planetoid's heart by up to 52 degrees).
//
// Its states are styles laid on it each frame (`style`): its size, its edges and body turned the lock's gold (the Mind program's
// uGold, vfx/labradorite.js), its spin, the inner prism's flash pulsed (at a constant rate: precept 3), dimmed (the read state), and,
// for the lock, five blades: its five side edges run on down past its point as short spikes, fanned round the thing and closing on
// it as the lock takes (Rez's lock squares and Zelda's Z-target brackets, the prism's own geometry carrying them).
//
// Prior art: the floating crystal of The Sims' Plumbob and the down-pointing arrow over the thing you can act on in Zelda, Persona
// and every action-RPG since; the two-layer, counter-rotating build is what keeps it alive while it is doing nothing.
//
// It is the System telling you what is, so it is drawn as the Mind is (vfx/labradorite.js, docs/ART.md precept 3): the outer a
// shell of black labradorite with the schiller coming up at its turn, the inner a glassy flash of it, the edges softly rainbow.
//
//   const c = new Chevron(scene, { blades, order })   c.target(p | null, up?)   c.style({ size, gold, spin, pulse, dim, bob, blade })
//   c.update(dt)   c.copyPose(other)   c.cut()   c.group (visible, position: what is drawn)   c.top(out) (the middle of its wide face)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial, mindFillMaterial, mindTick } from './labradorite.js';

/** Ease-out-back: 0 -> 1 with a small overshoot, continuous at both ends. */
export const backOut = (u, c = 1.4) => 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;
const _Y = new THREE.Vector3(0, 1, 0);
const HALF = 0.23; // (half the outer's height: its point is this far below the group's origin, its wide face this far above)

/** The five blades in one mesh, in the outer prism's frame with its point at the origin: each spike runs from a gap past the point to
 *  its tip along the line its side edge makes through the point (so it reads as the edge run on), at a unit radius one unit down. */
function bladeGeometry() {
  const pos = [], idx = [], A = 0.42, W = 0.13; // (W 0.13: at 0.06 the blades could not be made out at 7 m, the first shot)
  for (let j = 0; j < 5; j++) {
    const th = (j / 5) * Math.PI * 2, d = new THREE.Vector3(-Math.sin(th), -1, -Math.cos(th)); // (through the point from the top's vertex j)
    const t = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th)), n = new THREE.Vector3().crossVectors(d, t).normalize(), b = d.clone().multiplyScalar(A), o = pos.length / 3;
    for (let q = 0; q < 3; q++) { const f = (q / 3) * Math.PI * 2; const v = b.clone().addScaledVector(t, Math.cos(f) * W).addScaledVector(n, Math.sin(f) * W); pos.push(v.x, v.y, v.z); }
    pos.push(d.x, d.y, d.z); idx.push(o, o + 1, o + 3, o + 1, o + 2, o + 3, o + 2, o, o + 3, o, o + 2, o + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export class Chevron {
  constructor(scene, { blades = false, order = 40 } = {}) {
    this.group = new THREE.Group();
    this.group.visible = false; this.group.name = 'target-mark';
    this.mats = { lines: [], fills: [] };
    const mk = (geo, opacity, ink, o) => {
      const fill = new THREE.Mesh(geo, mindFillMaterial({ opacity, ink }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mindLineMaterial({ opacity: Math.min(1, opacity + 0.4), bright: 1.1 }));
      fill.renderOrder = o; edges.renderOrder = o + 1; fill.frustumCulled = edges.frustumCulled = false;
      fill.material.userData.base = opacity; edges.material.userData.base = Math.min(1, opacity + 0.4); // (what it was drawn at: the usable state exactly as the chevron was)
      this.mats.fills.push(fill.material); this.mats.lines.push(edges.material);
      const g = new THREE.Group(); g.add(fill, edges); return g;
    };
    const cyl = (rt, h) => new THREE.CylinderGeometry(rt, 0, h, 5, 1, false); // (wide at the top, to a point at the bottom: inverted)
    this.outer = mk(cyl(0.27, 0.46), 0.6, 1, order);
    this.inner = mk(cyl(0.15, 0.27), 0.55, 0, order);
    this.innerFill = this.inner.children[0].material;
    this.inner.position.y = 0.06; // (its point just above the outer's)
    this.group.add(this.outer, this.inner);
    if (blades) { this.blades = mk(bladeGeometry(), 0.75, 1, order + 2); this.blades.position.y = -HALF; this.blades.visible = false; this.outer.add(this.blades); }
    scene.add(this.group);
    this.t = 0; this.k = 0; this.want = 0; this.pos = new THREE.Vector3(); this.has = false;
    this.up = new THREE.Vector3(0, 1, 0); this.upWant = new THREE.Vector3(0, 1, 0); // (which way is up where the thing is: a planetoid's own)
    this.st = { size: 1, gold: 0, spin: 1, pulse: 0, dim: 1, bob: 0.05, blade: null }; this.gold = 0; this.dim = 1; this.spin = 1; this.close = 0;
  }

  /** Aim at a world point (or null to fade out); `up`, where up is not the world's (a planetoid's normal there), points it along it. */
  target(p, up = null) {
    if (!p) { this.want = 0; return; }
    this.upWant.copy(up || _Y).normalize();
    if (!this.has || this.k < 0.05) { this.pos.copy(p); this.up.copy(this.upWant); } // (a fresh appearance snaps to the thing, then follows)
    this.tp = p; this.want = 1; this.has = true;
  }
  /** How it looks this frame: size (times the chevron's own), gold 0..1, spin (times its turn), pulse (the inner's flash), dim (its
   *  opacity's share), bob (world m), blade { r, l, k } (the blades' radius and depth below its point, world m, and how closed). */
  style(s) { Object.assign(this.st, s); return this; }
  /** Take another's place, pose and pop as it is (the hand-over between two marks on one thing: never two drawn at once). */
  copyPose(o) {
    this.pos.copy(o.pos); this.up.copy(o.up); this.upWant.copy(o.upWant); this.k = o.k; this.t = o.t; this.has = true; this.tp = o.tp; this.want = o.want;
    this.outer.rotation.y = o.outer.rotation.y; this.inner.rotation.y = o.inner.rotation.y; this.gold = o.gold; this.size = o.size; this.dim = o.dim;
  }
  /** Gone at once (its place taken by another). */
  cut() { this.k = 0; this.want = 0; this.has = false; this.group.visible = false; }
  /** The middle of its wide face as drawn (where a tag's thread is tied). */
  top(out) { return out.copy(this.group.position).addScaledVector(this.up, HALF * this.group.scale.y); }

  update(dt) {
    this.t += dt;
    mindTick();
    // (k walks to want and stops there: stepping past it and back made the pop scale flip every frame, the old jitter)
    this.k = this.want > this.k ? Math.min(this.want, this.k + dt * 6) : Math.max(this.want, this.k - dt * 5);
    if (this.k <= 0) { this.group.visible = false; this.has = false; this.close = 0; return; }
    const S = this.st, e = (r) => 1 - Math.exp(-dt * r);
    if (this.tp) this.pos.lerp(this.tp, e(14));
    this.size = this.size == null ? S.size : this.size + (S.size - this.size) * e(10);
    this.gold += (S.gold - this.gold) * e(9); this.dim += (S.dim - this.dim) * e(8); this.spin += (S.spin - this.spin) * e(6);
    this.group.visible = true;
    // pop in with an overshoot (ease-out-back: it lands on exactly 1, no step at the end)
    const s = backOut(this.k);
    this.up.lerp(this.upWant, e(10)).normalize();
    this.group.quaternion.setFromUnitVectors(_Y, this.up); // (it points down at the thing along the thing's own up)
    this.group.position.copy(this.pos).addScaledVector(this.up, S.bob * Math.sin(this.t * 2.6));
    this.group.scale.setScalar(Math.max(0.001, s * this.size));
    this.outer.rotation.y += dt * 1.1 * this.spin;
    this.inner.rotation.y -= dt * 1.8 * this.spin * this.spin;
    this.inner.position.y = 0.06 + 0.02 * Math.sin(this.t * 3.1 + 1);
    // the materials: gold, dimmed, the inner's flash pulsed while it is also what F would use (a constant 2.2 Hz: precept 3)
    const fade = this.dim;
    for (const m of this.mats.lines) { m.uniforms.uGold.value = this.gold; m.uniforms.uOpacity.value = m.userData.base * fade; }
    for (const m of this.mats.fills) { m.uniforms.uGold.value = this.gold; m.uniforms.uOpacity.value = m.userData.base * fade; }
    if (S.pulse) this.innerFill.uniforms.uOpacity.value = (0.55 + 0.4 * (0.5 + 0.5 * Math.sin(this.t * 13.8))) * fade;
    if (this.blades) {
      const B = S.blade, want = B && this.want ? B.k : 0;
      this.close += (want - this.close) * e(want > this.close ? 7 : 5);
      this.blades.visible = !!B && this.close > 0.01;
      if (this.blades.visible) { // (its radius from wide open to the thing's own as it closes, a little spin as it takes: the old reticle's turn-in)
        const u = Math.max(0.001, s * this.size), r = B.r * (2.1 - 1.0 * this.close) / u, l = B.l / u;
        this.blades.scale.set(r, l, r); this.blades.rotation.y = (1 - this.close) * 0.9;
        const a = Math.min(1, this.close * 1.4) * fade; this.blades.children[0].material.uniforms.uOpacity.value = 0.75 * a; this.blades.children[1].material.uniforms.uOpacity.value = a;
      }
    }
  }
}
