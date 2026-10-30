// ---------------------------------------------------------------------------------------
// THE MOUNTS' RING: the mounts' choice (Y held: Petra's MountChoice, courier/jellymount/mountchoice.js, `.pick` 'skiff' or 'jelly')
// drawn round the Courier as a world mark, no words (Espada: "The held Y's choice needs no words"; Petra's plan: "a ring round the
// Courier"). On the ground round their feet (round the jelly's foot while it is ridden) a ring of gold; on it, on the screen's left the
// Solar Skiff and on its right a slip jelly, each small and on a socket of its own: the one the let go would call lifted off the ground,
// lit, swaying (the board) or bouncing (the jelly) over a heavier socket; the other set down on the ground, dimmed and still.
//
//   THE LINES   the mount's preview's wire (vfx/railmark.js MarkBuffer, wireStrip: screen-space lines that cannot crawl, dark at their
//               edges so they hold on noon sand, the Mind's schiller along their heart, depth-tested so the Courier and the jelly hide
//               them), the toll's reach's way (vfx/tollreach.js): the rail-mark program, no program of its own
//   THE SKIFF   the Solar Skiff's own model cloned skinned (SkeletonUtils.clone, casebook rule 6), as the rivals' mini skiff is
//               (vfx/racewayrivals.js), its materials its own painted copies on the house's one painted program (vfx/vessoulpaint.js:
//               casebook rule 28) so it can be dimmed, held at the ride's idle with its sail hoisted (boatpose.js, sampled once); made
//               once the board is in (until then its socket stands empty)
//   THE JELLY   the wild slip jelly's mesh and melt (creatures/jelly/deform.js), its own spring for its bounce: the wild jellies'
//               program, shared
// Read each frame from the choice while it is open; `show`, `set` and `close` drive it by hand (MountChoice can be wired to it later).
//
// Prior art: Red Dead Redemption 2's weapon wheel and horse whistle (a held key, a choice made round you, let go to take it), Mario
// Kart's item roulette (the one you will get lifted and lit), Into the Breach's and XCOM's marks on the ground (a choice's reach drawn
// where it lands), and the toll's reach's line (vfx/tollreach.js).
//
//   const R = new MountRing(game)   R.update(rawDt)   R.show(pick)   R.set(pick)   R.close()   R.read() -> { open, pick, k, lit }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { MarkBuffer, wireStrip } from '../railmark.js';
import { addRim } from '../../render/toon.js';
import { JellyDeform } from '../../creatures/jelly/deform.js';
import { vessoulPainted, PAINT_LIGHT } from '../vessoulpaint.js';

/** The ring's numbers: its radius and its sockets' (m); how small each mount is drawn (the skiff's deck stands `deck` over its
 *  socket); how high the lit one is lifted, how fast it sways or bounces; the dimmed one's colour and size. */
export const MOUNT_RING = {
  r: 1.6, socket: 0.48, gold: 0xffd36a, lift: 0.34,
  skiff: { scale: 0.27, deck: 0.22, sway: 0.35, rate: 1.6 }, jelly: { scale: 0.44, bounce: 1.1 },
  dim: { color: 0.4, size: 0.82 }, ease: { in: 12, out: 16, lit: 10 },
};
const MAIN = { m: 0.035, lo: 1.8, hi: 2.8, wire: true };
const LIT = { m: 0.05, lo: 2.6, hi: 3.6, wire: true };
const THIN = { m: 0.022, lo: 1.3, hi: 1.8, wire: false };
const LIFT = 0.05, CELL = 0.3, STEP = 0.24;
const DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3(), _r = new THREE.Vector3(), _c = new THREE.Color(), _q = new THREE.Quaternion();
const GROUND = (c) => !c.isSensor() && !c.parent()?.isDynamic() && !c.parent()?.isKinematic();
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export class MountRing {
  constructor(game) {
    this.game = game; this.k = 0; this.want = false; this.manual = false; this.pick = 'jelly'; this.t = 0;
    this.lit = { skiff: 0, jelly: 1 };
    this.buf = new MarkBuffer(700, { renderOrder: 31 });
    this.buf.mat.depthTest = true; // (a state, not a program: the rail-mark program, as the toll's reach wears it)
    this.mesh = this.buf.mesh; this.mesh.name = 'mount-ring'; this.mesh.visible = false;
    game.scene?.add(this.mesh);
    _c.set(MOUNT_RING.gold); this.rgb = [_c.r, _c.g, _c.b];
    this.ground = new Map(); this.groundY = null; this.groundT = 0; this.pw = []; this.pts = [];
    this.group = new THREE.Group(); this.group.name = 'mount-ring-mounts'; this.group.visible = false; this.group.userData.zoneFree = true;
    game.scene?.add(this.group);
    this.jelly = this.makeJelly(); this.skiff = null;
  }

  /** Opened by hand with `pick` lit ('skiff' | 'jelly'); `set` changes the lit one; `close` lets it go (and the choice drives it again). */
  show(pick = this.pick) { this.manual = true; this.want = true; this.set(pick); }
  set(pick) { if (pick === 'skiff' || pick === 'jelly') this.pick = pick; }
  close() { this.manual = false; this.want = false; }
  read() { return { open: this.k > 0.5, pick: this.pick, k: +this.k.toFixed(2), lit: { skiff: +this.lit.skiff.toFixed(2), jelly: +this.lit.jelly.toFixed(2) } }; }

  // ------------------------------------------------------------------ the two small mounts
  makeJelly() {
    const geo = this.game.jellies?.geo; if (!geo) return null;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, emissive: 0x000000, emissiveIntensity: 1 });
    addRim(mat, 0.5); // (the wild jelly's own material, so its program is theirs: creatures/jelly/slipjelly.js spawn)
    const deform = new JellyDeform(mat, 1.5, { melt: true }); deform.wet = 1;
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.renderOrder = 2;
    const root = new THREE.Group(); root.add(mesh); root.scale.setScalar(MOUNT_RING.jelly.scale); this.group.add(root);
    return { root, mesh, mat, deform, beat: 0 };
  }
  /** The Solar Skiff's own model, once it is in: cloned skinned, its materials its own copies on the one painted program. */
  makeSkiff() {
    const sk = this.game.techs?.get?.('skiff')?.skiff; if (!sk?.ready || !sk.model || !sk.P) return null;
    const M = { mats: [] };
    sk.model.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline) return;
      const n = o.material?.name;
      if (n === 'Skiff_Hull' && !M.hull) M.hull = vessoulPainted((sk.cleanHull ?? o.material).map ?? null, {});
      else if (n === 'Skiff_Parts' && !M.parts) M.parts = vessoulPainted(o.material.map ?? null, {});
      else if (n === 'Skiff_Cloth' && !M.cloth) M.cloth = vessoulPainted((sk.cleanCloth ?? o.material).map ?? null, { side: THREE.DoubleSide, roughness: 0.9 });
      else if (n === 'CourierEnergy' && !M.energy) { M.energy = o.material.clone(); M.energy.emissiveIntensity = 0.3; }
    });
    // (the board's meshes keep a reference to their outline in userData, which a clone would copy as JSON: set aside for it, casebook rule 293)
    const kept = [];
    sk.model.traverse((o) => { if (o.userData.outline) { kept.push([o, o.userData.outline]); delete o.userData.outline; } });
    const board = cloneSkinned(sk.model);
    for (const [o, ol] of kept) o.userData.outline = ol;
    let skin = null;
    board.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      if (o.userData.isOutline) return;
      const n = o.material?.name, m = n === 'Skiff_Hull' ? M.hull : n === 'Skiff_Parts' ? M.parts : n === 'Skiff_Cloth' ? M.cloth : n === 'CourierEnergy' ? M.energy : null;
      if (m) { m.name = n; o.material = m; }
      if (o.geometry?.userData?.stockCloth) o.geometry = o.geometry.userData.stockCloth; // (the stock cut: a sail's cut is the Courier's own, vfx/skiffsailcut.js)
      o.castShadow = n === 'Skiff_Hull'; o.receiveShadow = false;
      if (!skin && o.isSkinnedMesh && o.skeleton.bones.length === sk.P.nb) skin = o;
    });
    M.mats = [M.hull, M.parts, M.cloth].filter(Boolean);
    // (held at the ride's idle with its sail hoisted: the board's own clips, sampled once into the clone's bones, boatpose.js)
    if (skin) {
      const P = sk.P, F = new P.rest.constructor(P.nb), G = new P.rest.constructor(P.nb), B = skin.skeleton.bones;
      P.sample('Skiff_RideIdle', 0, F, true); P.blend(F, P.sample('Skiff_Unfurl', 0.96, G, false), 1);
      for (let i = 0; i < P.nb; i++) { B[i].position.fromArray(F.p, i * 3); B[i].quaternion.fromArray(F.q, i * 4); B[i].scale.fromArray(F.s, i * 3); }
    }
    const root = new THREE.Group(); root.add(board); root.scale.setScalar(MOUNT_RING.skiff.scale); this.group.add(root);
    return { root, board, M };
  }

  // ------------------------------------------------------------------ the ground under the ring
  /** The ground's height at (x, z): sampled on a grid of CELL and kept, the corners blended (the toll's reach's way). */
  floor(x, z, y0) {
    const P = this.game.player, gx = x / CELL, gz = z / CELL, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
    const at = (i, j) => {
      const key = i * 73856093 + j * 19349663; let h = this.ground.get(key);
      if (h === undefined) { const hit = this.game.physics?.raycast(_o.set(i * CELL, y0 + 0.8, j * CELL), DOWN, 2.2, P?.collider, undefined, GROUND); h = hit ? hit.point.y : y0; this.ground.set(key, h); }
      return h;
    };
    return (at(ix, iz) * (1 - fx) + at(ix + 1, iz) * fx) * (1 - fz) + (at(ix, iz + 1) * (1 - fx) + at(ix + 1, iz + 1) * fx) * fz;
  }
  /** A circle about (cx, cz) of radius r on the ground, as wire points. */
  circle(cx, cz, r, y0) {
    const n = Math.max(12, Math.ceil((r * Math.PI * 2) / STEP)), out = this.pts; out.length = 0;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = cx + r * Math.sin(a), z = cz + r * Math.cos(a); out.push(x, this.floor(x, z, y0) + LIFT, z); }
    return out;
  }
  strip(flat, look, a) {
    const W = this.pw, m = flat.length / 3; if (m < 3 || a < 0.01) return;
    for (let i = 0; i < m; i++) (W[i] ||= new THREE.Vector3()).set(flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]);
    wireStrip(this.buf, W, m, { look, a, rgb: this.rgb, camera: this.cam, pxk: this.pxk, closed: true });
  }

  // ------------------------------------------------------------------ each frame
  update(raw = 1 / 60) {
    const g = this.game, P = g.player, J = g.jellyMount;
    if (!this.manual) { const C = J?.choice; this.want = !!C; if (C?.pick) this.pick = C.pick; }
    const E = MOUNT_RING.ease;
    this.k = damp(this.k, this.want ? 1 : 0, this.want ? E.in : E.out, raw);
    const B = this.buf; B.count = 0;
    if (this.k < 0.01 || !P) { this.k = this.want ? this.k : 0; B.flush(); this.mesh.visible = false; this.group.visible = false; return; }
    this.t += raw;
    const cam = g.camera; cam.updateMatrixWorld();
    this.cam = cam; this.pxk = cam.projectionMatrix.elements[5] * 0.5 * (g.post?.target?.height || 480);
    B.time(this.t);
    // where: round the feet, or round the jelly's foot while it is ridden; the screen's left and right on the ground
    const feet = P.renderPos ?? P.pos, ridden = !!J?.active && J.groundY != null, y0 = ridden ? J.groundY : feet.y;
    if (this.groundY == null || Math.abs(y0 - this.groundY) > 0.3 || (this.groundT -= raw) <= 0) { this.ground.clear(); this.groundY = y0; this.groundT = 2; }
    const e = cam.matrixWorld.elements; _r.set(e[0], 0, e[2]); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize();
    const R = MOUNT_RING.r, S = MOUNT_RING.socket;
    for (const id of ['skiff', 'jelly']) this.lit[id] = damp(this.lit[id], this.pick === id ? 1 : 0, E.lit, raw);
    // THE LINES: the ring, and a socket each (the lit one's heavier and whole, the other's thin and faint)
    this.strip(this.circle(feet.x, feet.z, R, y0), MAIN, 0.55 * this.k);
    const spots = {};
    for (const [id, side] of [['skiff', -1], ['jelly', 1]]) {
      const x = feet.x + _r.x * R * side, z = feet.z + _r.z * R * side, l = this.lit[id];
      spots[id] = { x, z, y: this.floor(x, z, y0) };
      this.strip(this.circle(x, z, S, y0), l > 0.5 ? LIT : THIN, this.k * (0.28 + 0.72 * l));
      if (l > 0.02) this.strip(this.circle(x, z, S * (0.62 + 0.08 * Math.sin(this.t * 3)), y0), THIN, this.k * 0.55 * l);
    }
    B.flush(); this.mesh.visible = B.count > 0;
    // THE MOUNTS: lifted and lit, or set down and dimmed
    this.group.visible = true;
    if (!this.skiff) this.skiff = this.makeSkiff();
    const D = MOUNT_RING.dim, out = Math.atan2(-_r.x, -_r.z);
    if (this.skiff) {
      const l = this.lit.skiff, s = spots.skiff, A = MOUNT_RING.skiff, root = this.skiff.root;
      root.position.set(s.x, s.y + A.deck + MOUNT_RING.lift * l + 0.03 * l * Math.sin(this.t * 2.2), s.z);
      root.rotation.set(0, out + A.sway * l * Math.sin(this.t * A.rate), 0.06 * l * Math.sin(this.t * A.rate * 1.3));
      root.scale.setScalar(A.scale * this.k * (D.size + (1 - D.size) * l));
      const c = D.color + (1 - D.color) * l;
      for (const m of this.skiff.M.mats) { m.color.setScalar(c); m.emissiveIntensity = PAINT_LIGHT * (0.35 + 0.85 * l); }
      if (this.skiff.M.energy) this.skiff.M.energy.emissiveIntensity = 0.08 + 0.42 * l;
    }
    if (this.jelly) {
      const l = this.lit.jelly, s = spots.jelly, A = MOUNT_RING.jelly, J0 = this.jelly, root = J0.root;
      root.position.set(s.x, s.y + MOUNT_RING.lift * l * 0.8, s.z);
      root.rotation.y = out + Math.PI + 0.5;
      root.scale.setScalar(A.scale * this.k * (D.size + (1 - D.size) * l));
      if (l > 0.5 && (J0.beat -= raw) <= 0) { J0.beat = A.bounce; J0.deform.kick(-1.6, null, 0.06); } // (a little bounce in place, the lit one's)
      J0.deform.target.squash = 1 + 0.03 * Math.sin(this.t * 2.4);
      J0.deform.update(raw, null);
      const c = D.color + (1 - D.color) * l;
      J0.mat.color.setScalar(c); J0.mat.emissive.setRGB(0.05 * l, 0.04 * l, 0.02 * l);
    }
  }

  /** Shown 50 m down for the boot's compile (the jelly's program is the wild ones', the lines the rail mark's), then put back. */
  prewarm() {
    const J0 = this.jelly; if (!J0) return () => {};
    this.group.visible = true; J0.root.position.set(0, -50, 0);
    return () => { this.group.visible = false; };
  }
}
