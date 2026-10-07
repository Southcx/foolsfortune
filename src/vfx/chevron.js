// ---------------------------------------------------------------------------------------
// THE CHEVRON: the marker that hangs over what can be used when you are close enough to use it. Two inverted pentagonal pyramids,
// one nested in the other, the outer wide, tall and translucent and the inner small and brighter, turning against each other and
// bobbing, each coming to a point at the bottom (it points at the thing); drawn through everything (a marker has to be found) with a bright edge on each. It pops in with a little overshoot and
// eases from target to target rather than jumping. Where up is not the world's (a planetoid in the Spirit Garden), a source gives its
// `up` and the chevron stands along it and bobs along it (the garden sweep's #4: it was off the planetoid's heart by up to 52 degrees).
//
// Prior art: the floating crystal of The Sims' Plumbob and the down-pointing arrow over the thing you can act on in Zelda, Persona
// and every action-RPG since; the two-layer, counter-rotating build is what keeps it alive while it is doing nothing.
//
// It is the System telling you what F would do, so it is drawn as the Mind is (vfx/labradorite.js, docs/LOOK.md): the outer a
// shell of black labradorite with the schiller coming up at its turn, the inner a glassy flash of it, the edges softly rainbow.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial, mindFillMaterial, mindTick } from './labradorite.js';

/** Ease-out-back: 0 -> 1 with a small overshoot, continuous at both ends. */
export const backOut = (u, c = 1.4) => 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;
const _Y = new THREE.Vector3(0, 1, 0);

export class Chevron {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    const mk = (rt, rb, h, opacity, ink) => {
      const geo = new THREE.CylinderGeometry(rt, rb, h, 5, 1, false); // (wide at the top, to a point at the bottom: inverted)
      const fill = new THREE.Mesh(geo, mindFillMaterial({ opacity, ink }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mindLineMaterial({ opacity: Math.min(1, opacity + 0.4), bright: 1.1 }));
      const g = new THREE.Group(); g.add(fill, edges);
      fill.renderOrder = 40; edges.renderOrder = 41;
      return g;
    };
    this.outer = mk(0.27, 0, 0.46, 0.6, 1);
    this.inner = mk(0.15, 0, 0.27, 0.55, 0);
    this.inner.position.y = 0.06; // (its point just above the outer's)
    this.group.add(this.outer, this.inner);
    scene.add(this.group);
    this.t = 0; this.k = 0; this.want = 0; this.pos = new THREE.Vector3(); this.has = false;
    this.up = new THREE.Vector3(0, 1, 0); this.upWant = new THREE.Vector3(0, 1, 0); // (which way is up where the thing is: a planetoid's own)
  }

  /** Aim at a world point (or null to fade out); `up`, where up is not the world's (a planetoid's normal there), points it along it. */
  target(p, up = null) {
    if (!p) { this.want = 0; return; }
    this.upWant.copy(up || _Y).normalize();
    if (!this.has || this.k < 0.05) { this.pos.copy(p); this.up.copy(this.upWant); } // (a fresh appearance snaps to the thing, then follows)
    this.tp = p; this.want = 1; this.has = true;
  }

  update(dt) {
    this.t += dt;
    mindTick();
    // (k walks to want and stops there: stepping past it and back made the pop scale flip every frame, the old jitter)
    this.k = this.want > this.k ? Math.min(this.want, this.k + dt * 6) : Math.max(this.want, this.k - dt * 5);
    if (this.k <= 0) { this.group.visible = false; this.has = false; return; }
    if (this.tp) this.pos.lerp(this.tp, 1 - Math.exp(-dt * 14));
    this.group.visible = true;
    // pop in with an overshoot (ease-out-back: it lands on exactly 1, no step at the end)
    const s = backOut(this.k);
    this.up.lerp(this.upWant, 1 - Math.exp(-dt * 10)).normalize();
    this.group.quaternion.setFromUnitVectors(_Y, this.up); // (it points down at the thing along the thing's own up)
    this.group.position.copy(this.pos).addScaledVector(this.up, 0.05 * Math.sin(this.t * 2.6));
    this.group.scale.setScalar(Math.max(0.001, s));
    this.outer.rotation.y += dt * 1.1;
    this.inner.rotation.y -= dt * 1.8;
    this.inner.position.y = 0.06 + 0.02 * Math.sin(this.t * 3.1 + 1);
  }
}
