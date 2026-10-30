// ---------------------------------------------------------------------------------------
// THE FACILITIES' MODELS: the Spirit Garden's fixed places built to read by their shape alone from another planetoid (South, 2026-10-30:
// "the facilities need much stronger identity, readily identifiable silhouettes"), in the garden's one look: clay, glaze, Lachrymite,
// paper and lacquer. Each is a builder over the decor kit (vfx/garden/decorpieces/kit.js: soft primitives merged, vertex colours, a
// lamp's `g` lit by the hour) into two pieces: its body (lamps lit at dusk) and its fire (lit always, wavering). Metres, standing on
// its origin, +Y up, its front +Z; what stands below 0 is its footing, sunk into a planetoid's curve.
//
//   kura         the Pneuka Box's shed: a kura storehouse, white plaster over a namako band of black tiles and white lattice, a heavy
//                gabled roof of blue-grey tiles with a ridge and its horned end tiles, the gable to the front over a big round door of
//                vermilion lacquer in a black ring, brass studs and a ring pull, a gold mon in the gable (5.2 m)
//   moonGate     the gate out: a great round moon gate, a ring of plaster 4.2 m across on a stone plinth, celadon round its opening,
//                dark tiles on its crown, a short wall either side under a tiled cap (its veil is facilitylooks.js's)
//   athanor      the Athanor's furnace: an alchemist's tower furnace of brick on a stone foot, iron hoops, an arched firebox and sight
//                slits glowing, a verdigris dome ribbed in brass, a lantern cap smoking, an alembic on its west bracket and an aludel's
//                stacked pots on its east (8.8 m)
//   silkLantern  one silk cocoon hung as a lantern under the cocoon tree's crown: pale silk in ridges, a lacquer cap and tassel, lit at dusk
//   strawMat     the Chimney's mat: a round straw mat, its weave in rings, a vermilion rim
//   kilnChamber  one chamber of the climbing kiln: a vault across the slope on a stepped plinth, an ash glaze run over its crown, its
//                stoking ports glowing; `firebox` the mouth at its foot
//   stack        the kiln's chimney stack on the needle's summit: square brick, tapering, banded, corbelled, its mouth glowing (7 m)
//
// Prior art: the kura (dozō) of Kawagoe and Kurashiki (namako-kabe, the heavy kawara roof and its oni-gawara), the Chinese garden's moon
// gate (the Suzhou gardens' round doorways framing a view), the athanor of the alchemists' woodcuts (Geber's and Libavius's tower
// furnace, the philosophers' egg under its dome, the alembic and the aludel), the noborigama of Bizen and Shigaraki (chambers climbing a
// hill to a chimney, the natural ash glaze running), Sonic's and Mario Galaxy's landmark rule (a place known by its silhouette from
// across the level), and the decor kit's toy forms.
//
//   const { body, fire } = facilityPieces(kind, opts)   (each a Piece: .done() -> BufferGeometry, or null when empty)
//   FACILITY_KINDS   FC (the palette)   gableGeometry(w, h, d)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from './decorpieces/kit.js';

/** The facilities' palette (sRGB hexes): plaster, tiles, lacquer, brick, glazes, straw, silk, and the fire's dark coal (lit by `g`). */
export const FC = {
  plaster: 0xf1ece0, plasterD: 0xd9d2c2, tile: 0x3e4556, tileL: 0x59617a, tileD: 0x2a2f3c, namako: 0x2c2f37, lattice: 0xf4f1e8,
  vermilion: 0xc6402c, lacquer: 0x241c1f, gold: 0xe0b04a, brass: 0xc89a46, stone: 0xa39e94, stoneD: 0x6f6b66, stoneL: 0xc9c4b8,
  wood: 0x8b5e3c, woodD: 0x5a3a28, celadon: 0x9cc8b4, celadonD: 0x6e9e8a, brick: 0xa0563a, brickD: 0x7a3e2a, mortar: 0xdccbb2,
  verdigris: 0x4fa59a, iron: 0x3a383e, ash: 0x7d7440, kiln: 0xb06a3a, kilnD: 0x8a4e2c, straw: 0xd9c189, strawD: 0xb39a5c,
  silk: 0xf7f1e4, silkD: 0xe2d8c2, coal: 0x5a1c0c, lamp: 0xf6d27a,
};
export const FACILITY_KINDS = ['kura', 'moonGate', 'athanor', 'silkLantern', 'strawMat', 'kilnChamber', 'firebox', 'stack'];
const FLICKER = [4, 0, 0, 0]; // (the kit's FLICKER motion: a fire's glow wavers)
const PI = Math.PI;

/** A gable's infill: a triangular prism along x (width w), its base `d` deep and its apex `h` up (flat-shaded, as the hokora's). */
export function gableGeometry(w, h, d) {
  const x = w / 2, z = d / 2, V = [[-x, 0, z], [-x, 0, -z], [-x, h, 0], [x, 0, z], [x, 0, -z], [x, h, 0]];
  const F = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(F.flatMap((k) => V[k]), 3));
  g.computeVertexNormals(); return g;
}

/** A ring standing in the XY plane, `depth` thick along Z (an annulus extruded: the moon gate's ring). */
function annulus(R, r, depth, seg = 48) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, PI * 2, false);
  const h = new THREE.Path(); h.absarc(0, 0, r, 0, PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: seg }); g.translate(0, 0, -depth / 2);
  return g;
}

/** A box whose top is narrowed to `top` of its base (a tapering stack). */
function taperBox(w, h, d, top) {
  const g = new THREE.BoxGeometry(w, h, d, 1, 4, 1), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 1 - (1 - top) * ((P.getY(i) + h / 2) / h); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------------------------------------- the kura (the Pneuka Box's shed)
function kura(p, f) {
  const W = 3.6, D = 4.2, B = 0.5, H = 2.7, top = B + H, half = D / 2;
  p.box(W + 0.6, B + 0.6, D + 0.6, { at: [0, (B - 0.6) / 2, 0], c: FC.stoneD }, 0.08); // (the stone foot, sunk into the curve)
  p.slab(W, H, D, { at: [0, B + H / 2, 0], c: FC.plaster });
  // the namako band: black tiles under a white lattice set diagonally, round the lower walls
  p.slab(W + 0.06, 1.0, D + 0.06, { at: [0, B + 0.5, 0], c: FC.namako });
  p.slab(W + 0.1, 0.07, D + 0.1, { at: [0, B + 1.0, 0], c: FC.lattice });
  const rod = (at, rot) => p.slab(0.035, 1.3, 0.05, { at, rot, c: FC.lattice });
  for (let z = -half + 0.45; z <= half - 0.4; z += 0.5) for (const s of [-1, 1]) for (const a of [PI / 4, -PI / 4]) rod([s * (W / 2 + 0.04), B + 0.5, z], [a, 0, 0]);
  for (let x = -W / 2 + 0.45; x <= W / 2 - 0.4; x += 0.5) for (const a of [PI / 4, -PI / 4]) { rod([x, B + 0.5, -half - 0.04], [0, 0, a]); if (Math.abs(x) > 1.1) rod([x, B + 0.5, half + 0.04], [0, 0, a]); }
  p.slab(W + 0.16, 0.26, D + 0.16, { at: [0, top - 0.1, 0], c: FC.plasterD }); // (the band under the eaves)
  // the roof: the ridge along Z, its gable to the front; two thick slabs of tile, rows of round tiles down each, the ridge and its ends
  const run = W / 2 + 0.6, pitch = 0.5, rise = run * Math.tan(pitch), slope = run / Math.cos(pitch), len = D + 1.1;
  p.geo(gableGeometry(D, rise, W), { at: [0, top, 0], rot: [0, PI / 2, 0], c: FC.plaster }); // (the attic's white gables, front and back)
  for (const s of [-1, 1]) {
    const cx = s * run / 2, cy = top + rise / 2 - 0.1, nx = s * Math.sin(pitch), ny = Math.cos(pitch);
    p.slab(slope + 0.1, 0.3, len, { at: [cx, cy, 0], rot: [0, 0, -s * pitch], c: FC.tile });
    for (let z = -len / 2 + 0.2; z <= len / 2 - 0.15; z += 0.34) p.cyl(0.075, 0.075, slope, { at: [cx + nx * 0.16, cy + ny * 0.16, z], rot: [0, 0, s * (PI / 2 - pitch)], c: FC.tileL }, 6);
    p.slab(slope + 0.12, 0.12, 0.14, { at: [cx + nx * 0.1, cy + ny * 0.1, len / 2], rot: [0, 0, -s * pitch], c: FC.tileD }); // (the barge tiles at the gable's edge)
    p.slab(slope + 0.12, 0.12, 0.14, { at: [cx + nx * 0.1, cy + ny * 0.1, -len / 2], rot: [0, 0, -s * pitch], c: FC.tileD });
  }
  const ridge = top + rise + 0.25;
  p.box(0.56, 0.5, len + 0.1, { at: [0, ridge, 0], c: FC.tileD }, 0.06);
  p.cyl(0.21, 0.21, len + 0.2, { at: [0, ridge + 0.28, 0], rot: [PI / 2, 0, 0], c: FC.tile }, 10);
  for (const s of [-1, 1]) { // (the oni-gawara at each end, its two horns curling up and out)
    p.box(0.72, 0.7, 0.22, { at: [0, ridge + 0.32, s * (len / 2 + 0.12)], c: FC.tileD }, 0.06);
    for (const x of [-1, 1]) p.cone(0.11, 0.55, { at: [x * 0.26, ridge + 0.88, s * (len / 2 + 0.12)], rot: [0, 0, -x * 0.45], c: FC.tileD }, 6);
  }
  // the big round door: a black lacquer ring, the vermilion leaf with its planks, brass studs and a ring pull; a stone step
  const dy = B + 1.12, dz = half + 0.03;
  p.arc(1.02, 0.13, { at: [0, dy, dz + 0.04], c: FC.lacquer }, PI * 2, 28);
  p.cyl(0.92, 0.92, 0.12, { at: [0, dy, dz], rot: [PI / 2, 0, 0], c: FC.vermilion }, 24);
  for (let x = -0.6; x <= 0.61; x += 0.3) { const hgt = 2 * Math.sqrt(0.92 * 0.92 - x * x) - 0.08; p.slab(0.03, hgt, 0.02, { at: [x, dy, dz + 0.07], c: 0x8a2a1e }); }
  for (let k = 0; k < 14; k++) { const a = (k / 14) * PI * 2; p.ball(0.045, { at: [Math.cos(a) * 0.8, dy + Math.sin(a) * 0.8, dz + 0.08], c: FC.brass }, 6, 4); }
  p.arc(0.14, 0.03, { at: [0.42, dy - 0.05, dz + 0.12], c: FC.brass }, PI * 2, 12);
  p.box(1.6, 0.4, 0.8, { at: [0, 0.1, half + 0.6], c: FC.stone }, 0.05);
  // the mon in the gable: a gold ring round the Box's square
  p.arc(0.36, 0.055, { at: [0, top + rise * 0.42, half + 0.06], c: FC.gold }, PI * 2, 18);
  p.slab(0.26, 0.26, 0.04, { at: [0, top + rise * 0.42, half + 0.07], rot: [0, 0, PI / 4], c: FC.gold });
  // the high windows either side, iron-barred, lit within at dusk
  for (const s of [-1, 1]) {
    p.slab(0.08, 0.5, 0.62, { at: [s * (W / 2 + 0.02), top - 0.6, -0.6], c: FC.lacquer });
    p.slab(0.04, 0.38, 0.5, { at: [s * (W / 2 + 0.05), top - 0.6, -0.6], c: 0x3a2a1a, g: 1 });
    for (const z of [-0.78, -0.6, -0.42]) p.cyl(0.02, 0.02, 0.42, { at: [s * (W / 2 + 0.08), top - 0.6, z], c: FC.iron }, 4);
  }
  stoneLantern(p, [-1.6, 0, half + 0.8]);
}

/** A small stone lantern (the toro), its light box lit at dusk. */
function stoneLantern(p, [x, y, z], s = 1) {
  p.cyl(0.22 * s, 0.28 * s, 0.14 * s, { at: [x, y + 0.07 * s, z], c: FC.stoneD }, 6);
  p.cyl(0.08 * s, 0.1 * s, 0.7 * s, { at: [x, y + 0.49 * s, z], c: FC.stone }, 6);
  p.cyl(0.26 * s, 0.22 * s, 0.1 * s, { at: [x, y + 0.88 * s, z], c: FC.stone }, 6);
  p.slab(0.26 * s, 0.24 * s, 0.26 * s, { at: [x, y + 1.05 * s, z], c: FC.lamp, g: 1 });
  p.cone(0.36 * s, 0.26 * s, { at: [x, y + 1.3 * s, z], c: FC.stone }, 6);
  p.ball(0.06 * s, { at: [x, y + 1.47 * s, z], c: FC.stone }, 6, 4);
}

// ------------------------------------------------------------------------------------------------- the moon gate (the gate out)
function moonGate(p) {
  const R = 2.1, r = 1.5, cy = 2.25, depth = 0.72;
  p.box(5.6, 0.9, 1.3, { at: [0, -0.15, 0], c: FC.stoneD }, 0.06); // (the plinth, its foot sunk)
  p.geo(annulus(R, r, depth), { at: [0, cy, 0], c: FC.plaster });
  for (const z of [-1, 1]) p.arc(r + 0.02, 0.07, { at: [0, cy, z * (depth / 2 + 0.01)], c: FC.celadon }, PI * 2, 40); // (the glazed tiles round the opening)
  p.arc(R + 0.04, 0.15, { at: [0, cy, 0], rot: [0, 0, 0.3], sc: [1, 1, 3.1], c: FC.tile }, PI - 0.6, 20); // (dark tiles on its crown)
  p.arc(R + 0.16, 0.06, { at: [0, cy + 0.02, 0], rot: [0, 0, 0.32], sc: [1, 1, 7.2], c: FC.tileL }, PI - 0.64, 20);
  for (const s of [-1, 1]) { // (a short wall either side, under a tiled cap)
    p.slab(0.95, 2.5, 0.5, { at: [s * 2.4, 1.25, 0], c: FC.plaster });
    p.slab(1.05, 0.12, 0.72, { at: [s * 2.42, 2.55, 0], c: FC.tileD });
    p.geo(gableGeometry(1.05, 0.26, 0.72), { at: [s * 2.42, 2.6, 0], c: FC.tile });
    p.slab(0.98, 0.5, 0.54, { at: [s * 2.4, 0.25, 0], c: FC.namako });
  }
  for (const z of [-1, 1]) p.box(1.1, 0.18, 0.6, { at: [0, 0.05, z * 1.0], c: FC.stone }, 0.05); // (a stepping stone either side of the threshold)
  p.ball(0.1, { at: [0, cy + R + 0.32, 0], c: FC.gold }, 8, 6); // (a gold bead on its crown)
}

// ------------------------------------------------------------------------------------------------- the Athanor's tower furnace
function athanor(p, f) {
  p.cyl(2.2, 2.45, 1.2, { at: [0, 0, 0], c: FC.stoneD }, 8); // (the foot, half sunk)
  p.cyl(2.0, 2.15, 0.25, { at: [0, 0.68, 0], c: FC.stone }, 8);
  const prof = [[1.78, 0.6], [1.66, 2.0], [1.54, 4.2], [1.46, 6.0], [1.6, 6.12], [1.6, 6.36], [0.02, 6.4]];
  p.lathe(prof, { c: FC.brick }, 18);
  const rAt = (y) => (y < 2 ? 1.78 - 0.12 * (y - 0.6) / 1.4 : y < 4.2 ? 1.66 - 0.12 * (y - 2) / 2.2 : 1.54 - 0.08 * (y - 4.2) / 1.8);
  for (const y of [1.5, 2.6, 3.7, 4.9]) p.ring(rAt(y) + 0.01, 0.045, { at: [0, y, 0], c: FC.brickD }, 24, 4);
  for (const y of [1.0, 3.15, 5.45]) p.ring(rAt(y) + 0.03, 0.075, { at: [0, y, 0], c: FC.iron }, 24, 4);
  // the dome, ribbed in brass, and its lantern cap
  p.ball(1.58, { at: [0, 6.36, 0], sc: [1, 0.86, 1], c: FC.verdigris }, 18, 10);
  for (let k = 0; k < 4; k++) p.arc(1.59, 0.045, { at: [0, 6.36, 0], rot: [0, (k * PI) / 4, 0], sc: [1, 0.86, 1], c: FC.brass }, PI, 14);
  p.cyl(0.42, 0.48, 0.8, { at: [0, 7.9, 0], c: FC.brickD }, 8);
  p.ring(0.5, 0.06, { at: [0, 8.3, 0], c: FC.brass }, 12, 4);
  p.cone(0.6, 0.5, { at: [0, 8.55, 0], c: FC.verdigris }, 8);
  p.ball(0.11, { at: [0, 8.86, 0], c: FC.gold }, 8, 6);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + PI / 4; f.slab(0.16, 0.36, 0.06, { at: [Math.sin(a) * 0.46, 7.9, Math.cos(a) * 0.46], rot: [0, a, 0], c: FC.coal, g: 1, m: FLICKER }); }
  // the firebox's arched door to the front, its fire within; the sight slits round the upper body
  p.box(1.16, 1.2, 0.34, { at: [0, 1.4, 1.68], c: FC.lacquer }, 0.04);
  p.cyl(0.58, 0.58, 0.34, { at: [0, 2.0, 1.68], rot: [PI / 2, 0, 0], c: FC.lacquer }, 14);
  p.arc(0.62, 0.06, { at: [0, 2.0, 1.86], c: FC.brass }, PI, 12);
  for (const x of [-0.62, 0.62]) p.slab(0.1, 1.2, 0.1, { at: [x, 1.4, 1.86], c: FC.brass });
  f.slab(0.9, 1.0, 0.1, { at: [0, 1.35, 1.84], c: FC.coal, g: 1, m: FLICKER });
  f.cyl(0.45, 0.45, 0.1, { at: [0, 1.88, 1.84], rot: [PI / 2, 0, 0], c: FC.coal, g: 1, m: FLICKER }, 12);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2 + PI / 6; f.slab(0.16, 0.46, 0.12, { at: [Math.sin(a) * rAt(5.0), 5.0, Math.cos(a) * rAt(5.0)], rot: [0, a, 0], c: FC.coal, g: 1, m: FLICKER }); }
  // the alembic on its west bracket: a glazed flask, its long neck running into the tower
  p.slab(1.1, 0.14, 0.62, { at: [-2.1, 2.3, 0.2], c: FC.woodD });
  p.rod([-1.6, 1.4, 0.2], [-2.45, 2.25, 0.2], 0.06, { c: FC.woodD });
  p.lathe([[0.02, 0], [0.4, 0.08], [0.58, 0.38], [0.52, 0.72], [0.26, 0.98], [0.14, 1.12], [0.14, 1.3]], { at: [-2.3, 2.37, 0.2], c: FC.celadon }, 12);
  p.rod([-2.3, 3.62, 0.2], [-1.48, 4.45, 0.2], 0.075, { c: FC.celadon });
  p.ring(0.16, 0.04, { at: [-2.3, 3.55, 0.2], c: FC.brass }, 10, 4);
  // the aludel on its east: three pots stacked on a shelf, a little lid
  p.slab(1.0, 0.14, 0.7, { at: [2.05, 1.65, 0], c: FC.woodD });
  p.rod([1.62, 0.9, 0], [2.4, 1.6, 0], 0.06, { c: FC.woodD });
  for (let k = 0; k < 3; k++) p.lathe([[0.02, 0], [0.32, 0.04], [0.4, 0.22], [0.3, 0.42], [0.26, 0.46]], { at: [2.15, 1.72 + k * 0.44, 0], c: k % 2 ? FC.kiln : FC.celadonD }, 10);
  p.cone(0.3, 0.3, { at: [2.15, 3.2, 0], c: FC.brass }, 10);
}

// ------------------------------------------------------------------------------------------------- the cocoon tree's silk lanterns
function silkLantern(p, f, { at = [0, 0, 0], thread = 1, sc = 1 } = {}) {
  const [x, y, z] = at, s = sc, top = y;
  p.lathe([[0.02, -0.98], [0.15, -0.92], [0.28, -0.72], [0.33, -0.5], [0.29, -0.26], [0.16, -0.07], [0.04, 0]].map(([r, h]) => [r * s, h * s]), { at: [x, top, z], c: FC.silk, g: 0.9 }, 10);
  for (const h of [-0.3, -0.5, -0.7]) { const rr = h === -0.5 ? 0.33 : 0.29; p.ring(rr * s + 0.008, 0.016, { at: [x, top + h * s, z], c: FC.silkD, g: 0.6 }, 12, 3); }
  p.cyl(0.07 * s, 0.09 * s, 0.07 * s, { at: [x, top + 0.02, z], c: FC.lacquer }, 6);
  p.cyl(0.05 * s, 0.07 * s, 0.05 * s, { at: [x, top - 1.0 * s, z], c: FC.lacquer }, 6);
  p.cone(0.055 * s, 0.26 * s, { at: [x, top - 1.15 * s, z], rot: [PI, 0, 0], c: FC.vermilion }, 6);
  p.rod([x, top + 0.04, z], [x, top + thread, z], 0.012, { c: FC.silkD }, 3);
}

// ------------------------------------------------------------------------------------------------- the Chimney: the mat, the climbing kiln, the stack
function strawMat(p) {
  p.cyl(1.58, 1.62, 0.1, { at: [0, 0.04, 0], c: FC.straw }, 28);
  for (const r of [0.35, 0.7, 1.05, 1.38]) p.ring(r, 0.025, { at: [0, 0.095, 0], c: FC.strawD }, 24, 3);
  p.ring(1.62, 0.075, { at: [0, 0.07, 0], c: FC.vermilion }, 32, 4);
  p.ball(0.12, { at: [0, 0.1, 0], sc: [1, 0.4, 1], c: FC.gold }, 8, 4); // (a gold boss at its heart)
}

/** One chamber of the climbing kiln: a vault across the slope (along X), on a plinth `foot` m tall (its step up the slope). */
function kilnChamber(p, f, { foot = 0.3 } = {}) {
  const L = 2.3, R = 0.88;
  p.box(L + 0.3, foot + 0.6, 2 * R + 0.2, { at: [0, (foot - 0.6) / 2, 0], c: FC.stoneD }, 0.05);
  p.geo(new THREE.CylinderGeometry(R, R, L, 12, 1, false, 0, PI), { at: [0, foot, 0], rot: [0, 0, PI / 2], c: FC.kiln });
  p.geo(new THREE.CylinderGeometry(R + 0.03, R + 0.03, L + 0.04, 12, 1, true, PI * 0.3, PI * 0.4), { at: [0, foot, 0], rot: [0, 0, PI / 2], c: FC.ash }); // (the ash glaze run over its crown)
  for (const s of [-1, 1]) {
    p.ring(R * 0.92, 0.06, { at: [s * (L / 2 + 0.02), foot, 0], rot: [0, 0, PI / 2], c: FC.kilnD }, 14, 3);
    f.cyl(0.13, 0.13, 0.08, { at: [s * (L / 2 + 0.04), foot + 0.36, 0], rot: [0, 0, PI / 2], c: FC.coal, g: 1, m: FLICKER }, 8);
  }
}
/** The firebox at the kiln's foot: a squat dome, its arched mouth glowing down the slope (-Z). */
function firebox(p, f) {
  p.box(2.0, 0.9, 1.9, { at: [0, -0.15, 0], c: FC.stoneD }, 0.05);
  p.ball(0.95, { at: [0, 0.3, 0], sc: [1.05, 0.78, 1], c: FC.kilnD }, 12, 8);
  p.box(0.8, 0.62, 0.3, { at: [0, 0.55, -0.82], c: FC.lacquer }, 0.04);
  f.slab(0.6, 0.48, 0.06, { at: [0, 0.55, -0.98], c: FC.coal, g: 1, m: FLICKER });
}
/** The stack on the needle's summit: square brick tapering 1.3 to 0.9 m, banded, corbelled, its mouth glowing. */
function stack(p, f) {
  const H = 7;
  p.geo(taperBox(1.3, H, 1.3, 0.7), { at: [0, H / 2, 0], c: FC.brick });
  for (const y of [1.6, 3.3, 5.0]) { const w = 1.3 * (1 - 0.3 * (y / H)) + 0.08; p.slab(w, 0.2, w, { at: [0, y, 0], c: FC.mortar }); }
  p.slab(1.18, 0.3, 1.18, { at: [0, H + 0.1, 0], c: FC.brickD });
  p.slab(1.32, 0.14, 1.32, { at: [0, H + 0.3, 0], c: FC.brickD });
  f.slab(0.62, 0.06, 0.62, { at: [0, H + 0.38, 0], c: FC.coal, g: 1, m: FLICKER });
  p.box(2.2, 0.5, 2.2, { at: [0, 0.05, 0], c: FC.stoneD }, 0.05); // (its footing on the summit's platform)
}

const BUILD = { kura, moonGate, athanor, silkLantern, strawMat, kilnChamber, firebox, stack };

/** One facility's two pieces (its body and its fire), built afresh: merge them where they stand (facilitylooks.js). */
export function facilityPieces(kind, opts = {}) {
  const body = new Piece(), fire = new Piece();
  (BUILD[kind] || kura)(body, fire, opts);
  return { body: body.pos.length ? body : null, fire: fire.pos.length ? fire : null };
}
