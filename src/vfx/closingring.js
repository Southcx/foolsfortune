// ---------------------------------------------------------------------------------------
// THE CLOSING RING: a boss's part about to act at sea shows it (docs/plans/RAIL-OVERHAUL.md section 6: "Every boss: telegraphs by a
// shrinking mark on the part about to act (Elemental Gearbolt), in Calissa's outline language"). A ring stands on the part, wide, and
// closes on it over the windup; where it will close, the part's own ring waits, fainter; at the act both are gone (no flash: the act is
// the part's own, its blow or its volley). The line is the parry mark's weight (3.6 px at the 480-line present) and its ink, with the
// Mind's schiller running round inside it (vfx/labradorite.js): the danger is drawn in line, on top of everything, and never bent by
// the storm. It means "this, now": it is not the parry mark (that means "answer this", and nothing else wears it), nor a telegraph
// (Divination's mark of a creature's windup on the ground: vfx/telegraphs/; the rail keeps this ring until it is settled, TELEGRAPHS.md 6.8).
//
// Prior art: Elemental Gearbolt's shrinking target marks (Alfa System, 1997), osu!'s approach circle closing on its hit circle (a
// linear shrink reads as a clock), Sekiro's perilous kanji and Elden Ring's glint (a windup that marks itself).
//
//   const T = new ClosingRings({ max: 16 })   parent.add(T.mesh)   T.parked() -> [mesh]
//   const h = T.mark(target, seconds, { radius, from, alive }?)   target: an Object3D (followed), a Vector3 (read each frame) or a function
//            (out) -> out, the part's place in the world; radius: the part's (m: by default the Object3D's bounding sphere, else 1);
//            from: where the ring starts (m: three radii and 2.5 m by default); alive: () -> bool, asked every frame: the mark is gone
//            the frame it says false (the part was downed, or the fight ended: a ring never closes on what can no longer act)
//   h.cancel()   the act was called off          T.update(rawDt)   T.clear()   T.show(on)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE } from './railmark.js';

const _w = new THREE.Vector3(), _s = new THREE.Sphere(), _b = new THREE.Box3();

export class ClosingRings {
  constructor({ max = 16 } = {}) {
    this.max = max; this.t = 0; this.marks = [];
    this.buf = new MarkBuffer(max, { renderOrder: 42 });
    this.mesh = this.buf.mesh;
  }

  parked() { return [this.mesh]; }
  show(on) { this.mesh.visible = on; }

  mark(target, seconds = 1, { radius = null, from = null, alive = null } = {}) {
    if (radius == null) radius = target?.isObject3D ? (_b.setFromObject(target).isEmpty() ? 1 : _b.getBoundingSphere(_s).radius) : 1;
    const h = { target, seconds: Math.max(0.05, seconds), radius, from: from ?? radius * 3 + 2.5, alive, age: 0, done: false, cancel: () => { h.done = true; } };
    this.marks.push(h);
    if (this.marks.length > this.max) this.marks.shift().done = true;
    return h;
  }
  clear() { for (const h of this.marks) h.done = true; this.marks.length = 0; this.buf.count = 0; this.buf.flush(); }

  /** Where a mark's part is now, in the marks' frame (the parent's: the world in the game). */
  where(h, out) {
    const T = h.target;
    if (T?.isObject3D) T.getWorldPosition(out);
    else if (typeof T === 'function') T(out);
    else if (T) out.copy(T);
    if (T?.isObject3D || typeof T === 'function') this.mesh.parent?.worldToLocal(out);
    return out;
  }

  update(raw = 1 / 60) {
    this.t += raw; this.buf.time(this.t);
    const B = this.buf;
    let k = 0;
    for (const h of this.marks) {
      if (h.done) continue;
      if (h.alive && !h.alive()) { h.done = true; continue; } // (its part is gone: no ring closes on nothing)
      h.age += raw;
      const u = h.age / h.seconds;
      if (u >= 1) { h.done = true; continue; } // (the act: the part's own, and the mark is gone)
      const p = this.where(h, _w), r = h.from + (h.radius - h.from) * u, al = Math.min(1, u / 0.12) * (0.75 + 0.25 * u);
      B.put(k++, p.x, p.y, p.z, r, p.x, p.y, p.z, h.radius, p.x, p.y, p.z, al, p.x, p.y, p.z, al, STYLE.ring);
    }
    this.marks = this.marks.filter((h) => !h.done);
    B.count = k; B.flush();
  }

  dispose() { this.buf.dispose(); }
}
