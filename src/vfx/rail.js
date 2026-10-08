// ---------------------------------------------------------------------------------------
// THE CROSSING'S LOOK, R1 (the owner, 2026-10-07: "a love letter to the genre... placeholders, but feeling polished to a mirror shine";
// docs/plans/RAIL.md, sections 3 and 8). What the rail shooter's camera frames and how the sea reads at speed. Petra's rail drives it
// (the views, the swing, the ship); the sloop's own looks are vfx/sloop.js (polarity, hurt, hoist).
//
//   THE VIEWS   five framings in the ship's own frame (+Z the bow, Y up, metres): CHASE (Star Fox: behind and above, the ship low in
//               the frame, the sea ahead), ABOVE (Ikaruga: straight down the mast with a lean forward), SIDE (Einhander: the sea as a
//               side-scroller's ground), FREE (Sin & Punishment: low and close over the shoulder, the horizon high), ASTERN (looking back
//               past the ship at what follows it: the brig's view)
//   A SWING     a bar long (1.5 s) from one view to the next: the camera's own path is Petra's; the LOOK of it is a smear of the frame
//               accumulation peaking at the swing's middle and a breath of the lens (a few degrees of field), so the turn of the world
//               reads as speed and not as a cut
//   THE WAKE    the sea at speed: two lines of foam streaming astern from the hull, spreading and fading (a ribbon each, laid on the
//               sea's surface as the ship goes), and spray thrown from the bow in time with the speed
//
// Prior art: Star Fox 64's chase and its All-Range turns, Ikaruga's and Einhander's fixed views, Sin & Punishment's over-the-shoulder,
// Rez's view changes on the bar, Wind Waker's wake and bow spray (a boat's speed read from its water), and the PS2's feedback blur.
//
//   RAIL_VIEWS[name] -> { pos, look, fov }   swingLook(game, k 0..1, from, to) -> fov   new ShipWake(game)   .update(rawDt, ship, sea)
//   foamMaterial(uniforms = { uT })   the foam's material (one program: the wake's lines and the Umbral's splash rings, vfx/umbral.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
export { ShoalLook } from './shoal.js'; // (the set pieces' looks ride along: game.railLook.ShoalLook, .BrigLook, .LeviathanLook)
export { BrigLook, BoarderLook } from './brig.js';
export { LeviathanLook } from './leviathan.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const RAIL_VIEWS = {
  chase: { pos: V(0, 3.0, -10), look: V(0, 1.0, 14), fov: 60 },      // (RAIL.md's 2.2 up and 7.5 back, from amidships of a 7 m hull, filled half the frame: back to 10)
  above: { pos: V(0, 15, -3), look: V(0, 0, 5), fov: 52 },
  side: { pos: V(13, 2.4, 1), look: V(0, 1.2, 3), fov: 48 },
  free: { pos: V(1.6, 2.3, -5.5), look: V(0, 2.4, 22), fov: 68 },
  astern: { pos: V(0, 3.2, 9), look: V(0, 1.2, -12), fov: 58 },
};

/** A swing's look at k (0..1 through the bar): the smear and the lens's breath. Returns the field of view to use. */
export function swingLook(game, k, from = 'chase', to = 'chase') {
  const s = Math.sin(Math.PI * THREE.MathUtils.clamp(k, 0, 1)), A = game.post?.accum;
  if (A && !game.death?.active) { if (k > 0 && k < 1) Object.assign(A, { amt: 0.45 * s, zoom: 0.004 * s, spin: 0 }); else A.amt = 0; }
  const f0 = RAIL_VIEWS[from]?.fov ?? 60, f1 = RAIL_VIEWS[to]?.fov ?? 60;
  return THREE.MathUtils.lerp(f0, f1, k * k * (3 - 2 * k)) + 6 * s; // (a breath of the lens at the turn)
}

const N = 48; // (each line of foam: its points, laid one every 0.25 s of travel)
const FOAM_V = /* glsl */`attribute float aAge; varying float vAge; varying vec2 vU; void main() { vAge = aAge; vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FOAM_F = /* glsl */`varying float vAge; varying vec2 vU; uniform float uT;
float h(float x) { return fract(sin(x * 91.7) * 43758.5); }
void main() {
  float edge = 1.0 - abs(vU.y * 2.0 - 1.0), broken = smoothstep(0.3, 0.7, h(floor(vU.x * 90.0 - uT * 4.0) + floor(vU.y * 7.0)));
  float a = (1.0 - vAge) * smoothstep(0.0, 0.7, edge) * (0.25 + 0.75 * broken);
  gl_FragColor = vec4(vec3(0.9, 0.86, 0.95) * 0.45, a * 0.4);                        // (pale foam on the ink: kept low, the scene is linear)
}`;

/** The foam's material: a strip with uv.x along it, uv.y across it and an age per vertex (aAge, 0 new .. 1 gone). One program for all. */
export function foamMaterial(u = { uT: { value: 0 } }) {
  return new THREE.ShaderMaterial({ name: 'ship-wake', uniforms: u, vertexShader: FOAM_V, fragmentShader: FOAM_F, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}

export class ShipWake {
  constructor(game) {
    this.game = game; this.t = 0; this.acc = 0;
    this.u = { uT: { value: 0 } };
    this.lines = [-1, 1].map((side) => {
      const pos = new Float32Array(N * 2 * 3), age = new Float32Array(N * 2), uv = new Float32Array(N * 2 * 2), idx = [];
      for (let i = 0; i < N; i++) { uv.set([i / (N - 1), 0, i / (N - 1), 1], i * 4); if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aAge', new THREE.BufferAttribute(age, 1).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, foamMaterial(this.u));
      m.frustumCulled = false; m.renderOrder = 3; game.scene?.add(m);
      return { side, m, pts: [] }; // (pts: newest first: { x, z, dx, dz (across), born })
    });
  }

  /** ship: { group (its world frame), speed (m/s), length (m), beam (m) }; sea: { heightAt(x, z) } or null. */
  update(raw, ship, sea = null) {
    if (!ship?.group) return;
    this.t += raw; this.u.uT.value = this.t;
    const G = ship.group; G.updateWorldMatrix(true, false);
    const fwd = _f.set(0, 0, 1).transformDirection(G.matrixWorld), right = _r.set(1, 0, 0).transformDirection(G.matrixWorld);
    const speed = ship.speed ?? 0, L = ship.length ?? 7, B = ship.beam ?? 2.4;
    this.acc += raw;
    if (this.acc >= 0.25) { // (a new point at each side's quarter, a little aft of amidships)
      this.acc = 0;
      for (const ln of this.lines) {
        const p = _p.setFromMatrixPosition(G.matrixWorld).addScaledVector(fwd, -L * 0.15).addScaledVector(right, ln.side * B * 0.45);
        ln.pts.unshift({ x: p.x, z: p.z, dx: right.x * ln.side, dz: right.z * ln.side, born: this.t, v: speed });
        if (ln.pts.length > N) ln.pts.pop();
      }
    }
    for (const ln of this.lines) {
      const P = ln.m.geometry.attributes.position, A = ln.m.geometry.attributes.aAge;
      for (let i = 0; i < N; i++) {
        const q = ln.pts[Math.min(i, ln.pts.length - 1)];
        if (!q) { A.setX(i * 2, 1); A.setX(i * 2 + 1, 1); continue; }
        const age = this.t - q.born, k = Math.min(1, age / 6), spread = q.v * 0.18 * age, w = 0.25 + 0.6 * k; // (it spreads out from the hull as it ages)
        const cx = q.x + q.dx * spread, cz = q.z + q.dz * spread, y = (sea?.heightAt?.(cx, cz) ?? G.position.y) + 0.04;
        P.setXYZ(i * 2, cx - q.dx * w * 0.5, y, cz - q.dz * w * 0.5); P.setXYZ(i * 2 + 1, cx + q.dx * w * 0.5, y, cz + q.dz * w * 0.5);
        const a = i >= ln.pts.length ? 1 : k; A.setX(i * 2, a); A.setX(i * 2 + 1, a);
      }
      P.needsUpdate = true; A.needsUpdate = true;
    }
    // spray from the bow, in time with the speed
    const fx = this.game.fx; if (!fx || speed < 4) return;
    this.sprayAcc = (this.sprayAcc || 0) + raw * speed * 3;
    while (this.sprayAcc >= 1) {
      this.sprayAcc -= 1;
      const sd = Math.random() < 0.5 ? -1 : 1, bow = _p.setFromMatrixPosition(G.matrixWorld).addScaledVector(fwd, L * 0.45).addScaledVector(right, sd * B * 0.2);
      fx.alpha.emit({ pos: bow.clone().setY(bow.y + 0.1), vel: right.clone().multiplyScalar(sd * (1.5 + Math.random() * 2)).addScaledVector(fwd, speed * 0.3).setY(1.5 + Math.random() * 2.5), life: 0.6, size: 0.12, sizeEnd: 0.05, color: new THREE.Color(0x231c2c), alpha: 0.8, drag: 1, gravity: 9.8 });
    }
  }

  dispose() { for (const ln of this.lines) { ln.m.parent?.remove(ln.m); ln.m.geometry.dispose(); ln.m.material.dispose(); } }
}
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _p = new THREE.Vector3();
