// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS, THEIR KIT: what the three targets' bodies (a target hopper, a quintain, a gallery duck:
// vfx/strawmanwell/targets/) are made of, so they read as one family with Strawman (vfx/strawman.js): Pip's ramshackle make, burlap and
// straw, button eyes, and on each the training target's red and cream rings, Strawman's own. One material for all three (the theatre's
// atlas: walnut, linen, burlap, tape; vertex-coloured, so most faces are their colour alone), shared while any body lives.
//   TargetBody   the body's contract as the straw dummies' runtime drives it (world/strawmanwell/dummy.js): `group` placed, `yawTo` its
//                side (+ right), `update(dt)`, `hit(point, dir, power)` (a wobble on a spring), `play(id)` / `breakOff()` (its move),
//                `dispose()`; the world sets `air` and `vy` on it. A flat body faces the stalls and turns as a paper cut-out does: its
//                width runs through zero to the other side, never a yaw that would show its edge to a side camera
//   bullseye     concentric rings in a plane, Strawman's red and cream; `buttonEye` a sewn button; `strawTuft` a fan of straw ends
//
// Prior art: Strawman's sack and its painted target (vfx/strawman.js), archery's straw boss and the shooting gallery's tin targets, the
// toy theatre's cut-outs flipped by hand (the theatre's kit, vfx/strawmanwell/theatre/kit.js).
//
//   TARGET_LOOK   targetMaterial() / releaseMaterial()   bullseye(S, cx, cy, z, r, n, opts)   buttonEye(S, x, y, z, r)   strawTuft(S, x, y, z, a, len, n, seed)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sheet, box, rgb, uvOf, V, hash, atlasTexture, WHITE } from '../theatre/kit.js';
import { WELL_LOOK } from '../look.js';
import { rockStep } from '../../strawman.js';

export { Sheet, box, rgb, uvOf, V, hash, WHITE };

/** The family's colours (Strawman's own: its burlap, its target's red and cream, its straw, its post) and the targets' extras. */
export const TARGET_LOOK = {
  burlap: 0xcdb48c, seam: 0x6b5236, red: 0xb8402e, cream: 0xf3e6c8, straw: 0xe0c070, strawDark: 0xa8853c, post: 0x3b2a1e,
  lacquer: 0x121014, brass: 0xd8a944, steel: 0xaab2ba, tin: 0xe2b04a, tinShade: 0xa87a22, beak: 0xe0782a, thread: [0x2f7f7a, 0xc8606a, 0xd6a32a],
  // a body's turn (s to pass from one side to the other, the cut-out's flip) and its blow's wobble (rad/s a unit of power)
  turn: 0.22, wobble: 3.4,
};
const L = TARGET_LOOK;

let shared = null, users = 0;
/** The one material the targets share (made with the first body, let go with the last). */
export function targetMaterial() {
  if (!shared) shared = new THREE.MeshStandardMaterial({ map: atlasTexture(WELL_LOOK.palette), vertexColors: true, roughness: 0.82, metalness: 0 });
  users++;
  return shared;
}
export function releaseMaterial() {
  if (--users > 0 || !shared) return;
  shared.map?.dispose(); shared.dispose(); shared = null; users = 0;
}

/** A disc of `n` concentric rings facing +z at (cx, cy), radius r, alternating red and cream from a red heart (Strawman's target);
 *  `back` also faces it the other way; `seg` its roundness. */
export function bullseye(S, cx, cy, z, r, n = 5, { back = false, seg = 28, k = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    const r0 = (r * i) / n, r1 = (r * (i + 1)) / n, col = rgb(i % 2 ? L.cream : L.red, k);
    for (let s = 0; s < seg; s++) {
      const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2;
      const p = (rr, a) => V(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z);
      if (i === 0) S.tri(p(0, 0), p(r1, a0), p(r1, a1), col);
      else S.quad(p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a1), col);
      if (back) { const q = (rr, a) => V(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z - 0.002); if (i === 0) S.tri(q(0, 0), q(r1, a1), q(r1, a0), col); else S.quad(q(r0, a1), q(r1, a1), q(r1, a0), q(r0, a0), col); }
    }
  }
}

/** A sewn button facing +z: its rim, its face a shade darker, four thread holes crossed in cream thread. */
export function buttonEye(S, x, y, z, r, hex = L.lacquer) {
  const seg = 14, rim = rgb(hex, 1.6), face = rgb(hex, 1);
  for (let s = 0; s < seg; s++) {
    const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2, c = (rr, a, dz) => V(x + Math.cos(a) * rr, y + Math.sin(a) * rr, z + dz);
    S.quad(c(r * 0.72, a0, 0.012), c(r, a0, 0.006), c(r, a1, 0.006), c(r * 0.72, a1, 0.012), rim);
    S.tri(V(x, y, z + 0.008), c(r * 0.72, a0, 0.008), c(r * 0.72, a1, 0.008), face);
  }
  const t = r * 0.32, w = r * 0.09, th = rgb(L.cream, 1.1);
  box(S, x - t - w, x + t + w, y - w, y + w, z + 0.012, z + 0.02, th, 'f');
  box(S, x - w, x + w, y - t - w, y + t + w, z + 0.012, z + 0.02, th, 'f');
}

/** A fan of `n` straw ends from (x, y) at angle a (rad, 0 = +x), each `len` long, in the plane z: thin cards, two straws' shades. */
export function strawTuft(S, x, y, z, a, len, n = 5, seed = 1) {
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) - 0.5 : 0, aa = a + t * 0.9 + (hash(seed * 7 + i) - 0.5) * 0.3, l = len * (0.7 + 0.5 * hash(seed * 3 + i));
    const ex = x + Math.cos(aa) * l, ey = y + Math.sin(aa) * l, nx = -Math.sin(aa) * 0.012, ny = Math.cos(aa) * 0.012;
    const col = rgb(i % 2 ? L.straw : L.strawDark, 1);
    S.quad(V(x - nx * 1.6, y - ny * 1.6, z), V(ex - nx * 0.4, ey - ny * 0.4, z), V(ex + nx * 0.4, ey + ny * 0.4, z), V(x + nx * 1.6, y + ny * 1.6, z), col);
    S.quad(V(x + nx * 1.6, y + ny * 1.6, z - 0.002), V(ex + nx * 0.4, ey + ny * 0.4, z - 0.002), V(ex - nx * 0.4, ey - ny * 0.4, z - 0.002), V(x - nx * 1.6, y - ny * 1.6, z - 0.002), col);
  }
}

const _l = new THREE.Vector3();
/** A training target's body: the contract above. A kind builds its meshes under `this.flip` in its constructor, sets `moveFor` (s, its move's length) and fills `pose(dt)` (its parts by
 *  `this.mv`, `this.air`, `this.vy`, `this.t`). */
export class TargetBody {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'well.target';
    this.rock = new THREE.Group(); this.flip = new THREE.Group(); this.group.add(this.rock); this.rock.add(this.flip);
    this.mat = targetMaterial(); this.geos = [];
    this.yawTo = Math.PI / 2; this.side = 1; this.a = new THREE.Vector2(); this.av = new THREE.Vector2();
    this.mv = null; this.air = false; this.vy = 0; this.t = Math.random() * 10; this.parts = {};
  }
  /** A sheet made a mesh of the shared material, under `parent` (the flip by default). */
  mesh(S, parent = this.flip) {
    const geo = S.geometry(), m = new THREE.Mesh(geo, this.mat); this.geos.push(geo);
    m.castShadow = true; m.receiveShadow = true; m.userData.zone = 'strawmanwell'; parent.add(m);
    return m;
  }
  /** A blow: it rocks away from the blow on its spring (about z, in the plane), more for a heavier blow. */
  hit(point, dir, power = 1) {
    const k = Math.min(2, power); _l.copy(dir || _l.set(1, 0, 0));
    this.av.y -= Math.sign(_l.x || 1) * L.wobble * k; this.av.x += (Math.random() - 0.5) * L.wobble * 0.4 * k;
    this.hitT = 0.18;
  }
  play(id) { this.mv = { id, t: 0 }; }
  breakOff() { this.mv = null; }
  update(raw = 1 / 60) {
    const dt = Math.min(raw, 0.05); this.t += dt; if (this.hitT > 0) this.hitT -= dt;
    if (this.mv && (this.mv.t += raw) > (this.moveFor ?? 1)) this.mv = null; // (a move plays its own length: `moveFor`, the kind's)
    this.side = Math.sin(this.yawTo) >= 0 ? 1 : -1;
    const sx = this.flip.scale.x, step = (dt / L.turn) * 2; this.flip.scale.x = sx + THREE.MathUtils.clamp(this.side - sx, -step, step);
    rockStep(this.a, this.av, dt); this.rock.rotation.set(this.a.x * 0.3, 0, this.a.y);
    this.pose?.(dt);
  }
  dispose() {
    for (const g of this.geos) g.dispose(); this.geos.length = 0;
    this.group.removeFromParent(); releaseMaterial(); this.mat = null;
  }
}
