// ---------------------------------------------------------------------------------------
// THE CLAY FRAME'S PARTS: the segment builders of the clay frame's body (vfx/mechs/clayframe.js, which assembles them on its joints).
// Each builder fills one segment's three pieces in its joint's frame (+Y up the limb's length, -Y down it, +Z the body's front):
// `p` the porcelain shells and the grooves cut between them (one glossy program, vertex coloured: bone, ivory, the earth tones, and
// the umber of a groove's floor), `g` the gold and bronze (the ball joints and the kintsugi seams), `l` the labradorite (the pauldrons
// and the crest: Lachryma's dark stone, its schiller baked in per plate from the film's palette, vfx/oxidation.js `schillerInk`).
// Hard surface the house's way: a groove is a real gap between two plates over a darker core, a chamfer is an extrusion's bevel, a
// socket is a cup the ball sits in. Prior art: the module's (clayframe.js); the decor kit's Piece (vfx/garden/decorpieces/kit.js).
//
//   head, faceHollows, neck, chest, cradle, boreMesh, shoulder, upperArm, foreArm, hand, hips, thigh, shin, foot   threadGeometry
//   CLAY_FRAME_LOOK (its colours and sizes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';
import { schillerInk } from '../oxidation.js';

/** Its colours (sRGB) and its sizes (metres). Porcelain bone and ivory, the earth tones (warm grey, umber, terracotta, ochre, slate),
 *  gold and bronze for the joints and seams only, the labradorite's dark base, the dark of a hollow, the film's light, the glass. */
export const CLAY_FRAME_LOOK = {
  bone: 0xece3d1, ivory: 0xd8cbb1, grey: 0x8e8277, umber: 0x3d2f26, terracotta: 0xa45c3c, ochre: 0xb48a46, slate: 0x575c62,
  gold: 0xd9ab4c, bronze: 0x9a6a36, lab: 0x2a3441, hollow: 0x140a08, film: 0xd8ccff, glass: 0x9fc4ff,
  hip: 7.46, thigh: 3.0, shin: 3.2, spine: 1.0, chest: 3.3, neck: 0.45, upper: 3.1, fore: 2.9,
  shoulderX: 3.05, shoulderY: 2.7, cradleY: 1.95, front: 1.56, bore: 0.82, depth: 1.05, boss: 0.45, pitch: 0.12,
};
const L = CLAY_FRAME_LOOK, PI = Math.PI;

// ------------------------------------------------------------------ shapes
/** A hard-surface plate: an outline [[x, y], ...] extruded `depth` along Z (centred on z 0), its edges chamfered by `bev`. */
export function plate(pts, depth, bev = 0.06) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 }).translate(0, 0, -depth / 2);
}
/** The same plate drawn side-on: an outline [[z, y], ...] extruded `width` across X (a foot, a beak, a crest). */
const sidePlate = (pts, width, bev) => plate(pts, width, bev).rotateY(-PI / 2);
/** An outline mirrored across x 0 (the frame's right of its left). */
const mirror = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
/** A lathed shell: profile [[radius, y], ...] round Y, all the way or a part of the way round. */
const shell = (pts, seg = 18, start = 0, len = PI * 2) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, start, len);
/** A socket cup for a ball of radius r centred at the origin: a thick dome over its +Y half, its lip just past the equator. */
const cup = (r) => shell([[r * 1.2, -r * 0.22], [r * 1.3, r * 0.12], [r * 1.16, r * 0.62], [r * 0.72, r * 0.98], [0.001, r * 1.1]], 20);
/** A kintsugi seam: a gold line run along points (a crack mended), in `P`. */
function seam(P, pts, r = 0.035, c = L.gold) { for (let i = 1; i < pts.length; i++) P.rod(pts[i - 1], pts[i], r, { c }, 4); }
/** A labradorite plate's colour: the stone's dark base with the film's schiller coming up through it at phase `ph`. */
const _s = new THREE.Color();
const labTone = (ph, k = 0.18) => new THREE.Color(L.lab).lerp(schillerInk(ph, _s), k);
/** A ball joint in its gold (the Courier's own make, at giant scale). */
const ball = (P, r, at = [0, 0, 0]) => P.ball(r, { at, c: L.gold }, 18, 12);

/** A helix of `turns` round +Z, radius r, advancing `pitch` a turn into -Z: the cradle's screw thread. */
export function threadGeometry(r, turns, pitch, tube) {
  const pts = []; for (let i = 0; i <= 64 * turns; i++) { const a = (i / 64) * PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -(i / 64) * pitch)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64 * turns, tube, 6, false);
}

// ------------------------------------------------------------------ the head: the haniwa under a beaked helmet
export function head(S) {
  const { p, l } = S;
  p.lathe([[0.001, -0.05], [0.5, 0], [0.58, 0.4], [0.56, 0.8], [0.3, 1.05], [0.001, 1.1]], { c: L.bone }, 16); // (the skull)
  p.box(0.8, 0.6, 0.2, { at: [0, 0.48, 0.5], c: L.umber }, 0.06); // (the face's recess, where the hollows are cut)
  p.box(0.9, 0.1, 0.18, { at: [0, 0.83, 0.52], c: L.terracotta }, 0.04); // (the brow)
  p.geo(shell([[0.76, 0.62], [0.8, 0.86], [0.7, 1.16], [0.42, 1.36], [0.001, 1.43]], 18), { sc: [1, 1, 1.12], c: L.ivory }); // (the helmet's bowl)
  p.ring(0.78, 0.05, { at: [0, 0.63, 0], sc: [1, 1, 1.12], c: L.umber }, 18, 3); // (its brim, a groove under the bowl)
  p.geo(sidePlate([[0.45, 0.92], [1.3, 1.02], [0.5, 1.32]], 0.34, 0.04), { c: L.bone }); // (the beak, ahead)
  for (let i = 0; i < 3; i++) p.geo(new THREE.CylinderGeometry(0.74 + i * 0.09, 0.8 + i * 0.1, 0.22, 16, 1, true, PI * 0.45, PI * 1.1), { at: [0, 0.52 - i * 0.25, -0.02], c: i % 2 ? L.ivory : L.bone }); // (the neck guard's lames)
  for (const s of [-1, 1]) { p.cyl(0.12, 0.16, 0.42, { at: [s * 0.66, 0.28, 0.12], c: L.terracotta }, 8); p.ball(0.17, { at: [s * 0.68, 0.04, 0.12], sc: [0.8, 1.1, 0.8], c: L.terracotta }); } // (the mizura)
  l.geo(sidePlate([[-0.1, 1.32], [0.35, 1.38], [-0.55, 2.25], [-0.78, 2.12]], 0.1, 0.03), { c: labTone(0.62, 0.45) }); // (the crest: a blade of the stone)
}
/** The face's three hollows, lit from inside once sealed (their own program: `glow`). */
export function faceHollows() {
  const P = new Piece();
  for (const s of [-1, 1]) P.box(0.24, 0.08, 0.06, { at: [s * 0.19, 0.58, 0.61], rot: [0, 0, s * -0.14], c: 0xffffff }, 0.03);
  P.box(0.22, 0.08, 0.06, { at: [0, 0.34, 0.61], c: 0xffffff }, 0.03);
  return P;
}
export function neck(S) { ball(S.g, 0.42); S.g.cyl(0.26, 0.3, L.neck, { at: [0, L.neck / 2, 0], c: L.bronze }, 10); }

// ------------------------------------------------------------------ the chest: the big shape, plates over a dark core
const CHEST = [[-1.25, 0], [1.25, 0], [2.45, 2.25], [2.6, 2.85], [1.75, 3.35], [-1.75, 3.35], [-2.6, 2.85], [-2.45, 2.25]];
/** The breastplate's left half, its inner edge notched round the cradle. */
function pec() {
  const Rh = L.bore + 0.1, a0 = Math.acos(0.08 / Rh), pts = [[0.08, 0.95], [1.85, 0.95], [2.5, 2.2], [2.6, 2.8], [1.75, 3.25], [0.08, 3.25]];
  for (let i = 0; i <= 12; i++) { const a = a0 - (i / 12) * a0 * 2; pts.push([Math.cos(a) * Rh, L.cradleY + Math.sin(a) * Rh]); }
  return pts;
}
const BACK = [[0.08, 0.95], [1.85, 0.95], [2.5, 2.2], [2.6, 2.8], [1.75, 3.25], [0.08, 3.25]];
export function chest(S) {
  const { p, g } = S;
  p.geo(plate(CHEST.map(([x, y]) => [x * 0.93, y]), 1.95, 0.04), { at: [0, 0, -0.52], c: L.umber }); // (the core the grooves open onto)
  const L0 = pec(), B0 = BACK;
  for (const [pts, c] of [[L0, L.bone], [mirror(L0), L.bone]]) p.geo(plate(pts, 1.1), { at: [0, 0, 0.95], c }); // (the breastplate, split at the keel)
  for (const pts of [B0, mirror(B0)]) p.geo(plate(pts, 1.1), { at: [0, 0, -1.0], c: L.ivory });
  for (const [y0, y1, w0, w1, c] of [[0.05, 0.44, 1.2, 1.42, L.grey], [0.52, 0.88, 1.46, 1.7, L.ivory]]) // (the abdomen's two bands, wrapped round)
    p.geo(plate([[-w0, y0], [w0, y0], [w1, y1], [-w1, y1]], 2.75, 0.05), { c });
  // the gorget and the neck's socket
  p.lathe([[0.55, 3.28], [1.15, 3.3], [1.22, 3.42], [0.7, 3.55]], { at: [0, 0, 0.1], sc: [1, 1, 0.85], c: L.terracotta }, 18);
  p.geo(cup(0.42).rotateX(PI), { at: [0, L.chest + 0.05, 0.12], c: L.ivory });
  // the shoulders' sockets: cups turned to face out, the balls seated in them
  for (const s of [-1, 1]) p.geo(cup(0.78).rotateZ(s * PI / 2), { at: [s * L.shoulderX, L.shoulderY, 0], c: L.ivory });
  // the generator on the back: a kiln dome, its band and vents; the two nozzles under it
  p.ball(1.0, { at: [0, 2.0, -1.62], sc: [1.25, 1.0, 0.7], c: L.bone }, 18, 12);
  p.ring(1.22, 0.08, { at: [0, 2.0, -1.62], rot: [PI / 2, 0, 0], sc: [1, 0.82, 1], c: L.umber }, 20, 4);
  for (let i = 0; i < 5; i++) g.slab(0.12, 0.44, 0.1, { at: [-0.5 + i * 0.25, 2.25, -2.3], c: L.bronze });
  for (const s of [-1, 1]) {
    p.lathe([[0.24, 0], [0.28, 0.3], [0.4, 0.62], [0.58, 0.96], [0.62, 1.0]], { at: [s * 0.72, 0.85, -1.9], rot: [PI - 0.4, 0, 0], c: L.slate }, 14);
    g.ring(0.6, 0.05, { at: [s * 0.72, -0.07, -2.27], rot: [-0.4, 0, 0], c: L.gold }, 14, 3);
  }
  // kintsugi: a crack across the left pectoral, mended, and the keel's gold line under the cradle
  seam(g, [[0.55, 3.24, 1.58], [0.9, 2.9, 1.58], [1.05, 2.55, 1.58], [1.5, 2.3, 1.58], [1.62, 1.85, 1.58], [2.1, 1.55, 1.58]]);
  seam(g, [[0, 0.06, 1.42], [0, 0.88, 1.44]], 0.045);
}

/** The cradle on the chest's face: a raised boss (an annulus, open in the middle so the bore is seen), the cartouche's rings, the
 *  thread, the gold collar and studs. In the cradle's frame: +Z out of the chest, its lip at z 0. */
export function cradle(S) {
  const { p, g } = S, R = L.bore, B = L.boss;
  p.geo(shell([[R, 0.03], [R + 0.1, 0.07], [R + 0.36, 0.07], [R + 0.4, 0.02], [R + 0.46, 0.02], [R + 0.5, 0.06], [R + 0.6, 0.04], [R + 0.7, -0.12], [R + 0.74, -B]], 36).rotateX(PI / 2), { c: L.ivory }); // (the boss: a groove cut round its face)
  g.geo(threadGeometry(R - 0.05, 2, L.depth / 2.6, 0.06), { at: [0, 0, -0.1], c: L.gold }); // (the thread: two turns cut round the bore)
  g.ring(R + 0.06, 0.1, { rot: [PI / 2, 0, 0], at: [0, 0, 0.07], c: L.gold }, 36, 6); // (the collar)
  g.ring(R + 0.43, 0.03, { rot: [PI / 2, 0, 0], at: [0, 0, 0.03], c: L.gold }, 40, 3); // (the cartouche's engraved line)
  g.ring(R + 0.68, 0.035, { rot: [PI / 2, 0, 0], at: [0, 0, -0.08], c: L.bronze }, 40, 3);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2 + PI / 8; g.ball(0.06, { at: [Math.cos(a) * (R + 0.23), Math.sin(a) * (R + 0.23), 0.1], c: L.gold }, 8, 6); } // (its studs)
}
/** The bore: dark clay seen from inside (its own program, drawn on its back faces), a floor at its foot. */
export function boreMesh() {
  const R = L.bore, D = L.depth, geo = new THREE.CylinderGeometry(R, R, D, 32, 1, false).rotateX(PI / 2).translate(0, 0, -D / 2 + 0.04);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'mech-bore', color: L.hollow, roughness: 0.95, side: THREE.BackSide }));
  m.receiveShadow = true; return m;
}

// ------------------------------------------------------------------ the arms: a great pauldron of the stone, long arms, big hands
export function shoulder(S, s) {
  const { g, l } = S;
  ball(g, 0.74);
  l.geo(shell([[1.55, -0.18], [1.62, 0.3], [1.42, 0.86], [0.9, 1.22], [0.001, 1.34]], 22), { at: [s * 0.35, 0.12, 0], sc: [1, 0.85, 1.15], c: labTone(0.1) }); // (the dome)
  const t0 = (s > 0 ? PI / 2 : -PI / 2) - 1.7;
  for (let i = 0; i < 2; i++) l.geo(new THREE.CylinderGeometry(1.64 + i * 0.07, 1.74 + i * 0.08, 0.44, 22, 1, true, t0, 3.4), { at: [s * 0.35, -0.42 - i * 0.52, 0], sc: [1, 1, 1.12], c: labTone(0.28 + i * 0.17) }); // (the lames, a groove between)
  g.ring(1.56, 0.05, { at: [s * 0.35, -0.16, 0], sc: [1, 1, 1.15], c: L.gold }, 26, 3); // (the dome's gilt rim)
  for (const [z, h, ph] of [[0.35, 1.7, 0.45], [-0.3, 1.25, 0.7]]) l.geo(plate([[0, 0], [0.46, 0], [0.22, h], [0.04, h * 0.92]], 0.12, 0.03), { at: [s * 1.0, 0.95, z], rot: [0, 0, -s * 0.4], c: labTone(ph, 0.4) }); // (two fins up off its crown)
  seam(g, [[s * 1.2, 0.95, 1.4], [s * 1.5, 0.55, 1.45], [s * 1.45, 0.2, 1.62], [s * 1.75, -0.1, 1.55]], 0.03);
}
/** A limb's lathed shell between two sockets, the groove a waist in its profile; a cup at its foot for the next ball. */
function limb(p, prof, c, foot, cupR) { p.lathe(prof, { c }, 18); p.geo(cup(cupR), { at: [0, -foot, 0], c: L.ivory }); }
export function upperArm(S, s) {
  limb(S.p, [[0.5, -0.5], [0.78, -0.76], [0.84, -1.5], [0.7, -1.56], [0.7, -1.68], [0.8, -1.74], [0.74, -2.65], [0.6, -2.95]], L.bone, L.upper, 0.58);
  S.p.geo(plate([[-0.42, -0.85], [0.42, -0.85], [0.36, -2.4], [-0.3, -2.5]], 0.18), { at: [s * 0.82, 0, 0], rot: [0, s * PI / 2, 0], c: L.ivory }); // (the outer plate)
}
export function foreArm(S, s) {
  ball(S.g, 0.6);
  limb(S.p, [[0.48, -0.45], [0.66, -0.72], [0.8, -1.5], [0.9, -2.15], [0.78, -2.24], [0.78, -2.36], [0.84, -2.42], [0.66, -2.8]], L.bone, L.fore, 0.48);
  S.p.geo(plate([[-0.5, -0.8], [0.5, -0.8], [0.6, -2.1], [0, -2.3], [-0.6, -2.1]], 0.2), { at: [s * 0.86, 0, 0], rot: [0, s * PI / 2, 0], c: L.terracotta }); // (the vambrace)
  seam(S.g, [[s * 0.97, -1.0, 0.3], [s * 0.98, -1.4, 0.05], [s * 0.99, -1.7, 0.2], [s * 0.97, -2.0, -0.1]], 0.03);
}
/** The hand, built palm to +Z (the joint turns it to face the thigh): a big palm, four fingers of two joints, the thumb. */
export function hand(S, s) {
  const { p, g } = S;
  ball(g, 0.46);
  p.box(1.38, 1.15, 0.72, { at: [0, -1.0, 0], c: L.bone }, 0.2);
  p.box(1.42, 0.12, 0.76, { at: [0, -0.7, 0], c: L.umber }, 0.04); // (the groove round the palm's heel)
  const curl = [0.28, 0.8], len = [0.62, 0.5];
  for (const x of [-0.5, -0.17, 0.17, 0.5]) {
    let at = new THREE.Vector3(x, -1.6, 0.04); ball(g, 0.15, at.toArray());
    for (let k = 0; k < 2; k++) {
      const a = curl[k], d = new THREE.Vector3(0, -Math.cos(a), Math.sin(a)), c = at.clone().addScaledVector(d, len[k] / 2 + 0.1);
      p.box(0.29, len[k], 0.33, { at: c.toArray(), rot: [-a, 0, 0], c: k ? L.ivory : L.bone }, 0.1);
      at = at.clone().addScaledVector(d, len[k] + 0.18); if (k === 0) ball(g, 0.12, at.toArray());
    }
  }
  ball(g, 0.15, [s * 0.68, -0.85, 0.28]);
  p.box(0.32, 0.72, 0.34, { at: [s * 0.76, -1.25, 0.48], rot: [-0.6, 0, s * 0.25], c: L.ivory }, 0.11); // (the thumb)
}

// ------------------------------------------------------------------ the waist and the legs
export function spine(S) {
  const { p, g } = S;
  p.cyl(0.6, 0.62, L.spine + 0.3, { at: [0, L.spine / 2 - 0.1, 0], c: L.slate }, 14); // (the frame, seen in the grooves)
  for (let i = 0; i < 3; i++) p.lathe([[0.74, 0], [0.86, 0.04], [0.86, 0.2], [0.74, 0.24]], { at: [0, 0.05 + i * 0.32, 0], sc: [1, 1, 0.85], c: i === 1 ? L.terracotta : L.ivory }, 18);
  g.ring(0.66, 0.05, { at: [0, L.spine - 0.02, 0], c: L.bronze }, 16, 3);
}
const TASSET = [[-0.42, 0], [0.42, 0], [0.36, -1.3], [-0.3, -1.42]];
export function hips(S) {
  const { p, g } = S;
  p.geo(plate([[-1.3, 0.4], [1.3, 0.4], [1.42, 0.1], [0.82, -0.62], [-0.82, -0.62], [-1.42, 0.1]], 1.8), { c: L.bone }); // (the pelvis)
  p.geo(plate([[-1.36, 0.46], [1.36, 0.46], [1.3, 0.66], [-1.3, 0.66]], 1.92, 0.04), { c: L.terracotta }); // (the belt)
  p.geo(plate([[-0.38, 0.32], [0.38, 0.32], [0.3, -0.7], [0, -0.85], [-0.3, -0.7]], 0.24), { at: [0, 0, 0.98], c: L.ivory }); // (the codpiece)
  for (const s of [-1, 1]) {
    p.geo(cup(0.62), { at: [s * 1.1, -0.35, 0], c: L.ivory }); // (the hips' sockets)
    p.geo(plate(TASSET, 0.14), { at: [s * 0.86, 0.32, 1.0], rot: [-0.32, s * 0.3, 0], c: L.terracotta }); // (the tassets: the kusazuri's plates)
    p.geo(plate(TASSET, 0.14), { at: [s * 1.5, 0.36, 0.05], rot: [-0.32, s * PI / 2, 0], c: L.ochre });
    p.geo(plate(TASSET, 0.14), { at: [s * 0.8, 0.32, -0.98], rot: [-0.32, PI + s * -0.3, 0], c: L.terracotta });
  }
  seam(g, [[0.12, 0.3, 1.13], [-0.08, 0.0, 1.13], [0.1, -0.35, 1.13], [-0.04, -0.7, 1.08]], 0.03);
}
export function thigh(S, s) {
  ball(S.g, 0.62);
  limb(S.p, [[0.55, -0.35], [0.92, -0.62], [1.04, -1.1], [1.0, -1.45], [0.86, -1.5], [0.86, -1.62], [0.97, -1.68], [0.9, -2.4], [0.72, -2.75]], L.bone, L.thigh, 0.62);
  S.p.geo(plate([[-0.55, -0.7], [0.55, -0.7], [0.5, -2.3], [0, -2.55], [-0.5, -2.3]], 0.2), { at: [0, 0, 0.98], rot: [0.05, 0, 0], c: L.ivory }); // (the thigh's front plate)
  seam(S.g, [[s * 1.02, -0.8, 0.1], [s * 1.0, -1.3, -0.15], [s * 0.96, -1.9, 0.05], [s * 0.9, -2.4, -0.1]], 0.03);
}
export function shin(S) {
  const { p, g } = S;
  ball(g, 0.62);
  p.geo(plate([[-0.5, 0.35], [0.5, 0.35], [0.56, -0.15], [0, -0.55], [-0.56, -0.15]], 0.22), { at: [0, 0, 0.78], rot: [0.15, 0, 0], c: L.ivory }); // (the knee's cop)
  limb(p, [[0.5, -0.35], [0.86, -0.62], [1.04, -1.2], [1.0, -1.7], [0.84, -1.76], [0.84, -1.88], [0.93, -1.94], [0.76, -2.7], [0.56, -3.05]], L.bone, L.shin, 0.5);
  p.geo(plate([[-0.6, -0.75], [0.6, -0.75], [0.48, -2.6], [-0.48, -2.6]], 0.2), { at: [0, 0, 0.94], rot: [-0.06, 0, 0], c: L.terracotta }); // (the greave)
}
export function foot(S) {
  const { p, g } = S;
  ball(g, 0.5);
  p.geo(sidePlate([[-0.85, -0.92], [0.85, -0.92], [0.85, -0.12], [0.35, -0.04], [-0.55, -0.12], [-0.85, -0.5]], 1.5), { c: L.bone }); // (the heel and instep)
  p.geo(sidePlate([[0.95, -0.92], [2.0, -0.92], [2.15, -0.72], [1.85, -0.5], [0.95, -0.2]], 1.4), { c: L.ivory }); // (the toe cap, a groove behind it)
  p.slab(1.56, 0.12, 3.0, { at: [0, -0.98, 0.62], c: L.slate }); // (the sole)
  seam(g, [[0.5, -0.12, 0.9], [0.2, -0.4, 1.4], [0.35, -0.75, 1.75]], 0.03);
}
