// ---------------------------------------------------------------------------------------
// THE GRIND'S BALANCE MARK (docs/plans/SKIFF-RACING.md section 10; the owner by name, via Dovina's handoff of 2026-10-14): the grind's
// balance (courier/skiff/grind.js `lean`, -1..1, past 1 the board drops off that side, + the right) read at a glance off the board itself,
// with no words and no numbers. Worn by the Solar Skiff just aft of its stern, standing up on the board's up over the banked flares'
// suns (vfx/skiffcombomarks.js), facing the chase camera; shown only while the keel grinds, faded in and out.
//   - THE ARC: a gauge over the top like a protractor's, 140 degrees across: its middle the labradorite's play (ink, the oil film's
//     colours flashing up through it: vfx/oxidation.js schillerInk; the owner, v204, "too blue"), its two ends a warm ember
//     brightening toward each tip (the side it falls off), so the danger sits where the needle would go.
//   - THE NEEDLE: a slim diamond from the arc's hub, tilted by the lean (+ to the board's right); it warms toward the ember as it nears
//     an end, and the ends brighten as it does. A coaster rail's drift never grows (grind.js), so there it is the same mark.
//   - ON A COASTER RAIL (grind.R.coaster: the board banked and round loops, upside down at the top; the owner, v204, "hard to keep
//     track of"): the mark is hung from the camera's view instead, its hub above the stern by the screen's up and its face square to
//     the lens, so it never flips or turns away; it eases over in PIN real seconds' damping. The lean is still the board's (A / D
//     answer it the same way), so the needle never reverses. On a plain rail it rides the board as before.
// Two meshes, two draw calls: the calm (the arc's middle, the top tick, the hub, the needle) and the ends, each one colour and its
// brightness read off the glow atlas's gradient by u (vfx/racewaylooks.js glowAtlas), so their material is the combo's marks' own
// (vfx/skiffcombomarks.js: the mapped basic, blended over, depth not written): no program added. Only the needle's six vertices are
// written each frame.
//
// Prior art: Tony Hawk's Pro Skater's balance meter (an arrow swinging over the skater, the ends the fall; it stays screen-up through
// a loop, which the coaster pin takes), the spirit level and the
// aircraft's turn-and-slip ball (a needle off its middle), Splatoon's ink tank and Dead Space's spine (a gauge worn on the body, not the
// screen); the combo's marks (vfx/skiffcombomarks.js) for the way a mark is drawn on the board.
//
//   const M = new GrindBalanceMark({ map })   M.attach(group)   M.update(dt, grind, { t, camera })   M.dispose()   GRIND_BALANCE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schillerInk, SCHILLER } from './oxidation.js';

/** The numbers, in the board's own frame (+Z the bow, Y up, +X the board's left; m and rad): where the arc's hub stands (z aft, y up),
 *  its radius and band, its half-sweep (rad from the top), its segments, where the ends begin (share of the half-sweep); the needle's
 *  length (share of the radius) and width; the top tick; brightness of the calm and the ends (low, high); the lean shown at most; the
 *  ember's colour and where the warming starts and is whole (|lean|); how fast it fades in and out; the schiller's least and most; the
 *  coaster pin's damping (a real second). */
export const GRIND_BALANCE = {
  at: { z: -2.15, y: 0.75 }, // (its hub over the banked flares' middle sun)
  arc: { r: 1.05, w: 0.11, sweep: 1.22, segs: 28, ends: 0.62 },
  needle: { len: 0.96, w: 0.07 },
  tick: 0.16,
  lit: { calm: 0.55, needle: 0.95, endLo: 0.35, endHi: 0.95 },
  showMax: 1.12,
  ember: 0xff5a2a, warm: [0.45, 0.95],
  fade: { in: 14, out: 6 },
  schiller: { floor: 0.42, sheen: 0.95 },
  pin: 8,
};

// the glow atlas's gradient (its left half, alpha by u): the u that gives a brightness (as vfx/skiffcombomarks.js)
const GRAD = [[0, 0.95], [0.145, 0.5], [0.3145, 0.15], [0.484, 0]];
function uOf(b) {
  const a = Math.max(0, Math.min(1, b)) * 0.95;
  for (let i = 1; i < GRAD.length; i++) {
    const [u0, a0] = GRAD[i - 1], [u1, a1] = GRAD[i];
    if (a >= a1) return u0 + (u1 - u0) * ((a0 - a) / Math.max(1e-6, a0 - a1));
  }
  return GRAD[GRAD.length - 1][0];
}
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const EMBER = new THREE.Color(GRIND_BALANCE.ember);
const _q = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _p = new THREE.Vector3(), _u = new THREE.Vector3(), _h = new THREE.Vector3();
const FLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // (the mark faces -Z: turned to face the lens)

/** A point on the gauge at angle a from the top (+ toward the board's right, which is -X) and radius r, in the board's frame. */
const onArc = (a, r) => [-Math.sin(a) * r, GRIND_BALANCE.at.y + Math.cos(a) * r];

/** A mesh's geometry from flat triangles [[x, y, b] x3] in the plane z = at.z, each wound to face aft (the camera behind). */
function geometry(tris, dynamic) {
  const z = GRIND_BALANCE.at.z, pos = [], uv = [];
  for (let t of tris) {
    const [a, b, c] = t, nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (nz > 0) t = [a, c, b]; // (its normal toward -Z: seen from behind the stern)
    for (const p of t) { pos.push(p[0], p[1], z); uv.push(uOf(p[2]), 0.5); }
  }
  const g = new THREE.BufferGeometry();
  const P = new THREE.Float32BufferAttribute(pos, 3); if (dynamic) P.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', P); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
/** The arc's band from a0 to a1 (rad), split in n, a soft edge each side; its brightness by `k(a)`. */
function band(tris, a0, a1, n, k) {
  const A = GRIND_BALANCE.arc, r0 = A.r - A.w / 2, r1 = A.r + A.w / 2;
  for (let j = 0; j < n; j++) {
    const b0 = a0 + ((a1 - a0) * j) / n, b1 = a0 + ((a1 - a0) * (j + 1)) / n, k0 = k(b0), k1 = k(b1);
    for (const [ra, rb, wa, wb] of [[r0, A.r, 0.35, 1], [A.r, r1, 1, 0.35]]) {
      const p0 = [...onArc(b0, ra), k0 * wa], p1 = [...onArc(b1, ra), k1 * wa], q0 = [...onArc(b0, rb), k0 * wb], q1 = [...onArc(b1, rb), k1 * wb];
      tris.push([p0, p1, q1], [p0, q1, q0]);
    }
  }
}

export class GrindBalanceMark {
  /** `map`: the glow atlas (vfx/racewaylooks.js), so both materials are the combo's marks' program. */
  constructor({ map }) {
    const G = GRIND_BALANCE, A = G.arc, edge = A.sweep * A.ends, L = G.lit;
    // the calm: the arc's middle, a tick at the top, the hub; the needle last (its six vertices rewritten each frame)
    const calm = [];
    band(calm, -edge, edge, Math.round(A.segs * A.ends), () => L.calm);
    { const [x0, y0] = onArc(0, A.r + A.w / 2 + 0.02), [x1, y1] = onArc(0, A.r + A.w / 2 + G.tick), s = 0.06;
      calm.push([[x0 - s, y0, L.needle], [x0 + s, y0, L.needle], [x1, y1, L.needle * 0.5]]); }
    for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2, h = 0.09, [cx, cy] = [0, G.at.y];
      calm.push([[cx, cy, L.needle], [cx + Math.cos(a0) * h, cy + Math.sin(a0) * h, L.needle * 0.7], [cx + Math.cos(a1) * h, cy + Math.sin(a1) * h, L.needle * 0.7]]); }
    this.needle0 = calm.length;
    for (let k = 0; k < 2; k++) calm.push([[0, 0, L.needle], [0, 0, L.needle], [0, 0, L.needle]]);
    // the ends: from where the calm stops to each tip, brighter toward the tip, a little barb pointing off it (the fall)
    const ends = [], endK = (a) => L.endLo + (L.endHi - L.endLo) * smooth(edge, A.sweep, Math.abs(a));
    const n = Math.round(A.segs * (1 - A.ends));
    band(ends, edge, A.sweep, n, endK); band(ends, -A.sweep, -edge, n, endK);
    for (const sg of [-1, 1]) { const a = sg * A.sweep, [ix, iy] = onArc(a, A.r - A.w), [ox, oy] = onArc(a, A.r + A.w), [tx, ty] = onArc(a + sg * 0.12, A.r);
      ends.push([[ix, iy, L.endHi], [ox, oy, L.endHi], [tx, ty, L.endHi * 0.6]]); }
    const mat = (name) => new THREE.MeshBasicMaterial({ name, map, color: SCHILLER.ink, transparent: true, depthWrite: false });
    this.calmMat = mat('grind-balance-calm'); this.endMat = mat('grind-balance-ends'); this.endMat.color.copy(EMBER);
    this.calm = new THREE.Mesh(geometry(calm, true), this.calmMat); this.ends = new THREE.Mesh(geometry(ends, false), this.endMat);
    this.calm.name = 'grind-balance-calm'; this.ends.name = 'grind-balance-ends';
    for (const m of [this.calm, this.ends]) { m.frustumCulled = false; m.renderOrder = 5; m.visible = false; }
    this.show = 0; this.lean = 0; this.pinK = 0;
  }
  /** Worn by a board (its group: the mark rides it, in its frame). */
  attach(group) { for (const m of [this.calm, this.ends]) if (m.parent !== group) { m.parent?.remove(m); group?.add(m); } }

  /** Each frame: `grind` the skiff's Grind (grind.js: on, lean, R) or null; `t` real seconds (the schiller's walk); `camera` the view
   *  (on a coaster rail the mark hangs from it). */
  update(dt, grind, { t = 0, camera = null } = {}) {
    const G = GRIND_BALANCE, on = !!grind?.on;
    this.show = damp(this.show, on ? 1 : 0, on ? G.fade.in : G.fade.out, dt);
    const vis = this.show > 0.01 && !!this.calm.parent;
    this.calm.visible = this.ends.visible = vis;
    if (!vis) return;
    if (on) this.lean = damp(this.lean, Math.max(-G.showMax, Math.min(G.showMax, grind.lean || 0)), 30, dt); // (held where it was as it fades)
    const k = smooth(G.warm[0], G.warm[1], Math.abs(this.lean));
    // the needle: two triangles, hub to tip, tilted by the lean
    const a = this.lean * G.arc.sweep, [tx, ty] = onArc(a, G.arc.r * G.needle.len), cx = 0, cy = G.at.y, w = G.needle.w;
    const sx = Math.cos(a) * w, sy = Math.sin(a) * w, mx = cx + (tx - cx) * 0.22, my = cy + (ty - cy) * 0.22; // (its widest a fifth of the way out)
    const P = this.calm.geometry.attributes.position, o = this.needle0 * 3, z = G.at.z;
    const set = (i, x, y) => P.setXYZ(o + i, x, y, z);
    // (wound to face aft: hub, tip, side as the arc's are)
    set(0, cx, cy); set(1, mx + sx, my - sy); set(2, tx, ty);
    set(3, cx, cy); set(4, tx, ty); set(5, mx - sx, my + sy);
    for (const t of [0, 3]) { const i = o + t, ax = P.getX(i), ay = P.getY(i), bx = P.getX(i + 1), by = P.getY(i + 1), qx = P.getX(i + 2), qy = P.getY(i + 2);
      if ((bx - ax) * (qy - ay) - (by - ay) * (qx - ax) > 0) { P.setXYZ(i + 1, qx, qy, z); P.setXYZ(i + 2, bx, by, z); } }
    P.needsUpdate = true;
    // the colour: the calm is the labradorite's play, warming toward the ember as the needle nears an end; the ends brighten with it
    schillerInk(t * SCHILLER.rate, this.calmMat.color, G.schiller).lerp(EMBER, k * 0.85);
    this.calmMat.opacity = this.show;
    this.endMat.opacity = this.show * (0.55 + 0.45 * k);
    this.pin(dt, on && !!grind.R?.coaster, camera);
  }
  /** On a coaster rail: both meshes turned (in the board's frame) so the mark faces the lens with the screen's up, its hub held over
   *  the stern by that up; eased in and out by pinK. Off one, back to the board's own frame. */
  pin(dt, coaster, camera) {
    this.pinK = damp(this.pinK, coaster && camera ? 1 : 0, GRIND_BALANCE.pin, dt);
    const group = this.calm.parent;
    if (this.pinK < 0.002 || !group || !camera) { if (this.pinned) { for (const m of [this.calm, this.ends]) { m.position.set(0, 0, 0); m.quaternion.identity(); } this.pinned = false; } return; }
    this.pinned = true;
    const A = GRIND_BALANCE.at;
    group.updateWorldMatrix(true, false);
    const inv = group.getWorldQuaternion(_qb).invert(), cam = camera.getWorldQuaternion(_qc);
    _qp.copy(inv).multiply(cam).multiply(FLIP).normalize(); // (the lens's turn, in the board's frame)
    _q.slerpQuaternions(_qi, _qp, this.pinK);
    // the hub: on a plain rail at (0, at.y, at.z); pinned, at (0, 0, at.z) plus the screen's up by at.y (into the board's frame)
    _u.set(0, 1, 0).applyQuaternion(cam).applyQuaternion(inv);
    _h.set(0, A.y, A.z).lerp(_p.set(_u.x * A.y, _u.y * A.y, A.z + _u.z * A.y), this.pinK);
    _p.set(0, A.y, A.z).applyQuaternion(_q); // (the mesh turned about the board's origin: its hub put back where it belongs)
    for (const m of [this.calm, this.ends]) { m.quaternion.copy(_q); m.position.copy(_h).sub(_p); }
  }
  dispose() { for (const m of [this.calm, this.ends]) { m.parent?.remove(m); m.geometry.dispose(); } this.calmMat.dispose(); this.endMat.dispose(); }
}
