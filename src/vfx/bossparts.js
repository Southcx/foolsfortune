// ---------------------------------------------------------------------------------------
// BOSS PARTS: the pieces of a leg's big object that the runtime hits and breaks, each its own object (docs/plans/RAIL-OVERHAUL.md
// section 6: "the big object (parts that pay)"; docs/GLOSSARY.md: a boss part). The False Light's rigging, gunports, keel and lamp
// (vfx/brig.js), Old Nobody's gills, teeth and eye (vfx/leviathan.js), the Drowned Light's lamp and windows (vfx/drownedlighthouse.js)
// are all one kind of thing, so they answer the runtime the same way:
//
//   STATE      intact, damaged, broken: each look says how its part shows each one (a callback); the runtime says which, the look
//              never decides (Petra counts the hits, Dovina sizes them)
//   SEALED     a part that cannot be hit yet (the figurehead's lamp until the rigging is cut: Ikaruga's covers that open for the
//              matching answer); its line and glow is dark while it is
//   LINE AND GLOW  every part wears its edges in the Mind's labradorite (vfx/labradorite.js, Rez's wireframes): what fights is drawn in
//              line and glow so it reads against the dark midtones of a tarred hull or a crude hide. Bright intact, dim damaged, gone
//              broken; a hit lifts it for a fifth of a real second (a pulse on the part, never a flash on the screen)
//   THE TELEGRAPH  `telegraphAnchor`: an Object3D on the part where the shrinking mark sits (the mark is another module's: Elemental
//              Gearbolt's boxes, in the outline language), its `userData.radius` (m) the mark's size and `userData.facing` the way
//              the part faces (local); `windup(k)` is the part's own body telegraph (a port's lid, a gill's flare, the lamp's warning
//              line) and `windupK` what the mark reads
//
// Prior art: KH2's Phantom Storm (one ship, parts that pay apart), Einhander's and Radiant Silvergun's segmented bosses, Ikaruga's
// Buppousou (covers that open), Shadow of the Colossus (weak points that glow on a body that is a place), Rez (the wireframe target).
//
//   const P = new BossPart({ name, object, radius, at (local Vector3 on object), facing, look(part, what) })
//   P.wire(geometry | mesh, { threshold, bright, parent, lines })   (its line and glow: LineSegments added to the object, or to `parent`;
//     `lines`: the geometry is already line pairs)
//   P.hit(power)   P.damage()   P.break()   P.set('intact' | 'damaged' | 'broken')   P.seal(on)   P.windup(k 0..1)   P.world(out)
//   P.state   P.sealed   P.alive (not broken)   P.open (alive and not sealed)   P.pulse   P.windupK   P.telegraphAnchor   P.object
//   const R = new BossParts()   R.add(P)   R.part(name)   R.list(prefix)   R.update(rawDt)   R.reset()   R.states()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial, mindTick } from './labradorite.js';

export const PART_STATES = ['intact', 'damaged', 'broken'];
const GLOW = { intact: 1, damaged: 0.55, broken: 0 };

export class BossPart {
  constructor({ name, object, radius = 1, at = null, facing = null, look = null } = {}) {
    this.name = name; this.object = object; this.look = look;
    this.state = 'intact'; this.sealed = false; this.pulse = 0; this.windupK = 0; this.wires = [];
    const A = (this.telegraphAnchor = new THREE.Object3D()); A.name = `telegraph:${name}`;
    if (at) A.position.copy(at);
    A.userData = { radius, part: name, facing: (facing || new THREE.Vector3(0, 0, 1)).clone().normalize() };
    object.add(A);
  }

  get alive() { return this.state !== 'broken'; }
  get open() { return this.alive && !this.sealed; }

  /** Its line and glow: the edges of a geometry (or of a mesh, placed as the mesh is), drawn in labradorite and hidden behind the body. */
  wire(src, { threshold = 30, bright = 1, parent = null, opacity = 0.9, lines = false } = {}) {
    const geo = src.isBufferGeometry ? src : src.geometry, edges = lines ? geo : new THREE.EdgesGeometry(geo, threshold);
    const line = new THREE.LineSegments(edges, mindLineMaterial({ opacity, depthTest: true, bright }));
    line.name = `wire:${this.name}`; line.userData.bright = bright; line.userData.lent = lines; line.renderOrder = 2;
    if (!src.isBufferGeometry) { line.position.copy(src.position); line.quaternion.copy(src.quaternion); line.scale.copy(src.scale); (parent || src.parent || this.object).add(line); }
    else (parent || this.object).add(line);
    this.wires.push(line); this.glow(); return line;
  }

  hit(power = 1) { if (!this.open) return this; this.pulse = Math.min(1.5, this.pulse + power); this.look?.(this, 'hit'); return this; }
  damage() { if (this.state === 'intact') this.set('damaged'); return this; }
  break() { if (this.state !== 'broken') this.set('broken'); return this; }
  set(state) {
    if (!PART_STATES.includes(state)) return this;
    const was = this.state; this.state = state;
    if (state === 'intact') this.pulse = 0;
    if (was !== state || state === 'intact') this.look?.(this, 'state');
    this.glow(); return this;
  }
  seal(on = true) { if (this.sealed !== on) { this.sealed = on; this.look?.(this, 'seal'); this.glow(); } return this; }
  windup(k) { this.windupK = THREE.MathUtils.clamp(k, 0, 1); this.look?.(this, 'windup'); this.glow(); return this; } // (its line and glow rises with it: glow() reads windupK)
  world(out = new THREE.Vector3()) { return this.telegraphAnchor.getWorldPosition(out); }

  /** The line and glow as the state, the seal and the pulse say. */
  glow() {
    const k = this.sealed ? 0 : GLOW[this.state] * (1 + 1.6 * Math.min(1, this.pulse)) + 0.6 * this.windupK * (this.alive ? 1 : 0);
    for (const w of this.wires) { w.visible = k > 0.01; w.material.uniforms.uBright.value = k * w.userData.bright; }
  }

  update(raw) {
    if (this.pulse > 0) { this.pulse = Math.max(0, this.pulse - raw * 6); this.look?.(this, 'pulse'); this.glow(); } // (a fifth of a real second)
  }

  dispose() { for (const w of this.wires) { w.parent?.remove(w); if (!w.userData.lent) w.geometry.dispose(); w.material.dispose(); } this.telegraphAnchor.parent?.remove(this.telegraphAnchor); }
}

export class BossParts {
  constructor() { this.map = new Map(); }
  add(p) { this.map.set(p.name, p); return p; }
  part(name) { return this.map.get(name) || null; }
  list(prefix = '') { return [...this.map.values()].filter((p) => p.name.startsWith(prefix)); }
  update(raw) { mindTick(); for (const p of this.map.values()) p.update(raw); }
  reset() { for (const p of this.map.values()) { p.windupK = 0; p.set('intact'); } }
  states() { const o = {}; for (const [n, p] of this.map) o[n] = p.sealed ? 'sealed' : p.state; return o; }
  dispose() { for (const p of this.map.values()) p.dispose(); this.map.clear(); }
}
