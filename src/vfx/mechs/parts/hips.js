// ---------------------------------------------------------------------------------------
// A MECH'S HIP PIECE (plain name; South, 2026-11-02: "Fold in the Drossel model into the Haydee model as modular pieces, the skirts
// being like hip pauldrons"): armour hung from a belt round the pelvis as a pauldron hangs from the shoulder, chosen apart from the parts
// (the mech's style, slot `hip`; the parts body's setHip), worn on any form and any legs. Each plate is its own hinge (a joint
// `hipPlate<n>` under the belt's `hipBelt`, +Z out of the body, -Y down the plate) on a damped spring: the thighs (any leg type's
// upper and lower segments, measured each frame) push the plates they would pass through outward, so a stride parts them and they
// swing back after, and a plate never sits inside the pelvis it hangs over (its rest tilt measured from the pelvis's own surface).
//   crinoline  Drossel's: twelve bell plates, open at the front, two ruffled tiers and a ruffled, gilt hem, the petticoat under them,
//              a waistband with a bustle and its bow behind
//   tassets    a knight's: two great tassets over the thighs and two smaller at the hips, each of four lames, riveted in gold, under a
//              fauld of two lames round the belt
//   kusazuri   the samurai's: seven laced skirt plates all round, each five rows of lamellar, laced in gold, its foot edged
//   pteruges   the Roman's: sixteen leather straps all round, studded, a gilt tip and a fringe at each foot
// Built in the parts body's programs: the plates in the porcelain (the body glaze) or the trim, gold on the edges and studs.
// Prior art: Drossel von Flügel of Fireball (Jinni's Animation Studios for Disney Japan, 2008: the robot duchess's crinoline of plates);
// the Victorian crinoline and bustle; the tasset and fauld of the Gothic and Maximilian harness, and Henry VIII's tonlet (the
// Greenwich foot-combat skirt of lames, 1520); the kusazuri of the ō-yoroi and the tōsei gusoku; the pteruges of the Roman lorica
// and the Greek linothorax; the pauldrons' hang off the shoulder (parts/pauldrons.js); secondary motion as a damped spring (the
// chest plates, partsbody.js BUST_SPRING) with collision by projection (Jakobsen, 2001).
//
//   HIPS[id] = { label, n, splay?, ... }   HIP_SWING   HIP_FIT   wearHip(body, id | null) -> { update(dt), dispose(), plates, splay } | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, curved } from './kit.js';

const PI = Math.PI;
/** The plates' spring (rad, s): its stiffness toward the rest tilt and its damping (underdamped: a swing back past rest), the margin
 *  kept off a thigh or the pelvis (m), the most a plate opens (rad), and the segments' radius at their far end against their root's. */
export const HIP_SWING = { stiffness: 60, damping: 5.5, margin: 0.12, max: 1.35, taper: 0.5, samples: 6 };
/** A plate's fit on any leg type (2026-11-02, South's last look: on the tetrapod they lay flat, on the treads they hid): the most a plate
 *  may lie open at rest (rad) before it is hung shorter, the shortest share of its length it is hung at, a tank's farthingale (its
 *  hoop `hoopLift` m over the pods' tops and `hoopPad` m clear of their sides, rounded out to take their corners in, at most x `hoopRound`), and a tetrapod's belt (`lowAt`, a share of the pelvis's
 *  height from its foot, under the leg roots, its hoop clearing what of the legs stands within `lowBand` m of it). */
export const HIP_FIT = { fit: 0.85, short: 0.4, hoopLift: 0.15, hoopPad: 0.3, lowAt: 0.08, lowBand: 0.7, hoopRound: 1.2 };

/** The hip pieces: where the belt sits (`at`: the share of the pelvis's height from its foot), the plates (`n` round, `skip` those
 *  within that angle of the front, `wide` the share of their slot a plate fills, or `w` m each), their length (m), their outward
 *  profile (`prof`: [out m, depth m] down the plate at rest), thickness, their own kick at rest (rad), and how each is built. */
export const HIPS = {
  crinoline: { label: "Drossel's crinoline", splay: 0.2, at: 0.72, n: 12, skip: 0.62, wide: 0.94, len: 2.4, th: 0.07, kick: 0.04,
    prof: [[0, 0], [0.16, 0.25], [0.5, 0.75], [0.9, 1.4], [1.14, 2.0], [1.22, 2.4]] },
  tassets: { label: "Knight's tassets", at: 0.7, n: 4, at4: [0.5, 1.3], w: [1.35, 0.95], len: 1.9, th: 0.09, kick: 0.06,
    prof: [[0, 0], [0.1, 0.5], [0.22, 1.2], [0.3, 1.9]] },
  kusazuri: { label: 'Kusazuri', at: 0.7, n: 7, skip: 0, wide: 0.97, len: 1.75, th: 0.08, kick: 0.05,
    prof: [[0, 0], [0.12, 0.6], [0.3, 1.2], [0.42, 1.75]] },
  pteruges: { label: 'Pteruges', at: 0.72, n: 16, skip: 0, wide: 0.78, len: 1.55, th: 0.06, kick: 0.02,
    prof: [[0, 0], [0.05, 0.6], [0.1, 1.55]] },
};

const at = (prof, d) => { for (let i = 1; i < prof.length; i++) { const [o0, d0] = prof[i - 1], [o1, d1] = prof[i]; if (d <= d1 || i === prof.length - 1) return o0 + ((o1 - o0) * Math.min(1, Math.max(0, (d - d0) / (d1 - d0 || 1)))); } return 0; };
/** A plate's face curved round the belt: `prof` ([out, depth]) bent about an axis Rc behind the hinge, between -half and half m wide. */
function face(P, prof, Rc, hw, th, c, d0 = 0, d1 = Infinity, dOut = 0) {
  const e = Math.min(d1, prof[prof.length - 1][1]), rows = [[at(prof, d0), d0], ...prof.filter(([, d]) => d > d0 + 1e-3 && d < e - 1e-3), [at(prof, e), e]];
  const half = hw / Rc, g = curved(rows.map(([o, d]) => [Rc + o + dOut, -d]), th, -half, half, 10).translate(0, 0, -Rc);
  P.geo(g, { c });
}
/** A gold band along a plate's face at depth d (a hem, a lame's edge), `h` tall. */
const hem = (S, pl, d, h, out = 0.02) => face(S.g, pl.spec.prof, pl.Rc, pl.hw * 1.01, 0.04, L.gold, d - h, d, out + pl.spec.th * 0.5);

const BUILD = {
  crinoline(S, pl, i) {
    const { spec: H, Rc, hw } = pl;
    face(S.p, H.prof, Rc, hw, H.th, i % 2 ? L.pale : L.mid);
    face(S.core, H.prof.map(([o, d]) => [o - 0.06, d]), Rc, hw * 1.04, 0.04, L.coreD, 0.1); // (the petticoat)
    for (const d of [0.8, 1.55]) face(S.trim, H.prof, Rc, hw * 1.02, 0.08, L.trimM, d - 0.16, d, H.th + 0.02); // (the ruffled tiers)
    face(S.trim, H.prof, Rc, hw * 1.03, 0.08, L.trimL, H.len - 0.2, H.len, H.th + 0.04); hem(S, pl, H.len, 0.06, 0.1); // (the hem's ruffle, gilt)
  },
  tassets(S, pl, i) {
    const { spec: H, Rc, hw } = pl, n = 4, step = H.len / n;
    for (let k = 0; k < n; k++) { // (four lames, each lapping over the one under it)
      const d0 = k * step, d1 = Math.min(H.len, d0 + step * 1.15), w = hw * (1 - k * 0.04);
      face(S.trim, H.prof, Rc, w, H.th, k % 2 ? L.trimM : L.trimL, d0, d1, k * 0.05);
      face(S.g, H.prof, Rc, w * 1.01, 0.035, L.gold, d1 - 0.05, d1, k * 0.05 + H.th * 0.6);
      for (const x of [-1, 1]) { const d = d0 + step * 0.5, o = at(H.prof, d) + k * 0.05 + H.th + 0.04; S.g.ball(0.06, { at: [x * w * 0.82, -d, o - (w * 0.82) ** 2 / (2 * Rc)], c: L.gold }, 8, 6); } // (the rivets)
    }
  },
  kusazuri(S, pl) {
    const { spec: H, Rc, hw } = pl, n = 5, step = H.len / n;
    face(S.core, H.prof, Rc, hw * 0.98, 0.04, L.coreD, 0, H.len, -0.05); // (the lacing's ground under the rows)
    for (let k = 0; k < n; k++) {
      const d0 = k * step + 0.03, d1 = d0 + step - 0.06;
      face(S.p, H.prof, Rc, hw, H.th, k % 2 ? L.mid : L.pale, d0, d1);
      for (let x = -3; x <= 3; x++) { const d = d0 + 0.05, X = (x / 3.4) * hw, o = at(H.prof, d) + H.th + 0.03 - X * X / (2 * Rc); S.g.ball(0.045, { at: [X, -d, o], c: L.gold }, 6, 4); } // (the lacing's knots)
    }
    hem(S, pl, H.len, 0.08, 0.02);
  },
  pteruges(S, pl) {
    const { spec: H, Rc, hw } = pl;
    face(S.trim, H.prof, Rc, hw, H.th, L.trimD, 0, H.len - 0.12);
    for (let k = 1; k <= 3; k++) { const d = (k / 4) * H.len, o = at(H.prof, d) + H.th + 0.03; S.g.ball(0.055, { at: [0, -d, o], c: L.gold }, 8, 6); } // (the studs)
    hem(S, pl, H.len - 0.08, 0.08, 0.02);
    for (let x = -2; x <= 2; x++) { const X = (x / 2.3) * hw, o = at(H.prof, H.len); S.core.box(0.05, 0.3, 0.04, { at: [X, -H.len - 0.1, o - X * X / (2 * Rc)], c: L.coreD }, 0.01); } // (the fringe)
  },
};
/** What the belt carries for each piece (in the belt's frame, the pelvis's): a waistband for all; the crinoline's bustle and bow; the
 *  tassets' fauld. */
function belt(S, id, E, hoop = null) {
  const zc = (E.front - E.back) / 2, bz = (E.front + E.back) / 2;
  const onE = (Q, a, k, y) => new THREE.Vector3(Math.sin(a) * Q.ax * k, y, (Q.front - Q.back) / 2 + Math.cos(a) * ((Q.front + Q.back) / 2) * k);
  const ring = (y, k, r, c, piece, Q = E) => {
    const curve = new THREE.CatmullRomCurve3([...Array(48).keys()].map((i) => onE(Q, (i / 48) * PI * 2, k, y)), true);
    piece.geo(new THREE.TubeGeometry(curve, 96, r, 6, true), { c });
  };
  ring(E.y, 1.02, 0.09, L.trimM, S.trim); ring(E.y - 0.08, 1.04, 0.035, L.gold, S.g);
  if (hoop) { // (a tank's farthingale: its hoop round the pods, gilt, and twelve stays from the belt down to it)
    ring(hoop.y + 0.06, 1, 0.13, L.trimM, S.trim, hoop); ring(hoop.y + 0.2, 1.005, 0.05, L.gold, S.g, hoop);
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * PI * 2, A = onE(E, a, 1.03, E.y - 0.05), B = onE(hoop, a, 0.99, hoop.y + 0.1), M = A.clone().lerp(B, 0.5); M.y += 0.25;
      S.g.geo(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 12, 0.06, 5, false), { c: L.gold });
    }
  }
  if (id === 'crinoline') {
    const z = -E.back - 0.35;
    S.trim.ball(0.72, { at: [0, E.y - 0.35, z], sc: [1.4, 0.7, 0.75], c: L.trimL }, 28, 16); // (the bustle)
    for (const s of [-1, 1]) S.trim.ball(0.34, { at: [s * 0.42, E.y + 0.02, z - 0.2], sc: [1.3, 0.7, 0.5], rot: [0, 0, s * 0.35], c: L.trimM }, 20, 12); // (its bow)
    S.g.ball(0.12, { at: [0, E.y + 0.02, z - 0.27], c: L.gold }, 12, 8);
  }
  if (id === 'tassets') for (const k of [1, 2]) ring(E.y - 0.18 * k, 1.04 + 0.03 * k, 0.11, k % 2 ? L.trimL : L.trimM, S.trim); // (the fauld)
}

/** The pelvis's own surface (its meshes' vertices, in its frame), and the belt's ellipse at height y: half-width, front and back. */
function pelvisOf(pelvis) {
  const pts = [];
  for (const m of pelvis.children) { if (!m.isMesh || !m.geometry?.attributes?.position) continue; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) pts.push(new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i))); }
  let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const ellipse = (y) => { let ax = 0.3, front = 0.3, back = 0.3; for (const p of pts) if (Math.abs(p.y - y) < 0.1) { ax = Math.max(ax, Math.abs(p.x)); front = Math.max(front, p.z); back = Math.max(back, -p.z); } return { y, ax, front, back }; };
  return { pts, y0, y1, ellipse };
}
/** What of the legs stands still under the plates (in the pelvis's frame): every leg joint's own meshes but the swinging segments'
 *  (the thighs, pushed each frame), sampled to about `max` points: a tetrapod's leg cups, a tank's tread pods. */
function legsStill(body, swinging, max = 6000) {
  const j = body.joints, out = [], skip = (o) => { for (; o && o !== j.pelvis; o = o.parent) if (swinging.has(o)) return true; return false; };
  const M = new THREE.Matrix4(), v = new THREE.Vector3(), src = [];
  for (const J of body.legJoints || []) { if (skip(J)) continue; for (const m of J.children) if (m.isMesh && !m.isInstancedMesh && m.geometry?.attributes?.position) src.push(m); }
  const total = src.reduce((n, m) => n + m.geometry.attributes.position.count, 0), step = Math.max(1, Math.ceil(total / max));
  for (const m of src) {
    M.identity(); for (let o = m; o && o !== j.pelvis; o = o.parent) { o.updateMatrix(); M.premultiply(o.matrix); }
    const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += step) out.push(v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(M).clone());
  }
  return out;
}

/** The hip piece `id` worn on `body` (built under its pelvis, its meshes in the slot `hip`); null takes it off. Its fit on any leg type
 *  (HIP_FIT): a plate whose rest would lie past `fit` rad is hung shorter until it clears, never put away; a tetrapod's belt is slung
 *  low, under its leg roots; on a tank the plates hang from a farthingale's hoop round the tread pods (a gown over the hull). */
export function wearHip(body, id) {
  const H = HIPS[id], j = body.joints; if (!H || !j.pelvis) return null;
  const PV = pelvisOf(j.pelvis), F = HIP_FIT, low = body.stats?.legType === 'tetra', gap = 0.06;
  const E = PV.ellipse(PV.y0 + (PV.y1 - PV.y0) * (low ? F.lowAt : H.at)); // (a tetrapod's belt slung under its leg roots: the legs rise over the skirt)
  // the thighs first: each leg's upper and lower segments, found by the legs' joints' names, their radius from their own meshes
  const segs = [];
  const rOf = (o) => { const b = new THREE.Box3(); for (const m of o.children) if (m.isMesh) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } if (b.isEmpty()) return 0.5; const s = b.getSize(new THREE.Vector3()); return Math.min(s.x, s.z) / 2; };
  for (const k of ['L', 'R']) {
    if (j[`knee${k}`]) { segs.push([j[`hip${k}`], j[`knee${k}`], rOf(j[`hip${k}`])]); if (j[`ankle${k}`]) segs.push([j[`knee${k}`], j[`ankle${k}`], rOf(j[`knee${k}`])]); }
    for (const f of ['F', 'B']) if (j[`upper${k}${f}`]) segs.push([j[`upper${k}${f}`], j[`lower${k}${f}`], rOf(j[`upper${k}${f}`])]);
  }
  const still = legsStill(body, new Set(segs.map((s) => s[0]))), tank = body.stats?.legType === 'tank' || (!segs.length && still.length > 0);
  // a farthingale where legs stand still under the belt: a hoop wide enough to clear them, the plates hung from it (a tank's just over
  // its pods' tops; a tetrapod's at its low belt, round its leg roots)
  let hoop = null;
  if ((tank || low) && still.length) {
    let top = -Infinity, ax = 0, fr = 0, bk = 0; for (const p of still) if (p.y < E.y) top = Math.max(top, p.y);
    const yH = tank ? Math.min(E.y - 0.2, top + F.hoopLift) : E.y, band = tank ? [-Infinity, yH + 1] : [yH - F.lowBand, yH + F.lowBand];
    for (const p of still) if (p.y > band[0] && p.y < band[1]) { ax = Math.max(ax, Math.abs(p.x)); fr = Math.max(fr, p.z); bk = Math.max(bk, -p.z); }
    if (ax > E.ax) { // (the ellipse through the box's sides grown to take its corners in too, up to `hoopRound`)
      const zc = (fr - bk) / 2, bz = (fr + bk) / 2; let k = 1;
      for (const p of still) if (p.y > band[0] && p.y < band[1]) k = Math.max(k, Math.hypot(p.x / ax, (p.z - zc) / bz));
      k = Math.min(k, F.hoopRound); hoop = { y: yH, ax: ax * k + F.hoopPad, front: zc + bz * k + F.hoopPad, back: bz * k - zc + F.hoopPad };
    }
  }
  const R0 = hoop || E;
  const beltJ = body.J('hipBelt', j.pelvis); body.put(beltJ, 'hip', (S) => belt(S, id, E, hoop));
  const zc = (R0.front - R0.back) / 2, bz = (R0.front + R0.back) / 2, ax = hoop ? R0.ax : R0.ax * 1.06 + gap, bzz = hoop ? bz : bz * 1.06 + gap;
  const statics = [...PV.pts, ...still];
  const plates = [];
  const phis = H.at4 ? [H.at4[0], -H.at4[0], H.at4[1], -H.at4[1]] : [...Array(H.n).keys()].map((i) => -PI + ((i + 0.5) / H.n) * PI * 2).filter((p) => Math.abs(p) >= H.skip);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Pp = new THREE.Vector3(), r = new THREE.Vector3();
  const inPelvis = (o, v) => { for (; o && o !== j.pelvis; o = o.parent) { o.updateMatrix(); v.applyMatrix4(o.matrix); } return v; };
  const K = HIP_SWING;
  /** The tilt a plate needs to clear the thigh segments (`pushes`, in the pelvis's frame), hung at length share s. */
  const pushNeed = (pl, pushes, need) => {
    const len = pl.spec.len * pl.s;
    for (const [a, b, r0] of pushes) for (let q = 0; q <= K.samples; q++) {
      const u = q / K.samples, rr = r0 * (1 - (1 - K.taper) * u); Pp.lerpVectors(a, b, u);
      r.subVectors(Pp, pl.pos); const d = -r.y; if (d < 0.05 || d > len + rr) continue;
      const lat = Math.abs(r.dot(pl.t)); if (lat > pl.hw + rr) continue;
      const dd = Math.min(d, len); if (r.dot(pl.n) > at(pl.spec.prof, dd / pl.s) + dd * Math.tan(pl.rest)) continue; // (its middle outside the plate: an arm beside the bell, never one to open toward)
      const cover = Math.sqrt(Math.max(0, 1 - (Math.max(0, lat - pl.hw) / rr) ** 2)), o = r.dot(pl.n) + rr * cover + K.margin - at(pl.spec.prof, dd / pl.s);
      if (o > 0) need = Math.max(need, Math.atan2(o, dd));
    }
    return need;
  };
  /** The tilt a plate hung at length share s needs to clear what stands still under it. */
  const staticNeed = (pl, s) => {
    let need = H.kick; const len = H.len * s;
    for (const p of statics) {
      const rr = p.clone().sub(pl.pos), d = -rr.y; if (d < 0.08 || d > len) continue;
      if (Math.abs(rr.dot(pl.t)) > pl.hw) continue;
      const o = rr.dot(pl.n) + K.margin - at(H.prof, d / s); if (o > 0) need = Math.max(need, Math.atan2(o, d));
    }
    return need;
  };
  const restPush = segs.map(([a, b, r0]) => [inPelvis(a, A.set(0, 0, 0)).clone(), inPelvis(b, B.set(0, 0, 0)).clone(), r0]);
  phis.forEach((phi, i) => {
    const pos = new THREE.Vector3(ax * Math.sin(phi), R0.y, zc + bzz * Math.cos(phi)), n = new THREE.Vector3(Math.sin(phi) / ax, 0, Math.cos(phi) / bzz).normalize();
    const slot = (2 * PI * Math.hypot(ax, bzz) * Math.SQRT1_2) / H.n, hw = H.w ? H.w[i < 2 ? 0 : 1] * (hoop ? 1.4 : 1) : (slot * H.wide) / 2, Rc = Math.max(1.2, Math.hypot(pos.x, pos.z - zc));
    const J = body.J(`hipPlate${i}`, beltJ, pos.toArray()); J.rotation.order = 'YXZ'; J.rotation.set(0, Math.atan2(n.x, n.z), 0); J.userData.rest = J.rotation.clone();
    const pl = { J, spec: H, Rc, hw, n, t: new THREE.Vector3(n.z, 0, -n.x), pos, rest: 0, a: 0, v: 0, s: 1 };
    body.put(J, 'hip', (S) => BUILD[id](S, pl, i));
    // its fit: the longest hang (a share of its length, down to F.short) whose rest, over the pelvis, the legs that stand still and the
    // thighs at rest, stays inside F.fit; the plate scaled down its own length to it
    let need = 0;
    for (let s = 1; s >= F.short - 1e-6; s -= 0.05) { pl.s = s; need = pushNeed(pl, restPush, staticNeed(pl, s)); if (need <= F.fit) break; }
    J.scale.y = pl.s;
    const statik = staticNeed(pl, pl.s);
    pl.rest = pl.a = Math.min(K.max, statik); pl.need0 = statik;
    plates.push(pl);
  });
  // the arms as pushers too (2026-11-02: the held weapon passed through the crinoline): each forearm (elbow to wrist) and what its grip
  // holds (the grip to the far end of its meshes' box), measured again every half a real second (a weapon swapped in its place)
  const armsOf = () => {
    const out = [];
    for (const k of ['L', 'R']) {
      const e = j[`elbow${k}`], w = j[`wrist${k}`], g = j[`grip${k}`]; if (!e || !w) continue;
      out.push([e, w, Math.max(0.35, rOf(e))]);
      if (g) {
        const box = new THREE.Box3(), inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), M = new THREE.Matrix4();
        g.updateMatrixWorld(true); inv.copy(g.matrixWorld).invert();
        g.traverse((o) => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(M.multiplyMatrices(inv, o.matrixWorld))); } });
        if (!box.isEmpty()) { const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), far = c.clone(), ax = sz.x > sz.y ? (sz.x > sz.z ? 'x' : 'z') : sz.y > sz.z ? 'y' : 'z'; far[ax] += Math.sign(c[ax] || -1) * sz[ax] / 2; out.push([g, null, Math.max(0.3, Math.min(sz.x, sz.y, sz.z) * 0.6), far]); }
      }
    }
    return out;
  };
  let arms = [], armT = 0;
  return {
    plates, splay: H.splay || 0,
    /** One frame: each plate's tilt sprung toward its rest, pushed out of any thigh it would pass through (never past K.max: a plate
     *  pressed flat by a leg rides on it). */
    update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 1 / 20);
      if ((armT -= dt) <= 0) { armT = 0.5; arms = armsOf(); }
      const pushes = segs.map(([a, b, r0]) => [inPelvis(a, A.set(0, 0, 0)).clone(), inPelvis(b, B.set(0, 0, 0)).clone(), r0]);
      for (const [a, b, r0, far] of arms) if (a.visible !== false) pushes.push([inPelvis(a, A.set(0, 0, 0)).clone(), far ? inPelvis(a, A.copy(far)).clone() : inPelvis(b, B.set(0, 0, 0)).clone(), r0]);
      for (const pl of plates) {
        const need = Math.min(K.max, pushNeed(pl, pushes, pl.rest));
        if (dt > 0) { pl.v += (K.stiffness * (pl.rest - pl.a) - K.damping * pl.v) * dt; pl.a += pl.v * dt; }
        if (pl.a < need) { pl.a = need; pl.v = Math.max(pl.v, 0); }
        pl.a = Math.min(pl.a, K.max);
        pl.J.rotation.x = pl.J.userData.rest.x - pl.a;
      }
    },
    dispose() { beltJ.removeFromParent(); for (const pl of plates) delete j[pl.J.name.slice(5)]; delete j.hipBelt; },
  };
}
