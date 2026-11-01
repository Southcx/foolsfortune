// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE SEWING KIT'S PROPS, THE MACHINE'S: the Machine stage's parts (Dovina's world/strawmanwell/machine.js) and the
// Run's spring as things of Pip's sewing basket at giant scale, each drawn in its placeholder's own metres (x along, y up, z toward the
// stalls; props/kit.js); the ones that move are ridden (props.js) so whatever moves them moves the look:
//   a spring        a coil of steel wire under a brass thimble, the thimble's top the pad's top
//   a ruler         the seesaw's plank: maple, ticked along the edge the stalls see, brass-capped
//   tailor's chalk  a crumbling floor: a cake of chalk, its edges bevelled, cracked
//   a key           the key: brass, its bow tied with a velvet ribbon
//   a lock door     the lock's door: walnut bound in brass, its keyhole plate at the Courier's height
//   a cannon        a brass barrel on a walnut carriage, button wheels, its breech a thimble's dome
//   a pincushion    the cannon's ball: a tomato pincushion stuck with glass-headed pins, rolled as it flies
//   the conveyor    the belt: felt run round two wooden rollers, a running stitch along it that runs with the belt, the rollers' hubs
//                   turning with it (BeltLook: its stitches and spokes rewritten each frame while its lane is shown)
// Prior art: LittleBigPlanet's and Yoshi's Woolly World's household contraptions, the tomato pincushion, the tailor's chalk cake, the
// cotton-reel tank (a reel, a band and a pencil: the toy every child made), Mega Man's conveyors (the belt's look is its marks moving).
//
//   coilSpring(K, w, h, d)   ruler(K, w, h, d)   chalk(K, w, h, d, { col, seed })   key(K)   lockDoor(K, w, h, d, { lockY })
//   cannon(K, w, h, d, { mx, my, dir })   pincushion(pal) -> BufferGeometry   new BeltLook(K, belt, mat, pal)  .mesh  .step(dt)  .dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PropKit, turned, extruded, tube, hash, shade } from './kit.js';
import { thimble, button } from './sewing.js';

/** The numbers (metres). */
export const MACHINE_LOOK = {
  spring: { coil: 0.8, turns: 2.5, wire: 0.036, cap: 0.5 },
  ruler: { tick: 0.5, cap: 0.05 },
  key: { bow: 0.19, shaft: 0.065 },
  door: { straps: [0.6, 2.4, 4.9, 7.4], strap: 0.18, plate: [0.72, 0.95] },
  cannon: { r: 0.58, wheel: 0.5, carriage: 0.85 },
  ball: { r: 0.34, pins: 6 },
  belt: { roller: 0.23, dash: 0.3, every: 0.6, stitch: 0.08, spoke: 0.15 },
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** The Run's spring in a pad w x h x d: a coil of wire on the boards, a brass thimble capping it at the pad's top. */
export function coilSpring(K, w, h, d) {
  const S = MACHINE_LOOK.spring, P = K.pal, y0 = -h / 2, R = (Math.min(w, d) / 2) * S.coil, hc = h * S.cap, pts = [];
  for (let i = 0; i <= S.turns * 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push(V(Math.cos(a) * R, y0 + S.wire + (i / (S.turns * 16)) * (hc - S.wire * 2), Math.sin(a) * R)); }
  K.metal.add(tube(pts, S.wire, 5), P.steel);
  K.metal.add(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.02, 16).translate(0, y0 + 0.01, 0), shade(P.steel, 0.8));
  thimble(K, R * 1.12, R * 1.04, h - hc + 0.01, { y: y0 + hc - 0.01, col: P.brass });
}

/** The seesaw's plank as a ruler w x h x d: maple, a tick each half metre on its front edge (a longer one a metre), brass end caps. */
export function ruler(K, w, h, d) {
  const S = MACHINE_LOOK.ruler, P = K.pal, zf = d * 0.48, c = S.cap;
  K.matte.box(-w / 2 + c, w / 2 - c, -h / 2, h / 2, -zf, zf, P.maple);
  for (const s of [-1, 1]) K.metal.box(s > 0 ? w / 2 - c : -w / 2, s > 0 ? w / 2 : -w / 2 + c, -h / 2, h / 2, -zf - 0.01, zf + 0.01, P.brass);
  for (let i = 1, x = -w / 2 + S.tick; x < w / 2 - 0.1; i++, x += S.tick) {
    const big = i % 2 === 0, tw = big ? 0.04 : 0.028;
    K.matte.box(x - tw, x + tw, big ? -h * 0.18 : h * 0.1, h / 2, zf, zf + 0.016, P.ink);
  }
}

/** A crumbling floor as a cake of tailor's chalk w x h x d: bevelled all round its face, two cracks down its front. */
export function chalk(K, w, h, d, { col = K.pal.sky, seed = 0 } = {}) {
  const c = Math.min(0.09, h * 0.25), zf = d * 0.47;
  K.matte.add(extruded([[-w / 2 + c, -h / 2], [w / 2 - c, -h / 2], [w / 2, -h / 2 + c], [w / 2, h / 2 - c], [w / 2 - c, h / 2], [-w / 2 + c, h / 2], [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c]], zf * 2, -zf), col);
  const ink = shade(col, 0.42), z = zf + 0.015;
  for (let k = 0; k < 2; k++) {
    let x = -w * 0.25 + w * 0.5 * k + (hash(seed + k) - 0.5) * 0.3, y = h / 2 - 0.03;
    for (let s = 0; s < 3; s++) {
      const nx = Math.max(-w / 2 + 0.1, Math.min(w / 2 - 0.1, x + (hash(seed + k * 5 + s) - 0.5) * 0.36)), ny = y - h * 0.28;
      const t = V(ny - y, -(nx - x), 0).normalize().multiplyScalar(0.025);
      K.matte.quad(V(x, y, z).add(t), V(x, y, z).sub(t), V(nx, ny, z).sub(t), V(nx, ny, z).add(t), ink);
      x = nx; y = ny;
    }
  }
}

/** The key, about a metre long, along x through the box's middle: its bow a ring with a velvet ribbon tied through it, its bit hung down. */
export function key(K) {
  const S = MACHINE_LOOK.key, P = K.pal, b = P.gold;
  K.metal.add(new THREE.TorusGeometry(S.bow, 0.065, 8, 18).translate(-0.33, 0, 0), b);
  K.metal.add(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 10).rotateZ(Math.PI / 2).translate(-0.11, 0, 0), shade(b, 0.85));
  K.metal.add(new THREE.CylinderGeometry(S.shaft, S.shaft, 0.62, 8).rotateZ(Math.PI / 2).translate(0.18, 0, 0), b);
  K.metal.box(0.3, 0.42, -0.24, -0.04, -0.045, 0.045, b);
  K.metal.box(0.44, 0.49, -0.17, -0.04, -0.045, 0.045, b);
  for (const [x1, y1] of [[-0.5, -0.52], [-0.24, -0.56]]) {
    const a = V(-0.33, -S.bow, 0.06), e = V(x1, y1, 0.06), n = V(-(e.y - a.y), e.x - a.x, 0).normalize().multiplyScalar(0.05), m = e.clone().lerp(a, 0.12);
    K.matte.add(extruded([[a.x + n.x, a.y + n.y], [a.x - n.x, a.y - n.y], [e.x - n.x, e.y - n.y], [m.x, m.y], [e.x + n.x, e.y + n.y]], 0.03, 0.045), P.velvet);
  }
  K.matte.add(new THREE.SphereGeometry(0.07, 8, 6).scale(1, 0.8, 0.6).translate(-0.33, -S.bow, 0.06), shade(P.velvet, 0.8));
}

/** The lock's door w x h x d: walnut bound in brass straps, the keyhole plate on its front at `lockY` (its height over the door's foot). */
export function lockDoor(K, w, h, d, { lockY = 1.5 } = {}) {
  const S = MACHINE_LOOK.door, P = K.pal, xw = w * 0.46, zf = d * 0.47, y0 = -h / 2;
  K.matte.box(-xw, xw, y0, h / 2, -zf, zf, P.walnut);
  for (let x = -xw + 0.14; x < xw - 0.05; x += 0.16) K.matte.box(x - 0.012, x + 0.012, y0 + 0.1, h / 2 - 0.1, zf, zf + 0.015, shade(P.walnut, 0.72));
  for (const y of S.straps) if (y < h - 0.2) K.metal.box(-xw - 0.025, xw + 0.025, y0 + y - S.strap / 2, y0 + y + S.strap / 2, -zf - 0.025, zf + 0.025, P.brass);
  const [pw, ph] = S.plate, py = y0 + lockY, c = 0.1, z = zf + 0.03;
  K.metal.add(extruded([[-pw / 2 + c, py - ph / 2], [pw / 2 - c, py - ph / 2], [pw / 2, py - ph / 2 + c], [pw / 2, py + ph / 2 - c], [pw / 2 - c, py + ph / 2], [-pw / 2 + c, py + ph / 2], [-pw / 2, py + ph / 2 - c], [-pw / 2, py - ph / 2 + c]], 0.05, z), P.brass);
  K.matte.add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12).rotateX(Math.PI / 2).translate(0, py + 0.12, z + 0.06), P.ink);
  K.matte.add(extruded([[-0.05, py + 0.06], [0.05, py + 0.06], [0.09, py - 0.24], [-0.09, py - 0.24]], 0.03, z + 0.045), P.ink);
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.metal.add(new THREE.SphereGeometry(0.045, 6, 4).translate(sx * (pw / 2 - 0.09), py + sy * (ph / 2 - 0.09), z + 0.05), shade(P.brass, 0.7));
}

/** The cannon in its base w x h x d: a barrel laid along x with its muzzle at (mx, my) firing toward `dir` (-1 left), brass-banded, its
 *  breech a thimble's dome past the base's far end; a walnut carriage under it, a button wheel each side; the barrel's top the base's. */
export function cannon(K, w, h, d, { mx = -w / 2 - 0.2, my = h / 2 - 0.6, dir = -1 } = {}) {
  const S = MACHINE_LOOK.cannon, P = K.pal, R = Math.min(S.r, (h / 2 - my) / 1.08), L = Math.abs(-dir * (w / 2) - mx), steel = P.steel, brass = P.brass;
  const prof = [[0, -0.22, steel, 'metal'], [R * 0.62, -0.17, steel, 'metal'], [R * 0.92, -0.06, steel, 'metal'], [R, 0, brass, 'metal'], [R * 1.08, 0.06, brass, 'metal'], [R * 1.08, 0.18, brass, 'metal'], [R, 0.22, steel, 'metal'],
    [R, L * 0.5 - 0.06, brass, 'metal'], [R * 1.06, L * 0.5, brass, 'metal'], [R * 1.06, L * 0.5 + 0.1, brass, 'metal'], [R, L * 0.5 + 0.14, steel, 'metal'],
    [R * 1.02, L - 0.3, brass, 'metal'], [R * 1.12, L - 0.12, brass, 'metal'], [R * 1.12, L, brass, 'metal'], [R * 0.68, L, P.ink], [R * 0.68, L - 0.45, P.ink], [0, L - 0.45]];
  const place = new THREE.Matrix4().makeRotationZ(dir < 0 ? Math.PI / 2 : -Math.PI / 2).setPosition(mx - dir * L, my, 0);
  turned(K, prof, 18, { place });
  const top = my - R * 0.45, zc = Math.min(S.carriage, d * 0.3);
  K.matte.box(-w / 2 + 0.12, w / 2 - 0.05, -h / 2, top, -zc, zc, P.walnut);
  K.matte.box(-w / 2 + 0.1, w / 2 - 0.03, top - 0.08, top, -zc - 0.02, zc + 0.02, shade(P.walnut, 0.75));
  const r = Math.min(S.wheel, (top + h / 2) * 0.7), wx = 0.05 * -dir, wy = -h / 2 + r;
  for (const s of [1, -1]) button(K, r, 0.12, { col: P.velvet, place: new THREE.Matrix4().makeRotationX(s * Math.PI / 2).setPosition(wx, wy, s * zc) });
}

/** The cannon's ball as a tomato pincushion stuck with glass-headed pins: one geometry, every ball's, in the matte material. */
export function pincushion(pal) {
  const S = MACHINE_LOOK.ball, K = new PropKit(pal), red = shade(pal.velvet, 1.5), lobe = shade(red, 0.8), heads = [pal.mustard, pal.teal, pal.chalk, pal.sky, pal.rose, pal.gold];
  K.matte.add(new THREE.SphereGeometry(S.r, 18, 10).scale(1, 0.88, 1), (x, y, z) => (Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 6 + 0.5) % 2 ? lobe : red));
  const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 0.05 : 0.13; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  K.matte.add(extruded(pts, 0.03, 0).rotateX(-Math.PI / 2).translate(0, S.r * 0.86, 0), pal.sage);
  const dirs = [[0.6, 0.7, 0.4], [-0.7, 0.5, 0.5], [0.2, 0.3, 0.93], [-0.3, -0.45, 0.84], [0.8, -0.25, 0.55], [-0.5, 0.2, -0.84]];
  for (let i = 0; i < Math.min(S.pins, dirs.length); i++) {
    const n = V(...dirs[i]).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
    K.matte.add(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 5).applyQuaternion(q).translate(n.x * (S.r + 0.08), n.y * (S.r + 0.08), n.z * (S.r + 0.08)), pal.steel);
    K.matte.add(new THREE.SphereGeometry(0.068, 8, 6).translate(n.x * (S.r + 0.23), n.y * (S.r + 0.23), n.z * (S.r + 0.23)), heads[i % heads.length]);
  }
  return K.matte.geometry();
}

// ---------------------------------------------------------------------------------------------------------------- the conveyor
const BOX = (() => { const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(); return { p: g.attributes.position.array.slice(), n: g.attributes.normal.array.slice() }; })();

/** The conveyor (the movers' belt, world/props/movers.js Belt): its felt, rollers and hubs into the lane's kit K (static), and its running
 *  stitch and the hubs' spokes as a mesh of its own (`mesh`, centred on the belt) rewritten by `step(dt)` as the belt runs. */
export class BeltLook {
  constructor(K, belt, mat, pal) {
    const S = MACHINE_LOOK.belt, [w, h, d] = belt.size, c = belt.cur.p, rr = S.roller, zf = d / 2 - 0.05;
    this.belt = belt; this.off = 0; this.w = w; this.h = h; this.zf = zf;
    K.frame(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));
    const felt = pal.teal, xa = -w / 2 + rr, xb = w / 2 - rr;
    K.matte.box(xa, xb, h / 2 - 0.14, h / 2, -zf, zf, felt);
    K.matte.box(xa, xb, -h / 2, -h / 2 + 0.12, -zf, zf, shade(felt, 0.8));
    K.matte.box(xa, xb, -h / 2 + 0.12, h / 2 - 0.14, -zf + 0.1, zf - 0.1, pal.walnut);
    for (const x of [xa, xb]) {
      K.matte.add(new THREE.CylinderGeometry(rr, rr, zf * 2 - 0.02, 16).rotateX(Math.PI / 2).translate(x, 0, 0), pal.maple);
      for (const s of [1, -1]) K.metal.add(new THREE.CylinderGeometry(rr * 0.72, rr * 0.78, 0.04, 14).rotateX(Math.PI / 2).translate(x, 0, s * (zf + 0.01)), pal.brass);
    }
    // the moving marks: the running stitch on top (three rows) and down the front, the spokes on the two front hubs
    this.xa = xa; this.xb = xb; this.L = xb - xa; this.n = Math.max(1, Math.round(this.L / S.every)); this.s = this.L / this.n;
    this.rows = [[h / 2, h / 2 + 0.016, -0.95, -0.95 + S.stitch], [h / 2, h / 2 + 0.016, -S.stitch / 2, S.stitch / 2], [h / 2, h / 2 + 0.016, 0.95 - S.stitch, 0.95], [h / 2 - 0.1, h / 2 - 0.04, zf, zf + 0.016]];
    this.hubs = [xa, xb];
    const boxes = this.rows.length * this.n * 2 + this.hubs.length * 2, count = boxes * 36;
    const g = new THREE.BufferGeometry(), col = new Float32Array(count * 3), cc = new THREE.Color(pal.mustard), ci = new THREE.Color(pal.ink);
    for (let i = 0; i < boxes; i++) { const k = i < this.rows.length * this.n * 2 ? cc : ci; for (let v = 0; v < 36; v++) k.toArray(col, (i * 36 + v) * 3); }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), w / 2 + d / 2 + 0.5);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.position.copy(c); this.mesh.receiveShadow = true;
    this.step(0);
  }

  /** The stitches carried along the belt by its surface's speed, the spokes turned with them. */
  step(dt) {
    const S = MACHINE_LOOK.belt, vx = this.belt.surface?.x ?? 0, P = this.mesh.geometry.attributes.position, N = this.mesh.geometry.attributes.normal;
    this.off += vx * dt;
    let k = 0;
    for (const [y0, y1, z0, z1] of this.rows) for (let i = 0; i < this.n; i++) {
      const x = this.xa + (((i * this.s + this.off) % this.L) + this.L) % this.L, e = x + S.dash;
      this.put(P, N, k++, x, Math.min(e, this.xb), y0, y1, z0, z1, 0);
      const over = e - this.xb; this.put(P, N, k++, this.xa, this.xa + Math.max(0, over), y0, y1, z0, z1, 0);
    }
    const th = -this.off / S.roller, z = this.zf + 0.03;
    for (const x of this.hubs) for (const a of [0, Math.PI / 2]) this.put(P, N, k++, x - S.spoke, x + S.spoke, -0.03, 0.03, z, z + 0.016, th + a, x);
    P.needsUpdate = true; N.needsUpdate = true;
  }
  /** Box k: x0..x1, y0..y1, z0..z1, turned by `rot` about the depth axis through (cx, 0). */
  put(P, N, k, x0, x1, y0, y1, z0, z1, rot, cx = (x0 + x1) / 2) {
    const sx = Math.max(0, x1 - x0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2, co = Math.cos(rot), si = Math.sin(rot), pa = P.array, na = N.array;
    for (let v = 0; v < 36; v++) {
      const i = v * 3, o = (k * 36 + v) * 3;
      const lx = mx - cx + BOX.p[i] * sx, ly = my + BOX.p[i + 1] * (y1 - y0);
      pa[o] = cx + lx * co - ly * si; pa[o + 1] = lx * si + ly * co; pa[o + 2] = mz + BOX.p[i + 2] * (z1 - z0);
      na[o] = BOX.n[i] * co - BOX.n[i + 1] * si; na[o + 1] = BOX.n[i] * si + BOX.n[i + 1] * co; na[o + 2] = BOX.n[i + 2];
    }
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); }
}
