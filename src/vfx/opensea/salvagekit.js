// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SALVAGE AND DRIFT BOTTLES, THEIR SHAPES (vfx/opensea/salvagelooks.js and bottlelooks.js dress them; the wrecks:
// world/opensea/seaprops.js, the bottles: world/opensea/puzzlepieces.js, the rules: progress/opensea/salvage.js and isletpuzzles.js,
// Dovina's). Each builder bakes geometry on the islet kit (isletkits/kit.js: its colour and glow in the vertex), so every piece draws with
// the one islet program (vfx/opensea/isletlooks.js isletMaterial), but the bottle's glass (its own, bottlelooks.js):
//   wreckLook(rng, tier)   a ship gone down by the head and broken in two at the waist: the stern half on its beam ends, its frames
//                          showing through its sprung planks, its mainmast snapped and leaning; the bow half pitched under, its foremast
//                          fallen across the water with a yard and a rag of canvas on it; barnacles and weed along both waterlines.
//                          { geo, spots: [[x, y, z]] (where its crates lie in it), rise: [x, y, z] (where they come up), len }
//   crateLook(tier, rng)   a sea chest by tier, its barrel lid hinged at the back: common plain and iron-bound, uncommon brass-bound,
//                          rare brass-bound with corner caps, studs and a lock plate, legend gilded with the film; its cubes inside lit
//                          in the tier's colour. { body, lid, hinge: [y, z], size: [w, h, d] }
//   bottleLook()           a drift bottle at its real size (0.4 m): { glass (a lathe, no colour: its own program), cork, roll (the
//                          rolled note with its ribbon, inside), sheet (the note unrolled: 1 m wide along +X from 0, scaled), ribbon }
//   TIER_LOOK              a tier's light: { glow (the wreck's light under the crude, the crate's cubes), band (its bands), k }
//
// Prior art: Sea of Thieves' shipwrecks (a hull broken in two, its masts down, its loot glowing under the water) and its messages in
// bottles (a green bottle bobbing, a rolled note with a ribbon); The Wind Waker's salvage (a light on the water over a sunken chest); the
// house's own cache (puzzlekit.js cacheBox: the barrel lid, the iron straps); a carvel hull's frames and strakes; a wine bottle's lathe.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IsletKit, PAL, noise2, twoSided } from './isletkits/kit.js';
import { schillerInk } from '../oxidation.js';

const PI = Math.PI;
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();

/** A tier's light (sRGB): the wreck's glow under the crude and its crates' cubes, the crate's bands, the glow's strength. */
export const TIER_LOOK = {
  common: { glow: 0x9fe8f0, band: PAL.iron, k: 0.5 }, uncommon: { glow: 0x40d0c0, band: 0xb08a3c, k: 0.7 },
  rare: { glow: 0xf0cc6a, band: PAL.gold, k: 0.9 }, legend: { glow: 0xb070d0, band: 'film', k: 1.2 },
};
const WRECK = { len: 26, beam: 7, depth: 3.2, top: 1.6 };

/** The wreck's wood by where it lies (the kit's frame, the waterline at y 0): weed under, barnacle-white at the waterline, wet dark
 *  planks over it, a strake a shade apart from its neighbour. */
const wreckWood = (x, y, z) => {
  if (y < -0.35) return mix(PAL.weedD, PAL.deep, noise2(x * 0.7 + z * 0.4, y * 2));
  if (y < 0.45) return noise2(x * 3.1 + z * 2.3, y * 4) > 0.45 ? mix(PAL.white, PAL.stone, noise2(z * 6, x * 6)) : PAL.weed;
  const strake = Math.floor(y / 0.42), n = noise2(z * 0.35 + strake * 7.1, strake * 1.3);
  return mix(PAL.woodD, 0x2a1d14, n * 0.8);
};

/** One half of the hull, lofted: U sections from z0 to z1 (its own frame, the deck edge at `top`), some upper planks sprung (`holes`),
 *  the broken end ragged; then laid by `mat` into the kit, its frames (ribs) showing where planks are gone. */
function hullHalf(k, rng, { z0, z1, ragged, holes, mat }) {
  const { len, beam, depth, top } = WRECK, nz = 9, na = 9, pos = [];
  const half = (z) => { const t = z / (len / 2); return (beam / 2) * (t > 0 ? Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.55) : 1 - 0.35 * t * t); };
  const P = (i, j) => { const z = z0 + (z1 - z0) * (i / nz), a = PI * (j / na), hb = half(z);
    return [-Math.cos(a) * hb, top - Math.sin(a) * (top + depth * (0.6 + 0.4 * hb / (beam / 2))), z]; };
  const grid = []; for (let i = 0; i <= nz; i++) { grid.push([]); for (let j = 0; j <= na; j++) grid[i].push(P(i, j)); }
  if (ragged != null) for (let j = 0; j <= na; j++) grid[ragged][j][2] += (rng() - 0.5) * 1.8; // (the break: its planks' ends ragged)
  for (let i = 0; i < nz; i++) for (let j = 0; j < na; j++) {
    if ((j < 3 || j > na - 4) && rng() < holes) continue; // (a sprung plank: the frames behind it show)
    const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1]; pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  k.add(twoSided(g), { c: (x, y, z) => wreckWood(x, y, z), ...mat });
  // the frames: half rings every 1.6 m, over the gaps and the break
  for (let z = z0 + 0.8; z < z1 - 0.4; z += 1.6) {
    const hb = half(z), tor = new THREE.TorusGeometry(hb, 0.14, 4, 10, PI); // (its arc from +x through -y to -x once turned)
    tor.rotateZ(PI); tor.scale(1, (top + depth * (0.6 + 0.4 * hb / (beam / 2))) / hb, 1); tor.translate(0, top, z);
    k.add(tor, { c: (x, y, zz) => (y < 0.4 ? mix(PAL.weedD, PAL.white, y > -0.3 ? 0.5 : 0) : PAL.woodD), ...mat });
  }
}

/** A point of a piece's own frame into the kit's: the piece's place and turn. */
const into = (p, r, at) => _v.set(...at).applyMatrix4(_m.compose(new THREE.Vector3(...p), _q.setFromEuler(_e.set(r[0], r[1], r[2])), new THREE.Vector3(1, 1, 1))).toArray();

export function wreckLook(rng, tier = 'common') {
  const k = new IsletKit(), { len, depth, top } = WRECK;
  const stern = { p: [0, -1.1, -2.2], r: [0.07, 0, 0.46] }, bow = { p: [0.9, -2.1, 4.8], r: [-0.3, 0.16, -0.22] };
  hullHalf(k, rng, { z0: -len / 2, z1: 1.2, ragged: 9, holes: 0.35, mat: stern });
  hullHalf(k, rng, { z0: 2.2, z1: len / 2, ragged: 0, holes: 0.25, mat: bow });
  // the stern's deck beams and its transom's taffrail, still standing
  for (let z = -len / 2 + 2; z < 0; z += 2.4) k.add(new THREE.BoxGeometry(5.6, 0.22, 0.26), { c: PAL.woodD, p: into(stern.p, stern.r, [0, top - 0.1, z]), r: stern.r });
  k.add(new THREE.BoxGeometry(6, 0.9, 0.3), { c: mix(PAL.woodD, PAL.gold, 0.2), p: into(stern.p, stern.r, [0, top + 0.4, -len / 2 + 0.3]), r: stern.r });
  // the mainmast snapped short and leaning; its jagged top
  const foot = into(stern.p, stern.r, [0, top, -1.2]), lean = [stern.r[0] - 0.12, 0, stern.r[2] + 0.28], mastLen = 11;
  k.add(new THREE.CylinderGeometry(0.28, 0.36, mastLen, 7), { c: (x, y, z) => (y < 0.4 ? PAL.weed : mix(PAL.driftD, PAL.woodD, noise2(y, z))), p: into(foot, lean, [0, mastLen / 2, 0]), r: lean });
  k.add(new THREE.ConeGeometry(0.3, 1.1, 7), { c: PAL.drift, p: into(foot, lean, [0.05, mastLen + 0.4, 0]), r: [lean[0] + 0.5, 0, lean[2] - 0.4] });
  k.add(new THREE.CylinderGeometry(0.14, 0.14, 7, 5), { c: PAL.driftD, p: into(foot, lean, [0, mastLen * 0.72, 0]), r: [lean[0], 0, lean[2] + PI / 2 - 0.25] }); // (a yard, cockbilled)
  // the foremast fallen across the water, a yard and a rag of its canvas on it
  const fm = { p: [3.5, 0.15, 10], r: [0.08, 0.9, PI / 2 - 0.12] };
  k.add(new THREE.CylinderGeometry(0.22, 0.3, 16, 7), { c: (x, y, z) => (y < 0.15 ? PAL.weed : PAL.driftD), p: into(fm.p, fm.r, [0, 6, 0]), r: fm.r });
  k.add(new THREE.CylinderGeometry(0.12, 0.12, 6, 5), { c: PAL.driftD, p: into(fm.p, fm.r, [0, 10, 0]), r: [fm.r[0], fm.r[1], fm.r[2] + PI / 2] });
  const rag = new THREE.PlaneGeometry(4.2, 2.6, 5, 3), R = rag.attributes.position;
  for (let i = 0; i < R.count; i++) R.setZ(i, Math.sin(R.getX(i) * 1.4) * 0.3 + (rng() - 0.5) * 0.15);
  rag.computeVertexNormals();
  k.add(twoSided(rag), { c: (x, y, z) => mix(0x9a8e7a, 0x5e5446, noise2(x * 0.8, z * 0.8)), p: into(fm.p, fm.r, [1.4, 10.2, 0.2]), r: [0.3, 0.9, 0.2] });
  // barnacles and weed along the waterlines: on the hull's skin where it meets the water (found by walking each section down)
  for (let n = 0; n < 46; n++) {
    const piece = n % 3 ? stern : bow, z = n % 3 ? -len / 2 + rng() * (len / 2 + 0.6) : 2.6 + rng() * (len / 2 - 3), s = rng() < 0.5 ? -1 : 1;
    for (let a = 0.05; a < PI / 2; a += 0.08) {
      const t = z / (len / 2), hb = (WRECK.beam / 2) * (t > 0 ? Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.55) : 1 - 0.35 * t * t);
      const lp = [s * Math.cos(a) * hb * 1.04, top - Math.sin(a) * (top + depth), z], w = into(piece.p, piece.r, lp);
      if (w[1] < 0.35 && w[1] > -0.4) { k.lump(rng.range(0.09, 0.2), rng, { c: rng() < 0.7 ? mix(PAL.white, PAL.stone, rng()) : PAL.weed, p: w, s: [1, 0.6, 1], detail: 0, rough: 0.35 }); break; }
    }
  }
  for (let n = 0; n < 10; n++) { const w = into(stern.p, stern.r, [rng.range(-3, 3), -0.6 - rng(), rng.range(-len / 2, 0)]); k.add(new THREE.ConeGeometry(0.08, 1.6, 3), { c: PAL.weedD, p: [w[0], 0.1, w[2]], r: [rng.range(-0.4, 0.4), rng() * 3, rng.range(-0.4, 0.4)] }); } // (weed streaming at the surface)
  // where its crates lie: in the stern's hold by the break, under the water (the glow rises over them)
  const spots = [[-1.2, 0.75, -0.6], [0.9, 0.6, -2.1], [-0.2, 0.45, -3.6]].map((p) => into(stern.p, stern.r, p));
  return { geo: k.build().geo, spots, rise: into(stern.p, stern.r, [0, -0.2, -1.8]), len };
}

/** A sea chest of its tier (its frame: the body's foot at y 0, the lid's hinge at its back top edge). */
export function crateLook(tier = 'common', rng = Math.random) {
  const T = TIER_LOOK[tier] || TIER_LOOK.common, body = new IsletKit(), lid = new IsletKit(), W = 1.5, H = 0.85, D = 0.95;
  const film = (x, y, z) => schillerInk(x * 0.3 + y * 0.4 + z * 0.2, _c, { floor: 0.5, sheen: 1 }).getHex();
  const band = T.band === 'film' ? film : T.band, bandGlow = tier === 'legend' ? 0.35 : tier === 'rare' ? 0.08 : 0;
  const wood = tier === 'legend' ? (x, y, z) => mix(0x2a1420, 0x40202e, noise2(x * 6, y * 3 + z * 5)) : (x, y, z) => mix(PAL.wood, PAL.woodD, noise2(x * 6, y * 2 + z * 5)); // (grain along it; the legend's lacquered dark)
  body.add(new THREE.BoxGeometry(W, H, D), { c: wood, p: [0, H / 2, 0] });
  body.add(new THREE.BoxGeometry(W - 0.1, 0.02, D - 0.1), { c: PAL.deep, p: [0, H + 0.015, 0] }); // (the dark inside, proud of the rim)
  for (const x of [-0.5, 0, 0.5]) body.add(new THREE.BoxGeometry(0.09, H + 0.02, D + 0.04), { c: band, glow: bandGlow, p: [x, H / 2, 0] });
  if (tier !== 'common') for (const sx of [-1, 1]) for (const sz of [-1, 1]) body.add(new THREE.BoxGeometry(0.16, H * 0.5, 0.16), { c: band, glow: bandGlow, p: [sx * (W / 2 - 0.06), H * 0.25, sz * (D / 2 - 0.06)] }); // (corner caps)
  if (tier === 'rare' || tier === 'legend') for (let i = 0; i < 6; i++) body.add(new THREE.SphereGeometry(0.035, 5, 3), { c: PAL.goldL, glow: 0.2, p: [-0.62 + i * 0.25, H * 0.82, D / 2 + 0.03] }); // (studs)
  body.add(new THREE.BoxGeometry(0.2, 0.24, 0.05), { c: tier === 'common' ? PAL.iron : PAL.gold, glow: tier === 'common' ? 0 : 0.18, p: [0, H - 0.12, D / 2 + 0.03] }); // (the hasp and lock plate)
  for (const sx of [-1, 1]) body.add(new THREE.TorusGeometry(0.11, 0.025, 3, 8, PI), { c: band, glow: bandGlow, p: [sx * (W / 2 + 0.02), H * 0.62, 0], r: [0, PI / 2, PI] }); // (its rope handles' irons)
  for (let i = 0; i < 7; i++) body.add(new THREE.BoxGeometry(0.16, 0.16, 0.16), { c: T.glow, glow: 0.9, p: [rng.range ? rng.range(-0.5, 0.5) : (rng() - 0.5), H - 0.04 + (rng() * 0.06), (rng() - 0.5) * 0.5], r: [rng() * 3, rng() * 3, rng() * 3] }); // (its cubes, lit)
  lid.add(twoSided(new THREE.CylinderGeometry(D / 2, D / 2, W, 10, 1, false, 0, PI)), { c: wood, p: [0, 0, D / 2], r: [0, 0, PI / 2] }); // (the barrel lid: the hinge at the origin, the lid running +Z over the body)
  for (const x of [-W / 2, W / 2]) lid.add(twoSided(new THREE.CircleGeometry(D / 2, 10, 0, PI)), { c: PAL.woodD, p: [x, 0, D / 2], r: [0, -PI / 2, 0] });
  for (const x of [-0.5, 0, 0.5]) lid.add(new THREE.TorusGeometry(D / 2 + 0.012, 0.045, 3, 8, PI), { c: band, glow: bandGlow, p: [x, 0, D / 2], r: [0, PI / 2, 0] });
  return { body: body.build().geo, lid: lid.build().geo, hinge: [H, -D / 2], size: [W, H, D] };
}

/** A drift bottle at its real size, lying along +Z (its neck forward), its middle at the origin. */
export function bottleLook() {
  const prof = [[0, -0.2], [0.05, -0.2], [0.056, -0.19], [0.058, 0.02], [0.05, 0.07], [0.026, 0.11], [0.018, 0.14], [0.018, 0.19], [0.022, 0.195], [0.02, 0.2], [0.014, 0.2]];
  const glass = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14).rotateX(PI / 2); // (its axis laid along +Z)
  const cork = new IsletKit(); cork.add(new THREE.CylinderGeometry(0.016, 0.014, 0.045, 8), { c: 0xa0784a, p: [0, 0, 0.205], r: [PI / 2, 0, 0] });
  const roll = new IsletKit();
  roll.add(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), { c: (x, y, z) => mix(0xefe4c8, 0xd8c8a0, noise2(z * 40, x * 40)), p: [0, -0.008, -0.05], r: [PI / 2, 0, 0] });
  roll.add(new THREE.TorusGeometry(0.032, 0.006, 4, 12), { c: 0xb8322a, glow: 0.12, p: [0, -0.008, -0.05] }); // (the ribbon round it)
  const sheet = new IsletKit(), S = new THREE.PlaneGeometry(1, 0.22, 1, 1).translate(0.5, 0, 0);
  sheet.add(twoSided(S), { c: 0xf2e8cc });
  for (let i = 0; i < 6; i++) sheet.add(new THREE.BoxGeometry(0.62 - (i % 3) * 0.12, 0.008, 0.002), { c: 0x3a2c22, p: [0.42 - (i % 3) * 0.04, 0.075 - i * 0.03, 0.002] }); // (its lines of ink, no words: unreadable at a glance, as a note is)
  sheet.add(new THREE.BoxGeometry(0.06, 0.06, 0.002), { c: 0xb8322a, glow: 0.1, p: [0.84, -0.085, 0.002], r: [0, 0, PI / 4] }); // (the X where it is)
  const ribbon = new IsletKit(); ribbon.add(new THREE.TorusGeometry(0.032, 0.006, 4, 12), { c: 0xb8322a, glow: 0.12 });
  return { glass, cork: cork.build().geo, roll: roll.build().geo, sheet: sheet.build().geo, ribbon: ribbon.build().geo };
}
