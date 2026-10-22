// ---------------------------------------------------------------------------------------
// THE BODY'S PROXIES: where the Courier's body is this frame, as a capsule a body bone (the torso's three, the hips, the head and neck,
// the arms and legs), for whatever must stay out of it: a hand or a forearm the pose put in the chest or a thigh (the standoff,
// courier/anim/standoff.js), a held tool swung through the body (turnOff: tools/toolbody.js keepOffBody), a thing carried between the
// hands (pushOff: the carried pot), an elbow the wrist's ease would swing in (courier/anim/wristease.js). The shapes are the pose
// audit's own (scripts/poseaudit.page.js: fitted to the skinned meshes in their bind pose, each a capsule along its bone with an elliptic,
// tapered cross-section centred where the flesh is, drawn in until it sits inside the skin), learned once into data (bodyproxydata.js, by
// scripts/learn_bodyproxies.mjs), so the game keeps the body out of the very shapes the audit measures. Each hand's and forearm's own
// points (the vertices those bones carry, thinned) stand for the limb.
//
// Prior art: Unity's ragdoll wizard and Unreal's physics asset (a capsule a bone, sized from the mesh), the signed distance of an
// ellipse's capsule (the pose audit's `depthLocal`), and the collision proxies every engine keeps apart from what is drawn.
//
//   const body = new BodyProxies(bones)     body.place()   (after the pose: once a frame, before any of the asks below)
//   body.of(part) -> [proxy]                (part: 'chest', 'spine', 'pelvis', 'head', 'neck', 'thighL', 'upperArmR', ...)
//   body.depth(proxy, p) -> metres          (how far the world point p is inside it; below 0 outside)
//   body.out(proxy, p, n) -> n              (the way out of it at p, world, unit)
//   body.limb(limb, out[]) -> out           (limb: 'handL', 'forearmR', ...: its points in the world now)
//   body.deepest(points, parts) -> { d, i (the point), proxy } | null   (the deepest of points inside any proxy of those parts)
//   body.turnOff(M, points, { skip, max, parts }) -> radians   (a held thing at world matrix M turned about its origin, the hand, until none
//                                                     of its points { x, y, z, r } (its own frame) is in the body; `skip` { part, at, r }:
//                                                     a part left out near a world point, the holding forearm at the grip)
//   body.pushOff(M, points, { parts, max }) -> metres (the same moved out whole: a thing carried between two hands)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BODY_PROXIES, LIMB_POINTS } from './bodyproxydata.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const _l = new THREE.Vector3(), _s = new THREE.Vector3();
const _sec = { cx: 0, cz: 0, ax: 0, az: 0 }; // (a proxy's section at a height: section())
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _ax = new THREE.Vector3(), _q = new THREE.Quaternion(), _R = new THREE.Matrix4(), _T = new THREE.Matrix4();
/** The parts a held thing is kept out of: the whole body but the hands (which hold it) and the feet. */
export const HELD_PARTS = ['head', 'neck', 'chest', 'spine', 'pelvis', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR', 'thighL', 'thighR', 'shinL', 'shinR'];

export class BodyProxies {
  constructor(bones) {
    this.list = [];
    for (const d of BODY_PROXIES) {
      const bone = bones[d.bone];
      if (!bone) continue;
      const [y0, y1, ya, yb] = d.y, [c0x, c0z, a0x, a0z] = d.s0, [c1x, c1z, a1x, a1z] = d.s1;
      const r = Math.max(a0x, a0z, a1x, a1z) + Math.max(Math.abs(c0x), Math.abs(c0z), Math.abs(c1x), Math.abs(c1z));
      this.list.push({ part: d.part, bone, y0, y1, ya, yb, c0x, c0z, a0x, a0z, c1x, c1z, a1x, a1z, half: (y1 - y0) / 2 + r + 0.02, inv: new THREE.Matrix4(), c: new THREE.Vector3(), R: 0, scale: 1 });
    }
    this.byPart = {};
    for (const p of this.list) (this.byPart[p.part] ||= []).push(p);
    this.limbs = {};
    for (const [limb, rows] of Object.entries(LIMB_POINTS)) this.limbs[limb] = rows.filter((r) => bones[r[0]]).map((r) => ({ bone: bones[r[0]], p: new THREE.Vector3(r[1], r[2], r[3]) }));
  }

  of(part) { return this.byPart[part] || []; }

  /** Each proxy's frame this frame, from the bones' world matrices as they stand (the caller has them current: after the pose, and again
   *  after anything moves the spine or the legs). */
  place() {
    for (const p of this.list) {
      p.inv.copy(p.bone.matrixWorld).invert();
      p.scale = _s.setFromMatrixColumn(p.bone.matrixWorld, 0).length();
      p.c.set(0, (p.y0 + p.y1) / 2, 0).applyMatrix4(p.bone.matrixWorld);
      p.R = p.half * p.scale;
    }
  }

  /** The section at height y of its own axis: centre and half-widths. */
  section(p, y, out = _sec) { // (into one scratch: depth() runs it a proxy and a point every frame, and made an object a call)
    const u = p.yb > p.ya ? clamp((y - p.ya) / (p.yb - p.ya), 0, 1) : 0.5;
    out.cx = p.c0x + (p.c1x - p.c0x) * u; out.cz = p.c0z + (p.c1z - p.c0z) * u; out.ax = p.a0x + (p.a1x - p.a0x) * u; out.az = p.a0z + (p.a1z - p.a0z) * u;
    return out;
  }

  /** How far the world point p is inside proxy `p` (metres; below 0 outside; -1 when it is nowhere near). */
  depth(px, p) {
    if (p.distanceToSquared(px.c) > px.R * px.R) return -1;
    _l.copy(p).applyMatrix4(px.inv);
    const yc = clamp(_l.y, px.y0, px.y1), e = _l.y - yc, s = this.section(px, yc);
    const dx = _l.x - s.cx, dz = _l.z - s.cz, d = Math.hypot(dx, dz);
    const re = d < 1e-6 ? Math.min(s.ax, s.az) : (s.ax * s.az) / Math.hypot((s.az * dx) / d, (s.ax * dz) / d);
    return (re - Math.hypot(d, e)) * px.scale;
  }

  /** The way out of proxy `px` at the world point p (world, unit): away from its axis across it (the ellipse's own normal), and along it
   *  past an end. A point on the axis itself goes out the way `hint` (world) leans, if given. */
  out(px, p, n, hint = null) {
    _l.copy(p).applyMatrix4(px.inv);
    const yc = clamp(_l.y, px.y0, px.y1), e = _l.y - yc, s = this.section(px, yc);
    let dx = _l.x - s.cx, dz = _l.z - s.cz;
    if (Math.hypot(dx, dz) < 1e-4 && Math.abs(e) < 1e-4 && hint) { _s.copy(hint).transformDirection(px.inv); dx = _s.x; dz = _s.z; }
    n.set(dx / (s.ax * s.ax), Math.abs(e) > 1e-6 ? e / Math.min(s.ax, s.az) ** 2 : 0, dz / (s.az * s.az));
    if (n.lengthSq() < 1e-12) n.set(0, 0, 1);
    return n.transformDirection(px.bone.matrixWorld);
  }

  /** A limb's points in the world now (`limb`: handL, handR, forearmL, forearmR). */
  limb(limb, out = []) {
    const L = this.limbs[limb] || [];
    out.length = L.length;
    for (let i = 0; i < L.length; i++) { const r = L[i]; (out[i] ||= new THREE.Vector3()).copy(r.p).applyMatrix4(r.bone.matrixWorld); }
    return out;
  }

  /** The deepest of `points` inside any proxy of `parts` ({ d, i, proxy }), or null when none is inside. */
  deepest(points, parts) {
    const B = (this.best ||= { d: 0, i: 0, proxy: null }); let found = false; // (one answer object, reused: the caller reads it at once)
    for (const part of parts) for (const px of this.of(part)) for (let i = 0; i < points.length; i++) {
      const d = this.depth(px, points[i]);
      if (d > 0 && (!found || d > B.d)) { found = true; B.d = d; B.i = i; B.proxy = px; }
    }
    return found ? B : null;
  }

  /** The deepest of a held thing's points (its frame, carried by M: { x, y, z, r }) in the body, its radius in: { d, p, proxy } or null. */
  deepestHeld(M, points, parts, skip) {
    let best = null;
    for (const pt of points) {
      _p.set(pt.x, pt.y || 0, pt.z || 0).applyMatrix4(M);
      for (const part of parts) for (const px of this.of(part)) {
        if (skip && px.part === skip.part && _p.distanceTo(skip.at) < (skip.r ?? 0.14)) continue;
        const d = this.depth(px, _p) + (pt.r || 0);
        if (d > 0 && (!best || d > best.d)) best = { d, p: _p.clone(), proxy: px };
      }
    }
    return best;
  }

  /** Turn the thing at world matrix M about its origin until none of `points` is in the body, the deepest moved out first, by no more than
   *  `max` radians in all (in place on M). Turning about d x n (d: from the origin to the point, n: the way out) moves the point out by
   *  |d| sin(d, n) a radian. */
  turnOff(M, points, { skip = null, max = 0.6, parts = HELD_PARTS, margin = 0.008 } = {}) {
    let turned = 0;
    for (let k = 0; k < 4 && turned < max; k++) {
      const hit = this.deepestHeld(M, points, parts, skip);
      if (!hit || hit.d < 0.002) break;
      _o.setFromMatrixPosition(M);
      _d.subVectors(hit.p, _o);
      this.out(hit.proxy, hit.p, _n, _d);
      _ax.crossVectors(_d, _n);
      const len = _d.length(), reach = _ax.length() / Math.max(1e-6, len);
      if (len < 0.08 || reach < 0.05) break;
      const a = Math.min(max - turned, 0.35, (hit.d + margin) / (len * reach));
      _q.setFromAxisAngle(_ax.normalize(), a);
      M.premultiply(_T.makeTranslation(-_o.x, -_o.y, -_o.z)).premultiply(_R.makeRotationFromQuaternion(_q)).premultiply(_T.makeTranslation(_o.x, _o.y, _o.z));
      turned += a;
    }
    return turned;
  }

  /** Move the thing at world matrix M out of the body whole (in place on M): along the way out at its deepest point, a few rounds, by no
   *  more than `max` metres; -> the move (world, `out`). */
  pushOff(M, points, { parts = HELD_PARTS, max = 0.2, margin = 0.008, out = new THREE.Vector3() } = {}) {
    out.set(0, 0, 0);
    for (let k = 0; k < 4 && out.length() < max; k++) {
      const hit = this.deepestHeld(M, points, parts, null);
      if (!hit || hit.d < 0.002) break;
      this.out(hit.proxy, hit.p, _n, _d.subVectors(hit.p, hit.proxy.c));
      const m = Math.min(max - out.length(), hit.d + margin);
      M.premultiply(_T.makeTranslation(_n.x * m, _n.y * m, _n.z * m));
      out.addScaledVector(_n, m);
    }
    return out;
  }
}
