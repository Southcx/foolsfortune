// ---------------------------------------------------------------------------------------
// THE FISH KIT: the pieces a Weir fish's body is merged from, at unit length, nose toward +X, up +Y (fishbodies.js lays them out per
// species; fishmesh.js swims and poses the result). Every piece writes the attributes the fish's one program reads (vfx/fishlook.js):
// aCol, aFin (how it flutters), aKind (skin, fin, eye, a light, a crack; and its scale pattern). One BufferGeometry a species, shared by
// every copy of it.
//   skin    a tube swept along the body's profile (h, w: half height and half width along it, head u = 0 to tail u = 1; yo: the middle's
//           rise; sq: a superellipse's power, 2 round, more boxy), its ends pinched round as the old sphere sweep's were, its rings closer
//           toward the ends (cosine spacing) so a mouth and a snout have vertices to be drawn on
//   strip   a fin: a strip from a root line on the skin to its edge, both faces, its rays the edge's alternate shades
//   ball / cone / rod   an eye or a curd, a spine or a tooth or a scute, a barbel or a lantern's stalk
// Each triangle is turned to face out by a hint each vertex carries (away from the piece's middle), so the one-sided program culls true.
//
// Prior art: lofting a hull from station sections (a boat builder's lines plan, and every modelling package's loft), the superellipse
// (Piet Hein's) for a cross-section between round and boxy, and the old fishmesh.js's pinched sphere sweep, kept as the profile's ends.
//   const k = new FishKit(B)    k.skin(colourAt, scales, flapAt)   k.strip(root, edge, o)   k.ball(...)   k.cone(...)   k.rod(...)
//   k.surf(u, a, lift)  a point on the skin (a: 0 the back, PI/2 the +Z flank, PI the belly)      k.geometry()  the merged BufferGeometry
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const sgnPow = (x, p) => Math.sign(x) * Math.pow(Math.abs(x), p);

export class FishKit {
  constructor(B) {
    this.B = B; this.pos = []; this.col = []; this.fin = []; this.kind = []; this.hint = []; this.idx = [];
  }

  /** A profile array read at u (0..1), linearly. */
  at(arr, u) {
    if (!arr) return 0;
    const n = arr.length, f = THREE.MathUtils.clamp(u, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f));
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }

  /** The ends' pinch: 0 at the nose and the tail's root, 1 between (the old sweep's). */
  pinch(u) { return Math.pow(Math.sqrt(Math.max(0, 1 - (1 - 2 * u) ** 2)), 0.55); }

  /** A point on the skin at (u, a), `lift` times its radius there. */
  surf(u, a, lift = 1) {
    const B = this.B, c = this.pinch(u) * lift, e = 2 / (B.sq || 2);
    return [0.5 - u, this.at(B.yo, u) + this.at(B.h, u) * c * sgnPow(Math.cos(a), e), this.at(B.w, u) * c * sgnPow(Math.sin(a), e)];
  }

  v(p, c, f = null, k = 0, s = 0, hint = [0, 1, 0]) {
    this.pos.push(p[0], p[1], p[2]); this.col.push(c[0], c[1], c[2], c[3] ?? 1);
    this.fin.push(f ? f[0] : 0, f ? f[1] : 0, f ? f[2] : 0, f ? f[3] : 0); this.kind.push(k, s); this.hint.push(hint[0], hint[1], hint[2]);
    return this.pos.length / 3 - 1;
  }

  tri(a, b, c) { this.idx.push(a, b, c); }

  /** The body: rings along the profile, `colourAt(u, a)` rgba per vertex, `flapAt(u, a, p)` a flutter for the skin itself (the ray's wings). */
  skin(colourAt, scales = 0, flapAt = null) {
    const B = this.B, R = B.rings || 24, S = B.sides || 16;
    const yo = (u) => this.at(B.yo, u);
    const nose = this.v([0.5, yo(0), 0], colourAt(0, Math.PI / 2), flapAt?.(0, 0, [0.5, 0, 0]), 0, 0, [1, 0, 0]);
    const rings = [];
    for (let i = 1; i < R; i++) {
      const u = 0.5 - 0.5 * Math.cos((Math.PI * i) / R), ring = []; // (closer at the ends, where the nose and the mouth are)
      for (let j = 0; j < S; j++) {
        const a = (j / S) * Math.PI * 2, p = this.surf(u, a);
        ring.push(this.v(p, colourAt(u, a), flapAt?.(u, a, p), 0, scales, [0, p[1] - yo(u), p[2]]));
      }
      rings.push(ring);
    }
    const tail = this.v([-0.5, yo(1), 0], colourAt(1, Math.PI / 2), flapAt?.(1, 0, [-0.5, 0, 0]), 0, 0, [-1, 0, 0]);
    for (let j = 0; j < S; j++) {
      const j1 = (j + 1) % S;
      this.tri(nose, rings[0][j], rings[0][j1]);
      this.tri(tail, rings[R - 2][j], rings[R - 2][j1]);
      for (let i = 0; i < R - 2; i++) { const A = rings[i][j], Bq = rings[i][j1], C = rings[i + 1][j], D = rings[i + 1][j1]; this.tri(A, C, Bq); this.tri(Bq, C, D); }
    }
  }

  /** A fin: root[i] on the body to edge[i] at its edge, both faces. o: { c0, c1 rgba (root, edge), axis [x, y, z] (its flutter's way, off its
   *  plane), amp, off (its phase), offU (phase a unit of u: a long fin's wave running down it), rays (the edge's alternate shade, 0..1) }. */
  strip(root, edge, o) {
    const ax = o.axis || [0, 0, 1], amp = o.amp ?? 0.03, rays = o.rays ?? 0.25;
    for (const side of [1, -1]) {
      const h = [ax[0] * side, ax[1] * side, ax[2] * side], R = [], E = [];
      for (let i = 0; i < root.length; i++) {
        const ph = (o.off || 0) + (o.offU || 0) * (0.5 - root[i][0]);
        const fr = [ax[0] * amp * 0.15, ax[1] * amp * 0.15, ax[2] * amp * 0.15, ph]; // (a root barely moves)
        const fe = [ax[0] * amp, ax[1] * amp, ax[2] * amp, ph + 0.6];
        const sh = i % 2 ? 1 - rays : 1, c1 = o.c1;
        R.push(this.v(root[i], o.c0, fr, 1, 0, h));
        E.push(this.v(edge[i], [c1[0] * sh, c1[1] * sh, c1[2] * sh, c1[3]], fe, 1, 0, h));
      }
      for (let i = 0; i < root.length - 1; i++) { this.tri(R[i], E[i], E[i + 1]); this.tri(R[i], E[i + 1], R[i + 1]); }
    }
  }

  /** A ball: centre c, radii r (a number or [x, y, z]), kind, colourAt(n) rgba by its outward direction, its flutter f (or none). */
  ball(c, r, kind, colourAt, f = null, w = 8, hs = 6) {
    const rr = typeof r === 'number' ? [r, r, r] : r, first = this.pos.length / 3;
    for (let i = 0; i <= hs; i++) {
      const th = (i / hs) * Math.PI;
      for (let j = 0; j < w; j++) {
        const ph = (j / w) * Math.PI * 2, n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
        this.v([c[0] + n[0] * rr[0], c[1] + n[1] * rr[1], c[2] + n[2] * rr[2]], colourAt(n), f, kind, 0, n);
      }
    }
    for (let i = 0; i < hs; i++) for (let j = 0; j < w; j++) {
      const a = first + i * w + j, b = first + i * w + ((j + 1) % w), cc = a + w, d = b + w;
      if (i > 0) this.tri(a, b, cc);
      if (i < hs - 1) this.tri(b, d, cc);
    }
  }

  /** A cone from base along dir (unit) for len, base radius r: a spine, a tooth, a scute. */
  cone(base, dir, r, len, rgba, kind = 0, sides = 4, f = null) {
    const d = new THREE.Vector3(...dir).normalize(), t = new THREE.Vector3(0, 1, 0);
    if (Math.abs(d.y) > 0.9) t.set(1, 0, 0);
    const s1 = new THREE.Vector3().crossVectors(d, t).normalize(), s2 = new THREE.Vector3().crossVectors(d, s1);
    const tip = this.v([base[0] + d.x * len, base[1] + d.y * len, base[2] + d.z * len], rgba, f, kind, 0, [d.x, d.y, d.z]);
    const ring = [];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2, o = s1.clone().multiplyScalar(Math.cos(a) * r).addScaledVector(s2, Math.sin(a) * r);
      ring.push(this.v([base[0] + o.x, base[1] + o.y, base[2] + o.z], rgba, f, kind, 0, [o.x, o.y, o.z]));
    }
    for (let j = 0; j < sides; j++) this.tri(tip, ring[j], ring[(j + 1) % sides]);
  }

  /** A rod along a polyline, radius r0 to r1: a barbel, a stalk, a whip tail. Its flutter grows along it (axis, amp, off). */
  rod(points, r0, r1, rgba, kind = 0, o = {}) {
    const sides = 4, rings = [], n = points.length, ax = o.axis || [0, 0, 1], amp = o.amp ?? 0;
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector3(...points[i]), q = new THREE.Vector3(...points[Math.min(n - 1, i + 1)]).sub(new THREE.Vector3(...points[Math.max(0, i - 1)])).normalize();
      const t = Math.abs(q.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const s1 = new THREE.Vector3().crossVectors(q, t).normalize(), s2 = new THREE.Vector3().crossVectors(q, s1);
      const k = i / Math.max(1, n - 1), r = r0 + (r1 - r0) * k, f = [ax[0] * amp * k * k, ax[1] * amp * k * k, ax[2] * amp * k * k, (o.off || 0) + k * 2];
      const ring = [];
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2, d = s1.clone().multiplyScalar(Math.cos(a)).addScaledVector(s2, Math.sin(a));
        ring.push(this.v([p.x + d.x * r, p.y + d.y * r, p.z + d.z * r], typeof rgba === 'function' ? rgba(k) : rgba, f, kind, 0, [d.x, d.y, d.z]));
      }
      rings.push(ring);
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides; this.tri(rings[i][j], rings[i + 1][j], rings[i][j1]); this.tri(rings[i][j1], rings[i + 1][j], rings[i + 1][j1]);
    }
  }

  /** The merged geometry, every triangle turned to face the way its vertices' hints point. */
  geometry() {
    const P = this.pos, H = this.hint, I = this.idx;
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), h = new THREE.Vector3();
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      e1.set(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]); e2.set(P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]);
      n.crossVectors(e1, e2);
      h.set(H[a] + H[b] + H[c], H[a + 1] + H[b + 1] + H[c + 1], H[a + 2] + H[b + 2] + H[c + 2]);
      if (n.dot(h) < 0) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 4));
    g.setAttribute('aFin', new THREE.Float32BufferAttribute(this.fin, 4));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.kind, 2));
    g.setIndex(I);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    g.boundingSphere.radius += 0.25; // (the swim's sway and the fins' flutter reach past the rest pose)
    return g;
  }
}
