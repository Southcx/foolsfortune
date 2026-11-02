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
//   HIPS[id] = { label, n, ... }   HIP_SWING   wearHip(body, id | null) -> { update(dt), dispose(), plates } | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, curved } from './kit.js';

const PI = Math.PI;
/** The plates' spring (rad, s): its stiffness toward the rest tilt and its damping (underdamped: a swing back past rest), the margin
 *  kept off a thigh or the pelvis (m), the most a plate opens (rad), and the segments' radius at their far end against their root's. */
export const HIP_SWING = { stiffness: 60, damping: 5.5, margin: 0.12, max: 1.35, taper: 0.5, samples: 6 };

/** The hip pieces: where the belt sits (`at`: the share of the pelvis's height from its foot), the plates (`n` round, `skip` those
 *  within that angle of the front, `wide` the share of their slot a plate fills, or `w` m each), their length (m), their outward
 *  profile (`prof`: [out m, depth m] down the plate at rest), thickness, their own kick at rest (rad), and how each is built. */
export const HIPS = {
  crinoline: { label: "Drossel's crinoline", at: 0.72, n: 12, skip: 0.62, wide: 0.94, len: 2.4, th: 0.07, kick: 0.04,
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
function belt(S, id, E) {
  const zc = (E.front - E.back) / 2, bz = (E.front + E.back) / 2;
  const ring = (y, k, r, c, piece) => {
    const curve = new THREE.CatmullRomCurve3([...Array(48).keys()].map((i) => { const a = (i / 48) * PI * 2; return new THREE.Vector3(Math.sin(a) * E.ax * k, y, zc + Math.cos(a) * bz * k); }), true);
    piece.geo(new THREE.TubeGeometry(curve, 96, r, 6, true), { c });
  };
  ring(E.y, 1.02, 0.09, L.trimM, S.trim); ring(E.y - 0.08, 1.04, 0.035, L.gold, S.g);
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

/** The hip piece `id` worn on `body` (built under its pelvis, its meshes in the slot `hip`); null takes it off. */
export function wearHip(body, id) {
  const H = HIPS[id], j = body.joints; if (!H || !j.pelvis) return null;
  const PV = pelvisOf(j.pelvis), E = PV.ellipse(PV.y0 + (PV.y1 - PV.y0) * H.at), gap = 0.06;
  const beltJ = body.J('hipBelt', j.pelvis); body.put(beltJ, 'hip', (S) => belt(S, id, E));
  const zc = (E.front - E.back) / 2, bz = (E.front + E.back) / 2, ax = E.ax * 1.06 + gap, bzz = bz * 1.06 + gap;
  const plates = [];
  const phis = H.at4 ? [H.at4[0], -H.at4[0], H.at4[1], -H.at4[1]] : [...Array(H.n).keys()].map((i) => -PI + ((i + 0.5) / H.n) * PI * 2).filter((p) => Math.abs(p) >= H.skip);
  phis.forEach((phi, i) => {
    const pos = new THREE.Vector3(ax * Math.sin(phi), E.y, zc + bzz * Math.cos(phi)), n = new THREE.Vector3(Math.sin(phi) / ax, 0, Math.cos(phi) / bzz).normalize();
    const slot = (2 * PI * Math.hypot(ax, bzz) * Math.SQRT1_2) / H.n, hw = H.w ? H.w[i < 2 ? 0 : 1] : (slot * H.wide) / 2, Rc = Math.max(1.2, Math.hypot(pos.x, pos.z - zc));
    const J = body.J(`hipPlate${i}`, beltJ, pos.toArray()); J.rotation.order = 'YXZ'; J.rotation.set(0, Math.atan2(n.x, n.z), 0); J.userData.rest = J.rotation.clone();
    const pl = { J, spec: H, Rc, hw, n, t: new THREE.Vector3(n.z, 0, -n.x), pos, rest: 0, a: 0, v: 0 };
    body.put(J, 'hip', (S) => BUILD[id](S, pl, i));
    // its rest: the pelvis's surface under it cleared (sampled down its length, across its width)
    let need = H.kick;
    for (const p of PV.pts) {
      const r = p.clone().sub(pos), d = -r.y; if (d < 0.08 || d > H.len) continue;
      if (Math.abs(r.dot(pl.t)) > hw) continue;
      const o = r.dot(n) + HIP_SWING.margin - at(H.prof, d); if (o > 0) need = Math.max(need, Math.atan2(o, d));
    }
    pl.rest = pl.a = Math.min(HIP_SWING.max, need); pl.need0 = need;
    plates.push(pl);
  });
  // the thighs: each leg's upper and lower segments, found by the legs' joints' names, their radius from their own meshes
  const segs = [];
  const rOf = (o) => { const b = new THREE.Box3(); for (const m of o.children) if (m.isMesh) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } if (b.isEmpty()) return 0.5; const s = b.getSize(new THREE.Vector3()); return Math.min(s.x, s.z) / 2; };
  for (const k of ['L', 'R']) {
    if (j[`knee${k}`]) { segs.push([j[`hip${k}`], j[`knee${k}`], rOf(j[`hip${k}`])]); if (j[`ankle${k}`]) segs.push([j[`knee${k}`], j[`ankle${k}`], rOf(j[`knee${k}`])]); }
    for (const f of ['F', 'B']) if (j[`upper${k}${f}`]) segs.push([j[`upper${k}${f}`], j[`lower${k}${f}`], rOf(j[`upper${k}${f}`])]);
  }
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Pp = new THREE.Vector3(), r = new THREE.Vector3();
  const inPelvis = (o, v) => { for (; o && o !== j.pelvis; o = o.parent) { o.updateMatrix(); v.applyMatrix4(o.matrix); } return v; };
  const K = HIP_SWING;
  return {
    plates,
    /** One frame: each plate's tilt sprung toward its rest, pushed out of any thigh it would pass through. */
    update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 1 / 20);
      const pushes = segs.map(([a, b, r0]) => [inPelvis(a, A.set(0, 0, 0)).clone(), inPelvis(b, B.set(0, 0, 0)).clone(), r0]);
      for (const pl of plates) {
        let need = pl.rest;
        for (const [a, b, r0] of pushes) for (let s = 0; s <= K.samples; s++) {
          const u = s / K.samples, rr = r0 * (1 - (1 - K.taper) * u); Pp.lerpVectors(a, b, u);
          r.subVectors(Pp, pl.pos); const d = -r.y; if (d < 0.05 || d > pl.spec.len + rr) continue;
          const lat = Math.abs(r.dot(pl.t)); if (lat > pl.hw + rr) continue;
          const cover = Math.sqrt(Math.max(0, 1 - (Math.max(0, lat - pl.hw) / rr) ** 2)), o = r.dot(pl.n) + rr * cover + K.margin - at(pl.spec.prof, Math.min(d, pl.spec.len));
          if (o > 0) need = Math.max(need, Math.atan2(o, Math.min(d, pl.spec.len)));
        }
        if (dt > 0) { pl.v += (K.stiffness * (pl.rest - pl.a) - K.damping * pl.v) * dt; pl.a += pl.v * dt; }
        if (pl.a < need) { pl.a = need; pl.v = Math.max(pl.v, 0); }
        pl.J.visible = need <= K.max + 0.25 && pl.need0 <= K.max + 0.25; // (a plate a leg or the pelvis would fold past flat is put away, never clipped through)
        pl.a = Math.min(pl.a, K.max);
        pl.J.rotation.x = pl.J.userData.rest.x - pl.a;
      }
    },
    dispose() { beltJ.removeFromParent(); for (const pl of plates) delete j[pl.J.name.slice(5)]; delete j.hipBelt; },
  };
}
