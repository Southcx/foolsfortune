// ---------------------------------------------------------------------------------------
// THE SAFARI'S EGREGORES, AS PLACEHOLDER BODIES (docs/plans/OPEN-SEA.md section 5; the species: progress/opensea/safari.js EGREGORES,
// the herds: migrations.js, Dovina's). One simple body a species, a silhouette that reads at a distance across the water and its
// feeling's colour in its spots, in the Brine dress of the rail's Egregores (vfx/railfoes/egregores.js: a wet grey-blue hide over a pale
// belly, spots of bioluminescence lit in the feeling's colour). Nothing places them yet: laying a herd's bodies in its square, and a
// sighting's, is the world's (Petra's, OPEN-SEA.md 13); this is the body maker it calls. Bodies are built along +Z (the head), +Y up,
// the waterline at y 0, scaled to the species' `size` (its length in metres); they do not move (a placeholder: its mind and its
// moves come with the species' own body).
//   sealFolk     a seal raising its head (the selkie)             seaLights    corposants: balls of light hanging over the water
//   horseHerd    a horse's forequarters, a fish's tail (hippocamp) fishPeople   a pale head and shoulders over a koi's body and tail (ningyo)
//   wolfWhale    an orca's body with a wolf's head (the akhlut)   seaSerpent   three humps and a frilled head (the sea serpent)
//   seaMonk      a great dark dome of a head, two pale eyes (umibozu)
//   islandWhale  a whale's back as an islet, trees on it, its fluke behind (the aspidochelone)
//   ghostShip    a hull and three masts of tattered sails, glowing faintly (the Flying Dutchman)
//   bigSquid     a mantle reared out of the sea, its arms arched round it (the kraken)
//   worldSerpent four great humps and a horned head (Jormungandr)
// THE FEELINGS (`EGREGORE_FEEL`) are placeholders of this look's, read from each myth (the selkie's longing is Grief, the ghost ship
// keeps to grief and the sea monk to dread as their `lives` say): Dovina's and Espada's to rule.
//
// Cost: no new program (the islet program, isletlooks.js `isletMaterial`, one shared material); one draw a body; under 3,000 triangles.
//
// Prior art: the rail's Egregores (vfx/railfoes/egregores.js: countershaded hide, glowing spots); the myths themselves (the Physiologus'
// aspidochelone, Sinbad's island-whale; Toriyama Sekien's umibozu; the Inuit akhlut; Olaus Magnus' Carta Marina for the sea serpent and
// the kraken); Wind Waker's sea creatures (one strong silhouette each, under a big sky).
//
//   egregoreBody(species, { mat } = {}) -> { group, mesh, size, feel, tris }   EGREGORE_FEEL[species]   EGREGORE_SHAPES (the species built)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IsletKit, noise2 } from './isletkits/kit.js';
import { isletMaterial } from './isletlooks.js';
import { EGREGORES } from '../../progress/opensea/safari.js';
import { COLOR } from '../../progress/weather.js';
import { seeded } from '../../core/rng.js';

const PI = Math.PI;
/** Each species' feeling (placeholders: see the header). */
export const EGREGORE_FEEL = {
  sealFolk: 'grief', seaLights: 'wonder', horseHerd: 'mirth', fishPeople: 'desire', wolfWhale: 'fury', seaSerpent: 'dread',
  seaMonk: 'dread', islandWhale: 'wonder', ghostShip: 'grief', bigSquid: 'dread', worldSerpent: 'gall',
};
/** The Brine dress: hide, its dark, the pale belly, pearl, and an orca's white. */
const B = { hide: 0x4a5a66, hideD: 0x2c363e, belly: 0xc8ccc4, pearl: 0xe8eef0, ink: 0x15181c, white: 0xe6e8e2, sand: 0xe0d2a8, turf: 0x6a7448, wood: 0x3a3430 };
const shade = (line, top = B.hide, under = B.belly) => (x, y) => (y < line ? under : top);
const ball = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);
const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
/** Glowing spots in the feeling's colour, scattered over a patch. */
function spots(k, col, rng, n, at, spread, r = 0.04) {
  for (let i = 0; i < n; i++) k.add(new THREE.IcosahedronGeometry(r * rng.range(0.7, 1.3), 0), { c: col, glow: 0.85, p: [at[0] + rng.range(-1, 1) * spread[0], at[1] + rng.range(-1, 1) * spread[1], at[2] + rng.range(-1, 1) * spread[2]] });
}
/** A run of balls along a curve, thinning: a tentacle, a tail, a neck. */
function chain(k, pts, r0, r1, c, n = 12) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let i = 0; i <= n; i++) { const t = i / n, p = curve.getPoint(t); k.add(ball(r0 + (r1 - r0) * t, 8, 6), { c, p: [p.x, p.y, p.z] }); }
}
/** A hump: half a ring standing on the water along Z. */
const hump = (k, z, r, tube, c) => k.add(new THREE.TorusGeometry(r, tube, 8, 16, PI), { c, p: [0, -tube * 0.4, z], r: [0, PI / 2, 0] });

/** Each builder works in metres at its own length `L` (the body is scaled to the species' size). */
const SHAPES = {
  sealFolk: { L: 2, build(k, col, rng) {
    k.add(ball(0.5), { c: shade(0.05), p: [0, 0.1, 0], s: [0.55, 0.5, 1.0] });
    k.add(ball(0.24), { c: shade(0.48), p: [0, 0.5, 0.72] }); k.add(ball(0.13), { c: B.hideD, p: [0, 0.46, 0.94], s: [1, 0.8, 1.2] });
    for (const s of [-1, 1]) { k.add(ball(0.06, 6, 4), { c: B.ink, p: [s * 0.12, 0.58, 0.88] }); k.add(cone(0.12, 0.4, 4), { c: B.hideD, p: [s * 0.3, 0.05, 0.3], r: [0.5, 0, s * 1.2], s: [1, 1, 0.3] }); }
    k.add(cone(0.18, 0.4, 4), { c: B.hideD, p: [0, 0.05, -1.0], r: [-PI / 2, 0, 0], s: [1.6, 1, 0.3] });
    spots(k, col, rng, 7, [0, 0.32, 0], [0.18, 0.04, 0.5], 0.035);
  } },
  seaLights: { L: 1, build(k, col, rng) {
    for (let i = 0; i < 6; i++) { const a = rng() * PI * 2, d = rng.range(0, 0.45), y = rng.range(0.7, 1.9), r = rng.range(0.08, 0.16); k.add(new THREE.IcosahedronGeometry(r, 1), { c: col, glow: 1, p: [Math.cos(a) * d, y, Math.sin(a) * d] }); k.add(new THREE.IcosahedronGeometry(r * 0.5, 0), { c: 0xffffff, glow: 1, p: [Math.cos(a) * d, y, Math.sin(a) * d] }); }
    k.add(new THREE.TorusGeometry(0.5, 0.02, 3, 20), { c: col, glow: 0.6, p: [0, 0.02, 0], r: [PI / 2, 0, 0] }); // (their light on the water)
  } },
  horseHerd: { L: 3, build(k, col, rng) {
    k.add(ball(0.5), { c: shade(0.2), p: [0, 0.35, 0.35], s: [0.7, 0.8, 1.1] });
    k.add(cyl(0.18, 0.28, 0.9), { c: B.hide, p: [0, 0.95, 0.75], r: [0.6, 0, 0] });
    k.add(new THREE.BoxGeometry(0.22, 0.24, 0.62), { c: B.hide, p: [0, 1.32, 1.12], r: [0.5, 0, 0] });
    for (const s of [-1, 1]) { k.add(cone(0.05, 0.16, 4), { c: B.hideD, p: [s * 0.07, 1.5, 0.92] }); k.add(ball(0.04, 6, 4), { c: col, glow: 0.9, p: [s * 0.11, 1.38, 1.18] }); }
    for (const s of [-1, 1]) chain(k, [[s * 0.2, 0.3, 0.7], [s * 0.22, 0.45, 1.05], [s * 0.2, 0.15, 1.2]], 0.08, 0.06, B.hideD, 5);
    for (let i = 0; i < 5; i++) k.add(cone(0.1, 0.42, 3), { c: col, glow: 0.4, p: [0, 1.0 + i * 0.1, 0.5 + i * 0.13], r: [-0.9, 0, 0], s: [0.25, 1, 1] }); // (the mane, a fin in its feeling)
    chain(k, [[0, 0.2, -0.1], [0, 0.0, -0.7], [0, 0.4, -1.2], [0, 0.9, -1.1]], 0.32, 0.1, B.hide, 10);
    k.add(cone(0.3, 0.5, 4), { c: B.hideD, p: [0, 1.15, -1.0], r: [-0.4, 0, 0], s: [1, 1, 0.2] });
    spots(k, col, rng, 6, [0, 0.4, -0.6], [0.2, 0.25, 0.4]);
  } },
  fishPeople: { L: 1.5, build(k, col, rng) {
    k.add(ball(0.5), { c: shade(0.0, 0xc87a4a, B.belly), p: [0, -0.05, -0.15], s: [0.32, 0.3, 0.9] });
    k.add(ball(0.2), { c: B.belly, p: [0, 0.2, 0.42], s: [1.3, 0.8, 0.9] }); // (shoulders)
    k.add(ball(0.13), { c: B.pearl, p: [0, 0.48, 0.45] });
    for (const s of [-1, 1]) k.add(ball(0.025, 6, 4), { c: col, glow: 1, p: [s * 0.05, 0.5, 0.57] });
    for (let i = 0; i < 6; i++) k.add(new THREE.BoxGeometry(0.035, 0.42, 0.02), { c: B.ink, p: [(i - 2.5) * 0.04, 0.34, 0.33], r: [0.25, 0, (i - 2.5) * 0.08] }); // (long dark hair down the back)
    k.add(cone(0.26, 0.42, 4), { c: col, glow: 0.35, p: [0, 0.25, -0.72], r: [-PI / 2 + 0.7, 0, 0], s: [1.6, 1, 0.15] });
    spots(k, col, rng, 5, [0, 0.08, -0.2], [0.12, 0.04, 0.3], 0.025);
  } },
  wolfWhale: { L: 8, build(k, col, rng) {
    k.add(ball(1), { c: (x, y, z) => (y < -0.2 || (y < 0.4 && z > 1.2 && Math.abs(x) > 0.5) ? B.white : B.ink), p: [0, 0.1, 0], s: [1.2, 1.1, 3.4] });
    k.add(cone(0.55, 2.0, 4), { c: B.ink, p: [0, 1.9, -0.4], r: [-0.25, 0, 0], s: [0.2, 1, 1] });
    k.add(ball(0.8), { c: B.ink, p: [0, 0.75, 3.1], s: [0.9, 0.85, 1.1] }); k.add(ball(0.42), { c: B.hideD, p: [0, 0.55, 3.95], s: [0.8, 0.7, 1.3] });
    for (const s of [-1, 1]) { k.add(cone(0.22, 0.6, 4), { c: B.ink, p: [s * 0.42, 1.55, 3.0] }); k.add(ball(0.09, 6, 4), { c: col, glow: 1, p: [s * 0.4, 0.95, 3.7] }); }
    k.add(cone(0.9, 1.4, 4), { c: B.ink, p: [0, 0.35, -3.6], r: [PI / 2, 0, 0], s: [1.6, 1, 0.12] });
    spots(k, col, rng, 10, [0, 0.9, 0], [0.6, 0.15, 2.2], 0.08);
  } },
  seaSerpent: { L: 30, build(k, col, rng) {
    for (const [z, r] of [[-9, 2.2], [-2, 2.8], [5, 2.4]]) hump(k, z, r, 0.75, shade(0.6));
    chain(k, [[0, 0, 8], [0, 2.4, 10], [0, 4.2, 12.5]], 0.8, 0.7, B.hide, 8);
    k.add(ball(1.2), { c: B.hide, p: [0, 4.6, 13.6], s: [0.75, 0.65, 1.4] });
    for (const s of [-1, 1]) { k.add(ball(0.18, 6, 4), { c: col, glow: 1, p: [s * 0.55, 5.0, 14.4] }); k.add(cone(0.7, 1.6, 3), { c: col, glow: 0.3, p: [s * 0.8, 5.2, 13.0], r: [0, 0, s * -0.9], s: [1, 1, 0.15] }); }
    spots(k, col, rng, 14, [0, 1.8, -2], [0.4, 1.0, 8], 0.12);
  } },
  seaMonk: { L: 12, build(k, col) {
    k.add(ball(6, 18, 12), { c: (x, y) => (y > 6.5 ? B.hideD : B.ink), p: [0, -1.2, 0], s: [1, 1.25, 0.9] });
    k.add(ball(6.4, 18, 8), { c: B.ink, p: [0, -2.5, -0.5], s: [1.15, 0.45, 1] }); // (its shoulders at the water)
    for (const s of [-1, 1]) { k.add(ball(0.9, 10, 8), { c: B.pearl, glow: 0.5, p: [s * 1.8, 3.4, 5.0], s: [1, 0.7, 0.4] }); k.add(ball(0.42, 8, 6), { c: col, glow: 1, p: [s * 1.8, 3.4, 5.3], s: [1, 0.8, 0.4] }); }
  } },
  islandWhale: { L: 120, build(k, col, rng) {
    k.add(ball(1, 24, 12), { c: (x, y, z) => (y > 3.0 ? (noise2(x * 0.1, z * 0.1) > 0.45 ? B.turf : B.sand) : y > 0.4 ? B.sand : B.hide), p: [0, -3, 0], s: [20, 7, 50] });
    for (const [x, z, h] of [[-4, 8, 9], [3, 14, 11], [1, -6, 8]]) { k.add(cyl(0.35, 0.55, h, 6), { c: B.wood, p: [x, 3.2 + h / 2, z], r: [0.1, 0, 0.12] }); for (let i = 0; i < 5; i++) k.add(cone(0.6, 4, 3), { c: B.turf, p: [x + Math.cos(i * 1.26) * 1.5, 3.2 + h, z + Math.sin(i * 1.26) * 1.5], r: [Math.sin(i * 1.26) * 1.1, 0, -Math.cos(i * 1.26) * 1.1], s: [1, 1, 0.25] }); }
    for (let i = 0; i < 3; i++) k.lump(rng.range(1.5, 3), rng, { c: 0x7a7066, p: [rng.range(-8, 8), 3.5, rng.range(-20, 25)], s: [1, 0.6, 1], detail: 0 });
    k.add(cone(9, 10, 4), { c: B.hide, p: [0, 3, -56], r: [-0.5, 0, 0], s: [2.2, 1, 0.12] });
    for (const s of [-1, 1]) k.add(ball(1.2, 8, 6), { c: col, glow: 0.9, p: [s * 17, 0.8, 34] }); // (its eyes, low at the water: the islet looks back)
    spots(k, col, rng, 20, [0, 0.6, 0], [18, 0.4, 40], 0.5);
  } },
  ghostShip: { L: 40, build(k, col, rng) {
    const pale = 0x8a9a96, paleD = 0x5a6662;
    k.add(new THREE.BoxGeometry(7, 4.5, 30), { c: paleD, glow: 0.12, p: [0, 1.2, 0] });
    k.add(cone(3.5, 8, 4), { c: paleD, glow: 0.12, p: [0, 1.5, 19], r: [PI / 2, PI / 4, 0], s: [1, 1, 0.6] });
    k.add(new THREE.BoxGeometry(7.4, 3, 6), { c: paleD, glow: 0.12, p: [0, 4.5, -12] }); // (the sterncastle)
    for (const [z, h] of [[9, 22], [-1, 28], [-9, 20]]) {
      k.add(cyl(0.3, 0.45, h, 6), { c: B.wood, p: [0, 3.4 + h / 2, z] });
      for (const [y, w] of [[0.45, 10], [0.75, 8]]) {
        const sail = new THREE.PlaneGeometry(w, h * 0.26, 4, 2), P = sail.attributes.position.array;
        for (let i = 0; i < P.length; i += 3) P[i + 2] = Math.sin((P[i] / w + 0.5) * PI) * 0.8; sail.computeVertexNormals();
        k.add(sail, { c: (x, yy) => (noise2(x * 0.6, yy * 0.6 + z) > 0.62 ? paleD : pale), glow: (x, yy) => (noise2(x * 0.6, yy * 0.6 + z) > 0.62 ? 0 : 0.3), p: [0, 3.4 + h * y, z] });
        k.add(sail.clone().rotateY(PI), { c: pale, glow: 0.3, p: [0, 3.4 + h * y, z - 0.02] }); // (its back, for the one-sided program)
      }
    }
    k.add(ball(0.7, 8, 6), { c: col, glow: 1, p: [0, 7, -15.5] }); // (the stern lantern)
    spots(k, col, rng, 10, [0, 2, 0], [3.6, 1.2, 13], 0.25);
  } },
  bigSquid: { L: 50, build(k, col, rng) {
    k.add(cone(5, 18, 10), { c: shade(4, 0x6a3a44, 0xb8a0a0), p: [0, 8, -4], r: [-0.45, 0, 0] });
    for (const s of [-1, 1]) k.add(ball(1.4, 10, 8), { c: col, glow: 0.8, p: [s * 3.8, 2.4, 1.5] });
    for (let i = 0; i < 7; i++) {
      const a = PI * (0.1 + 0.8 * (i / 6)), x = Math.cos(a) * 14, z = Math.sin(a) * 14 + 2, h = rng.range(9, 15);
      chain(k, [[x * 0.25, 0, z * 0.25], [x * 0.6, h, z * 0.6], [x * 0.95, h * 0.6, z * 0.95], [x * 1.1, 0, z * 1.1]], 1.6, 0.4, 0x6a3a44, 14);
    }
    spots(k, col, rng, 14, [0, 9, -4], [3, 6, 2], 0.35);
  } },
  worldSerpent: { L: 400, build(k, col, rng) {
    for (const [z, r] of [[-150, 28], [-70, 34], [10, 32], [90, 26]]) hump(k, z, r, 9, shade(10, 0x4a5a3a, 0xb8c0a0));
    chain(k, [[0, 0, 130], [0, 22, 150], [0, 40, 168]], 9, 8, 0x4a5a3a, 8);
    k.add(ball(12), { c: 0x4a5a3a, p: [0, 44, 182], s: [0.8, 0.6, 1.5] });
    for (const s of [-1, 1]) { k.add(cone(3, 22, 6), { c: B.pearl, p: [s * 7, 56, 172], r: [-0.7, 0, s * -0.4] }); k.add(ball(2, 8, 6), { c: col, glow: 1, p: [s * 6.5, 48, 194] }); }
    spots(k, col, rng, 30, [0, 18, -30], [6, 12, 140], 1.6);
  } },
};
export const EGREGORE_SHAPES = Object.keys(SHAPES);

let SHARED = null; // (one material for every body: the islet program)
/** One species' placeholder body, scaled to its size; `mat` the islet program's material to draw it with (one shared, by default). */
export function egregoreBody(species, { mat = null } = {}) {
  const S = SHAPES[species] || SHAPES.sealFolk, E = EGREGORES[species] || {}, feel = EGREGORE_FEEL[species] || 'wonder';
  const k = new IsletKit(), rng = seeded(species.length * 7919 + 13);
  S.build(k, COLOR[feel] ?? 0xffffff, rng);
  const b = k.build(), mesh = new THREE.Mesh(b.geo, mat || (SHARED ||= isletMaterial())), group = new THREE.Group();
  const size = E.size ?? S.L; mesh.scale.setScalar(size / S.L); mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh); group.name = `egregore:${species}`; group.userData.species = species;
  return { group, mesh, size, feel, tris: b.tris };
}
