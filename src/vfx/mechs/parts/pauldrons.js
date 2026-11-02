// ---------------------------------------------------------------------------------------
// A MECH'S PAULDRONS (plain name; South, 2026-11-02: "add in pauldron variants, make em large, iconic"): the shoulder armour as a look
// chosen apart from the arms part (the parts body's setPauldron), both sides built in their pauldron joint's frame (vfx/mechs/
// partsbody.js: hung off the chest at the shoulder's socket, riding a part of the arm's swing; +X out for the left, -Y down the arm),
// big enough to own the silhouette, all in trim (the Courier's trim glaze; authored in neutral tones) with gold edges and studs.
//   default    the arms part's own (vfx/mechs/parts/arms.js `pauldron`; a feminine form's own, femlimbs.js: Haydee's deltoid cap,
//              Drossel's puffed sleeve)
//   none       the bare shoulder ball
//   osode      the samurai's great sleeve: six lames of lamellar hung flat off the shoulder, laced in gold, its crown plate on top
//   zaku       Okawara's Zaku: a spiked dome on the left, the flat shoulder shield on the right
//   wing       a winged sweep: four long blades fanned up and back off a cap, gilt along their leading edges
//   spaulder   the knight's: a domed cap over four stacked lames, the haute-piece standing on the neck side
//   disc       a round shield-disc facing out, its rings and a gold boss
//   horn       a dome cap with a great horn curving up and back and a lesser one under it, as a stag beetle's crest or a crab's claw
// Prior art: the ōsode of the ō-yoroi (the Heian and Kamakura great armour); Kunio Okawara's MS-06 Zaku II (spiked left pauldron,
// right shield); the Gothic and Maximilian spaulder and its haute-piece; Warhammer's and Gundam Wing's winged shoulders; the
// Kabutomushi and the Kuwagata's horns (Sengoku kabuto crests, the Zeong's and Gouf's horns); a parade shield's boss.
//
//   PAULDRONS[id] = (S, s) | null (default) | 'none'   pauldronIds()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, plate, curved, seam } from './kit.js';

const PI = Math.PI;
/** A tube along a curve tapering from r0 to r1 (a horn): three's TubeGeometry with each ring scaled about its centre. */
function taper(curve, r0, r1, n = 24, radial = 10) {
  const geo = new THREE.TubeGeometry(curve, n, 1, radial, false), P = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    curve.getPointAt(i / n, c); const r = r0 + (r1 - r0) * (i / n) ** 0.8;
    for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; v.fromBufferAttribute(P, k).sub(c).multiplyScalar(r).add(c); P.setXYZ(k, v.x, v.y, v.z); }
  }
  geo.computeVertexNormals(); return geo;
}
/** A dome cap over the ball: radius r, squashed, its centre out at x. */
const cap = (S, s, r, x, c = L.trimL, sy = 0.8) => {
  S.trim.geo(shell([[r, -0.2 * r], [r * 1.04, 0.2 * r], [r * 0.9, 0.62 * r], [r * 0.55, 0.88 * r], [0.001, 0.96 * r]], 32), { at: [s * x, 0.1, 0], sc: [1, sy, 1.1], c });
  S.g.ring(r * 1.0, 0.05, { at: [s * x, 0.1 - 0.2 * r * sy, 0], sc: [1, 1, 1.1], c: L.gold }, 40, 4);
};
const out = (s) => s * PI / 2; // (the lathe's phi facing out of the shoulder)

export const PAULDRONS = {
  default: null,
  none: 'none',
  osode(S, s) {
    const { g, trim } = S, R = 1.9, half = 0.82, cx = s * 0.35, h = 0.5;
    trim.geo(curved([[R - 0.05, 0.75], [R + 0.05, 0.98], [R - 0.1, 1.18]], 0.16, out(s) - half - 0.06, out(s) + half + 0.06, 14), { at: [cx, 0, 0], c: L.trimL }); // (the crown plate)
    g.geo(curved([[R + 0.06, 0.73], [R + 0.08, 0.79]], 0.04, out(s) - half - 0.06, out(s) + half + 0.06, 14), { at: [cx, 0, 0], c: L.gold });
    for (let i = 0; i < 6; i++) {
      const y1 = 0.78 - i * (h - 0.04), r = R + 0.06 * i;
      trim.geo(curved([[r, y1 - h], [r + 0.06, y1 - h * 0.5], [r, y1]], 0.1, out(s) - half, out(s) + half, 14), { at: [cx, 0, 0], rot: [0, 0, s * 0.1], c: i % 2 ? L.trimM : L.trimL });
      for (let k = 0; k <= 6; k++) { const a = out(s) - half + (k / 6) * 2 * half; g.ball(0.05, { at: [cx + Math.sin(a) * (r + 0.07), y1 - h * 0.62, Math.cos(a) * (r + 0.07)], c: L.gold }, 6, 4); } // (the lacing's knots)
    }
    for (const k of [-0.55, 0, 0.55]) { const a = out(s) + k; seam(g, [0, 1, 2, 3, 4, 5].map((i) => { const y = 0.6 - i * 0.46, r = R + 0.06 * i + 0.08; return [cx + Math.sin(a) * r + s * (0.6 - y) * 0.1, y, Math.cos(a) * r]; }), 0.03); } // (the cords)
    trim.geo(shell([[0.95, -0.1], [1.0, 0.3], [0.8, 0.7], [0.001, 0.82]], 28), { at: [s * 0.25, 0.25, 0], sc: [1, 0.8, 1.1], c: L.trimM }); // (the cap it hangs from)
  },
  zaku(S, s) {
    const { g, trim } = S;
    if (s > 0) { // (the spiked dome)
      cap(S, s, 2.0, 0.55, L.trimL, 0.85);
      trim.ring(2.04, 0.12, { at: [s * 0.55, 0.1 - 0.4 * 0.85, 0], sc: [1, 1, 1.1], c: L.trimD }, 40, 6);
      for (const [el, az] of [[0.55, 0.9], [0.55, 0], [0.55, -0.9], [1.1, 0.45], [1.1, -0.45]]) {
        const d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el) * 0.85, Math.cos(el) * Math.sin(az) * 1.1).normalize(), at = d.clone().multiplyScalar(1.75).add(new THREE.Vector3(0.55, 0.1, 0));
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), e = new THREE.Euler().setFromQuaternion(q);
        trim.cone(0.32, 1.1, { at: at.clone().addScaledVector(d, 0.45).toArray(), rot: [e.x, e.y, e.z], c: L.trimM }, 12);
        g.ring(0.33, 0.05, { at: at.toArray(), rot: [e.x, e.y, e.z], c: L.gold }, 16, 4);
      }
    } else { // (the shoulder shield: a tall rounded plate hung flat outside the arm)
      const W = 1.25, H = 1.7, R = 5.0, half = W / R;
      trim.geo(curved([[R, -H], [R + 0.12, 0], [R, H * 0.7]], 0.18, out(s) - half, out(s) + half, 12), { at: [s * (0.95 - R), -0.4, 0], c: L.trimL });
      g.geo(curved([[R + 0.03, H * 0.66], [R + 0.05, H * 0.72]], 0.08, out(s) - half, out(s) + half, 12), { at: [s * (0.95 - R), -0.4, 0], c: L.gold });
      g.geo(curved([[R + 0.03, -H - 0.02], [R + 0.05, -H + 0.04]], 0.08, out(s) - half, out(s) + half, 12), { at: [s * (0.95 - R), -0.4, 0], c: L.gold });
      cap(S, s, 0.95, 0.25, L.trimM, 0.8);
      for (const y of [-1.4, 0.7]) for (const z of [-0.8, 0.8]) g.ball(0.08, { at: [s * 1.17, y - 0.4, z], c: L.gold }, 8, 6);
    }
  },
  wing(S, s) {
    const { g, trim } = S;
    cap(S, s, 1.35, 0.35, L.trimL, 0.82);
    const blade = [[0, -0.32], [3.2, -0.2], [3.9, 0], [3.2, 0.22], [0, 0.34]];
    for (let i = 0; i < 4; i++) {
      const rz = s * (0.55 + i * 0.32), ry = -s * 0.25, rx = -0.25 - i * 0.12, at = [s * (0.6 + i * 0.05), 0.75 - i * 0.18, -0.25 - i * 0.18];
      trim.geo(plate(blade.map(([x, y]) => [x * (1 - i * 0.12), y]), 0.1, 0.04), { at, rot: [rx, ry, rz], sc: [s, 1, 1], c: i % 2 ? L.trimM : L.trimL });
      const e = new THREE.Euler(rx, ry, rz), A = new THREE.Vector3(...at), tip = new THREE.Vector3(s * 3.9 * (1 - i * 0.12), 0, 0).applyEuler(e).add(A), root = new THREE.Vector3(0, 0.34, 0).applyEuler(e).add(A), lead = new THREE.Vector3(s * 3.2 * (1 - i * 0.12), 0.22, 0).applyEuler(e).add(A);
      seam(g, [root.toArray(), lead.toArray(), tip.toArray()], 0.035);
    }
  },
  spaulder(S, s) {
    const { g, trim } = S;
    cap(S, s, 1.5, 0.4, L.trimL, 0.85);
    for (let i = 0; i < 4; i++) {
      const r = 1.58 + i * 0.1, y = -0.38 - i * 0.42, half = 1.45 - i * 0.12;
      trim.geo(curved([[r, y - 0.22], [r + 0.08, y], [r + 0.02, y + 0.22]], 0.1, out(s) - half, out(s) + half, 12), { at: [s * (0.4 + i * 0.05), 0, 0], sc: [1, 1, 1.08], c: i % 2 ? L.trimM : L.trimL });
      g.geo(curved([[r + 0.04, y - 0.25], [r + 0.06, y - 0.19]], 0.05, out(s) - half, out(s) + half, 12), { at: [s * (0.4 + i * 0.05), 0, 0], sc: [1, 1, 1.08], c: i === 3 ? L.gold : L.bronze });
    }
    // (the haute-piece: a flared plate standing on the neck side, its top rolled)
    trim.geo(curved([[1.05, 0.6], [1.12, 1.2], [1.35, 1.9]], 0.12, -out(s) - 1.0, -out(s) + 1.0, 12), { at: [s * 0.55, 0, 0], c: L.trimM });
    g.geo(curved([[1.36, 1.86], [1.42, 1.96]], 0.06, -out(s) - 1.0, -out(s) + 1.0, 12), { at: [s * 0.55, 0, 0], c: L.gold });
  },
  disc(S, s) {
    const { g, trim, l } = S, x = s * 1.25, rot = [0, 0, -s * (PI / 2 - 0.25)];
    cap(S, s, 1.0, 0.25, L.trimM, 0.8);
    trim.geo(shell([[0.001, 0.38], [0.7, 0.33], [1.6, 0.16], [2.15, 0], [2.2, -0.12], [2.05, -0.16], [0.001, -0.06]], 40), { at: [x, -0.2, 0], rot, c: L.trimL }); // (the disc)
    g.ring(2.17, 0.07, { at: [x, -0.2, 0], rot, c: L.gold }, 48, 5);
    for (const [r, c] of [[1.55, L.trimD], [0.95, L.trimM]]) trim.ring(r, 0.07, { at: new THREE.Vector3(0, r < 1 ? 0.33 : 0.2, 0).applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(x, -0.2, 0)).toArray(), rot, c }, 40, 5);
    const boss = new THREE.Vector3(0, 0.38, 0).applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(x, -0.2, 0));
    g.ball(0.42, { at: boss.toArray(), rot, sc: [1, 0.6, 1], c: L.gold }, 20, 12);
    l.ball(0.2, { at: new THREE.Vector3(0, 0.62, 0).applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(x, -0.2, 0)).toArray(), c: L.lab }, 14, 10); // (a small gem in the boss)
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2, v = new THREE.Vector3(Math.cos(a) * 1.85, 0.12, Math.sin(a) * 1.85).applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(x, -0.2, 0)); g.ball(0.08, { at: v.toArray(), c: L.gold }, 8, 6); }
  },
  horn(S, s) {
    const { g, trim } = S;
    cap(S, s, 1.55, 0.45, L.trimL, 0.85);
    trim.geo(curved([[1.6, -0.6], [1.68, -0.3], [1.6, 0]], 0.1, out(s) - 1.4, out(s) + 1.4, 12), { at: [s * 0.45, -0.1, 0], c: L.trimM });
    const big = new THREE.CatmullRomCurve3([[0.9, 0.9, 0.3], [1.5, 1.7, 0.25], [1.8, 2.7, -0.2], [1.5, 3.5, -1.0], [0.9, 3.8, -1.7]].map(([x, y, z]) => new THREE.Vector3(s * x, y, z)));
    trim.geo(taper(big, 0.48, 0.04, 28, 12), { c: L.trimM });
    const small = new THREE.CatmullRomCurve3([[1.5, 0.2, 0.6], [2.3, 0.6, 0.9], [2.8, 1.3, 0.7], [2.9, 1.9, 0.2]].map(([x, y, z]) => new THREE.Vector3(s * x, y, z)));
    trim.geo(taper(small, 0.3, 0.03, 20, 10), { c: L.trimL });
    for (const C of [big, small]) g.geo(new THREE.TorusGeometry(C === big ? 0.5 : 0.32, 0.05, 6, 20).lookAt(C.getTangentAt(0.02)), { at: C.getPointAt(0.02).toArray(), c: L.gold });
  },
};
export const pauldronIds = () => Object.keys(PAULDRONS);
