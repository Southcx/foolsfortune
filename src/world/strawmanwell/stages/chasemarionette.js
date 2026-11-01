// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE CHASE'S MARIONETTE: Strawman's giant puppet of itself (docs/plans/STRAWMANS-WELL.md 1, "the boss": a giant
// marionette worked by strings from the fly loft), as a placeholder of boxes: a burlap sack of a body with its target, a round head with
// X eyes, two charcoal sleeves, two stubby legs, a block hat, and a string from each hand, the head and each knee up to a control bar in
// the loft. It is the stage's hazard, never a creature and never counted (Strawman never falls). Calissa dresses it.
//
// Prior art: Rayman's and Donkey Kong Country's chasers (a giant at your heels, its reach the danger), Subspace Emissary's set-piece
// bosses; the marionette's control bar (an airplane control: strings from a cross).
//
//   const M = new Marionette(group)   M.place(x, y, z)   M.update(dt, { run, reach, tangled })   M.reachX (the front of its hands, world x)
//   M.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const BURLAP = 0xb89a6a, CHAR = 0x2c2622, CREAM = 0xeadfc6, RED = 0xb8483a, THREAD = 0xe8dcc0;
/** Its size: the body's height (m), the loft's height over the boards (m), how far ahead of its middle its hands reach (m). */
export const MARIONETTE = { scale: 1, loft: 15, reach: 2.6, stride: 2.4 };

export class Marionette {
  constructor(into) {
    const g = this.group = new THREE.Group(); g.name = 'marionette'; into.add(g);
    this.mats = [];
    const mat = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }); this.mats.push(m); return m; };
    const box = (w, h, d, c, at, parent = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(...at); m.castShadow = true; parent.add(m); return m; };
    this.body = box(2.6, 3.2, 1.6, BURLAP, [0, 4.4, 0]);
    box(1.4, 1.4, 0.05, CREAM, [0, 0, 0.82], this.body); box(0.9, 0.9, 0.06, RED, [0, 0, 0.83], this.body); box(0.4, 0.4, 0.07, CREAM, [0, 0, 0.84], this.body);
    this.head = box(1.8, 1.7, 1.6, BURLAP, [0, 6.9, 0]);
    for (const s of [-1, 1]) { box(0.5, 0.1, 0.05, CHAR, [s * 0.4, 0.2, 0.82], this.head).rotation.z = 0.8; box(0.5, 0.1, 0.05, CHAR, [s * 0.4, 0.2, 0.82], this.head).rotation.z = -0.8; }
    box(0.9, 0.08, 0.05, CHAR, [0, -0.4, 0.82], this.head);
    box(1.1, 1.3, 1.1, CHAR, [0, 1.45, -0.1], this.head); // (the block hat)
    this.arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 1.4, 5.6, 0); g.add(p); box(0.7, 2.6, 0.7, CHAR, [0, -1.2, 0], p); box(0.72, 0.3, 0.72, CREAM, [0, -2.4, 0], p); return p; });
    this.legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.7, 2.8, 0); g.add(p); box(0.7, 1.8, 0.7, BURLAP, [0, -0.9, 0], p); return p; });
    // the strings to the control bar in the loft (a line each, redrawn as it moves)
    this.bar = box(4.4, 0.2, 0.2, CHAR, [0, MARIONETTE.loft, 0]);
    this.lineGeo = new THREE.BufferGeometry(); this.lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(5 * 6), 3));
    this.lineMat = new THREE.LineBasicMaterial({ color: THREAD });
    this.lines = new THREE.LineSegments(this.lineGeo, this.lineMat); this.lines.frustumCulled = false; g.add(this.lines);
    this.t = 0; this.x = 0; this.tangle = 0;
  }
  place(x, y, z) { this.x = x; this.group.position.set(x, y, z); }
  get reachX() { return this.x + MARIONETTE.reach; }

  /** Pose it: `run` its speed (m/s: the legs and the bob), `tangled` its strings caught (it sags and twitches). */
  update(dt, { run = 0, tangled = false } = {}) {
    this.t += dt; const w = Math.min(1, run / 4), ph = this.t * (2 + run * 0.9);
    this.tangle += ((tangled ? 1 : 0) - this.tangle) * Math.min(1, dt * 3);
    const T = this.tangle, bob = Math.abs(Math.sin(ph)) * 0.5 * w;
    this.body.position.y = 4.4 + bob - T * 0.8; this.head.position.y = 6.9 + bob - T * 0.9; this.head.rotation.z = T * 0.35 + Math.sin(this.t * 13) * 0.04 * T;
    this.arms.forEach((a, i) => { a.position.y = 5.6 + bob - T * 0.8; a.rotation.z = (i ? 1 : -1) * (0.15 + T * 0.6) + Math.sin(ph + i * Math.PI) * 0.25 * w; a.rotation.x = -0.5 * w; });
    this.legs.forEach((l, i) => { l.position.y = 2.8 + bob - T * 0.6; l.rotation.z = Math.sin(ph + i * Math.PI) * 0.6 * w; });
    this.bar.rotation.z = Math.sin(ph) * 0.08 * w + T * 0.25;
    // the strings, from the bar's ends and middle to the hands, the head and the knees
    const P = this.lineGeo.attributes.position, L = MARIONETTE.loft, ends = [[-2.2, L], [2.2, L], [0, L], [-1.1, L], [1.1, L]];
    const to = [this.hand(0), this.hand(1), [0, this.head.position.y + 0.85], [this.legs[0].position.x, this.legs[0].position.y - 0.9], [this.legs[1].position.x, this.legs[1].position.y - 0.9]];
    ends.forEach(([ex, ey], i) => { P.setXYZ(i * 2, ex, ey, 0); P.setXYZ(i * 2 + 1, to[i][0], to[i][1], 0); });
    P.needsUpdate = true;
  }
  hand(i) { const a = this.arms[i]; return [a.position.x + Math.sin(a.rotation.z) * 2.4, a.position.y - Math.cos(a.rotation.z) * 2.4]; }

  dispose() {
    this.group.removeFromParent();
    this.group.traverse((o) => o.geometry?.dispose());
    for (const m of this.mats) m.dispose(); this.lineMat.dispose();
  }
}
