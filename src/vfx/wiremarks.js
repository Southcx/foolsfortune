// ---------------------------------------------------------------------------------------
// WIRE MARKS: the Mind's small marks in the world, drawn in labradorite lines (vfx/labradorite.js) and never with a digit.
//
//   LOCK SQUARES   (Rez) a homing lock: two squares spin in from wide and close onto the target until they coincide as one diamond;
//                  locked, the ORDER of the lock is how many squares are nested in the mark (the first lock one, the third three),
//                  as Rez counted its eight locks by the marks and the rising tones and never by numerals. A hit bursts it outward.
//
// A mark sits on its thing in the world but keeps a size on the screen (a few tens of pixels whatever the distance), and is drawn
// through walls (a lock has to be found). Nothing blinks: a mark spins in, holds, turns at a steady rate, bursts once.
//
// Prior art: Rez (lock squares, up to eight, the count told by the marks and the sound), Panzer Dragoon's lock-on, the paint-to-lock
// of Ace Combat's and Zone of the Enders' multi-locks.
//
//   const m = new LockSquares(scene)    m.set({ pos, px, spin, locked, order, alpha })    m.update(dt, camera)    m.burst()    m.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial, mindTick } from './labradorite.js';

const MAX_NEST = 8;
let _square = null;
const square = () => (_square ||= new THREE.BufferGeometry().setFromPoints([
  [-1, -1], [1, -1], [1, -1], [1, 1], [1, 1], [-1, 1], [-1, 1], [-1, -1],
].map(([x, y]) => new THREE.Vector3(x, y, 0))));

/** World size of `px` screen pixels at `pos` (perspective camera). */
export function pxToWorld(camera, pos, px) {
  const d = camera.position.distanceTo(pos);
  const h = window.innerHeight || 1;
  return (px * 2 * d * Math.tan((camera.fov * Math.PI) / 360)) / h;
}

export class LockSquares {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.renderOrder = 34;
    this.mat = mindLineMaterial({ opacity: 1, bright: 1.25 });
    this.a = new THREE.LineSegments(square(), this.mat);
    this.b = new THREE.LineSegments(square(), this.mat);
    this.nest = [];
    for (let i = 0; i < MAX_NEST; i++) {
      const n = new THREE.LineSegments(square(), this.mat);
      n.visible = false; n.renderOrder = 34;
      this.nest.push(n); this.group.add(n);
    }
    for (const l of [this.a, this.b]) { l.renderOrder = 34; l.frustumCulled = false; this.group.add(l); }
    this.group.frustumCulled = false;
    scene.add(this.group);
    this.pos = new THREE.Vector3(); this.px = 60; this.spin = 0; this.locked = false; this.order = 0; this.alpha = 1;
    this.t = 0; this.burstT = -1;
  }

  /** px: the mark's half-size on the screen; spin: radians apart the two squares still are (0: one diamond); order: 1.. when locked. */
  set({ pos, px = 30, spin = 0, locked = false, order = 0, alpha = 1, visible = true }) {
    this.pos.copy(pos); this.px = px; this.spin = spin; this.locked = locked; this.order = order; this.alpha = alpha;
    this.group.visible = visible;
  }

  burst() { this.burstT = 0; }

  /** Returns false when a burst has finished (the caller disposes). */
  update(dt, camera) {
    mindTick();
    this.t += dt;
    let k = 1, a = this.alpha;
    if (this.burstT >= 0) { this.burstT += dt; const u = this.burstT / 0.25; if (u >= 1) return false; k = 1 + 1.2 * u; a *= 1 - u; }
    this.group.position.copy(this.pos);
    this.group.quaternion.copy(camera.quaternion);
    this.group.scale.setScalar(pxToWorld(camera, this.pos, this.px) * k);
    const turn = this.locked ? this.t * 1.6 : 0; // (locked, the pair turns together, steadily)
    this.a.rotation.z = Math.PI / 4 + this.spin + turn;
    this.b.rotation.z = Math.PI / 4 - this.spin + turn;
    const n = this.locked ? Math.min(MAX_NEST, this.order) : 0;
    for (let i = 0; i < MAX_NEST; i++) {
      const s = this.nest[i];
      s.visible = i < n - 1; // (the first lock is the diamond alone; each later one adds a square inside it)
      if (s.visible) { s.scale.setScalar(0.8 * Math.pow(0.82, i)); s.rotation.z = Math.PI / 4 + turn * (i % 2 ? -1 : 1) * 0.5; }
    }
    this.mat.uniforms.uOpacity.value = a;
    return true;
  }

  dispose() { this.scene.remove(this.group); this.mat.dispose(); }
}

// ---------------------------------------------------------------------------------------
// THE REACH DOME (Parasite Eve, Vagrant Story): how far an ability reaches, as a low-poly wire dome standing on the ground around the
// one who has it, drawn only while it is readied. It bursts up from the ground (an overshoot, once), holds, turns very slowly, and
// sinks away when it is put down. Depth-tested and faint: it is a volume to stand in, not a wall of light (the comfort rule).
//
//   const d = new ReachDome(scene)     d.show(pos, radius)     d.hide()      (it animates itself while it is drawn)
// ---------------------------------------------------------------------------------------
let _dome = null;
function domeGeometry() {
  if (_dome) return _dome;
  // an icosphere's edges, the upper half (Parasite Eve's dome is a low-poly polyhedron standing on the floor)
  const e = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 1)).getAttribute('position');
  const pts = [];
  for (let i = 0; i < e.count; i += 2) {
    const ay = e.getY(i), by = e.getY(i + 1);
    if (ay < -0.02 || by < -0.02) continue;
    pts.push(new THREE.Vector3(e.getX(i), ay, e.getZ(i)), new THREE.Vector3(e.getX(i + 1), by, e.getZ(i + 1)));
  }
  // and its rim on the ground
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, b = ((i + 1) / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), new THREE.Vector3(Math.cos(b), 0, Math.sin(b)));
  }
  return (_dome = new THREE.BufferGeometry().setFromPoints(pts));
}
const backOut = (u, c = 1.4) => 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;

export class ReachDome {
  constructor(scene, { opacity = 0.42 } = {}) {
    this.mat = mindLineMaterial({ opacity: 0, depthTest: true, bright: 1.1 });
    this.lines = new THREE.LineSegments(domeGeometry(), this.mat);
    this.lines.visible = false; this.lines.frustumCulled = false; this.lines.renderOrder = 7;
    this.opacity = opacity; this.k = 0; this.want = 0; this.last = 0; this.radius = 1;
    this.lines.onBeforeRender = () => this.step();
    scene.add(this.lines);
  }

  show(pos, radius) {
    this.lines.position.copy(pos); this.radius = radius;
    if (!this.want) { this.want = 1; this.lines.visible = true; this.last = performance.now(); }
  }

  hide() { this.want = 0; }

  step() {
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    mindTick(now / 1000);
    this.k = this.want ? Math.min(1, this.k + dt * 2.2) : Math.max(0, this.k - dt * 3);
    const s = this.want ? backOut(this.k) : this.k;
    this.lines.scale.set(this.radius * Math.max(0.001, s), this.radius * Math.max(0.001, s) * 0.62, this.radius * Math.max(0.001, s));
    this.lines.rotation.y += dt * 0.05;
    this.mat.uniforms.uOpacity.value = this.opacity * this.k;
    if (!this.want && this.k <= 0) this.lines.visible = false;
  }
}

// ---------------------------------------------------------------------------------------
// COUNT RINGS (Elemental Gearbolt's closing frames): a countdown with no digits. Rings stand round a thing (the trial's gong), one
// for each count left; on each count the outermost closes in onto the thing and is gone, and on the last a ring bursts outward (GO).
// The closing IS the clock, as Gearbolt's shrinking box round a foe was the time before it fired.
//
//   const c = new CountRings(scene)    c.start(pos, n)    c.tick()    c.go()    c.stop()    c.update(dt, camera)
// ---------------------------------------------------------------------------------------
let _circle = null;
const circle = () => {
  if (_circle) return _circle;
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, b = ((i + 1) / 40) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0), new THREE.Vector3(Math.cos(b), Math.sin(b), 0));
  }
  return (_circle = new THREE.BufferGeometry().setFromPoints(pts));
};

export class CountRings {
  constructor(scene, { radius = 0.9, step = 0.38 } = {}) {
    this.scene = scene; this.R = radius; this.step = step;
    this.group = new THREE.Group(); this.group.visible = false; this.group.frustumCulled = false;
    this.rings = [];
    for (let i = 0; i < 5; i++) {
      const m = mindLineMaterial({ opacity: 0, bright: 1.3 });
      const l = new THREE.LineSegments(circle(), m);
      l.renderOrder = 33; l.frustumCulled = false;
      this.group.add(l);
      this.rings.push({ l, m, r: 0, want: 0, a: 0, wantA: 0, burst: false });
    }
    scene.add(this.group);
    this.n = 0;
  }

  start(pos, n) {
    this.group.position.copy(pos); this.group.visible = true; this.n = Math.min(n, this.rings.length - 1);
    this.rings.forEach((g, i) => {
      g.burst = false;
      if (i < this.n) { g.want = this.R * (1 + i * this.step); g.r = g.want * 1.8; g.a = 0; g.wantA = 1; } // (they come in from wide)
      else { g.want = 0; g.wantA = 0; g.a = 0; }
    });
  }

  /** One count: the outermost ring left closes onto the thing. */
  tick() {
    if (this.n <= 0) return;
    this.n--;
    const g = this.rings[this.n]; g.want = 0.02; g.wantA = 0;
  }

  /** The last count: a ring bursts outward from the thing. */
  go() {
    while (this.n > 0) this.tick();
    const g = this.rings[this.rings.length - 1]; g.burst = true; g.r = this.R * 0.3; g.a = 1;
  }

  stop() { this.n = 0; for (const g of this.rings) { g.wantA = 0; g.want = 0; g.burst = false; } }

  update(dt, camera) {
    if (!this.group.visible) return;
    mindTick();
    this.group.quaternion.copy(camera.quaternion);
    let any = false;
    for (const g of this.rings) {
      if (g.burst) { g.r += dt * 7; g.a = Math.max(0, g.a - dt * 1.6); if (g.a <= 0) g.burst = false; }
      else { g.r += (g.want - g.r) * (1 - Math.exp(-dt * 9)); g.a += (g.wantA - g.a) * (1 - Math.exp(-dt * (g.wantA > g.a ? 8 : 5))); }
      g.l.scale.setScalar(Math.max(0.001, g.r));
      g.m.uniforms.uOpacity.value = g.a;
      g.l.visible = g.a > 0.01;
      any ||= g.l.visible;
    }
    if (!any && this.n <= 0) this.group.visible = false;
  }
}
