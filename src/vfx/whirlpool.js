// ---------------------------------------------------------------------------------------
// THE WHIRLPOOL: the maelstrom's crude turning round its heart (docs/plans/RAIL-OVERHAUL.md section 6, PASSAGE.md 14.4; docs/LORE.md
// "The passage": Charybdis, the whirlpool that swallows the sea and spits it out; docs/GLOSSARY.md: the whirlpool, the whirlpool's
// heart). The arena's laps (world/emocean/railpath.js `arena`) circle it; Charybdis (vfx/charybdis.js) rises out of its middle and
// dives back down it. It is drawn on THE CRUDE SEA'S OWN PROGRAM (vfx/crudesea.js): a disc of the sea's material with a uniform of its
// own (`uDisc`), laid about the heart, while the sea round it leaves the disc's circle undrawn. No second sea, no second program.
//
//   THE SURFACE   a Rankine vortex's free surface (the textbook's: a core turning as one body, its surface a paraboloid, and round it
//                 the free vortex whose surface falls as 1/r^2), so the walls steepen inward as a real one's do and the speed rises
//                 toward the middle; its depth set so the surface meets what fills its middle (Charybdis's lip when it swallows, its
//                 sheath when it spits); the swells laid down toward the core. The disc's own grid (rings denser inward) is fixed in
//                 the world, never the camera's, so nothing it draws crawls as the eye moves. It runs on past its rim under the sea
//                 round it (drawn a hair nearer the eye, so where the two lie together it wins without fighting), so no crack ever
//                 opens at the seam; a skirt hangs from its inner edge (the crude pouring down into the maw)
//   THE TURNING   the current's streaks and the oil film wound into it: a pattern in log-polar space (a logarithmic spiral's arms),
//                 carried round at the vortex's own angular speed and drawn inward, in two phases half a period apart, each restarted
//                 while it is unseen (the flow map of Portal 2), so the shear never winds the bands finer than the grid can hold. It turns
//                 the way the arena's ship laps (`sense`: the arena's sign, measured, never read off a rotation: casebook 129)
//   THE LIGHT     Poe's: the film brightest along the steep walls ("a flood of golden glory along the black walls"), the crude
//                 darkening down them, and a bow of the film's colours hung over the middle (his rainbow in the spray); leaning to the
//                 waypoint's feeling
//   SWALLOW, SPIT `swallow` 1: deep, fast, drawing in (Charybdis below); 0: shallow, slow, the bands streaming out round its sheath
//                 (Charybdis risen). `on` spins it up as the leg begins and lets it go still when the leg ends or it is beaten
// The logic's sea has the whirlpool too (`depthAt`, `taperAt`: the crude sea's heightAt adds them), so what is drawn is what is ridden;
// nothing of the crossing's rides inside it today (the laps run ten metres outside its rim).
//
// Prior art: Homer, Odyssey XII (Charybdis: "thrice a day she spouts it forth, and thrice a day she sucks it down"); Edgar Allan Poe,
// "A Descent into the Maelstrom" (1841: the walls of black water at forty-five degrees, the moonlight down them, the rainbow in the
// mist); W. J. M. Rankine's combined vortex (1858) and the free-surface profile of every fluids text; Alex Vlachos, "Water Flow in
// Portal 2" (SIGGRAPH 2010: two phases of a flow map crossfaded); the humpback's bubble net (a spiral that gathers the sea, then the
// lunge up its middle); Sin & Punishment's and Panzer Dragoon's arena bosses (the place circles the beast).
//
//   const W = sea.whirlpool()  (vfx/crudesea.js makes it once, its disc beside the sea's mesh)   W.set({ at, on, swallow, apex, inner, tint, sense })
//   W.update(rawDt)   W.depthAt(x, z)   W.taperAt(x, z)   W.under(on)   W.mesh   W.dispose()
//   whirlHeart(path, turn, seaY, out)   the whirlpool's heart: the point on the sea the arena's laps circle (railpath.js lays them)
//   WHIRL (its numbers), WHIRL_U(), WHIRL_VERT, WHIRL_FRAG (the crude sea's shader takes them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { arenaRadius } from '../world/emocean/railpath.js';

export const WHIRL = {
  /** The disc's radius (m: the laps run about 44 m out, so the swells go on under the ship), the vortex's core radius, its grid. */
  radius: 34, core: 8.5, rings: 40, segs: 128, spacing: 1.6,
  /** How far the disc runs on under the sea past its rim (m: the seam's overlap), and the skirt hung from its inner edge (the pour). */
  over: 3, pour: 5,
  /** The angular speed at the core (rad a real second) swallowing and spitting; the draw inward (log-radius a real second; < 0 out). */
  spin: { swallow: 0.95, spit: 0.32 }, inflow: { swallow: 0.2, spit: -0.1 },
  /** The flow map's period (real seconds), the swells' least share at the core, how fast it spins up and lets go (a real second). */
  period: 2.6, swell: 0.2, rise: 0.45, still: 0.22,
  /** With nothing in its middle: how deep (m) and how small its inner edge closes. */
  bare: { apex: -8, inner: 0.05 },
};
const W = WHIRL;

/** The whirlpool's uniforms (one set a sea, shared by the sea's material and the disc's). */
export const WHIRL_U = () => ({
  uWhirl: { value: new THREE.Vector4(0, 0, W.radius, 0) }, // (heart x, z; the disc's radius; on)
  uWhirlA: { value: new THREE.Vector4(W.core, 0, W.bare.inner, W.swell) }, // (the core's radius; A, the depth's scale with `on` in it; the inner edge; the swells' least)
  uWhirlF: { value: new THREE.Vector4(0, 0, 0, 0) }, // (the two phases' turn at the core, radians; the two phases' draw, log-radius)
  uWhirlT: { value: new THREE.Vector4(0, 0, 0, 1) }, // (phase 0's place in its period; the feeling's share of the film; the bow; the sense it turns: +1 toward atan2(z, x) rising, -1 the other way)
  uWhirlC: { value: new THREE.Color(1, 1, 1) }, // (the feeling's colour)
});

/** The vortex's surface and slope (shared by the vertex and the CPU): h(r) <= 0 from the sea's level, zero at the rim. */
const WHIRL_PROFILE = /* glsl */`
float whirlH(float r) { r = min(r, uWhirl.z); float c = uWhirlA.x, A = uWhirlA.y, c2 = c * c; float h = r < c ? -A * (2.0 - r * r / c2) : -A * c2 / max(r * r, 1e-4); return h + A * c2 / (uWhirl.z * uWhirl.z); }
float whirlDH(float r) { if (r >= uWhirl.z) return 0.0; float c = uWhirlA.x, A = uWhirlA.y; return r < c ? 2.0 * A * r / (c * c) : 2.0 * A * c * c / max(r * r * r, 1e-4); }`;

/** The vertex's part: the uniforms and the profile (the crude sea lays its disc with them: vfx/crudesea.js). */
export const WHIRL_VERT = /* glsl */`
uniform vec4 uWhirl, uWhirlA; uniform float uDisc; varying vec2 vSeaP;
${WHIRL_PROFILE}`;

/** The fragment's part: the turning bands (a log-polar value noise, periodic round the heart, carried in two phases). */
export const WHIRL_FRAG = /* glsl */`
uniform vec4 uWhirl, uWhirlA, uWhirlF, uWhirlT; uniform vec3 uWhirlC; uniform float uDisc; varying vec2 vSeaP;
float whirlHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float whirlNoise(vec2 p, float P) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = mod(i.x, P), b = mod(i.x + 1.0, P);
  return mix(mix(whirlHash(vec2(a, i.y)), whirlHash(vec2(b, i.y)), f.x), mix(whirlHash(vec2(a, i.y + 1.0)), whirlHash(vec2(b, i.y + 1.0)), f.x), f.y); }
float whirlStreak(vec2 d, float r, float phi, float psi) {
  float c = uWhirlA.x, s = r < c ? 1.0 : c * c / (r * r);             // (the vortex's own angular speed, as a share of the core's)
  float lr = log(max(r, 0.4)), a = (atan(d.y, d.x) - phi * s) / 6.2831853;
  float x = a * 12.0 + lr * 2.4 * uWhirlT.w, y = (lr + psi) * 7.0;    // (twelve arms round, wound as a log spiral trailing the turn, whichever way it goes; seven bands an e-fold in)
  return whirlNoise(vec2(x, y), 12.0) * 0.6 + whirlNoise(vec2(x * 2.0 + 5.0, y * 2.3), 24.0) * 0.4;
}`;

/** The whirlpool's heart: the point on the sea the arena's laps circle (where the line's heartline turns about, at the sea's level).
 *  The rail's arena centre (railpath.js arenaCentre) is the same point as the frame sees it unbanked; through the arena the frame is
 *  banked inward, so it is found here from the heartline (`heart` metres up the frame) and the frame's heading, never its tilt. */
export function whirlHeart(path, turn, seaY, out = new THREE.Vector3(), heart = 3) {
  if (!path || !turn) return out.set(0, seaY, 0);
  path.at(turn.at + turn.len * 0.5, _p, _q);
  _u.set(0, 1, 0).applyQuaternion(_q); _p.addScaledVector(_u, heart); // (the heartline: the line the laps are laid on)
  _f.set(0, 0, 1).applyQuaternion(_q); _f.y = 0; _f.normalize();
  _i.crossVectors(_Y, _f).multiplyScalar(turn.sign ?? 1); // (inward: the turning side, across the heading)
  return out.copy(_p).addScaledVector(_i, arenaRadius(turn)).setY(seaY);
}
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _i = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);

/** The disc: rings about the heart (position x the ring's place, 0 at the inner edge .. 1 at the rim and the overlap past it, below 0
 *  the pour; y the skirt's drop; z the angle), so the vertex lays it where the uniforms say and its inner edge can open and close. */
function discGeometry() {
  const NA = W.segs, rows = [[-0.15, -W.pour]];
  for (let i = 0; i < W.rings; i++) rows.push([i / (W.rings - 1), 0]);
  const n = rows.length * (NA + 1), pos = new Float32Array(n * 3), idx = [];
  rows.forEach(([u, y], k) => { for (let j = 0; j <= NA; j++) pos.set([u, y, (j / NA) * Math.PI * 2], (k * (NA + 1) + j) * 3); });
  for (let k = 0; k < rows.length - 1; k++) for (let j = 0; j < NA; j++) { const a = k * (NA + 1) + j, b = a + NA + 1, c = a + 1, d = b + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3).fill(0), 3));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

const damp = THREE.MathUtils.damp;

export class Whirlpool {
  /** Made by the crude sea (`sea.whirlpool()`): its material is the sea's own program with `uDisc` set. */
  constructor(sea) {
    this.sea = sea; this.u = sea.u;
    this.on = 0; this.swallow = 1; this.apex = W.bare.apex; this.inner = W.bare.inner; this.A = 0; this.tint = 0;
    this.want = { on: 0, swallow: 1, apex: W.bare.apex, inner: W.bare.inner, tint: 0 };
    this.at = new THREE.Vector2(); this.sense = 1; this.tau = 0; this.phi = [0, 0]; this.psi = [0, 0]; this.cycle = 0;
    this.geo = discGeometry(); this.idxUp = this.geo.index;
    this.mat = sea.material(true);
    this.mat.polygonOffset = true; this.mat.polygonOffsetFactor = -1; this.mat.polygonOffsetUnits = -2; // (where it runs on under the sea round it, it is the one drawn: a state, not a program)
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.name = 'whirlpool';
    this.mesh.frustumCulled = false; this.mesh.receiveShadow = true; this.mesh.visible = false; this.mesh.userData.zoneFree = true;
  }

  /** What it should be (each kept until set again): `at` the heart (world, a Vector3 or { x, z }), `on` 0..1, `swallow` 0..1, `apex` the
   *  height (m, from the drawn sea) its surface meets the middle at, `inner` that middle's radius (m), `tint` a Color or null, `sense`
   *  +1 or -1: which way round it turns (+1 toward atan2(z, x) rising, as seen in the world's x and z: the way a ship laps at sign -1). */
  set({ at, on, swallow, apex, inner, tint, sense } = {}) {
    const S = this.want; if (sense !== undefined) this.sense = sense < 0 ? -1 : 1;
    if (at) this.at.set(at.x, at.z);
    if (on !== undefined) S.on = THREE.MathUtils.clamp(on, 0, 1);
    if (swallow !== undefined) S.swallow = THREE.MathUtils.clamp(swallow, 0, 1);
    if (apex !== undefined) S.apex = Math.min(-0.3, apex);
    if (inner !== undefined) S.inner = Math.max(0.05, Math.min(W.core - 0.5, inner));
    if (tint !== undefined) { if (tint) { this.u.uWhirlC.value.copy(tint); S.tint = 0.35; } else S.tint = 0; }
  }

  /** Each frame: eased toward what it should be, the phases carried round, the uniforms written, the disc on the drawn sea. */
  update(raw = 1 / 60) {
    const S = this.want, u = this.u;
    this.on = damp(this.on, S.on, S.on > this.on ? W.rise * 3 : W.still * 3, raw); if (S.on === 0 && this.on < 0.003) this.on = 0;
    this.swallow = damp(this.swallow, S.swallow, 2.5, raw);
    this.apex = damp(this.apex, S.apex, 6, raw); this.inner = damp(this.inner, S.inner, 6, raw); this.tint = damp(this.tint, S.tint, 2, raw);
    const c = W.core, R = W.radius, ri = this.inner, den = ri < c ? (c * c) / (R * R) - 2 + (ri * ri) / (c * c) : (c * c) / (R * R) - (c * c) / (ri * ri);
    this.A = (this.apex / den) * this.on; // (so the surface meets the middle at the apex: a Rankine vortex's depth for its edge)
    // the flow map: two phases half a period apart, each restarted (its turn and draw back to nothing) while its weight is nothing
    const spin = THREE.MathUtils.lerp(W.spin.spit, W.spin.swallow, this.swallow) * this.on, draw = THREE.MathUtils.lerp(W.inflow.spit, W.inflow.swallow, this.swallow) * this.on;
    const t0 = this.tau, t1 = (t0 + 0.5) % 1; this.tau = (t0 + raw / W.period) % 1;
    if (this.tau < t0) { this.cycle++; this.phi[0] = 0; this.psi[0] = (this.cycle * 0.37) % 5; }
    if ((this.tau + 0.5) % 1 < t1) { this.phi[1] = 0; this.psi[1] = (this.cycle * 0.53 + 2.1) % 5; }
    for (let k = 0; k < 2; k++) { this.phi[k] += spin * raw * this.sense; this.psi[k] += draw * raw; }
    u.uWhirl.value.set(this.at.x, this.at.y, R, this.on);
    u.uWhirlA.value.set(c, this.A, ri, W.swell);
    u.uWhirlF.value.set(this.phi[0], this.phi[1], this.psi[0], this.psi[1]);
    u.uWhirlT.value.set(this.tau, this.tint, this.swallow * this.on, this.sense);
    const sea = this.sea; this.mesh.position.set(0, sea.y + sea.lift, 0);
    this.mesh.visible = this.on > 0 && sea.mesh.visible !== false;
  }

  /** The surface's fall at a point (m, <= 0; the logic's as the shader's), and the share of the swells left there. */
  depthAt(x, z) {
    if (!this.on) return 0;
    const r = Math.hypot(x - this.at.x, z - this.at.y), c = W.core, R = W.radius, A = this.A; if (r >= R) return 0;
    const h = r < c ? -A * (2 - (r * r) / (c * c)) : (-A * c * c) / Math.max(r * r, 1e-4);
    return h + (A * c * c) / (R * R);
  }
  taperAt(x, z) {
    if (!this.on) return 1;
    const r = Math.hypot(x - this.at.x, z - this.at.y); if (r >= W.radius) return 1;
    const k = THREE.MathUtils.smoothstep(r, W.core, W.radius); return W.swell + (1 - W.swell) * k;
  }

  /** The eye under the surface: the disc's winding turned to face it (the meniscus's, as the sea's own: vfx/crudesea.js under). */
  under(on) {
    if (on && !this.idxDown) { const a = this.idxUp.array, b = new a.constructor(a.length); for (let i = 0; i < a.length; i += 3) { b[i] = a[i]; b[i + 1] = a[i + 2]; b[i + 2] = a[i + 1]; } this.idxDown = new THREE.BufferAttribute(b, 1); }
    if (this.idxDown) this.geo.setIndex(on ? this.idxDown : this.idxUp);
  }

  dispose() { this.mesh.parent?.remove(this.mesh); this.geo.dispose(); this.mat.dispose(); }
}
