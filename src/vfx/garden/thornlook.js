// ---------------------------------------------------------------------------------------
// THE THORN LOOK: a bramble patch's clump, drawn (GARDEN-COZY.md A4 and H6; the rules are Dovina's, progress/harmony.js and
// world/garden/thornpatches.js, which place one clump a thorn and prune it). A clump is a fistful of arching canes, tapered from a
// stout foot to a hair, each curled at its tip like a fiddlehead, set along its length with small hooked thorns that lean back toward
// the foot, with a few dead leaves hanging from the canes. Three sizes (young, grown, old: more canes, taller, longer), so a patch of
// several reads as one bramble and not one stamp. Olive and rust are VERTEX colours (a cane olive at its foot going rust at its curl,
// the thorns rust, the leaves dead tan): the clumps share the decor layer's one material, which reads a `color` attribute
// (vertexColors on; a geometry without one draws black, measured 2026-10-22), and so its one program; the instance colour on top is
// a near-white tint. A sway in the vertex shader would need that material patched, which would change every decor piece, so there is
// none. No draw call and no program added. Built once at boot; nothing here runs per frame.
//
// Prior art: Sleeping Beauty's briar wall (the cane that arches and curls), Hollow Knight's Queen's Gardens thorns (thorns hooked
// back, a dark mass with a few bright points), Ori's thornfen vines, Animal Crossing's weeds (readable at a glance from a hop away).
//
//   thornClumps() -> [young, grown, old]   three BufferGeometry (non-indexed: position, normal, color, tintk 1, glowk 0), about 0.5 to 1.6 m tall, foot at 0,0,0
//   THORN_LOOK   the numbers: canes, height, length of a cane a size
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** A size's numbers: how many canes, how tall one stands (m), the length of its run, the foot's radius (m). */
export const THORN_LOOK = {
  sizes: [{ canes: 5, h: 0.75, len: 1.0, foot: 0.05 }, { canes: 7, h: 1.05, len: 1.4, foot: 0.065 }, { canes: 9, h: 1.4, len: 1.9, foot: 0.08 }],
  sides: 5, steps: 10, hooksEvery: 1, leafSize: 0.16,
};

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }; // (vertex colours are linear: the hexes below are the sRGB ones you see)
const COL = { footOlive: lin(0x4a4a22), midOlive: lin(0x6a6a2c), tipRust: lin(0x8c4a22), footRust: lin(0x5a3418), midRust: lin(0x7a4222), hook: lin(0x9a5a2c), leaf: [lin(0x9a6a30), lin(0x7a4a24), lin(0x6a6430)] };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _bn = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** One cane: a turtle that rises, arches over under its own weight and curls at the tip. Returns points [{ p, r, t }]. */
function cane(rnd, size, yaw, startR) {
  const S = THORN_LOOK.steps, pts = [], dir = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw)), side = new THREE.Vector3(-dir.z, 0, dir.x);
  const p = new THREE.Vector3(Math.cos(yaw) * startR, 0, Math.sin(yaw) * startR), step = size.len / S;
  let pitch = 1.15 + rnd() * 0.3, curl = (rnd() < 0.5 ? -1 : 1), bend = 0.22 + rnd() * 0.12; // (pitch above the ground, rad; curl: the tip's twist to one side)
  const bias = size.h / size.len;
  for (let i = 0; i <= S; i++) {
    const t = i / S, tip = Math.max(0, (t - 0.72) / 0.28);
    pts.push({ p: p.clone(), r: size.foot * (1 - t * 0.9) + 0.008, t });
    pitch -= bend * (0.5 + t) * (1 + 1.4 * tip * tip) * (0.9 / (0.5 + bias)); // (it arches, then the tip rolls under)
    _a.copy(dir).multiplyScalar(Math.cos(pitch)).addScaledVector(_u, Math.sin(pitch)).addScaledVector(side, curl * tip * 0.9).normalize();
    p.addScaledVector(_a, step * (1 - 0.35 * tip));
  }
  return pts;
}

/** A tube along points, tapered; pushes triangles into pos and nor (flat arrays). */
function tube(pts, pos, nor, col, rusty) {
  const N = THORN_LOOK.sides, rings = [], norms = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(pts.length - 1, i + 1)].p; _t.subVectors(b, a).normalize();
    _n.crossVectors(_t, Math.abs(_t.y) > 0.95 ? _a.set(1, 0, 0) : _u).normalize(); _bn.crossVectors(_t, _n).normalize();
    const ring = [], nr = [];
    for (let k = 0; k < N; k++) { const th = (k / N) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th); const d = new THREE.Vector3().addScaledVector(_n, c).addScaledVector(_bn, s); nr.push(d); ring.push(pts[i].p.clone().addScaledVector(d, pts[i].r)); }
    rings.push(ring); norms.push(nr);
  }
  const colAt = (i) => { const t = i / (pts.length - 1), f = rusty ? COL.footRust : COL.footOlive, m = rusty ? COL.midRust : COL.midOlive; return t < 0.55 ? mix3(f, m, t / 0.55) : mix3(m, COL.tipRust, (t - 0.55) / 0.45); };
  const push = (v, n, i) => { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); col.push(...colAt(i)); };
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < N; k++) {
    const k2 = (k + 1) % N;
    push(rings[i][k], norms[i][k], i); push(rings[i][k2], norms[i][k2], i); push(rings[i + 1][k], norms[i + 1][k], i + 1); // (wound to face outward: the frame turns counter-clockwise about the tangent)
    push(rings[i][k2], norms[i][k2], i); push(rings[i + 1][k2], norms[i + 1][k2], i + 1); push(rings[i + 1][k], norms[i + 1][k], i + 1);
  }
}

/** A hooked thorn: a three-sided cone from the cane's skin, leaning out and back toward the foot, its point bent down. */
function thorn(at, out, back, len, r, pos, nor, col) {
  const base = [], ang = [0, 2.094, 4.189]; _a.crossVectors(out, back).normalize();
  for (const th of ang) base.push(at.clone().addScaledVector(back, Math.cos(th) * r).addScaledVector(_a, Math.sin(th) * r));
  const mid = at.clone().addScaledVector(out, len * 0.55).addScaledVector(back, len * 0.05), tipP = at.clone().addScaledVector(out, len * 0.8).addScaledVector(back, len * 0.5); // (the hook: out, then back)
  const heart = at.clone().addScaledVector(out, len * 0.3); // (a face turns to look away from the thorn's own axis)
  const tri = (p, q, s) => { _b.subVectors(q, p); _t.subVectors(s, p); const nn = _b.cross(_t).normalize(); if (nn.dot(_n.copy(p).add(q).add(s).multiplyScalar(1 / 3).sub(heart)) < 0) { nn.negate(); [q, s] = [s, q]; } for (const v of [p, q, s]) { pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); col.push(...COL.hook); } };
  const mb = base.map((b) => b.clone().lerp(mid, 0.55));
  for (let k = 0; k < 3; k++) { const k2 = (k + 1) % 3; tri(base[k], base[k2], mb[k]); tri(mb[k], base[k2], mb[k2]); tri(mb[k], mb[k2], tipP); }
}

/** A dead leaf: a drooping lozenge on a short stalk off the cane. */
function leaf(at, out, size, pos, nor, col, tint) {
  const side = _a.crossVectors(out, _u).normalize().clone(), tipP = at.clone().addScaledVector(out, size).addScaledVector(_u, -size * 0.55);
  const m = at.clone().addScaledVector(out, size * 0.45).addScaledVector(_u, -size * 0.1), l = m.clone().addScaledVector(side, size * 0.32), r = m.clone().addScaledVector(side, -size * 0.32);
  const tri = (p, q, s) => { _b.subVectors(q, p); _t.subVectors(s, p); const nn = _b.cross(_t).normalize(); for (const v of [p, q, s]) { pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); col.push(...COL.leaf[tint % 3]); } };
  tri(at, l, r); tri(l, tipP, r); tri(r, tipP, l); tri(r, l, at); // (both faces, so the clump is lit from either side)
}

function clump(size, seed) {
  const rnd = rng(seed), pos = [], nor = [], col = [], S = THORN_LOOK.steps;
  for (let c = 0; c < size.canes; c++) {
    const yaw = (c / size.canes) * Math.PI * 2 + rnd() * 0.6, sz = { ...size, len: size.len * (0.7 + rnd() * 0.5) }, pts = cane(rnd, sz, yaw, 0.04 + rnd() * 0.08);
    tube(pts, pos, nor, col, c % 3 === 0);
    for (let i = 1; i < pts.length - 1; i += THORN_LOOK.hooksEvery) {
      _t.subVectors(pts[i + 1].p, pts[i - 1].p).normalize(); _n.crossVectors(_t, _u).normalize(); if (_n.lengthSq() < 0.1) _n.set(1, 0, 0);
      for (const a of [rnd() * 6.28, rnd() * 6.28]) { const out = _a.copy(_n).applyAxisAngle(_t, a).clone(), back = _t.clone().multiplyScalar(-1); thorn(pts[i].p, out, back, 0.1 * (1 - pts[i].t * 0.5), 0.022 * (1 - pts[i].t * 0.5), pos, nor, col); }
    }
    if (c % 2 === 0) { const i = 3 + Math.floor(rnd() * (S - 6)); _t.subVectors(pts[i + 1].p, pts[i - 1].p).normalize(); _n.crossVectors(_t, _u).normalize(); const out = _n.clone().applyAxisAngle(_t, rnd() * 6.28); leaf(pts[i].p, out, THORN_LOOK.leafSize * (0.8 + rnd() * 0.5), pos, nor, col, c); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const n = pos.length / 3; g.setAttribute('tintk', new THREE.Float32BufferAttribute(new Float32Array(n).fill(1), 1)); g.setAttribute('glowk', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); // (the decor material's: the patch's grade tints it all, no lamp)
  g.computeBoundingSphere(); return g;
}

/** The three clump geometries: young, grown, old (non-indexed: position, normal and the vertex colour the decor material reads). */
export function thornClumps() { return THORN_LOOK.sizes.map((s, i) => clump(s, 71 + i * 13)); }
