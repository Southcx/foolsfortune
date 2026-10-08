// ---------------------------------------------------------------------------------------
// THE PATHS ON THE BATH AND THE LUMPS ROUND IT (docs/plans/SOUL-ALCHEMY.md 4.8 to 4.10):
//   the GHOST PATH   the hovered lump's walk drawn ahead of the soul bead, a soft ribbon 2 px wide in the colours it passes, along the
//                    curve the bead itself will glide (the same interpolation as the press's walk: hue the short way round, saturation
//                    straight, so a step at one saturation is an arc round the grey centre); it draws on over 0.25 s from where the
//                    lumps already waiting leave the bead
//   the QUEUE        the paths of the lumps circling the mouth, firmer and dimmer: the first walk brightest, each after fainter, down to a
//                    third, with a small hollow ring where each material's walk ends
//   the LINE BLEND   a droplet of glaze at every step the bead took, in the colour it had there, filled in between where the steps
//                    were far apart, so the gradient you pressed lies on the bath as a row of test tiles walked from one glaze into another
//   the LUMPS        the Pneuka Box's materials laid out on the ware ring, each in its own colour (where it pulls), its form its kind's
//                    winding (Atelier: a coil for a spiral, a toothed shard for a zigzag, a crescent for an arc, a rod for a line); a
//                    rarer one bigger, with a glint
// All of it is drawn by the marks (vfx/alchemy/marks.js: one program), the paths and droplets as quads lying on the bath, the lumps as
// four instanced shapes on the same shader; every colour is wheelColour's.
//
// Prior art: Potion Craft's previewed ingredient path, the potter's line blend (Ian Currie: test tiles walked from one glaze into
// another), the plum-blossom palette's hollows (the ware ring), the Farnsworth-Munsell 100 Hue Test (the lumps in hue order), and the
// Atelier series (a material's shape is what it does in the cauldron).
//
//   const P = new Paths(group, marks, { R })   P.ghost(trail, from) -> reveal 0..1   P.queue(trail, ends?)   P.drop(c)   P.clearDrops()
//   P.lumps([{ pos (the bath's frame), h, s, big, m: { kind } }])   P.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wheelColour } from '../wheelcolour.js';
import { RANGE, MARK } from './marks.js';
import { wheelPoint, WARE } from './basin.js';
import { KINDS } from '../../progress/econ/materials.js';

const RIB = { w: 0.056, ghostY: 0.026, queueY: 0.022, sub: 0.035 }; // (metres: a 2 px core and its soft edge at the widest view; heights over the liquid; a sub-step's length)
const DROP = { r: 0.05, y: 0.021, gap: 0.12 }; // (metres: a droplet's radius, its height, the most room left between two: beads, not a rope)
const LUMPS = 96;
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color(), _y = new THREE.Vector3(0, 1, 0);
/** The press's walk between two points of a trail (press.js `update`): hue the short way round, saturation straight. */
const lerpC = (a, b, e) => ({ h: a.h + (((((b.h - a.h) % 360) + 540) % 360) - 180) * e, s: a.s + (b.s - a.s) * e });

export class Paths {
  constructor(group, marks, { R = 2.5 } = {}) {
    this.R = R; this.marks = marks; this.nDrops = 0; this.lastDrop = null; this.gKey = ''; this.reveal = 1; this.t0 = performance.now(); this.gN = 0; this.qN = 0; this.qrN = 0;
    this.shapes = { spiral: marks.lumpMesh(coil(), LUMPS), zigzag: marks.lumpMesh(shard(), LUMPS), arc: marks.lumpMesh(crescent(), LUMPS), line: marks.lumpMesh(rod(), LUMPS) };
  }

  /** A trail as ribbon segments into a range: [{ h, s }] from `from`, `alpha(i)` per trail step; returns how many were written. */
  ribbon([i0, cap], trail, from, y, alpha, reveal = 1) {
    const pts = [];
    for (let i = from; i < trail.length - 1; i++) {
      const a = trail[i], b = trail[i + 1], pa = wheelPoint(a.h, a.s, this.R), pb = wheelPoint(b.h, b.s, this.R);
      const n = Math.max(1, Math.min(12, Math.ceil(pa.distanceTo(pb) / RIB.sub)));
      for (let k = 0; k < n; k++) pts.push({ c0: lerpC(a, b, k / n), c1: lerpC(a, b, (k + 1) / n), step: i });
    }
    const n = Math.min(cap, pts.length), stride = pts.length / Math.max(1, n);
    for (let j = 0; j < n; j++) {
      const P = pts[Math.floor(j * stride)], Q = pts[Math.min(pts.length - 1, Math.floor((j + 1) * stride) - 1)];
      const pa = wheelPoint(P.c0.h, P.c0.s, this.R), pb = wheelPoint(Q.c1.h, Q.c1.s, this.R), dx = pb.x - pa.x, dz = pb.z - pa.z, len = Math.hypot(dx, dz);
      const shown = Math.max(0, Math.min(1, reveal * n - j));
      if (len < 1e-5 || shown <= 0) { this.marks.hide(i0 + j); continue; }
      _q.setFromAxisAngle(_y, Math.atan2(-dz, dx));
      _m.compose(_p.set((pa.x + pb.x) / 2, y, (pa.z + pb.z) / 2), _q, _s.set(len / 2 + RIB.w / 2, 1, RIB.w / 2));
      this.marks.put(i0 + j, _m, MARK.ribbon, wheelColour(P.c0.h, P.c0.s, _c), wheelColour(Q.c1.h, Q.c1.s, _c2), [alpha(P.step) * shown, 0, 0]);
    }
    return n;
  }
  clear([i0], from, to) { for (let j = from; j < to; j++) this.marks.hide(i0 + j); }

  /** The hovered lump's ghost path, from step `from` of the trail (where the lumps waiting leave the bead); null: none. */
  ghost(trail, from = 0) {
    const now = performance.now(), dt = Math.min(0.1, (now - this.t0) / 1000); this.t0 = now;
    if (!trail || trail.length - from < 2) { this.clear(RANGE.ghost, 0, this.gN); this.gN = 0; this.gKey = ''; return 0; }
    const e = trail[trail.length - 1], key = `${trail.length}|${from}|${e.h.toFixed(2)}|${e.s.toFixed(3)}|${trail[from].h.toFixed(2)}`;
    if (key !== this.gKey) { if (!this.gKey) this.reveal = 0; this.gKey = key; this.drawn = -1; }
    const was = this.reveal; this.reveal = Math.min(1, this.reveal + dt / 0.25);
    if (was !== this.reveal || this.drawn !== this.reveal) {
      const n = this.ribbon(RANGE.ghost, trail, from, RIB.ghostY, () => 0.95, this.reveal);
      this.clear(RANGE.ghost, n, this.gN); this.gN = n; this.drawn = this.reveal;
    }
    return this.reveal;
  }

  /** The paths of the lumps waiting in the mouth (`ends`: the trail step where each material's walk ends, when the caller says). */
  queue(trail, ends = null) {
    if (!trail || trail.length < 2) { this.clear(RANGE.queue, 0, this.qN); this.clear(RANGE.qrings, 0, this.qrN); this.qN = this.qrN = 0; this.qKey = ''; return; }
    const key = `${trail.length}|${trail[0].h}|${trail[0].s}|${trail[trail.length - 1].h}|${trail[trail.length - 1].s}|${ends || ''}`; if (key === this.qKey) return; this.qKey = key;
    const k = ends?.length || 0, which = (step) => { if (!k) return 0; for (let i = 0; i < k; i++) if (step < ends[i]) return i; return k - 1; };
    const dim = (i) => (k > 1 ? 0.72 * (1 - (2 / 3) * (i / (k - 1))) : 0.62); // (the first walk brightest, each after fainter, down to a third)
    const n = this.ribbon(RANGE.queue, trail, 0, RIB.queueY, (step) => dim(which(step)));
    this.clear(RANGE.queue, n, this.qN); this.qN = n;
    const [r0, rc] = RANGE.qrings, m = Math.min(rc, k);
    for (let i = 0; i < m; i++) {
      const c = trail[Math.min(trail.length - 1, ends[i])]; wheelPoint(c.h, c.s, this.R, _p); _p.y = RIB.queueY + 0.004;
      _m.compose(_p, _q.identity(), _s.set(0.055, 1, 0.055)); this.marks.put(r0 + i, _m, MARK.ring, wheelColour(c.h, c.s, _c), _c, [dim(i) + 0.2, 0.3, 0]);
    }
    this.clear(RANGE.qrings, m, this.qrN); this.qrN = m;
  }

  /** The line blend: a droplet where the bead stood, in its colour then (and between, where two steps lie far apart). */
  drop(c) {
    const p = wheelPoint(c.h, c.s, this.R), L = this.lastDrop;
    const n = L ? Math.max(1, Math.min(8, Math.ceil(p.distanceTo(wheelPoint(L.h, L.s, this.R)) / DROP.gap))) : 1;
    for (let k = 1; k <= n; k++) {
      const q = L ? lerpC(L, c, k / n) : c, [i0, cap] = RANGE.drops, i = i0 + (this.nDrops++ % cap);
      wheelPoint(q.h, q.s, this.R, _p); _p.y = DROP.y; // (droplets write no depth: one laid over another is simply drawn after it)
      _m.compose(_p, _q.identity(), _s.set(DROP.r * 2, 1, DROP.r * 2)); this.marks.put(i, _m, MARK.drop, wheelColour(q.h, q.s, _c), _c, [0, 0.96, 0]);
    }
    this.lastDrop = { h: c.h, s: c.s };
  }
  clearDrops() { const [i0, cap] = RANGE.drops; for (let j = 0; j < Math.min(cap, this.nDrops); j++) this.marks.hide(i0 + j); this.nDrops = 0; this.lastDrop = null; }

  /** The lumps on the ware ring (and the one the hand carries), positions in the bath's frame. */
  lumps(list) {
    const n = { spiral: 0, zigzag: 0, arc: 0, line: 0 };
    list.forEach((L, idx) => {
      const shape = KINDS[L.m?.kind]?.shape || 'line', M = this.shapes[shape] || this.shapes.line, i = n[shape]++; if (i >= LUMPS) return;
      _p.copy(L.pos); const resting = _p.y < 0.3, sc = L.big ? 1.4 : 1;
      if (resting) _p.y = WARE.y + 0.026 * sc + Math.max(0, _p.y - 0.02) * 0.6; // (lying on the step; a heap's second layer on the first)
      const seed = (L.slot ?? idx) * 0.618 + idx * 0.13;
      _q.setFromAxisAngle(_y, -Math.atan2(_p.x, -_p.z) + (((seed * 7.31) % 1) - 0.5) * 0.9); // (along the ring, a little askew)
      _m.compose(_p, _q, _s.setScalar(sc)); M.setMatrixAt(i, _m);
      wheelColour(L.h, L.s, _c); const A = M.userData.at; A.col.setXYZ(i, _c.r, _c.g, _c.b); A.col2.setXYZ(i, _c.r, _c.g, _c.b); A.data.setXYZW(i, MARK.lump, L.big ? 1 : 0, 0, 0);
    });
    for (const [k, M] of Object.entries(this.shapes)) {
      const c = Math.min(LUMPS, n[k]); M.count = c; M.visible = c > 0; if (!c) continue;
      M.instanceMatrix.needsUpdate = true; for (const a of Object.values(M.userData.at)) a.needsUpdate = true;
    }
  }
  dispose() { for (const M of Object.values(this.shapes)) M.removeFromParent(); }
}

// ---- the lumps' four forms (about 18 cm across, lying flat; each has position, normal and uv, as the marks' quad has)
function coil() {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI * 3.4, r = 0.018 + 0.064 * t; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.021, 6, false);
}
const flat = (shape, depth) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -depth / 2); g.rotateX(-Math.PI / 2); return g; };
function shard() {
  const S = new THREE.Shape(), teeth = 5; S.moveTo(-0.09, -0.03);
  for (let i = 0; i <= teeth; i++) { const x = -0.09 + (0.18 * i) / teeth; S.lineTo(x, i % 2 ? 0.05 : 0.025); }
  S.lineTo(0.09, -0.02); S.lineTo(0.02, -0.05); S.lineTo(-0.09, -0.03);
  return flat(S, 0.04);
}
function crescent() {
  const S = new THREE.Shape(); S.absarc(0, 0, 0.085, Math.PI * 0.15, Math.PI * 1.85, false); S.absarc(0.035, 0, 0.06, Math.PI * 1.7, Math.PI * 0.3, true);
  return flat(S, 0.045);
}
function rod() { return new THREE.CylinderGeometry(0.024, 0.024, 0.19, 8).rotateZ(Math.PI / 2); }
