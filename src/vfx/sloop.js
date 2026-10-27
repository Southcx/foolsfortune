// ---------------------------------------------------------------------------------------
// THE SLOOP: the Vessoul's ship form for the Emocean, the errand runner and the letter-carrier (the courier's own trade; docs/GLOSSARY.md:
// the Vessoul, ship; progress/rail/ships.js). A SEA-GOING STARSHIP OF THE AGE OF SAIL (Calissa's look for the five classes,
// shipkit/shiplook.js): a Bermuda sloop's silhouette dressed as the Outlaw Star. RAIL-SHIPS-SCIFI.md 1.1 and 3.1, followed:
//   the real read   one tall mast raked a little aft, a long bowsprit with a jib from its end to near the masthead, a mainsail on a boom
//                   that reaches over the cockpit, a long low narrow hull (3.5:1, about 4.5:1 with the bowsprit), a fine raked bow,
//                   a keel blade under it
//   the dress       white plates over a dark-blue belly, a red band at the boot-top, dark-blue mechanical joints, two big engine pods at
//                   the stern quarters glowing white-blue, the grappler arms folded flush under the hull (the Outlaw Star's), its sails
//                   vanes of light (the main still carries the owner's wife's lotus in gold, circle_lotus)
//   the core        the helm's cradle aft of the mast, sunk in the deck as a cockpit, Lachrymite grown round it lit in the ship's
//                   feeling, a canopy of ribs over it (shipkit/core.js)
//   the fold        a six-segment telescope into a deck slot, a stub left up in the Umbral, the hatch shut over it (shipkit/rig.js)
//   the life size   (the owner, 2026-10-27: five times larger, a crew of six Couriers or more, more sailing-ship presence, flatter decks)
//                   35 m by 10.5, a nearly level main deck 2.2 m over the water, planked (shipkit/hullmaterial.js), a raised quarterdeck
//                   aft with stairs down, turned balusters under a gold cap rail along every gunwale, a carved transom over an ornate
//                   rudder, and a gilded Pneuka Jar for a figurehead with a letter in its arms (shipkit/fittings.js, figureheads.js)
// Prior art: the Bermuda and Jamaica sloops (the narrow, sharp, raked fore-and-aft type), the XGP15A-II Outlaw Star (Kawamori's: white
// and red plates, grappler arms that hide in the hull, big rear pods), a submarine's photonics mast, Jurai's light for the sails.
//
//   const s = new Sloop({ env })   scene.add(s.group)   s.set({ sail 0..1, heel rad, side -1|1, glow 0..1, t, form, roll })   s.fold(u)
//   s.feeling(hex)   s.hurt(0..1)   s.hoist('bronze' | 'silver' | 'gold' | 'platinum' | 'none')   s.scars({ open, gilt })   s.dispose()
//   s.helmCradles (one)   s.helmCradle   s.helmCradleSpots() -> [world point]   s.helmWake(on, i = 0)   (the rest: shipkit/shiplook.js)
//   (its own frame: +Z the bow, Y up, origin at the waterline amidships; 35 m long, `scale` 5 over the first hull's 7)
// Kept from the jar-hulled sloop, for what else is made with them: JAR (the Pneuka Jar's profile), jarHull, jarDeck, jarTop, seatHelms
// (a cradle on a plinth on a jar's top skin), furlRoll (a sail furled), and the sail's material and FURL (now shipkit/vane.js).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CradleLook, cradleFoot } from './cradlelook.js';
import { ShipLook } from './shipkit/shiplook.js';
import { deckAt, deckHalf, PLANK } from './shipkit/hullkit.js';
import { pod, fin, slot } from './shipkit/parts.js';
import { balustrade, railRuns, deckBreak, capstan, rudder, gallery } from './shipkit/fittings.js';
import { figurehead } from './shipkit/figureheads.js';
export { sailMaterial, FURL } from './shipkit/vane.js';

/** The sloop at its life size (the owner, 2026-10-27: five times the first hull's 7 m, a deck for a crew of six and more): `was` the
 *  first hull's length, the look's `scale` its ratio; helm: its cradles' [x, z]. */
export const SLOOP = { length: 35, was: 7, beam: 10.5, draft: 3.0, mast: { z: 6, h: 38 }, boom: { y: 3.6, len: 15 }, bowsprit: 8, helm: [[0, -12.6]], quarter: -9.05 };
const JAR_DIMS = { length: 7, beam: 2.1, draft: 0.6 }; // (the jar-hulled sloop's size: what jarHull and its kin draw when not told, Letty's cutter's and the tableaux' own)

// the Pneuka Jar's profile, foot to lip (fraction of the length, fraction of the belly's radius): the hull is this turned and laid down
export const JAR = [[0, 0], [0.03, 0.34], [0.1, 0.66], [0.24, 0.93], [0.4, 1], [0.58, 0.95], [0.74, 0.78], [0.84, 0.6], [0.9, 0.5], [0.95, 0.54], [1, 0.6]];

/** The hull: the jar's silhouette turned (rings round the girth), laid along Z, squashed to a hull's depth and cut at the waterline.
 *  Any pot's profile and size (the ship classes', vfx/shipclasses.js: each hull a different pot thrown and laid down). */
export function jarHull(profile = JAR, { length: L, beam, draft, sheer: sh = [0.55, 0.4, 0.18] } = JAR_DIMS) {
  const R = beam / 2;
  const pts = profile.map(([u, r]) => new THREE.Vector2(Math.max(0.001, r * R), u * L - L * 0.5));
  // (the throwing rings: a small ripple in the profile, as a thrown pot keeps the marks of the fingers)
  const ringed = [];
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 4; k++) { const p = pts[i].clone().lerp(pts[i + 1], k / 4); p.x *= 1 + 0.018 * Math.sin((i * 4 + k) * 1.9); ringed.push(p); }
  ringed.push(pts[pts.length - 1]);
  const g = new THREE.LatheGeometry(ringed, 28);
  g.rotateX(Math.PI / 2); g.rotateY(Math.PI); // (the lathe's axis laid along Z: the foot at +Z, the bow)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i); const t = p.getZ(i) / (L * 0.5); // (t: -1 the stern's lip .. +1 the bow's foot)
    const sheer = sh[0] + sh[1] * Math.max(0, t) ** 2 + sh[2] * Math.max(0, -t) ** 2; // (the freeboard, rising to the bow and a little to the stern: a sheer line)
    y = y > 0 ? sheer * Math.pow(Math.min(1, y / R), 0.55) : (y / R) * draft;
    p.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

/** The deck: the hull's outline at the gunwale, filled (at `y`). */
export function jarDeck(profile = JAR, { length: L, beam } = JAR_DIMS, y = 0.42) {
  const R = beam / 2;
  const half = profile.map(([u, r]) => [r * R * 0.92, L * 0.5 - u * L]);
  const s = new THREE.Shape();
  s.moveTo(0, half[0][1]);
  for (const [x, z] of half) s.lineTo(x, z);
  for (let i = half.length - 1; i >= 0; i--) s.lineTo(-half[i][0], half[i][1]);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(Math.PI / 2); g.translate(0, y, 0);
  return g;
}

/** The hull's top skin at (x, z) of its frame (jarHull's mapping: the lathe's ring at z, its upper half squashed to the sheer, the
 *  throwing rings left out); null off the hull. What stands on the hull's top stands here. */
export function jarTop(profile = JAR, { length: L, beam, sheer: sh = [0.55, 0.4, 0.18] } = JAR_DIMS, x = 0, z = 0) {
  const R = beam / 2, u = THREE.MathUtils.clamp(0.5 - z / L, 0, 1);
  let r = R * profile[profile.length - 1][1];
  for (let i = 0; i < profile.length - 1; i++) if (u <= profile[i + 1][0]) { const [u0, r0] = profile[i], [u1, r1] = profile[i + 1]; r = R * THREE.MathUtils.lerp(r0, r1, (u - u0) / Math.max(1e-6, u1 - u0)); break; }
  if (Math.abs(x) >= r) return null;
  const t = z / (L * 0.5), sheer = sh[0] + sh[1] * Math.max(0, t) ** 2 + sh[2] * Math.max(0, -t) ** 2;
  return sheer * Math.pow(Math.min(1, Math.sqrt(r * r - x * x) / R), 0.55);
}

/** The helm (HANKO.md 4: a ship is a body, sealed into at its helm): at each spot [x, z] of the ship's frame, a raised plinth of `mat`
 *  (the ship's own flat clay: no new program) standing on the hull's top skin (its top over the highest skin under it, its foot tapering
 *  down into the hull, so it never floats), and the cradle's look sat on it at the Pneuka Jar's scale. `add` is the ship's own (it
 *  tracks the plinth's geometry and outlines it). Returns the cradles. */
export function seatHelms(add, parent, spots, mat, profile, dims) {
  const foot = cradleFoot(), cradles = [];
  for (const [x, z] of spots) {
    let top = -Infinity;
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const dx = (i / 4) * foot, dz = (j / 4) * foot; if (dx * dx + dz * dz <= foot * foot) top = Math.max(top, jarTop(profile, dims, x + dx, z + dz) ?? -Infinity); }
    top += 0.04; const h = 0.5;
    add(parent, new THREE.CylinderGeometry(foot * 1.06, foot * 0.7, h, 8, 1, false, Math.PI / 8).translate(0, top - h / 2, 0), mat, x, 0, z); // (the octagon turned as the cradle's)
    const c = new CradleLook(); c.group.position.set(x, top, z); parent.add(c.group); cradles.push(c);
  }
  return cradles;
}

/** A sail furled: a roll of canvas from `a` to `b` (the ship's frame), lumpy with its folds, round at its ends and pinched where a tie
 *  holds it. `r0`, `r1` its radius at each end; `bunt` 0..1 how much fatter its middle is (a square sail on its yard is fattest at the
 *  bunt); `squash` its section's height to its width (a main flaked over a boom sags wide); `ties` where it is tied (fractions along
 *  it). Prior art: a dinghy's main flaked and tied on its boom, a roller-furled jib, a square-rigger's courses furled on the yards.
 *  Returns { roll, ties } (geometries; `ties` null when it has none). */
export function furlRoll(a, b, { r0 = 0.15, r1 = 0.1, bunt = 0, squash = 1, ties = [], lumps = 7 } = {}) {
  const len = a.distanceTo(b), n = Math.max(12, Math.round(len * 26));
  const rad = (t) => THREE.MathUtils.lerp(r0, r1, t) * (1 - bunt + bunt * Math.sqrt(Math.sin(Math.PI * t)));
  const pinch = (t) => ties.reduce((k, tk) => k * (1 - 0.3 * Math.exp(-((((t - tk) * len) / 0.05) ** 2))), 1);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, end = Math.min(t, 1 - t) * len, re = t < 0.5 ? r0 : r1, cap = Math.sqrt(1 - (1 - Math.min(1, end / re)) ** 2); // (each end rounded over its own radius)
    pts.push(new THREE.Vector2(Math.max(0.001, rad(t) * pinch(t) * (1 + 0.09 * Math.sin(t * len * lumps + 1.3)) * cap), t * len));
  }
  const at = new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.asin(THREE.MathUtils.clamp((b.y - a.y) / len, -1, 1)), Math.atan2(b.x - a.x, b.z - a.z), 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
  const roll = new THREE.LatheGeometry(pts, 8); roll.scale(1, 1, squash); roll.rotateX(Math.PI / 2); roll.applyMatrix4(at); // (the lathe's axis laid along +Z, then from a to b; the section's height up)
  roll.computeVertexNormals();
  const rings = ties.map((tk) => { const r = rad(tk) * (1 - 0.3) + 0.012, g = new THREE.TorusGeometry(r, 0.018, 4, 10); g.scale(1, squash, 1); g.translate(0, 0, tk * len); g.applyMatrix4(at); return g; });
  const tied = rings.length ? mergeGeometries(rings, false) : null; for (const g of rings) g.dispose();
  return { roll, ties: tied };
}



/** The sloop's colours (Outlaw Star's: white, red, dark-blue joints, a white-blue glow; the deck holystoned ash). */
const C = { white: 0xeef0ee, red: 0xc8322b, navy: 0x1f2a4a, deck: 0xd3c6a8, joint: 0x232b3f, glow: 0xcfe8ff, gold: 0xf2c14e, seam: 0x9fd8ff };

/** The hull's lines at its life size: stations stern to bow [z, half-beam, draft, sheer, rake], the half-section keel to deck edge. The
 *  main deck nearly level (2.2 m over the waterline, the sheer rising 0.75 m to the stem), the quarterdeck raised 1.2 m aft of its
 *  break (two stations 0.2 m apart: the step, not a ramp). */
const HULL = {
  shape: [[0, -1], [0.42, -0.94], [0.86, -0.48], [1, 0.02], [0.98, 0.55], [0.9, 1]],
  stations: [[-17.5, 3.9, 1.5, 3.45], [-14.5, 4.6, 2.1, 3.42], [-9.15, 5.1, 2.7, 3.4], [-8.95, 5.1, 2.72, 2.22], [0, 5.25, 3.0, 2.2], [7, 4.7, 2.75, 2.22], [12.5, 3.3, 2.1, 2.4], [15.75, 1.5, 1.3, 2.7, 0.6], [17.5, 0.1, 0.5, 2.95, 1.5]],
  camber: 0.08,
  strip: (i) => [[C.navy, 0.1], [C.navy, 0.1], [C.white, 0.1], [C.red, 0.1], [C.white, PLANK]][i],
  deck: [C.deck, PLANK], transom: [C.navy, 0.1],
};
const Q = SLOOP.quarter, qY = deckAt(HULL, -12), mY = deckAt(HULL, 0);

export const SLOOP_SPEC = {
  id: 'sloop', length: SLOOP.length, beam: SLOOP.beam, draft: SLOOP.draft, scale: SLOOP.length / SLOOP.was, panel: 3.6, plank: 0.3, dives: true, hull: HULL,
  engineGlow: C.glow, vane: { lotus: true, fill: 0xe8f2ff, edge: 0xd8f0ff, fillA: 0.34 }, pennantScale: 5,
  core: { crystal: 0xffffff, collar: C.joint, frame: C.joint, apex: 2.3, plate: 0.5, k: 1.8 },
  helm: SLOOP.helm.map(([x, z]) => [x, deckAt(HULL, z) - 0.14, z]),
  gun: [0, deckAt(HULL, 10.5) + 1.6, 10.5],
  pennant: { mast: 0 },
  crew: [[-2.6, -5], [2.6, -5], [-2.6, 1.5], [2.6, 1.5], [0, -2], [1.2, 11], [-2, -14.5], [2, -15]].map(([x, z]) => [x, z, deckAt(HULL, z)]),
  write(M) {
    const S = SLOOP, H = HULL;
    M.loft(H);
    // the railings: turned balusters under a gold cap rail along both gunwales, the quarterdeck's own, its breast rail and the taffrail
    railRuns(M, H, [[Q + 0.2, 15.6], [-17.25, Q - 0.25]], { post: C.white, cap: C.gold });
    deckBreak(M, H, { z: Q, stairs: [-2.4, 2.4], post: C.white, cap: C.gold, tread: C.deck, gold: C.gold });
    const th = deckHalf(H, -17.3) - 0.25; balustrade(M, [[-th, deckAt(H, -17.3) - H.camber, -17.3], [th, deckAt(H, -17.3) - H.camber, -17.3]], { post: C.white, cap: C.gold });
    for (const s of [1, -1]) M.gem([s * th, deckAt(H, -17.3) + 1.35, -17.3], 0.22, 0.4, 0.2, 6, C.glow, 0.5); // (the stern lanterns on the taffrail's newels)
    // the keel blade, its bottom edge lit in the ship's feeling
    fin(M, { t: 0.5, pts: [[6.5, -2.5], [-6.5, -2.4], [-5.0, -4.9], [4.5, -5.1]], col: C.navy, edge: 0xffffff, edgeCode: 0.85 });
    // the stern: a carved transom (one row of lit lights under a gold cornice and crest) over the rudder on its sternpost
    gallery(M, { z: -17.5, y0: 1.55, w: 6.2, tiers: 1, h: 1.45, rows: 4, col: C.navy, frame: C.gold, glass: C.glow, gold: C.gold });
    rudder(M, { z: -17.45, yTop: 1.45, yBot: -1.9, chord: 2.6, t: 0.4, col: C.navy, gold: C.gold, inlay: C.red });
    // the engines: two big pods at the stern quarters on pylons (Outlaw Star's), their rings and glow
    const engines = [1, -1].map((s) => pod(M, { x: s * 3.7, y: 0.7, z0: -19.5, z1: -11, r0: 1.5, r1: 1.1, sides: 10, body: C.white, band: C.red, nozzle: C.glow, pylon: [s * 2.5, 1.0], pylonCol: C.joint }));
    // the grappler arms, folded flush under the hull, their claws red
    for (const s of [1, -1]) { M.box([s * 1.8, -3.0, 3], [0.8, 0.6, 7.5], C.joint, 0.1); M.box([s * 1.8, -3.0, 7.25], [1.0, 0.7, 1.2], C.red, 0, { top: [0.8, 0.8] }); }
    // the bowsprit: a lance from the stem over the figurehead, the jib's tack at its end; the figurehead: a gilded Pneuka Jar
    const bz = 16.5, by = deckAt(H, 16.5) - 0.25, tip = [0, by + Math.sin(0.12) * S.bowsprit, bz + Math.cos(0.12) * S.bowsprit];
    M.cyl([0, by, bz - 1.5], tip, 0.3, 0.12, 8, C.white, 0); M.gem(tip, 0.3, 0.5, 0.3, 6, C.red, 0.4, { axis: [0, 0.12, 1] });
    for (const k of [0.25, 0.5]) { const z = bz + Math.cos(0.12) * S.bowsprit * k; M.cyl([0, by + Math.sin(0.12) * S.bowsprit * k, z - 0.12], [0, by + Math.sin(0.12) * S.bowsprit * k, z + 0.12], 0.36, 0.36, 8, C.gold, 0, { caps: false }); }
    figurehead(M, 'jar', { at: [0, 0.75, 18.35], lean: 0.95, k: 0.85, cols: { gold: C.gold, white: C.white, glow: C.glow } });
    // the bow's mount ring (the psygun's), the mast's slot and its gold collar, the capstan, the main hatch and a skylight
    const gz = 10.5, gy = deckAt(H, gz); M.cyl([0, gy - 0.25, gz], [0, gy + 0.8, gz], 1.2, 1.0, 10, C.joint, 0); M.cyl([0, gy + 0.8, gz], [0, gy + 1.0, gz], 1.0, 0.6, 10, C.red, 0);
    slot(M, { y: deckAt(H, S.mast.z), z: S.mast.z, w: 2.5, d: 2.5 });
    capstan(M, { at: [0, mY, -4.5], r: 0.55, col: C.white, band: C.gold, bars: C.joint });
    M.box([0, mY + 0.15, 1.4], [3.0, 0.3, 2.6], C.deck, PLANK); M.box([0, mY + 0.33, 1.4], [3.1, 0.06, 2.7], C.gold, 0); // (the main hatch's coaming)
    M.box([0, qY + 0.3, -15.6], [1.8, 0.6, 1.4], C.white, 0.1, { top: [0.7, 0.8] }); M.quad([-0.62, qY + 0.62, -16.1], [0.62, qY + 0.62, -16.1], [0.62, qY + 0.62, -15.1], [-0.62, qY + 0.62, -15.1], C.glow, 0.32, [0, qY, -15.6]); // (the skylight over the great cabin)
    return { engines };
  },
};
SLOOP_SPEC.rig = {
  masts: [{ x: 0, z: SLOOP.mast.z, y0: deckAt(HULL, SLOOP.mast.z), rake: 0.06, stub: 2.4, collar: C.joint, cap: C.glow,
    segs: Array.from({ length: 6 }, (_, i) => ({ len: 7.1 - 0.05 * i, r0: 0.4 - 0.048 * i, r1: 0.376 - 0.048 * i, col: C.white })) }], // (six nested segments: the lowest, sunk to its stub, stays inside the hull)
  booms: [{ mast: 0, h: SLOOP.boom.y, len: SLOOP.boom.len, r: 0.22, col: C.joint }], // (high enough to clear a Courier on the quarterdeck)
  vanes: [{ kind: 'main', mast: 0, boom: 0, head: 0.96, lotus: true, uvSwap: true },
    { kind: 'jib', mast: 0, head: 0.82, tack: [0, 0, 0], clew: [0, deckAt(HULL, 9.5) + 1.5, 9.25], clewX: 1.5 }],
  hatches: [{ mast: 0, w: 2.5, d: 2.5, col: C.white, seam: C.seam }],
};
{ const by = deckAt(HULL, 16.5) - 0.25; SLOOP_SPEC.rig.vanes[1].tack = [0, by + Math.sin(0.12) * SLOOP.bowsprit * 0.92, 16.5 + Math.cos(0.12) * SLOOP.bowsprit * 0.92]; } // (nine tenths out along the bowsprit)

export class Sloop extends ShipLook {
  constructor({ env = null } = {}) { super(SLOOP_SPEC, { env }); this.length = SLOOP.length; this.beam = SLOOP.beam; }
}
