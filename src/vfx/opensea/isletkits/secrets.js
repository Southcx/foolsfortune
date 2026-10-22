// ---------------------------------------------------------------------------------------
// THE ISLETS' SECRETS, AS LOOKS (vfx/opensea/isletlooks.js; the secrets: progress/opensea/islets.js SECRETS, Dovina's). One small shape a
// kind, built on the islet kit (isletkits/kit.js) so it draws with the one islet program, and swapped into the placeholder's own mesh
// (world/opensea/seaprops.js; the room hides that mesh when the secret is taken). The frame is the placeholder's: its origin `lift` m
// over the islet's top, so every shape stands on y -lift.
//   chest     a small banded chest, gold bands and lock
//   ostracon  a potsherd leaning on a little cairn
//   vantage   a flat lookout stone, Wonder's ring inlaid in gold (the vantage's stand: GLOSSARY, a vantage's frame)
//   nest      a dark tangle of strands, a few motes glowing in it
//   fuel      a small stack of casks, iron-hooped
//   stele     a standing stone, its face cut with three lines of marks
//   fishing   a mooring post with a net hung on it, a gold glass float
//   crystal   a Lachrymite crystal cluster on its rock, giving off its light
//
// Prior art: Wind Waker's island secrets (one readable thing, big enough to see from the boat), the Dunes' crystals (world/dunes/
// crystals.js: hexagonal prisms with points, Lachrymite's pale cyan) and a cooper's cask (staves bulged at the bilge, hoops at the chimes).
//
//   secretGeometry(kind, rng, lift) -> BufferGeometry (with `color` and `glow`)   SECRET_KINDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IsletKit, PAL, noise2, twoSided } from './kit.js';

const PI = Math.PI;
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();

const BUILD = {
  chest(k, g) {
    k.add(new THREE.BoxGeometry(0.95, 0.5, 0.62), { c: PAL.wood, p: [0, g + 0.25, 0] });
    k.add(new THREE.CylinderGeometry(0.31, 0.31, 0.95, 8, 1, false, 0, PI), { c: PAL.woodD, p: [0, g + 0.5, 0], r: [0, 0, PI / 2] });
    for (const x of [-0.36, 0, 0.36]) {
      k.add(new THREE.BoxGeometry(0.07, 0.52, 0.66), { c: PAL.gold, glow: 0.06, p: [x, g + 0.25, 0] });
      k.add(new THREE.TorusGeometry(0.33, 0.035, 3, 8, PI), { c: PAL.gold, glow: 0.06, p: [x, g + 0.5, 0], r: [0, PI / 2, 0] });
    }
    k.add(new THREE.BoxGeometry(0.14, 0.18, 0.06), { c: PAL.goldL, glow: 0.2, p: [0, g + 0.5, 0.33] });
  },
  ostracon(k, g, rng) {
    let y = g;
    for (let i = 0; i < 4; i++) { const s = 0.42 - i * 0.08; k.lump(s, rng, { c: i % 2 ? PAL.stone : PAL.stoneD, p: [rng.range(-0.04, 0.04), y + s * 0.3, rng.range(-0.04, 0.04)], s: [1, 0.45, 1], detail: 0, rough: 0.2 }); y += s * 0.55; }
    const sherd = new THREE.CylinderGeometry(0.42, 0.38, 0.38, 6, 1, true, 0, 1.3);
    k.add(twoSided(sherd.toNonIndexed()), { c: (x, yy, z, ny) => (noise2(x * 9, yy * 9) > 0.7 ? PAL.clayW : PAL.clay), p: [-0.12, y + 0.12, -0.3], r: [0.5, 0.4, 0.15] });
    k.add(new THREE.BoxGeometry(0.03, 0.12, 0.02), { c: PAL.clayW, p: [0.02, y + 0.16, 0.07], r: [0.5, 0, 0] }); // (its word, cut)
  },
  vantage(k, g) {
    k.add(new THREE.CylinderGeometry(1.0, 1.15, 0.35, 10, 1), { c: PAL.stoneD, p: [0, g + 0.17, 0] });
    k.add(new THREE.CylinderGeometry(0.9, 0.95, 0.2, 10, 1), { c: PAL.white, p: [0, g + 0.45, 0] });
    k.add(new THREE.TorusGeometry(0.6, 0.05, 3, 20), { c: PAL.gold, glow: 0.18, p: [0, g + 0.56, 0], r: [PI / 2, 0, 0] });
  },
  nest(k, g, rng) {
    for (let i = 0; i < 14; i++) {
      const a = rng() * PI * 2, d = rng.range(0, 0.45), L = rng.range(0.9, 1.6);
      k.add(new THREE.BoxGeometry(0.07, 0.07, L), { c: i % 3 ? PAL.nest : PAL.nestL, p: [Math.cos(a) * d, g + rng.range(0.1, 0.55), Math.sin(a) * d], r: [rng.range(-0.6, 0.6), rng() * PI, rng.range(-0.6, 0.6)] });
    }
    for (let i = 0; i < 4; i++) { const a = rng() * PI * 2; k.add(new THREE.IcosahedronGeometry(0.06, 0), { c: PAL.mote, glow: 0.8, p: [Math.cos(a) * 0.25, g + rng.range(0.2, 0.5), Math.sin(a) * 0.25] }); }
  },
  fuel(k, g) {
    const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(0.24 + 0.05 * Math.sin(PI * t), (t - 0.5) * 0.7)); }
    const hoop = (y) => Math.abs(Math.abs(y) - 0.24) < 0.05; // (the hoops at the chimes, painted on its staves: no rings of their own)
    const cask = (x, y, z, yaw) => k.add(new THREE.LatheGeometry(pts, 8), { c: (px, py, pz) => (hoop(Math.sin(yaw) * (px - x) + Math.cos(yaw) * (pz - z)) ? PAL.iron : PAL.wood), p: [x, y, z], r: [PI / 2, yaw, 0, 'YXZ'] });
    cask(-0.27, g + 0.28, 0, 0.1); cask(0.27, g + 0.28, 0, -0.05); cask(0, g + 0.72, 0.02, 0.05);
  },
  stele(k, g, rng) {
    const s = new THREE.BoxGeometry(0.75, 2.1, 0.36, 2, 4, 1);
    const P = s.attributes.position.array; for (let i = 0; i < P.length; i += 3) { const top = P[i + 1] > 0.9; P[i] *= top ? 0.85 : 1; P[i + 1] += top ? (P[i] > 0 ? -0.08 : 0.05) : 0; P[i] += (noise2(P[i + 1] * 3, P[i + 2] * 3) - 0.5) * 0.06; }
    s.computeVertexNormals();
    k.add(s, { c: (x, y, z) => mix(PAL.stone, PAL.stoneD, noise2(x * 4, y * 4)), p: [0, g + 1.0, 0], r: [rng.range(-0.04, 0.04), 0, rng.range(-0.06, 0.06)] });
    for (let l = 0; l < 3; l++) k.add(new THREE.BoxGeometry(0.5, 0.06, 0.02), { c: PAL.stoneD, p: [0, g + 1.45 - l * 0.32, 0.19] }); // (its three words)
  },
  fishing(k, g) {
    k.add(new THREE.CylinderGeometry(0.13, 0.16, 1.6, 7, 1), { c: (x, y, z) => mix(PAL.drift, PAL.driftD, noise2(x * 6, y * 6)), p: [0, g + 0.8, 0] });
    k.add(new THREE.TorusGeometry(0.17, 0.04, 3, 8), { c: PAL.rope, p: [0, g + 1.3, 0], r: [PI / 2, 0, 0] });
    const net = new THREE.PlaneGeometry(1.2, 1.1, 4, 4), N = net.attributes.position.array;
    for (let i = 0; i < N.length; i += 3) { const u = (N[i] + 0.6) / 1.2; N[i + 2] = -Math.sin(PI * u) * 0.25 - u * 0.1; N[i + 1] -= Math.sin(PI * u) * 0.18 * (0.55 - N[i + 1]); }
    net.computeVertexNormals();
    k.add(twoSided(net.toNonIndexed()), { c: (x, y) => (Math.abs(Math.sin(x * 22)) < 0.35 || Math.abs(Math.sin(y * 22)) < 0.35 ? PAL.rope : PAL.driftD), p: [0.62, g + 0.75, 0.05], r: [0, 0, -0.08] });
    k.add(new THREE.SphereGeometry(0.13, 8, 6), { c: PAL.gold, glow: 0.2, p: [1.15, g + 0.35, 0.2] });
  },
  crystal(k, g, rng) {
    k.lump(0.55, rng, { c: PAL.basalt, p: [0, g + 0.05, 0], s: [1.1, 0.5, 1], detail: 0 });
    for (let i = 0; i < 6; i++) {
      const h = i === 0 ? 1.7 : rng.range(0.6, 1.2), r = i === 0 ? 0.2 : rng.range(0.09, 0.15), a = rng() * PI * 2, d = i === 0 ? 0 : rng.range(0.12, 0.32);
      const tilt = i === 0 ? [0.05, 0, 0.08] : [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5];
      const prism = new THREE.CylinderGeometry(r, r * 1.1, h, 6, 1).translate(0, h / 2, 0), tip = new THREE.ConeGeometry(r, r * 2.2, 6, 1).translate(0, h + r * 1.1, 0);
      for (const geo of [prism, tip]) k.add(geo, { c: (x, y) => (y > g + 0.2 + h * 0.6 ? PAL.crystal : PAL.crystalD), glow: (x, y) => (y > g + h * 0.6 ? 0.85 : 0.5), p: [Math.cos(a) * d, g + 0.15, Math.sin(a) * d], r: tilt });
    }
  },
};
export const SECRET_KINDS = Object.keys(BUILD);

/** The secret's look as one geometry in the placeholder's frame (its origin `lift` m over the ground). */
export function secretGeometry(kind, rng, lift = 0.4) {
  const k = new IsletKit(); (BUILD[kind] || BUILD.chest)(k, -lift, rng);
  return k.build().geo;
}
