// ---------------------------------------------------------------------------------------
// THE ISLETS' PUZZLES, THEIR SHAPES (vfx/opensea/puzzlelooks.js dresses them; the pieces: world/opensea/puzzlepieces.js, the rules:
// progress/opensea/isletpuzzles.js, Dovina's). Each builder bakes one geometry on the islet kit (isletkits/kit.js: its colour and glow
// in the vertex), so every piece draws with the one islet program, and each is built in its placeholder's own frame (its origin `lift`
// m over the islet's top, so a shape stands on y -lift):
//   carving(shape, colour)   a pair's carving: a figure carved in the islet's stone and painted in its pair's colour, weathered in its
//                            hollows, on a rough plinth (urn, fish, bell, wheel, hand, moon: six silhouettes that differ at 6 m)
//   lineupStone()            the line-up's flat stone: a worn disc with two footprints cut in it, a groove and two foresight posts along
//                            +Z (the line), Wonder's gold ring inlaid
//   lineupArc(rho, tube)     one quarter of the ring: voussoirs of pale stone round the placeholder's own radius and tube (the puzzle's
//                            scale kept exactly), a vein of Lachrymite on the face toward the eye (-Z)
//   singingStone()           a menhir with three holes through it (dark wells on both faces) and the five degrees' colours inlaid in an
//                            arc: the voice the listening stone answers
//   listeningStone()         a broader menhir with a flat top cut with a cup a note, where the sockets rest, and a spiral cut in its face
//   cacheBox()               the dug cache: { pit, body, lid }: the hole and its thrown sand (stays on the ground), the old banded sea
//                            chest (rises), its barrel lid (hinged at the back, at the body's top: opens about -X), a few cubes inside
//
// Prior art: the kit's own secrets (isletkits/secrets.js: the chest, the stele); the standing stones of Carnac and the Men-an-Tol (a
// stone with a hole through it), the cup-marked stones of the British Isles; a ship's wheel's spokes; an amphora's lathe profile; a
// voussoir arch (wedge stones round a curve); a sea chest's barrel lid and iron straps.
//
//   carving(shape, colour, rng, lift)   lineupStone(lift)   lineupArc(rho, tube)   singingStone(rng, lift, degreeColours)
//   listeningStone(rng, lift, n)   cacheBox(rng) -> { pit, body, lid, hinge: [y, z] }   CARVINGS (the six shapes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IsletKit, PAL, noise2, twoSided } from './isletkits/kit.js';

const PI = Math.PI;
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();
const weathered = (c, k = 4.5) => (x, y, z) => { const n = noise2(x * k + z * 3.1, y * k - z * 2.3); return n > 0.68 ? mix(c, PAL.stoneD, 0.45) : n < 0.2 ? mix(c, PAL.white, 0.12) : c; };
const mottle = (a, b, k = 3) => (x, y, z) => mix(a, b, noise2(x * k + z * 1.7, y * k + z * 2.9));
const lathe = (pts, n = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n);

/** A rough plinth of the islet's stone, its top at `g + top`. */
function plinth(k, g, rng, top = 0.32) {
  k.lump(0.5, rng, { c: mottle(PAL.stone, PAL.stoneD), p: [0, g + top * 0.45, 0], s: [1, top * 1.6, 0.9], detail: 1, rough: 0.18, rot: [0, rng() * 6.28, 0] });
  return g + top;
}

const FIGURE = {
  urn(k, y, c) { // an amphora: a lathe body, two handles
    k.add(lathe([[0, 0], [0.14, 0], [0.2, 0.08], [0.33, 0.32], [0.36, 0.52], [0.3, 0.74], [0.15, 0.9], [0.12, 1.0], [0.18, 1.06], [0.15, 1.1], [0, 1.1]], 12), { c: weathered(c), glow: 0.06, p: [0, y, 0] });
    for (const s of [-1, 1]) k.add(new THREE.TorusGeometry(0.15, 0.04, 4, 8, PI), { c: weathered(c), glow: 0.06, p: [s * 0.24, y + 0.84, 0], r: [0, 0, s > 0 ? -PI / 2 : PI / 2] });
  },
  fish(k, y, c) { // a fish leaping off a post: its body, tail, fins and an eye
    k.add(new THREE.CylinderGeometry(0.06, 0.08, 0.32, 6), { c: PAL.stoneD, p: [0, y + 0.16, 0] });
    const at = [0, y + 0.62, 0], tilt = [-0.4, 0, 0];
    k.add(new THREE.SphereGeometry(0.5, 12, 8), { c: weathered(c), glow: 0.06, p: at, s: [0.22, 0.34, 0.66], r: tilt });
    k.add(new THREE.ConeGeometry(0.3, 0.42, 4), { c: weathered(c), glow: 0.06, p: [0, y + 0.62 - 0.27, -0.62], s: [0.22, 1, 1], r: [PI / 2 - 0.4, 0, 0] });
    k.add(new THREE.ConeGeometry(0.16, 0.34, 3), { c: weathered(c), glow: 0.06, p: [0, y + 0.98, 0.0], s: [0.25, 1, 1], r: [-0.9, 0, 0] });
    for (const s of [-1, 1]) k.add(new THREE.SphereGeometry(0.05, 6, 4), { c: PAL.iron, p: [s * 0.1, y + 0.74, 0.42] });
  },
  bell(k, y, c) { // a bell standing on its lip, its crown loop, a clapper's knob under the rim
    k.add(lathe([[0, 0.03], [0.44, 0], [0.47, 0.06], [0.37, 0.2], [0.28, 0.48], [0.25, 0.76], [0.17, 0.94], [0, 1.0]], 14), { c: weathered(c), glow: 0.06, p: [0, y, 0] });
    k.add(new THREE.TorusGeometry(0.09, 0.035, 4, 10), { c: weathered(c), glow: 0.06, p: [0, y + 1.07, 0] });
    k.add(new THREE.TorusGeometry(0.43, 0.03, 3, 18), { c: mix(c, PAL.white, 0.25), glow: 0.1, p: [0, y + 0.08, 0], r: [PI / 2, 0, 0] });
  },
  wheel(k, y, c) { // a ship's wheel upright on a stand: rim, hub, eight spokes running out to handles
    const h = y + 0.62;
    k.add(new THREE.BoxGeometry(0.14, 0.3, 0.14), { c: PAL.stoneD, p: [0, y + 0.15, 0] });
    k.add(new THREE.TorusGeometry(0.4, 0.05, 5, 20), { c: weathered(c), glow: 0.06, p: [0, h, 0] });
    k.add(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 8), { c: weathered(c), glow: 0.06, p: [0, h, 0], r: [PI / 2, 0, 0] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.add(new THREE.CylinderGeometry(0.025, 0.04, 1.08, 5), { c: weathered(c), glow: 0.06, p: [0, h, 0], r: [0, 0, a] }); }
  },
  hand(k, y, c) { // an open hand raised, palm out (+Z), on its wrist
    k.add(new THREE.CylinderGeometry(0.11, 0.13, 0.32, 8), { c: weathered(c), glow: 0.06, p: [0, y + 0.16, 0] });
    k.add(new THREE.BoxGeometry(0.4, 0.42, 0.13), { c: weathered(c), glow: 0.06, p: [0, y + 0.52, 0] });
    const F = [[-0.15, 0.3, 0.06], [-0.05, 0.36, 0], [0.05, 0.38, 0], [0.15, 0.33, -0.04]];
    for (const [x, L, lean] of F) k.add(new THREE.CylinderGeometry(0.045, 0.05, L, 6), { c: weathered(c), glow: 0.06, p: [x + lean * 0.5, y + 0.73 + L / 2, 0], r: [0, 0, -lean] });
    k.add(new THREE.CylinderGeometry(0.05, 0.055, 0.28, 6), { c: weathered(c), glow: 0.06, p: [-0.27, y + 0.55, 0.02], r: [0, 0, 0.9] });
  },
  moon(k, y, c) { // a crescent standing on its horns' curve: two arcs, extruded, edges softened
    const S = new THREE.Shape(); S.absarc(0, 0, 0.5, PI * 0.18, PI * 1.82, false); S.absarc(0.2, 0, 0.4, PI * 1.62, PI * 0.38, true);
    const g = new THREE.ExtrudeGeometry(S, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 14 }).translate(0, 0, -0.08);
    k.add(g, { c: weathered(c), glow: 0.06, p: [0.05, y + 0.56, 0], r: [0, 0, PI / 2] });
  },
};
export const CARVINGS = Object.keys(FIGURE);

/** A pair's carving: its figure in its pair's colour, carved in stone on a plinth (the placeholder's frame: ground at -lift). */
export function carving(shape, colour, rng, lift = 0.75) {
  const k = new IsletKit(), top = plinth(k, -lift, rng);
  (FIGURE[shape] || FIGURE.urn)(k, top, colour);
  return k.build().geo;
}

/** The line-up's flat stone: the line is +Z (the caller turns it to the bearing). */
export function lineupStone(lift = 0.1) {
  const k = new IsletKit(), g = -lift, top = g + 0.2;
  k.add(new THREE.CylinderGeometry(0.95, 1.04, 0.2, 14, 1), { c: (x, y, z) => (y > top - 0.02 ? mottle(0xc8beb0, 0xa8a094, 2.5)(x, y, z) : PAL.stoneD), p: [0, g + 0.1, 0] });
  k.add(new THREE.TorusGeometry(0.78, 0.025, 3, 28), { c: PAL.gold, glow: 0.18, p: [0, top + 0.005, 0], r: [PI / 2, 0, 0] });
  for (const s of [-1, 1]) { // (the footprints: where to stand, facing the line)
    k.add(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 8), { c: PAL.stoneD, p: [s * 0.13, top + 0.004, -0.12], s: [1, 1, 2.1] });
    k.add(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 7), { c: PAL.stoneD, p: [s * 0.13, top + 0.004, -0.36], s: [1, 1, 1.2] });
  }
  k.add(new THREE.BoxGeometry(0.05, 0.012, 0.42), { c: PAL.gold, glow: 0.18, p: [0, top + 0.006, 0.45] });
  k.add(new THREE.ConeGeometry(0.09, 0.16, 3), { c: PAL.gold, glow: 0.2, p: [0, top + 0.006, 0.72], r: [PI / 2, 0, 0], s: [1, 1, 0.1] });
  for (const s of [-1, 1]) k.add(new THREE.CylinderGeometry(0.04, 0.06, 0.2, 5), { c: PAL.stoneD, p: [s * 0.12, top + 0.1, 0.9] }); // (the foresight: a notch to look through)
  return k.build().geo;
}

/** One quarter-arc of the line-up's ring, at the placeholder's own radius and tube (its scale is the puzzle): eight voussoirs, their
 *  joints dark, a Lachrymite vein along the face toward the eye. */
export function lineupArc(rho, tube) {
  const k = new IsletKit(), seg = PI / 2 / 8;
  const c = (x, y, z) => {
    const a = Math.atan2(y, x), f = (a / seg) % 1, joint = Math.min(f, 1 - f) < 0.06, block = Math.floor(a / seg) & 1;
    if (z < -0.62 * tube) return PAL.crystal; // (the vein, facing the eye)
    return joint ? PAL.stoneD : block ? 0xd2c8b6 : 0xc2b8a6;
  };
  k.add(new THREE.TorusGeometry(rho, tube, 8, 48, PI / 2), { c, glow: (x, y, z) => (z < -0.62 * tube ? 0.45 : 0) });
  return k.build().geo;
}

/** A menhir: a slab, its top tapered and tilted, its faces pushed by noise. */
function menhir(k, g, w, h, d, rng, colour = mottle(PAL.stone, PAL.stoneD, 3.5), flatTop = false) {
  const s = new THREE.BoxGeometry(w, h, d, 3, 6, 2), P = s.attributes.position.array, tilt = rng.range(-0.1, 0.1);
  for (let i = 0; i < P.length; i += 3) {
    const t = (P[i + 1] + h / 2) / h, taper = flatTop ? 1 - 0.12 * t : 1 - 0.3 * t * t;
    P[i] *= taper; P[i + 2] *= 1 - 0.15 * t;
    if (!flatTop && t > 0.95) P[i + 1] += P[i] * tilt * 2;
    P[i] += (noise2(P[i + 1] * 2.6, P[i + 2] * 3 + 1.3) - 0.5) * 0.08; P[i + 2] += (noise2(P[i] * 2.4 + 4, P[i + 1] * 2.2) - 0.5) * 0.06;
  }
  s.computeVertexNormals();
  k.add(s, { c: colour, p: [0, g + h / 2, 0], r: [rng.range(-0.03, 0.03), 0, rng.range(-0.04, 0.04)] });
}

/** The singing stone: three holes through it, and the five degrees' colours inlaid in an arc on its face. */
export function singingStone(rng, lift = 1.1, degreeColours = []) {
  const k = new IsletKit(), g = -lift;
  menhir(k, g, 0.95, 2.3, 0.58, rng);
  for (const [x, y, r] of [[0.05, 1.75, 0.13], [-0.16, 1.3, 0.1], [0.12, 0.95, 0.08]]) for (const s of [-1, 1]) {
    k.add(new THREE.CylinderGeometry(r, r * 0.8, 0.06, 9), { c: PAL.deep, p: [x, g + y, s * 0.27], r: [PI / 2, 0, 0] }); // (a hole through: dark wells on both faces)
    k.add(new THREE.TorusGeometry(r * 1.05, 0.02, 3, 12), { c: PAL.stoneD, p: [x, g + y, s * 0.29] });
  }
  degreeColours.forEach((col, i) => { const a = PI * (0.15 + 0.7 * (i / Math.max(1, degreeColours.length - 1))); k.add(new THREE.IcosahedronGeometry(0.055, 0), { c: col, glow: 0.7, p: [Math.cos(a) * 0.32, g + 0.42 + Math.sin(a) * 0.22, 0.3] }); });
  return k.build().geo;
}

/** The listening stone: a broad menhir, flat on top, a cup cut there for each of the `n` sockets (they rest 0.15 m over the top, 0.3 m
 *  apart along X: puzzlepieces.js), and a spiral cut in its face. */
export function listeningStone(rng, lift = 1.1, n = 4) {
  const k = new IsletKit(), g = -lift, top = g + 2.2;
  menhir(k, g, 1.45, 2.2, 0.68, rng, mottle(0x948c80, PAL.stoneD, 3.2), true);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.3;
    k.add(new THREE.CylinderGeometry(0.13, 0.1, 0.06, 10), { c: PAL.deep, p: [x, top - 0.0, 0] });
    k.add(new THREE.TorusGeometry(0.15, 0.035, 3, 12), { c: PAL.stoneD, p: [x, top + 0.01, 0], r: [PI / 2, 0, 0] });
  }
  for (let i = 0; i < 4; i++) k.add(new THREE.TorusGeometry(0.08 + i * 0.07, 0.016, 3, 14, PI * 1.5), { c: PAL.gold, glow: 0.12, p: [0, g + 1.15, 0.33], r: [0, 0, i * 0.9] }); // (the ear: a spiral cut and gilded)
  return k.build().geo;
}

/** The dug cache: the pit (stays on the ground), the chest's body (rises out of it) and its lid (hinged at the back of the body's top). */
export function cacheBox(rng) {
  const pit = new IsletKit(), body = new IsletKit(), lid = new IsletKit();
  pit.add(new THREE.CylinderGeometry(0.62, 0.66, 0.03, 14), { c: PAL.sandD, p: [0, 0.01, 0] }); // (the hole's dark sand)
  pit.add(new THREE.TorusGeometry(0.78, 0.16, 5, 16), { c: mottle(PAL.sand, PAL.sandW, 4), p: [0, 0.02, 0], r: [PI / 2, 0, 0], s: [1, 1, 0.55] }); // (the sand thrown out round it)
  for (let i = 0; i < 5; i++) { const a = rng() * PI * 2, d = rng.range(1, 1.5); pit.lump(rng.range(0.08, 0.14), rng, { c: PAL.sandW, p: [Math.cos(a) * d, 0.02, Math.sin(a) * d], s: [1, 0.4, 1], detail: 0 }); }
  const W = 0.8, H = 0.42, D = 0.55, wood = (x, y, z) => mix(PAL.wood, PAL.woodD, noise2(x * 9, y * 3 + z * 7)); // (grain along it)
  body.add(new THREE.BoxGeometry(W, H, D), { c: wood, p: [0, H / 2, 0] });
  body.add(new THREE.BoxGeometry(W - 0.08, 0.02, D - 0.08), { c: PAL.deep, p: [0, H + 0.015, 0] }); // (the dark inside, 1.5 cm proud: casebook rule 1)
  for (const x of [-0.3, 0, 0.3]) body.add(new THREE.BoxGeometry(0.06, H + 0.02, D + 0.03), { c: PAL.iron, p: [x, H / 2, 0] });
  body.add(new THREE.BoxGeometry(0.13, 0.15, 0.04), { c: PAL.gold, glow: 0.12, p: [0, H - 0.08, D / 2 + 0.02] }); // (the hasp)
  for (let i = 0; i < 5; i++) body.add(new THREE.BoxGeometry(0.1, 0.1, 0.1), { c: PAL.crystal, glow: 0.8, p: [rng.range(-0.25, 0.25), H - 0.02 + rng.range(0, 0.05), rng.range(-0.14, 0.14)], r: [rng() * 3, rng() * 3, rng() * 3] }); // (cubes inside)
  lid.add(twoSided(new THREE.CylinderGeometry(D / 2, D / 2, W, 10, 1, false, 0, PI)), { c: wood, p: [0, 0, D / 2], r: [0, 0, PI / 2] }); // (its frame: the hinge at the origin, the lid running +Z over the body; two-sided, its inside seen when open)
  for (const x of [-W / 2, W / 2]) lid.add(twoSided(new THREE.CircleGeometry(D / 2, 10, 0, PI)), { c: PAL.woodD, p: [x, 0, D / 2], r: [0, -PI / 2, 0] }); // (its two ends)
  for (const x of [-0.3, 0, 0.3]) lid.add(new THREE.TorusGeometry(D / 2 + 0.01, 0.03, 3, 8, PI), { c: PAL.iron, p: [x, 0, D / 2], r: [0, PI / 2, 0] });
  return { pit: pit.build().geo, body: body.build().geo, lid: lid.build().geo, hinge: [H, -D / 2] };
}
