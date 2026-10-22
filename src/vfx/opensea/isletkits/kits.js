// ---------------------------------------------------------------------------------------
// THE ISLETS' KITS, AS LOOKS (vfx/opensea/isletlooks.js; the kits: progress/opensea/islets.js ISLET_KITS, Dovina's). One builder a kit,
// each a mound (the walkable top exactly the collider's disc, a skirt down under the water) and the one or two things that make it
// that kit, in Calissa's one look: the sixth generation's chunky soft forms under the Emocean's sky, wet dark stone, pale sand,
// sun-bleached driftwood, a little gold.
//   rock        lumpy dark basalt boulders on its rim, tide pools on its top, weed at the waterline
//   atoll       a pale coral-sand cay, its coral rim, a few palms (segmented trunks, drooping fronds), a turquoise shallows ring round it
//   stack       a low rock shelf, a tall eroded sea stack off-centre, banded in strata, guano-white on top
//   ruin        worn clay paving, broken columns, one standing arch, all of Anagami's clay-coloured stone
//   lighthouse  a dead lighthouse on a turfed rock: its tapering tower, its gallery, a dark broken lantern room, a gold finial; rocks
//   sandbar     a low pale bank, ripple-marked, wet at its edges, driftwood on it, a pale shallows ring
// Nothing stands within 0.4 of the islet's radius of its centre (the secret lies within 0.3); tall things stand on the side away from
// the secret and get a collider each.
//
// Prior art: The Legend of Zelda: The Wind Waker's islets (a mound, a tree, one thing on it: Outset's palms, the Forsaken Fortress's
// stack, the Tingle Tower's light); real coasts for the forms: Staffa's and the Old Man of Hoy's stacks (strata, guano), Maldivian cays
// (coral sand, a turquoise halo over the reef flat), the intertidal (weed on the wet rock, tide pools), and Ostia's worn paving.
//
//   ISLET_LOOKS[kit]({ rad, r, rng, away }) -> { kit: IsletKit, shallows?: { inner, outer, colour } }
//   (rad the islet's half-width, r the walkable top's radius (rad * 0.85), rng a seeded stream, away the bearing (radians) away from the
//   secret; the frame: the islet's centre on its top, +Y up; the water at y -SEA.top)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IsletKit, PAL, noise2, twoSided } from './kit.js';
import { SEA } from '../../../world/opensea/seaprops.js';

const W = -SEA.top, DROP = SEA.top + 2.4, PI = Math.PI;
const mix = (a, b, k) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))); return c.getHex(); };
/** A bearing and a distance from the centre, as [x, z]. */
const at = (a, d) => [Math.cos(a) * d, Math.sin(a) * d];
/** Where the skirt meets the water: the t whose drop is the waterline (searched). */
const waterT = (profile) => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (DROP * profile(m) < SEA.top) lo = m; else hi = m; } return lo; };
/** The shallows ring for a mound: from just inside its waterline out to `out` times its radius. */
const ring = (r, R, profile, out, colour) => ({ inner: r + (R - r) * waterT(profile) * 0.92, outer: R * out, colour });

/** Rocks round the rim, half sunk: a ball collider for each that reaches over the walkable top. */
function rimRocks(k, rng, { n, r, rad, size, c, rough = 0.3, skip = null }) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + rng.range(-0.25, 0.25); if (skip && skip(a)) continue;
    const s = rad * size * rng.range(0.6, 1.25), d = r * rng.range(0.92, 1.12), [x, z] = at(a, d), y = rng.range(-0.55, -0.15) * s;
    k.lump(s, rng, { c, p: [x, y, z], s: [1, rng.range(0.6, 0.9), 1], rough });
    if (d - s < r) k.collider({ ball: s * 0.82, at: [x, y, z] });
  }
}

export const ISLET_LOOKS = {
  rock({ rad, r, rng }) {
    const k = new IsletKit(), R = rad * 1.15, profile = (t) => t ** 0.9, seed = rng() * 50;
    k.mound({ r, R, drop: DROP, edge: 0.14, wobble: 0.7, profile, seed, colour: (x, y, z, t) => {
      const n = noise2(x * 0.14 + seed, z * 0.14);
      if (t < 0) return mix(PAL.basalt, PAL.basaltL, n * 1.4 - 0.2);
      if (y > W + 0.5) return mix(PAL.basalt, PAL.basaltW, t * 1.5);
      if (y > W - 0.6) return mix(PAL.weed, PAL.weedD, n);
      return PAL.deep;
    } });
    const lichen = (x, y, z, ny) => (ny > 0.75 && noise2(x * 1.7, z * 1.7 + y) > 0.8 ? PAL.gold : mix(PAL.basalt, PAL.basaltL, noise2(x, z + y)));
    rimRocks(k, rng, { n: 7, r, rad, size: 0.16, c: lichen });
    // two big boulders standing on the top, toward its rim
    for (let i = 0; i < 2; i++) {
      const s = rad * rng.range(0.1, 0.14), [x, z] = at(rng() * PI * 2, rng.range(rad * 0.48 + s, r - s * 0.3));
      k.lump(s, rng, { c: lichen, p: [x, s * 0.35, z], s: [1, 0.75, 1] }); k.collider({ ball: s * 0.8, at: [x, s * 0.3, z] });
    }
    // tide pools: dark still water in hollows near the rim, a pale lip round each
    for (let i = 0; i < 3; i++) {
      const pr = rad * rng.range(0.05, 0.09), [x, z] = at(rng() * PI * 2, rng.range(rad * 0.45, r - pr * 1.4));
      k.add(new THREE.CircleGeometry(pr * 1.25, 10), { c: PAL.basaltL, p: [x, 0.015, z], r: [-PI / 2, 0, 0] });
      k.add(new THREE.CircleGeometry(pr, 10), { c: 0x1e3a3e, glow: 0.04, p: [x, 0.03, z], r: [-PI / 2, 0, 0] });
    }
    // weed at the waterline: low fronds round the skirt
    for (let i = 0; i < 14; i++) {
      const a = rng() * PI * 2, d = r + (R - r) * waterT(profile) * rng.range(0.9, 1.05), [x, z] = at(a, d);
      k.add(new THREE.ConeGeometry(0.35, 0.9, 4), { c: i % 2 ? PAL.weed : PAL.weedD, p: [x, W + 0.25, z], r: [Math.cos(a) * 0.7, rng() * 6, Math.sin(a) * 0.7] });
    }
    return { kit: k };
  },

  atoll({ rad, r, rng, away }) {
    const k = new IsletKit(), R = rad * 1.15, profile = (t) => t ** 1.6, seed = rng() * 50;
    k.mound({ r, R, drop: DROP, edge: 0.08, seg: 40, profile, seed, colour: (x, y, z, t) => {
      const n = noise2(x * 0.12 + seed, z * 0.12);
      if (t < 0) return mix(PAL.sand, PAL.sandL, n);
      if (y > W + 0.3) return mix(PAL.sand, PAL.sandW, t * 2);
      return mix(PAL.sandW, PAL.sandD, (W - y) / 1.2);
    } });
    // the coral rim at the waterline
    for (let i = 0; i < 10; i++) {
      const a = rng() * PI * 2, d = r + (R - r) * waterT(profile) * rng.range(0.95, 1.1), [x, z] = at(a, d), s = rng.range(0.5, 1.1);
      k.lump(s, rng, { c: i % 3 ? PAL.coral : PAL.coralP, p: [x, W + 0.1, z], s: [1.3, 0.6, 1], detail: 0, rough: 0.35 });
    }
    // the palms: on the far side from the secret, leaning out to sea
    const n = rad > 28 ? 3 : 2;
    for (let i = 0; i < n; i++) palm(k, rng, ...at(away + (i - (n - 1) / 2) * 0.9 + rng.range(-0.2, 0.2), rng.range(rad * 0.5, rad * 0.75)), rng.range(6.5, 9));
    return { kit: k, shallows: ring(r, R, profile, 1.75, PAL.shallows) };
  },

  stack({ rad, r, rng, away }) {
    const k = new IsletKit(), R = rad * 1.15, profile = (t) => t ** 0.8, seed = rng() * 50;
    const band = (y) => PAL.strata[((Math.floor(y / 1.1 + noise2(y, seed) * 0.8) % 4) + 4) % 4];
    k.mound({ r, R, drop: DROP, edge: 0.12, wobble: 0.5, profile, seed, colour: (x, y, z, t) => {
      if (t < 0) return mix(PAL.strata[2], PAL.strata[1], noise2(x * 0.2 + seed, z * 0.2));
      return y > W - 0.3 ? band(y) : PAL.deep;
    } });
    // the stack: rings up a leaning, notched column, its radius worn in by the sea at the strata's soft beds
    const pr = rad * rng.range(0.16, 0.2), d = Math.max(rad * 0.4 + pr, rng.range(rad * 0.6, rad * 0.75)), [sx, sz] = at(away + rng.range(-0.4, 0.4), d);
    const H = rng.range(11, 17), rings = 13, segs = 10, lean = [rng.range(-0.08, 0.08), rng.range(-0.08, 0.08)], pts = [];
    for (let i = 0; i <= rings; i++) {
      const y = -2.5 + (i / rings) * (H + 2.5), soft = Math.sin(y * 1.9 + seed) > 0.55 ? 0.82 : 1, cap = i === rings ? 0.75 : 1;
      pts.push({ y, r: pr * soft * cap * (1.15 - 0.25 * (i / rings)) * (0.9 + 0.2 * noise2(y * 0.6, seed)) });
    }
    const pos = [], idx = [];
    pts.forEach(({ y, r: rr }, i) => { for (let j = 0; j < segs; j++) { const a = (j / segs) * PI * 2, w = 1 + 0.18 * (noise2(Math.cos(a) * 2 + i * 0.4, Math.sin(a) * 2 + seed) - 0.5); pos.push(sx + lean[0] * y + Math.cos(a) * rr * w, y, sz + lean[1] * y + Math.sin(a) * rr * w); } });
    for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = i * segs + j, b = i * segs + ((j + 1) % segs); idx.push(a, b + segs, b, a, a + segs, b + segs); }
    const c0 = pos.length / 3; pos.push(sx + lean[0] * (H + 0.6), H + 0.6, sz + lean[1] * (H + 0.6));
    for (let j = 0; j < segs; j++) idx.push(c0, rings * segs + ((j + 1) % segs), rings * segs + j);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    k.add(g, { c: (x, y, z, ny) => {
      if (y > H - 1.2 + noise2(x * 2, z * 2) * 0.8 || (y > H - 5 && noise2(Math.atan2(z - sz, x - sx) * 3, 0.5) > 0.7)) return PAL.guano; // (the top, and streaks down from it)
      return y < W + 0.4 ? (y < W - 0.4 ? PAL.deep : PAL.basaltW) : band(y);
    } });
    k.collider({ cyl: [(H + 2.5) / 2, pr * 0.95], at: [sx + lean[0] * H * 0.5, (H - 2.5) / 2, sz + lean[1] * H * 0.5] });
    // a fallen block at its foot, and rocks round the shelf
    const [fx, fz] = at(away + PI * 0.5, rad * 0.62), fs = rad * 0.1;
    k.lump(fs, rng, { c: (x, y) => band(y + 3), p: [fx, fs * 0.25, fz], s: [1.2, 0.7, 1] }); k.collider({ ball: fs * 0.8, at: [fx, fs * 0.2, fz] });
    rimRocks(k, rng, { n: 6, r, rad, size: 0.14, c: (x, y) => band(y + 2) });
    return { kit: k };
  },

  ruin({ rad, r, rng, away }) {
    const k = new IsletKit(), R = rad * 1.15, profile = (t) => t ** 1.1, seed = rng() * 50;
    k.mound({ r, R, drop: DROP, edge: 0.1, wobble: 0.4, profile, seed, colour: (x, y, z, t) => {
      const n = noise2(x * 0.12 + seed, z * 0.12);
      if (t < 0) return mix(PAL.clayD, PAL.turfD, n * 1.2 - 0.3);
      if (y > W + 0.4) return mix(PAL.clayD, PAL.clayW, t * 1.6);
      return y > W - 0.5 ? PAL.weedD : PAL.deep;
    } });
    // worn paving: a grid of slabs, some gone, the rest settled a little out of true
    const cell = 1.6, yaw = rng() * PI, slabs = [];
    for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
      const lx = i * cell, lz = j * cell, d = Math.hypot(lx, lz); if (d > r * 0.92 || d < 1 || rng() < 0.3 + 0.4 * (d / r) ** 2) continue;
      slabs.push([lx * Math.cos(yaw) - lz * Math.sin(yaw), lx * Math.sin(yaw) + lz * Math.cos(yaw), rng()]);
    }
    slabs.sort((a, b) => a[2] - b[2]); // (at most 60 slabs, the rest worn away: the triangle budget)
    for (const [x, z] of slabs.slice(0, 60)) {
      const h = rng.range(0.05, 0.1); // (each slab's face at most 3 cm over the collider's top, the rest sunk)
      k.add(new THREE.BoxGeometry(cell * 0.92, h, cell * 0.92), { c: [PAL.clay, PAL.clayL, PAL.stone][rng.int(3)], p: [x, 0.03 - h / 2, z], r: [rng.range(-0.012, 0.012), yaw + rng.range(-0.06, 0.06), rng.range(-0.012, 0.012)] });
    }
    // the arch, standing on the far side from the secret, its opening along the rim
    const ad = Math.min(r - 1.6, rad * 0.72), aa = away + rng.range(-0.3, 0.3), [ax, az] = at(aa, ad), tang = aa + PI / 2, span = 2.1, legH = 3.6;
    const tx = Math.cos(tang), tz = Math.sin(tang), ry = -tang;
    for (const s of [-1, 1]) {
      const lx = ax + tx * span * s, lz = az + tz * span * s;
      for (let b = 0; b < 3; b++) k.add(new THREE.BoxGeometry(0.85, legH / 3 - 0.04, 0.8), { c: b % 2 ? PAL.clayL : PAL.clay, p: [lx, (b + 0.5) * (legH / 3), lz], r: [0, ry + rng.range(-0.05, 0.05), 0] });
      k.collider({ box: [0.45, legH / 2, 0.42], at: [lx, legH / 2, lz], yaw: ry });
    }
    for (let v = 0; v < 7; v++) { // (the voussoirs round a half circle, the keystone with a gold inlay)
      const t = (v + 0.5) / 7 * PI, x = Math.cos(t) * span, y = legH + Math.sin(t) * span;
      k.add(new THREE.BoxGeometry(0.85, 0.95, 0.8), { c: v === 3 ? PAL.clayL : (v % 2 ? PAL.clay : PAL.clayD), p: [ax + tx * x, y, az + tz * x], r: [0, ry, t - PI / 2] });
    }
    k.add(new THREE.BoxGeometry(0.35, 0.35, 0.84), { c: PAL.gold, glow: 0.08, p: [ax, legH + span + 0.05, az], r: [0, ry, PI / 4] });
    k.collider({ box: [span + 0.5, 0.55, 0.42], at: [ax, legH + span * 0.75, az], yaw: ry });
    // the broken columns round the rim, a drum fallen beside one
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = away + PI + (i - (n - 1) / 2) * 0.75 + rng.range(-0.15, 0.15), [cx, cz] = at(a, Math.min(r - 1, rng.range(rad * 0.6, rad * 0.78))), drums = 1 + rng.int(3);
      k.add(new THREE.BoxGeometry(1.3, 0.3, 1.3), { c: PAL.stoneD, p: [cx, 0.15, cz], r: [0, rng() * PI, 0] });
      for (let b = 0; b < drums; b++) k.add(new THREE.CylinderGeometry(0.42, 0.45, 0.95, 10, 1), { c: b % 2 ? PAL.clay : PAL.clayL, p: [cx + rng.range(-0.04, 0.04), 0.3 + 0.5 + b * 0.97, cz + rng.range(-0.04, 0.04)], r: [rng.range(-0.03, 0.03), rng() * PI, rng.range(-0.03, 0.03)] });
      const top = 0.3 + drums * 0.97;
      k.add(new THREE.CylinderGeometry(0.2, 0.42, 0.5, 10, 1), { c: PAL.clayD, p: [cx + 0.1, top + 0.2, cz], r: [0.25, 0, 0.3] }); // (the break)
      k.collider({ cyl: [(top + 0.4) / 2, 0.5], at: [cx, (top + 0.4) / 2, cz] });
      if (i === 1) { const [fx, fz] = at(a + 0.18, Math.min(r - 1.2, rad * 0.62)); k.add(new THREE.CylinderGeometry(0.42, 0.42, 0.95, 10, 1), { c: PAL.clay, p: [fx, 0.4, fz], r: [PI / 2, a, 0, 'YXZ'] }); k.collider({ box: [0.42, 0.42, 0.48], at: [fx, 0.4, fz], yaw: a }); }
    }
    return { kit: k };
  },

  lighthouse({ rad, r, rng, away }) {
    const k = new IsletKit(), R = rad * 1.15, profile = (t) => t ** 0.95, seed = rng() * 50;
    k.mound({ r, R, drop: DROP, edge: 0.13, wobble: 0.6, profile, seed, colour: (x, y, z, t) => {
      const n = noise2(x * 0.12 + seed, z * 0.12);
      if (t < 0) return n > 0.45 ? mix(PAL.turfD, PAL.turf, n) : mix(PAL.stoneD, PAL.stone, n * 2);
      if (y > W + 0.5) return mix(PAL.stoneD, PAL.basaltW, t * 1.5);
      return y > W - 0.5 ? PAL.weed : PAL.deep;
    } });
    // the tower: a tapering lathe, weathered white with one faded red band, rust bled down from the gallery
    const H = rng.range(14, 18), b0 = 2.2, b1 = 1.45, ta = away + rng.range(-0.3, 0.3), [tx, tz] = at(ta, Math.max(rad * 0.4 + b0 + 0.2, rad * 0.6)), segs = 12;
    const lathe = [new THREE.Vector2(0.01, -1.2), new THREE.Vector2(b0 + 0.3, -1.2), new THREE.Vector2(b0 + 0.3, 0.35), new THREE.Vector2(b0, 0.5)];
    for (let i = 1; i <= 7; i++) { const t = i / 7; lathe.push(new THREE.Vector2(b0 + (b1 - b0) * t, 0.5 + (H - 0.5) * t)); }
    lathe.push(new THREE.Vector2(0.01, H));
    k.add(new THREE.LatheGeometry(lathe, segs), { c: (x, y, z) => {
      if (y < 0.5) return PAL.stoneD;
      const n = noise2(Math.atan2(z - tz, x - tx) * 4, y * 0.6), stain = (H - y) < 4 && n > 0.55;
      if (stain) return PAL.rust;
      const red = Math.abs(y - H * 0.55) < 1.3; return mix(red ? PAL.red : PAL.white, PAL.stone, n * 0.6);
    }, p: [tx, 0, tz] });
    k.add(new THREE.BoxGeometry(0.9, 1.9, 0.5), { c: PAL.iron, p: [tx + Math.cos(ta + PI) * b0, 1.45, tz + Math.sin(ta + PI) * b0], r: [0, PI / 2 - (ta + PI), 0] }); // (the door, facing the islet)
    // the gallery and its rail, the lantern room's posts and its last dark panes (most gone), the cap and its gold finial
    k.add(new THREE.CylinderGeometry(b1 + 0.55, b1 + 0.3, 0.3, segs, 1), { c: PAL.stoneD, p: [tx, H + 0.15, tz] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.add(new THREE.BoxGeometry(0.07, 0.8, 0.07), { c: PAL.rust, p: [tx + Math.cos(a) * (b1 + 0.45), H + 0.7, tz + Math.sin(a) * (b1 + 0.45)] }); }
    k.add(new THREE.TorusGeometry(b1 + 0.45, 0.04, 3, segs), { c: PAL.rust, p: [tx, H + 1.1, tz], r: [PI / 2, 0, 0] });
    const lr = b1 * 0.78, lh = 1.9;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2; k.add(new THREE.BoxGeometry(0.12, lh, 0.12), { c: PAL.iron, p: [tx + Math.cos(a) * lr, H + 0.3 + lh / 2, tz + Math.sin(a) * lr] });
      if (rng() < 0.4) { const m = a + PI / 6; k.add(new THREE.BoxGeometry(lr * 0.95, lh * rng.range(0.5, 0.95), 0.05), { c: PAL.glass, p: [tx + Math.cos(m) * lr * 0.86, H + 0.3 + lh * 0.45, tz + Math.sin(m) * lr * 0.86], r: [0, PI / 2 - m, rng.range(-0.1, 0.1)] }); }
    }
    k.add(new THREE.CylinderGeometry(lr * 0.4, lr * 0.5, 0.6, 8, 1), { c: PAL.iron, p: [tx, H + 0.6, tz] }); // (the dead lamp's pedestal)
    k.add(new THREE.ConeGeometry(lr + 0.3, 1.2, segs, 1), { c: (x, y, z) => (noise2(x * 3, z * 3) > 0.6 ? PAL.rust : PAL.verd), p: [tx, H + 0.3 + lh + 0.6, tz], r: [rng.range(-0.08, 0.08), 0, rng.range(0.05, 0.12)] }); // (the cap, slipped)
    k.add(new THREE.SphereGeometry(0.16, 6, 4), { c: PAL.gold, glow: 0.12, p: [tx + 0.12, H + 0.3 + lh + 1.3, tz] });
    k.collider({ cyl: [(H + 1.2) / 2, b0 + 0.1], at: [tx, (H - 1.2) / 2, tz] });
    rimRocks(k, rng, { n: 6, r, rad, size: 0.12, c: (x, y, z) => mix(PAL.basalt, PAL.basaltL, noise2(x, z + y)) });
    return { kit: k };
  },

  sandbar({ rad, r, rng }) {
    const k = new IsletKit(), R = rad * 1.18, profile = (t) => t ** 2.1, seed = rng() * 50, dir = rng() * PI;
    k.mound({ r, R, drop: DROP, seg: 40, topRings: 6, skirtRings: 5, edge: 0.18, profile, seed, colour: (x, y, z, t) => {
      const n = noise2(x * 0.1 + seed, z * 0.1), wet = t < 0 ? Math.max(0, (Math.hypot(x, z) / r - 0.75) * 2) : 1;
      return mix(mix(PAL.sandL, PAL.sand, n), PAL.sandW, wet + (t > 0 ? t : 0));
    } });
    // ripple marks: two patches of low ridges across the wind (geometry, not colour: a colour ripple aliases on the mound's polar grid)
    for (let f = 0; f < 2; f++) {
      const [cx, cz] = at(rng() * PI * 2, rng.range(r * 0.45, r * 0.6)), along = [Math.cos(dir), Math.sin(dir)];
      for (let i = -3; i <= 3; i++) {
        const L = rng.range(2.5, 4.5) * (1 - Math.abs(i) / 5), x = cx + along[0] * i * 0.7, z = cz + along[1] * i * 0.7;
        k.add(new THREE.BoxGeometry(0.22, 0.05, L), { c: PAL.sandW, p: [x, 0, z], r: [0, -dir, 0] });
      }
    }
    // driftwood: bleached logs, one with a root ball, lying on the bank (a box collider each, low enough to step over)
    for (let i = 0; i < 3 + rng.int(2); i++) {
      const L = rng.range(2.5, 5), lr = rng.range(0.14, 0.26), a = rng() * PI * 2, [x, z] = at(a, rng.range(rad * 0.42 + L / 2, r - L * 0.3)), yaw = rng() * PI;
      const wood = (px, py, pz) => mix(PAL.drift, PAL.driftD, noise2(px * 3, pz * 3 + py));
      k.add(new THREE.CylinderGeometry(lr * 0.75, lr, L, 7, 2), { c: wood, p: [x, lr * 0.7, z], r: [PI / 2, yaw, 0, 'YXZ'] });
      if (i === 0) for (let b = 0; b < 4; b++) k.add(new THREE.ConeGeometry(lr * 0.5, lr * 5, 4), { c: wood, p: [x + Math.sin(yaw) * L * 0.5, lr * 0.9, z + Math.cos(yaw) * L * 0.5], r: [rng.range(0.6, 1.4), rng() * PI * 2, rng.range(-0.8, 0.8)] });
      k.collider({ box: [lr, lr * 0.8, L / 2], at: [x, lr * 0.6, z], yaw });
    }
    // shells and pebbles strewn at the wet edge
    for (let i = 0; i < 12; i++) { const [x, z] = at(rng() * PI * 2, rng.range(r * 0.7, r * 0.97)); k.lump(rng.range(0.08, 0.16), rng, { c: i % 4 ? PAL.coral : PAL.goldL, p: [x, 0.03, z], s: [1, 0.5, 1], detail: 0 }); }
    return { kit: k, shallows: ring(r, R, profile, 1.6, PAL.shallowsP) };
  },
};

/** A palm: a trunk of segments bending out to sea, a crown of drooping fronds, coconuts under them; a collider round its foot. */
function palm(k, rng, x, z, H) {
  const lean = rng.range(0.12, 0.28), la = Math.atan2(z, x) + rng.range(-0.4, 0.4), segs = 6, pts = [];
  for (let i = 0; i <= segs; i++) { const t = i / segs, off = lean * H * t * t; pts.push([x + Math.cos(la) * off, t * H, z + Math.sin(la) * off]); }
  for (let i = 0; i < segs; i++) {
    const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), e = new THREE.Euler().setFromQuaternion(q);
    const r0 = 0.3 - 0.1 * (i / segs);
    k.add(new THREE.CylinderGeometry(r0 * 0.86, r0, len * 1.02, 6, 1, true), { c: i % 2 ? PAL.driftD : 0x8a7a60, p: mid.toArray(), r: [e.x, e.y, e.z] });
  }
  const top = pts[segs], fr = 7;
  for (let f = 0; f < fr; f++) {
    const a = (f / fr) * PI * 2 + rng.range(-0.2, 0.2), L = rng.range(3.2, 4.2), droop = rng.range(1.6, 2.4), n = 4, pos = [];
    const P = (t, side) => { const w = Math.sin(PI * Math.min(1, t * 1.15 + 0.08)) * 0.55 * side, along = t * L, y = 0.6 * t - droop * t * t, fold = Math.abs(side) * 0.18;
      return [top[0] + Math.cos(a) * along - Math.sin(a) * w, top[1] + y - fold, top[2] + Math.sin(a) * along + Math.cos(a) * w]; };
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n;
      for (const s of [-1, 1]) { const A = P(t0, 0), B = P(t1, 0), C = P(t1, s), D = P(t0, s); if (s > 0) pos.push(...A, ...C, ...B, ...A, ...D, ...C); else pos.push(...A, ...B, ...C, ...A, ...C, ...D); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    k.add(twoSided(g), { c: (px, py) => mix(0x5a8a3a, 0x3e6a2a, (top[1] - py) / 2.5) });
  }
  for (let i = 0; i < 3; i++) k.add(new THREE.IcosahedronGeometry(0.17, 0), { c: PAL.woodD, p: [top[0] + Math.cos(i * 2.1) * 0.25, top[1] - 0.25, top[2] + Math.sin(i * 2.1) * 0.25] });
  k.collider({ cyl: [1.6, 0.32], at: [x, 1.6, z] });
}
