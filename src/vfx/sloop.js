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
// Prior art: the Bermuda and Jamaica sloops (the narrow, sharp, raked fore-and-aft type), the XGP15A-II Outlaw Star (Kawamori's: white
// and red plates, grappler arms that hide in the hull, big rear pods), a submarine's photonics mast, Jurai's light for the sails.
//
//   const s = new Sloop({ env })   scene.add(s.group)   s.set({ sail 0..1, heel rad, side -1|1, glow 0..1, t, form, roll })   s.fold(u)
//   s.polarity(hex)   s.hurt(0..1)   s.hoist('bronze' | 'silver' | 'gold' | 'platinum' | 'none')   s.scars({ open, gilt })   s.dispose()
//   s.helmCradles (one)   s.helmCradle   s.helmCradleSpots() -> [world point]   s.helmWake(on, i = 0)   (the rest: shipkit/shiplook.js)
//   (its own frame: +Z the bow, Y up, origin at the waterline amidships; 7 m long)
// Kept from the jar-hulled sloop, for what else is made with them: JAR (the Pneuka Jar's profile), jarHull, jarDeck, jarTop, seatHelms
// (a cradle on a plinth on a jar's top skin), furlRoll (a sail furled), and the sail's material and FURL (now shipkit/vane.js).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CradleLook, cradleFoot } from './cradlelook.js';
import { ShipLook } from './shipkit/shiplook.js';
import { deckAt } from './shipkit/hullkit.js';
import { rail, pod, fin, slot } from './shipkit/parts.js';
export { sailMaterial, FURL } from './shipkit/vane.js';

export const SLOOP = { length: 7, beam: 2.1, draft: 0.6, mast: { z: 1.2, h: 7.6 }, boom: { y: 1.2, len: 3.4 }, bowsprit: 1.6, helm: [[0, -2.0]] }; // (helm: its cradles' [x, z])

// the Pneuka Jar's profile, foot to lip (fraction of the length, fraction of the belly's radius): the hull is this turned and laid down
export const JAR = [[0, 0], [0.03, 0.34], [0.1, 0.66], [0.24, 0.93], [0.4, 1], [0.58, 0.95], [0.74, 0.78], [0.84, 0.6], [0.9, 0.5], [0.95, 0.54], [1, 0.6]];

/** The hull: the jar's silhouette turned (rings round the girth), laid along Z, squashed to a hull's depth and cut at the waterline.
 *  Any pot's profile and size (the ship classes', vfx/shipclasses.js: each hull a different pot thrown and laid down). */
export function jarHull(profile = JAR, { length: L, beam, draft, sheer: sh = [0.55, 0.4, 0.18] } = SLOOP) {
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
export function jarDeck(profile = JAR, { length: L, beam } = SLOOP, y = 0.42) {
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
export function jarTop(profile = JAR, { length: L, beam, sheer: sh = [0.55, 0.4, 0.18] } = SLOOP, x = 0, z = 0) {
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


/** The sloop's colours (Outlaw Star's: white, red, dark-blue joints, a white-blue glow). */
const C = { white: 0xeef0ee, red: 0xc8322b, navy: 0x1f2a4a, deck: 0xc6cbd3, joint: 0x232b3f, glow: 0xcfe8ff, gold: 0xf2c14e, seam: 0x9fd8ff };

/** The hull's lines: stations stern to bow [z, half-beam, draft, sheer, rake], the half-section keel to deck edge. */
const HULL = {
  shape: [[0, -1], [0.42, -0.94], [0.86, -0.48], [1, 0.02], [0.98, 0.55], [0.9, 1]],
  stations: [[-3.5, 0.78, 0.3, 0.46], [-2.9, 0.92, 0.42, 0.44], [-1.6, 1.03, 0.55, 0.42], [0, 1.05, 0.6, 0.42], [1.4, 0.94, 0.55, 0.45], [2.5, 0.66, 0.42, 0.52], [3.15, 0.3, 0.26, 0.6, 0.12], [3.5, 0.02, 0.1, 0.66, 0.3]],
  camber: 0.04,
  strip: (i) => [[C.navy, 0.1], [C.navy, 0.1], [C.white, 0.1], [C.red, 0.1], [C.white, 0.1]][i],
  deck: [C.deck, 0.1], transom: [C.navy, 0.1],
};

export const SLOOP_SPEC = {
  id: 'sloop', length: SLOOP.length, beam: SLOOP.beam, draft: SLOOP.draft, panel: 0.85, dives: true, hull: HULL,
  engineGlow: C.glow, vane: { lotus: true, fill: 0xe8f2ff, edge: 0xd8f0ff, fillA: 0.34 },
  core: { crystal: 0xffffff, collar: C.joint, frame: C.joint, apex: 0.95 },
  helm: SLOOP.helm.map(([x, z]) => [x, deckAt(HULL, z) - 0.14, z]),
  gun: [0, deckAt(HULL, 2.1) + 0.32, 2.1],
  pennant: { mast: 0 },
  write(M) {
    const S = SLOOP, H = HULL;
    M.loft(H);
    rail(M, H, { z0: -3.3, z1: 3.2, col: C.gold });
    // the keel blade, its bottom edge lit in the ship's feeling
    fin(M, { t: 0.1, pts: [[1.3, -0.5], [-1.3, -0.48], [-1.0, -0.98], [0.9, -1.02]], col: C.navy, edge: 0xffffff, edgeCode: 0.85 });
    // the engines: two big pods at the stern quarters on pylons (Outlaw Star's), their rings and glow
    const engines = [1, -1].map((s) => pod(M, { x: s * 0.74, y: 0.14, z0: -3.9, z1: -2.2, r0: 0.3, r1: 0.22, body: C.white, band: C.red, nozzle: C.glow, pylon: [s * 0.5, 0.2], pylonCol: C.joint }));
    // the grappler arms, folded flush under the hull, their claws red
    for (const s of [1, -1]) { M.box([s * 0.36, -0.6, 0.6], [0.16, 0.12, 1.5], C.joint, 0.1, { top: [1, 1] }); M.box([s * 0.36, -0.6, 1.45], [0.2, 0.14, 0.24], C.red, 0, { top: [0.8, 0.8] }); }
    // the bowsprit: a slender lance from the stem, the jib's tack at its end
    const bz = 3.3, by = deckAt(H, 3.3) - 0.05, tip = [0, by + Math.sin(0.12) * S.bowsprit, bz + Math.cos(0.12) * S.bowsprit];
    M.cyl([0, by, bz - 0.3], tip, 0.06, 0.025, 6, C.white, 0); M.gem(tip, 0.06, 0.1, 0.06, 5, C.red, 0.4, { axis: [0, 0.12, 1] });
    // the bow's mount ring (the psygun's), the cockpit's coaming, the mast's slot
    const gz = 2.1, gy = deckAt(H, gz); M.cyl([0, gy - 0.05, gz], [0, gy + 0.16, gz], 0.24, 0.2, 8, C.joint, 0); M.cyl([0, gy + 0.16, gz], [0, gy + 0.2, gz], 0.2, 0.12, 8, C.red, 0);
    slot(M, { y: deckAt(H, S.mast.z) - 0.04, z: S.mast.z, w: 0.5, d: 0.5 });
    // a low dorsal spine between the mast's slot and the cockpit
    M.box([0, deckAt(H, -0.15) + 0.02, -0.15], [0.22, 0.1, 1.6], C.white, 0.1, { top: [0.5, 0.95] });
    return { engines };
  },
};
SLOOP_SPEC.rig = {
  masts: [{ x: 0, z: SLOOP.mast.z, y0: deckAt(HULL, SLOOP.mast.z) - 0.04, rake: 0.06, stub: 0.42, collar: C.joint, cap: C.glow,
    segs: Array.from({ length: 6 }, (_, i) => ({ len: 1.42 - 0.01 * i, r0: 0.1 - 0.012 * i, r1: 0.094 - 0.012 * i, col: C.white })) }], // (six nested segments: the lowest, sunk to its stub, stays inside the hull)
  booms: [{ mast: 0, h: SLOOP.boom.y, len: SLOOP.boom.len, r: 0.05, col: C.joint }],
  vanes: [{ kind: 'main', mast: 0, boom: 0, head: 0.96, lotus: true, uvSwap: true },
    { kind: 'jib', mast: 0, head: 0.82, tack: [0, 0, 0], clew: [0, deckAt(HULL, 1.9) + 0.3, 1.85], clewX: 0.3 }],
  hatches: [{ mast: 0, w: 0.5, d: 0.5, col: C.white, seam: C.seam }],
};
{ const by = deckAt(HULL, 3.3) - 0.05; SLOOP_SPEC.rig.vanes[1].tack = [0, by + Math.sin(0.12) * SLOOP.bowsprit * 0.92, 3.3 + Math.cos(0.12) * SLOOP.bowsprit * 0.92]; } // (nine tenths out along the bowsprit)

export class Sloop extends ShipLook {
  constructor({ env = null } = {}) { super(SLOOP_SPEC, { env }); this.length = SLOOP.length; this.beam = SLOOP.beam; }
  /** The ship's feeling, by the rail's name for it (world/emocean/stage.js, the mooring, the workbench). */
  polarity(hex) { return this.feeling(hex); }
}
