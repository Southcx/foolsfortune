import * as THREE from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

// Plane-cutting utilities for the slicer shell. A plane is { n: unit Vector3, d }
// with signed distance dist(p) = n·p - d, in whatever space the data lives in.

const EPS = 1e-5;

export function planeFrom(normal, point) {
  const n = normal.clone().normalize();
  return { n, d: n.dot(point) };
}

/** Plane (world) -> local space of an object at (pos, quat). */
export function planeToLocal(plane, pos, quat) {
  const inv = quat.clone().invert();
  const n = plane.n.clone().applyQuaternion(inv);
  const p0 = plane.n.clone().multiplyScalar(plane.d).sub(pos).applyQuaternion(inv);
  return { n, d: n.dot(p0) };
}

/**
 * Clip a convex point cloud. Reduce it to its hull first, then each half is
 * its hull vertices on that side plus the crossing points of the hull's
 * *edges* (O(edges), not O(n²) over every vertex pair: a sliced pot half has
 * hundreds of vertices). Returns { a, b, cut } arrays of Vector3.
 */
export function splitConvexPoints(points, plane) {
  const hull = new ConvexHull();
  try { hull.setFromPoints(points); } catch { return { a: [], b: [], cut: [] }; }
  const verts = new Map(), edges = new Map();
  for (const face of hull.faces) {
    let e = face.edge;
    do {
      const p = e.head().point, q = e.tail().point;
      for (const v of [p, q]) verts.set(v, v);
      const key = p.x < q.x || (p.x === q.x && p.y < q.y) ? `${p.x},${p.y},${p.z}|${q.x},${q.y},${q.z}` : `${q.x},${q.y},${q.z}|${p.x},${p.y},${p.z}`;
      edges.set(key, [p, q]);
      e = e.next;
    } while (e !== face.edge);
  }
  const d = (p) => plane.n.dot(p) - plane.d;
  const a = [], b = [], cut = [];
  for (const v of verts.values()) (d(v) >= 0 ? a : b).push(v.clone());
  for (const [p, q] of edges.values()) {
    const dp = d(p), dq = d(q);
    if ((dp >= 0) === (dq >= 0)) continue;
    cut.push(new THREE.Vector3().lerpVectors(p, q, dp / (dp - dq)));
  }
  return { a: a.concat(cut.map((p) => p.clone())), b: b.concat(cut.map((p) => p.clone())), cut };
}

/**
 * Collider-safe hull input. Rapier's hull builder can panic (a WASM trap that
 * poisons the whole physics world) on near-duplicate or near-flat point sets,
 * which repeated slicing produces. Returns the hull's vertices, merged within
 * `merge`, as a flat Float32Array, or null if the piece is thinner than `minWidth`.
 */
export function safeHullPoints(points, minWidth = 0.006, merge = 0.0015) {
  if (points.length < 4) return null;
  const hull = new ConvexHull();
  try { hull.setFromPoints(points); } catch { return null; }
  if (hull.faces.length < 4) return null;
  const onHull = new Set();
  for (const face of hull.faces) {
    let e = face.edge;
    do { onHull.add(e.head().point); e = e.next; } while (e !== face.edge);
  }
  const verts = [];
  for (const p of onHull) {
    if (!verts.some((u) => u.distanceToSquared(p) < merge * merge)) verts.push(p);
  }
  if (verts.length < 4) return null;
  // width = the smallest over faces of the farthest vertex behind that face
  let width = Infinity;
  for (const f of hull.faces) {
    let far = 0;
    for (const v of verts) far = Math.max(far, -f.distanceToPoint(v));
    width = Math.min(width, far);
  }
  if (!(width >= minWidth)) return null;
  const flat = new Float32Array(verts.length * 3);
  verts.forEach((p, i) => { flat[i * 3] = p.x; flat[i * 3 + 1] = p.y; flat[i * 3 + 2] = p.z; });
  return flat;
}

export function uniquePoints(geometry) {
  const pa = geometry.attributes.position;
  const seen = new Map();
  for (let i = 0; i < pa.count; i++) {
    const k = `${Math.round(pa.getX(i) * 1e4)},${Math.round(pa.getY(i) * 1e4)},${Math.round(pa.getZ(i) * 1e4)}`;
    if (!seen.has(k)) seen.set(k, new THREE.Vector3(pa.getX(i), pa.getY(i), pa.getZ(i)));
  }
  return [...seen.values()];
}

/**
 * Split a non-indexed triangle mesh (position + color). Crossing triangles are
 * clipped; each cut segment is returned with its face normal so callers can
 * build cap faces. Returns { a: {pos, col, segs}, b: {pos, col, segs} }.
 */
export function splitTriangles(geometry, plane) {
  const P = geometry.attributes.position, C = geometry.attributes.color;
  const out = { a: { pos: [], col: [], segs: [] }, b: { pos: [], col: [], segs: [] } };
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const c = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
  const fn = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const push = (side, poly, cols) => {
    for (let k = 1; k < poly.length - 1; k++) {
      for (const idx of [0, k, k + 1]) {
        side.pos.push(poly[idx].x, poly[idx].y, poly[idx].z);
        side.col.push(cols[idx].r, cols[idx].g, cols[idx].b);
      }
    }
  };
  for (let i = 0; i < P.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      v[k].set(P.getX(i + k), P.getY(i + k), P.getZ(i + k));
      if (C) c[k].setRGB(C.getX(i + k), C.getY(i + k), C.getZ(i + k)); else c[k].setRGB(1, 1, 1);
    }
    const d = v.map((p) => plane.n.dot(p) - plane.d);
    const pos = d.map((x) => x >= -EPS);
    if (pos[0] && pos[1] && pos[2]) { push(out.a, v, c); continue; }
    if (!pos[0] && !pos[1] && !pos[2]) { push(out.b, v, c); continue; }
    // Sutherland–Hodgman against both half-spaces
    const polyA = [], colA = [], polyB = [], colB = [], cutPts = [];
    for (let k = 0; k < 3; k++) {
      const k2 = (k + 1) % 3;
      if (pos[k]) { polyA.push(v[k].clone()); colA.push(c[k].clone()); } else { polyB.push(v[k].clone()); colB.push(c[k].clone()); }
      if (pos[k] !== pos[k2]) {
        const t = d[k] / (d[k] - d[k2]);
        const p = new THREE.Vector3().lerpVectors(v[k], v[k2], t);
        const cc = c[k].clone().lerp(c[k2], t);
        polyA.push(p.clone()); colA.push(cc.clone());
        polyB.push(p.clone()); colB.push(cc.clone());
        cutPts.push(p);
      }
    }
    push(out.a, polyA, colA);
    push(out.b, polyB, colB);
    if (cutPts.length === 2) {
      fn.crossVectors(e1.subVectors(v[1], v[0]), e2.subVectors(v[2], v[0])).normalize();
      const seg = { p: cutPts[0], q: cutPts[1], normal: fn.clone() };
      out.a.segs.push(seg);
      out.b.segs.push(seg);
    }
  }
  return out;
}

/**
 * Cap a sliced hollow lathe wall: every outer-surface cut segment gets a quad
 * reaching inward (toward the pot's axis) by the wall thickness.
 */
export function capWall(side, axis, thickness, color) {
  const r1 = new THREE.Vector3(), r2 = new THREE.Vector3();
  for (const s of side.segs) {
    const mid = s.p.clone().add(s.q).multiplyScalar(0.5);
    const radial = new THREE.Vector3(mid.x - axis.x, 0, mid.z - axis.z);
    if (radial.lengthSq() < 1e-8 || s.normal.dot(radial) <= 0) continue; // inner-wall segment
    r1.set(s.p.x - axis.x, 0, s.p.z - axis.z).normalize().multiplyScalar(-thickness);
    r2.set(s.q.x - axis.x, 0, s.q.z - axis.z).normalize().multiplyScalar(-thickness);
    const p2 = s.p.clone().add(r1), q2 = s.q.clone().add(r2);
    for (const tri of [[s.p, s.q, q2], [s.p, q2, p2], [s.p, q2, s.q], [s.p, p2, q2]]) {
      for (const p of tri) { side.pos.push(p.x, p.y, p.z); side.col.push(color.r, color.g, color.b); }
    }
  }
}

/** Build a BufferGeometry from {pos, col}, recentred on its vertex centroid. */
export function toGeometry(side) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(side.pos);
  const c = new THREE.Vector3();
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) c.x += pos[i * 3], c.y += pos[i * 3 + 1], c.z += pos[i * 3 + 2];
  c.divideScalar(Math.max(1, n));
  for (let i = 0; i < n; i++) { pos[i * 3] -= c.x; pos[i * 3 + 1] -= c.y; pos[i * 3 + 2] -= c.z; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(side.col, 3));
  g.computeVertexNormals();
  return { geometry: g, center: c };
}
