// ---------------------------------------------------------------------------------------
// THE EMBER'S CRAZING (the duel's view: vfx/duelview.js): before a cooling ember (Dread's junk, `ember.cool`) turns over into its gem,
// its coal crazes like a glaze cooling out of the kiln: the crackle break's look (vfx/crackbreak.js) laid on the coal's face, in guan
// ware's two nets: the IRON WIRE (a few bold dark cracks running from one point out to the rim and joined into cells) and the GOLDEN
// THREAD (the fine net between them, here the heat still showing through, ember-gold). The cracks grow along their length from where
// they start, the wire first and the thread after, then the coal turns (beats.js) and the net goes with its face.
// Drawn as instances of one unit quad in the pieces' unlit glow (the orbs' and the pips' program: no program of its own); the nets
// are made once each, three of them, a coal picking its own by its seed.
//
// Prior art: guan and ge ware's jinsi tiexian, "gold thread and iron wire" (the Song kilns: the crackle opens as the glaze cools and
// shrinks faster than the body), the crackle break's shell (.hack//Infection's Protect Break, ours in glaze), and the aberrant wipe's
// two nets on the held frame (vfx/aberrantwipe.js), here on a single coal.
//
//   crazeNet(seed) -> [{ ax, ay, bx, by, w, at, gold }]   (the coal's face in its own units: x across, y up, starting at `at` of 0..1)
//   drawCrazing(mesh, n, v, centre, q, size, t) -> n   (a coal's net into the instanced mesh from index n, its growth `v.craze` 0..1)
//   CRAZE (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hash } from './layout.js';

export const CRAZE = {
  rx: 0.33, ry: 0.29, face: 0.236, // (the coal's face in its geometry's units: emberGeometry is 0.38 across, 0.88 of it tall, 0.6 of it deep)
  wire: 0.034, thread: 0.014,      // (the cracks' widths)
  grow: 0.4,                       // (the share of the growth one crack takes to run its length)
};
const IRON = new THREE.Color(0x140c08), GOLD = new THREE.Color(0xffb54a);
const NETS = [];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _z = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const Z = new THREE.Vector3(0, 0, 1);

/** One coal's crackle: four wires out from a point near the middle, each in three jittered steps to the rim, joined by short wires into
 *  cells; the thread branching off the wires' middles. The same for the same seed. */
function makeNet(k) {
  const R = (i) => hash(k * 17.3 + i, k * 3.1 + i * 0.7), out = [], { rx, ry } = CRAZE;
  const ox = (R(1) - 0.5) * 0.12, oy = (R(2) - 0.5) * 0.1, arms = [];
  for (let a = 0; a < 4; a++) {
    const ang = (a / 4) * Math.PI * 2 + (R(10 + a) - 0.5) * 0.9, pts = [[ox, oy]];
    for (let s = 1; s <= 3; s++) { const f = s / 3, j = (R(20 + a * 3 + s) - 0.5) * 0.5 * (s < 3 ? 1 : 0.3); pts.push([ox + Math.cos(ang + j) * rx * f, oy + Math.sin(ang + j) * ry * f]); }
    arms.push(pts);
    for (let s = 0; s < 3; s++) out.push({ ax: pts[s][0], ay: pts[s][1], bx: pts[s + 1][0], by: pts[s + 1][1], w: CRAZE.wire * (1 - s * 0.2), at: s * 0.12, gold: false });
  }
  for (let a = 0; a < 4; a++) { const A = arms[a][2], B = arms[(a + 1) % 4][2]; if (R(40 + a) < 0.75) out.push({ ax: A[0], ay: A[1], bx: (A[0] + B[0]) * 0.55, by: (A[1] + B[1]) * 0.55, w: CRAZE.wire * 0.7, at: 0.3, gold: false }); }
  for (let i = 0; i < 9; i++) {
    const arm = arms[i % 4], s = 1 + (i % 2), m = [(arm[s][0] + arm[s + 1][0]) / 2, (arm[s][1] + arm[s + 1][1]) / 2], ang = R(60 + i) * Math.PI * 2, L = 0.05 + R(70 + i) * 0.07;
    out.push({ ax: m[0], ay: m[1], bx: m[0] + Math.cos(ang) * L, by: m[1] + Math.sin(ang) * L * 0.9, w: CRAZE.thread, at: 0.38 + R(80 + i) * 0.22, gold: true });
  }
  return out;
}

export function crazeNet(seed) { const k = Math.floor((seed || 0) * 3) % 3; return (NETS[k] ||= makeNet(k + 1)); }

/** A coal's net, drawn: each crack a quad from its start, as long as the growth has run it, on the coal's face turned with it. */
export function drawCrazing(mesh, n, v, centre, q, size, t = 0) {
  const g = v.craze || 0; if (g <= 0) return n;
  const cap = mesh.instanceMatrix.count, heat = 0.75 + 0.25 * Math.sin(t * 9 + v.seed * 5);
  for (const c of crazeNet(v.seed)) {
    if (n >= cap) break;
    const f = Math.min(1, Math.max(0, (g - c.at) / CRAZE.grow)); if (f <= 0) continue;
    const dx = c.bx - c.ax, dy = c.by - c.ay, L = Math.hypot(dx, dy) * f;
    _p.set(c.ax + (dx * f) / 2, c.ay + (dy * f) / 2, CRAZE.face).multiplyScalar(size).applyQuaternion(q).add(centre);
    _q.copy(q).multiply(_z.setFromAxisAngle(Z, Math.atan2(dy, dx)));
    mesh.setMatrixAt(n, _m.compose(_p, _q, _s.set(Math.max(1e-4, L * size), c.w * size, 1)));
    mesh.setColorAt(n++, c.gold ? _c.copy(GOLD).multiplyScalar(1.2 * heat) : IRON);
  }
  return n;
}
