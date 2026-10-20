// ---------------------------------------------------------------------------------------
// THE SHIP'S RIG AND THE MAST FOLD: a ship's masts, yards, boom and deck hatches as one mesh in the hull's material, and its vanes (the
// sails: light-cloth, a translucent fill and a bright edge, in the sail's program, vfx/sloop.js sailMaterial) as one mesh more, both
// posed on the CPU from ONE number, the fold `u` (0 the rig out .. 1 stowed), only when it or the wind changes. Research:
// docs/plans/research/RAIL-SHIPS-SCIFI.md 4.3 and 4.4, followed:
//   0.00 .. 0.30  the vanes close like a book onto what they hang from (a yard, the mast, the stay), and the yards that pivot turn to lie
//                 fore and aft (the frigate's)
//   0.20 .. 0.70  the mast stows: a TELESCOPE (each segment slides down into the one below, the lowest sinks into its deck slot leaving a
//                 periscope stub, a submarine's photonics mast) or a HINGE (a tabernacle: the whole mast swings flat aft on its foot, the
//                 destroyer's blade); `strike: 'top'` strikes only the upper segments (the galleon's topgallants: a gale's drill)
//   hatch 0.60 .. 1  the deck hatch slides shut over the slot, its seam lit on its last fifth (it marks the end), then held dimmer
// A mast's `delay` (a share of u) makes the frigate's ripple aft to fore. The pose is data: a new class is a table, not code.
// Prior art: Outlaw Star's grappler arms (parts that hide in a clean hull and deploy), a tabernacle mast, a submarine's photonics mast,
// a square-rigger striking its topgallants, Macross's transformations (the centreline never lost), Jurai's Light Hawk Wings (the
// vanes are light, so they close to their edge).
//
//   const R = new Rig({ masts, vanes, hatches, booms, hull, sail: [mat], side })   R.mesh (the spars and hatches)   R.vaneMesh
//   R.pose({ u, hatch, sail, side, t })   R.topOf(mastIndex) -> Vector3 (the masthead, posed)   R.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Mesher } from './hullkit.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _bm = new THREE.Matrix4(), _bm2 = new THREE.Matrix4(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export class Rig {
  /** masts: [{ x, z, y0, rake, segs: [{ len, r0, r1, col }], mode, hinge, stub, strike, delay, blade, yards: [{ seg, at, w, r, col, pivot,
   *  lateen: [fore, aft, tilt] }], cap: col }]; vanes: [{ kind: 'square' | 'main' | 'jib' | 'lateen', mast, yard, drop, foot, lotus, ... }];
   *  hatches: [{ mast, w, d, col, seam }]; booms: [{ mast, h, len, r, col }]. `hull`: the hull's material; `sail`: the vanes' material. */
  constructor({ masts = [], vanes = [], hatches = [], booms = [], hull, sail = null }) {
    this.masts = masts.map((M) => this.restOf(M)); this.vanes = vanes; this.hatches = hatches; this.booms = booms;
    this.ranges = []; const parts = [];
    const part = (kind, at, build) => { const M = new Mesher(); build(M); parts.push(M); this.ranges.push({ kind, ...at, M }); };
    this.masts.forEach((M, mi) => {
      M.segs.forEach((S, i) => part('seg', { mast: mi, i }, (G) => {
        if (M.blade) G.box([0, S.len / 2, 0], [M.blade.t, S.len, M.blade.w], S.col, S.code ?? 0, { top: [1, 0.35], shift: [0, -M.blade.w * 0.3] });
        else G.cyl([0, 0, 0], [0, S.len, 0], S.r0, S.r1, 6, S.col, S.code ?? 0, { phase: Math.PI / 6 });
        if (!M.blade && (i > 0 || M.segs.length === 1)) G.cyl([0, -0.02, 0], [0, 0.08, 0], S.r0 * 1.5, S.r0 * 1.3, 6, M.collar ?? S.col, 0); // (a collar at the joint: the dark-blue mechanical joint)
        if (i === M.segs.length - 1 && M.cap != null) G.gem([0, S.len + 0.06, 0], Math.max(0.05, S.r1 * 1.4), 0.12, 0.05, 6, M.cap, 0.55);
      }));
      M.yards.forEach((Y, j) => part('yard', { mast: mi, j }, (G) => {
        if (Y.lateen) { const [f, a, tilt] = Y.lateen; G.cyl([0, -Math.sin(tilt) * f, Math.cos(tilt) * f], [0, Math.sin(tilt) * a, -Math.cos(tilt) * a], Y.r * 1.2, Y.r * 0.7, 5, Y.col, Y.code ?? 0); }
        else { G.cyl([-Y.w / 2 - 0.1, 0, 0], [Y.w / 2 + 0.1, 0, 0], Y.r, Y.r, 5, Y.col, Y.code ?? 0); G.box([0, 0, 0], [0.12, Y.r * 3, Y.r * 3], M.collar ?? Y.col, 0); }
      }));
    });
    this.booms.forEach((B, bi) => part('boom', { bi }, (G) => { G.cyl([0, 0, 0], [0, 0, -B.len], B.r, B.r * 0.8, 6, B.col, 0); G.box([0, 0, 0], [B.r * 3, B.r * 3, B.r * 3], this.masts[B.mast].collar ?? B.col, 0); }));
    this.hatches.forEach((H, hi) => { for (const s of [1, -1]) part('hatch', { hi, s }, (G) => {
      const pw = H.w / 2; G.box([0, 0, 0], [pw, 0.03, H.d], H.col, 0.1, { cols: { bottom: null } });
      G.box([-s * (pw / 2 - 0.012), 0.017, 0], [0.024, 0.008, H.d * 0.96], H.seam, 0.2); // (its seam: lit as it shuts)
    }); });
    // one geometry for the spars: the ranges laid end to end, their rest positions kept
    let n = 0; for (const r of this.ranges) { r.start = n; r.count = r.M.p.length / 3; n += r.count; }
    const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), col = new Float32Array(n * 4);
    for (const r of this.ranges) {
      pos.set(r.M.p, r.start * 3); nrm.set(r.M.nrm, r.start * 3); col.set(r.M.c, r.start * 4); r.rest = Float32Array.from(r.M.p); r.restN = Float32Array.from(r.M.nrm);
      if (r.kind === 'hatch') { r.seam = []; for (let i = 0; i < r.count; i++) if (r.M.c[i * 4 + 3] >= 0.15) r.seam.push(i); } // (the seam's vertices: their code is what lights)
      delete r.M;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(g, hull); this.mesh.name = 'ship-rig'; this.mesh.castShadow = false; this.mesh.receiveShadow = true;
    // the vanes: a grid each, uv (along what it hangs from, away from it); a vane with no lotus has its uv.x moved by 2 (sloop.js sailMaterial)
    this.vaneGrid = []; let vn = 0; const idx = [], uv = [];
    for (const W of vanes) {
      const nu = W.kind === 'square' ? 6 : 8, nv = W.kind === 'square' ? 5 : 7; W.nu = nu; W.nv = nv; W.at = vn;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const s = i / nu, v = j / nv, ux = W.uvSwap ? v : s, uy = W.uvSwap ? s : v; uv.push(ux + (W.lotus ? 0 : 2), uy); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = vn + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      vn += (nu + 1) * (nv + 1);
    }
    if (vn && sail) {
      const vg = new THREE.BufferGeometry();
      vg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vn * 3), 3).setUsage(THREE.DynamicDrawUsage)); vg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vn * 3), 3).setUsage(THREE.DynamicDrawUsage));
      vg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); vg.setIndex(idx);
      this.vaneMesh = new THREE.Mesh(vg, sail); this.vaneMesh.name = 'ship-vanes'; this.vaneMesh.castShadow = true; this.vaneMesh.frustumCulled = false;
    } else this.vaneMesh = null;
    this.key = ''; this.pose({ u: 0, hatch: 0, sail: 1, side: 1 });
    g.computeBoundingSphere(); g.boundingSphere.radius *= 1.1; this.mesh.frustumCulled = true;
  }

  /** A mast's segments' rest bases (on its own axis from its foot), and its total height. */
  restOf(M) {
    let b = 0; const base = [];
    M.segs.forEach((S, i) => { base.push(b); b += S.len - (i < M.segs.length - 1 ? (M.overlap ?? 0.12) * S.len : 0); });
    return { mode: 'telescope', rake: 0, hinge: 1.45, stub: 0.3, strike: 'all', delay: 0, yards: [], ...M, base, height: b, posed: base.slice(), angle: 0, yaw: 0 };
  }
  /** A point at rest height h on mast m's axis, posed (body frame). */
  mastPoint(mi, h, out = new THREE.Vector3(), x = 0, z = 0, seg = null) {
    const M = this.masts[mi]; let i = 0; if (seg != null) i = seg; else for (let k = 0; k < M.segs.length; k++) if (h >= M.base[k] - 1e-6) i = k;
    return out.set(x, M.posed[i] + (h - M.base[i]), z).applyMatrix4(this.mastMatrix(M, _m2));
  }
  mastMatrix(M, out) { return out.makeRotationX(-(M.rake + M.angle)).setPosition(M.x, M.y0, M.z); }
  /** The masthead of mast m, posed. */
  topOf(mi, out = new THREE.Vector3()) { const M = this.masts[mi]; return this.mastPoint(mi, M.height, out); }

  /** The fold: u 0..1 (masts and vanes), hatch 0..1 (the form's own: shut only for a dive), sail 0..1 (hoisted; at FURL and under the
   *  caller hides the vanes), side (the wind's: which way the fore-and-aft vanes belly and the boom swings). */
  pose({ u = 0, hatch = 0, sail = 1, side = 1 } = {}) {
    const key = `${u.toFixed(3)}|${hatch.toFixed(3)}|${sail.toFixed(3)}|${side}`; if (key === this.key) return false; this.key = key;
    const dmax = Math.max(0, ...this.masts.map((M) => M.delay));
    for (const M of this.masts) {
      const um = THREE.MathUtils.clamp((u - M.delay) / Math.max(0.01, 1 - dmax), 0, 1);
      M.vf = sm(0, 0.3, um); const k = sm(0.2, 0.7, um); M.k = k;
      M.yaw = M.yards.some((Y) => Y.pivot) ? M.vf * Math.PI / 2 : 0;
      if (M.mode === 'hinge') { M.angle = k * M.hinge; M.posed = M.base.slice(); }
      else {
        M.angle = 0;
        if (M.strike === 'top') M.posed = M.base.map((b, i) => (i === 0 ? 0 : THREE.MathUtils.lerp(b, M.base[1] - M.segs[i].len + 0.25 + 0.03 * i, k))); // (struck: slid down beside the lower mast, its head just over the lower's)
        else { const sink = (M.segs[0].len - M.stub) * k; M.posed = M.base.map((b, i) => (i === 0 ? -sink : THREE.MathUtils.lerp(b, -sink + 0.02 * i, k))); } // (each nested in the lowest, the lowest sunk to its stub)
      }
    }
    const pos = this.mesh.geometry.attributes.position, nrm = this.mesh.geometry.attributes.normal, col = this.mesh.geometry.attributes.color;
    for (const r of this.ranges) {
      if (r.kind === 'seg') { const M = this.masts[r.mast]; this.mastMatrix(M, _m).multiply(_m2.makeTranslation(0, M.posed[r.i], 0)); }
      else if (r.kind === 'yard') { const M = this.masts[r.mast], Y = M.yards[r.j], h = M.base[Y.seg] + Y.at * M.segs[Y.seg].len; this.mastMatrix(M, _m).multiply(_m2.makeTranslation(0, M.posed[Y.seg] + (h - M.base[Y.seg]), 0)); if (Y.pivot) _m.multiply(_m2.makeRotationY(M.yaw)); }
      else if (r.kind === 'boom') this.boomMatrix(this.booms[r.bi], sail, side, _m);
      else { const H = this.hatches[r.hi], M = this.masts[H.mast], c = sm(0, 0.9, hatch), x = r.s * (H.w * 0.25 + (H.w * 0.5 + 0.04) * (1 - c)); _m.makeTranslation(M.x + x, M.y0 + 0.016, M.z);
        const lit = sm(0.8, 1, hatch) * (1 - 0.45 * sm(0.98, 1, hatch)), code = 0.2 + 0.4 * lit; // (its seam lit on the last fifth, then held dimmer while it stays shut)
        for (const i of r.seam) col.setW(r.start + i, code);
        col.needsUpdate = true; }
      _n3.getNormalMatrix(_m);
      for (let i = 0; i < r.count; i++) {
        _v.fromArray(r.rest, i * 3).applyMatrix4(_m); pos.setXYZ(r.start + i, _v.x, _v.y, _v.z);
        _w.fromArray(r.restN, i * 3).applyMatrix3(_n3).normalize(); nrm.setXYZ(r.start + i, _w.x, _w.y, _w.z);
      }
    }
    pos.needsUpdate = nrm.needsUpdate = true;
    this.sailNow = sail; if (this.vaneMesh) this.poseVanes(sail, side);
    return true;
  }
  boomYaw(B, sail, side) { return side * (0.3 + 0.25 * sail); }
  /** The boom's frame: on the lowest segment at its height (never below the deck: stowed, it lies on it), level (the mast's rake undone), swung to the wind. */
  boomMatrix(B, sail, side, out) { const M = this.masts[B.mast]; return this.mastMatrix(M, out).multiply(_bm.makeTranslation(0, Math.max(M.posed[0] + B.h, 0.12), 0)).multiply(_bm.makeRotationX(M.rake)).multiply(_bm.makeRotationY(this.boomYaw(B, sail, side))); }

  /** Each vane: from what it hangs from (A) to its free edge (B), spread by how far it is hoisted and not folded. */
  poseVanes(sail, side) {
    const g = this.vaneMesh.geometry, pos = g.attributes.position, nrm = g.attributes.normal, A = V(), B = V(), P = V(), du = V(), dv = V(), n = V();
    for (const W of this.vanes) {
      const M = this.masts[W.mast], folds = M.strike !== 'top' || this.segOf(W) > 0, vf = folds ? M.vf : 0, spread = (1 - vf) * (0.08 + 0.92 * sail);
      const edge = (s, outA, outB) => this.vaneEdge(W, M, s, side, outA, outB);
      for (let j = 0; j <= W.nv; j++) for (let i = 0; i <= W.nu; i++) {
        const s = i / W.nu, v = j / W.nv; edge(s, A, B); P.copy(A).lerp(B, v * spread);
        if (W.kind === 'main' && v > 0) P.addScaledVector(_v.copy(B).sub(A).normalize(), 0.12 * Math.sin(Math.PI * s) * v * spread); // (a roach: the leech bowed out)
        pos.setXYZ(W.at + j * (W.nu + 1) + i, P.x, P.y, P.z);
      }
      edge(0.5, A, B); edge(0.6, P, dv); du.copy(P).sub(A); dv.copy(B).sub(A); n.crossVectors(du, dv).normalize(); // (the plane's normal: the belly's way)
      if (W.kind === 'square' ? n.z < 0 : n.x * side < 0) n.negate(); // (the belly's side: a square vane fills forward, a fore-and-aft one to leeward; the material's uSide stays 1)
      if (!Number.isFinite(n.x) || n.lengthSq() < 0.5) n.set(W.kind === 'square' ? 0 : 1, 0, W.kind === 'square' ? 1 : 0);
      for (let k = 0; k < (W.nu + 1) * (W.nv + 1); k++) nrm.setXYZ(W.at + k, n.x, n.y, n.z);
    }
    pos.needsUpdate = nrm.needsUpdate = true; g.computeBoundingSphere();
  }
  segOf(W) { return W.kind === 'square' ? this.masts[W.mast].yards[W.yard].seg : W.seg ?? 0; }
  /** A vane's two edges at s (0..1 along what it hangs from). */
  vaneEdge(W, M, s, side, A, B) {
    const mi = this.masts.indexOf(M);
    if (W.kind === 'square') {
      const Y = M.yards[W.yard], h = M.base[Y.seg] + Y.at * M.segs[Y.seg].len, hw = Y.w / 2, ft = W.foot ?? 1.1;
      const yaw = Y.pivot ? M.yaw : 0, c = Math.cos(yaw), sn = Math.sin(yaw), xa = (s - 0.5) * 2 * hw * 0.96, xb = (s - 0.5) * 2 * hw * ft;
      this.mastPoint(mi, h, A, xa * c, -xa * sn, Y.seg).y -= Y.r; this.mastPoint(mi, h - W.drop, B, xb * c, -xb * sn, Y.seg); // (both edges ride the yard's segment)
      return;
    }
    if (W.kind === 'main') {
      const Bm = this.booms[W.boom], lo = M.base[0] + Bm.h + 0.08, hi = M.height * (W.head ?? 0.97);
      const head = this.mastPoint(mi, hi, _w), clew = V(0, 0.06, -Bm.len * 0.96).applyMatrix4(this.boomMatrix(Bm, this.sailNow ?? 1, side, _bm2));
      this.mastPoint(mi, THREE.MathUtils.lerp(lo, hi, s), A); B.copy(clew).lerp(head, s);
      return;
    }
    if (W.kind === 'jib') {
      const head = this.mastPoint(mi, M.height * W.head, _w), tack = V(...W.tack), clew = V(-side * (W.clewX ?? 0.35), W.clew[1], W.clew[2]);
      A.copy(tack).lerp(head, s); B.copy(clew).lerp(head, s);
      return;
    }
    // lateen: the yard's fore end (F) to its aft end (H) along A; the clew (C) low aft
    const Y = M.yards[W.yard], h = M.base[Y.seg] + Y.at * M.segs[Y.seg].len, [f, a, tilt] = Y.lateen;
    const F = this.mastPoint(mi, h - Math.sin(tilt) * f, V(), 0, Math.cos(tilt) * f, Y.seg), H = this.mastPoint(mi, h + Math.sin(tilt) * a, V(), 0, -Math.cos(tilt) * a, Y.seg);
    const C = this.mastPoint(mi, M.base[0] + (W.clewH ?? 0.6), V(), -side * 0.2, -(W.clewZ ?? a * 0.8));
    A.copy(F).lerp(H, s); B.copy(F).lerp(C, s);
  }

  dispose() { this.mesh.geometry.dispose(); this.vaneMesh?.geometry.dispose(); }
}

/** THE FOLD'S DRIVE: what `u` is from the ship's form and its barrel roll (RAIL-SHIPS-SCIFI.md 4.3, Petra's numbers). The form's part
 *  eases at its own pace (down 0.5 real s, up 0.4: going up eager, going down sealed) toward 1 only in the Umbral form of a hull that
 *  dives; the roll's part is a curve over the roll's progress (0..1): folded over its first `roll` share, held, unfolded over its last,
 *  so the mast is out when the roll ends. u = max(form, roll); the hatch follows the form's part only. `fold(u)` forces a pose. */
export const FOLD = { down: 0.5, up: 0.4, roll: 0.29 };
export class FoldDrive {
  constructor({ dives = true } = {}) { this.dives = dives; this.f = 0; this.t = null; this.forced = null; }
  step({ form, roll = 0, t = 0 } = {}) {
    const raw = this.t == null ? 0 : THREE.MathUtils.clamp(t - this.t, 0, 0.1); this.t = t;
    const want = form === 'umbral' && this.dives ? 1 : 0;
    this.f = want > this.f ? Math.min(want, this.f + raw / FOLD.down) : Math.max(want, this.f - raw / FOLD.up);
    if (form == null) this.f = 0; // (no form given: the rig stays out, as before the fold)
    const r = THREE.MathUtils.clamp(roll || 0, 0, 1), R = FOLD.roll, rollU = r <= 0 || r >= 1 ? 0 : Math.min(1, r / R, (1 - r) / R);
    if (this.forced != null) return { u: this.forced, hatch: this.dives ? this.forced : 0 };
    return { u: Math.max(this.f, rollU * 0.72), hatch: this.f }; // (0.72: the mast fully down, no hatch: a roll does not seal the slot)
  }
}
