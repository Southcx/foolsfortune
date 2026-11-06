// ---------------------------------------------------------------------------------------
// THE RACEWAY AS A PARK (docs/plans/SKIFF-RACING.md section 10; the owner, 2026-10-14: "quadruple the size ... nest multiple tracks into
// one map ... THE zone where we test ALL of our racing module mechanics"). One height function for the whole place: the open sand, every
// track's corridor pulled into it (track.js), then the park's own shapes laid over: the hub's plaza, the antlion pits (cones at the sand's
// angle of repose), the half-pipes, the lakes, the wave pool's banks (its ground graded down to its coping and beach: Surf Ranch's, URBNSURF's). Where a point is on any track's running surface, that surface wins (two at once: their
// mean). And one water function: the lakes and the fords, where the board skims (rideHeight). Pure numbers, no three.js: the game, the
// workbench and the Node tools (scripts/raceway/map.mjs) all lay the same ground.
//
// Prior art: Burnout Paradise's and SSX 3's open worlds threaded with events, Kirby Air Ride's City Trial (one map, many tests), Trackmania's
// stadium (every block in one place); the house's own track.js, nested; Kelly Slater's Surf Ranch (Lemoore), URBNSURF (Melbourne) and BSR
// Surf Resort (Waco) for the wave pool's banks: a deck flush with the coping, a beach running into the water, the land eased away beyond.
//
//   const P = park()   P.tracks [T]   P.track(id)   P.heightAt(lx, lz)   P.waterAt(lx, lz) -> surface | null   P.pits   P.pipes   P.lakes   PARK   poolBanksOf(POOL)
// ---------------------------------------------------------------------------------------
import { sandAt, track, SUN, CONTROL, FEATURES, BRANCH } from './track.js';
import { GORGE } from './tracks/gorge.js';
import { COASTER } from './tracks/coaster.js';
import { LOT } from '../../progress/trackdef.js';
import { slopeShape } from './surf/slope.js'; // (the slope, a dune for the snowboard ride: Calissa's, WAVE-RIDING.md 3)
import { wavePool } from './surf/wavepool.js';

/** The park's own shapes (local metres; y over the layer's floor). The hub: where the Index sets you down, a plaza flattened among the
 *  tracks' starts. An antlion pit: a cone whose sides stand at the sand's angle of repose (tan 33 degrees: dry sand will not lie steeper,
 *  the pit's whole trick), its rim at `y`, `r` across; its maw at the bottom. A half-pipe: a flat floor `w` across between two
 *  quarter-circle walls of radius `r`, `len` long along `dir` (radians, as the track's yaw), its floor at `y`. A lake: an ellipse of water at
 *  `y`, its bed `depth` under it. */
export const PARK = {
  hub: { x: 0, z: 0, r: 70, blend: 50, y: 24 },
  repose: Math.tan(33 * Math.PI / 180),
  pits: [{ id: 'antlion', x: -520, z: 470, r: 70, y: 22 }, { id: 'crater', x: 560, z: -760, r: 46, y: -45 }],
  pipes: [{ id: 'pipe', x: -200, z: 180, dir: 0.6, len: 140, w: 7, r: 9, y: 22 }],
  lakes: [{ id: 'mirror', x: 240, z: -470, rx: 70, rz: 110, y: 9, depth: 3 }],
  // a crater: a bowl sunk into the sand, its rim at `y` `r` out, falling to its floor at `floor` inside `rf` (the Gorge's spiral road
  // winds down its wall: tracks/gorge.js)
  craters: [{ id: 'crater', x: 560, z: -760, r: 260, rf: 60, y: 10, floor: -45 }],
  // the wave pool's banks (Calissa's; South, 2026-11-06: "sand dunes being sheared off on both sides of the pool"): the ground graded down
  // to the pool's coping round every side as a real wave pool sits in its ground (Surf Ranch at Lemoore, URBNSURF Melbourne, BSR Waco): a
  // flat deck `deck` m over the still water (the coping 0.15 proud of it: vfx/waves/basin.js) on the deep side and the ends, the beach's
  // sand running on up out of the water at `rise` on the beach side, then the dunes eased back in over the fall. The flat and the fall are
  // [at least m, a share of the pool's width], so a grown pool grows its banks (POOL, surf/wavepool.js); `blendV` the metres along an end
  // over which the beach's sand meets the deck.
  poolBanks: { deck: 1.45, rise: 0.035, flat: [16, 0.12], fall: [44, 0.4], blendV: 20 },
};
/** The wave pool's banks' numbers for a pool (POOL): the deck's and the beach's tops (over the layer's floor), the flat's and the fall's
 *  widths (m), and the beach blend; read by heightAt here and by the basin's dress (the deck's paving, vfx/waves/basin.js). */
export function poolBanksOf(P) {
  const B = PARK.poolBanks;
  return { deck: P.y + B.deck, beach: P.y + P.rim, rise: B.rise, flat: Math.max(B.flat[0], P.W * B.flat[1]), fall: Math.max(B.fall[0], P.W * B.fall[1]), blendV: B.blendV };
}
/** A crater's bowl at `d` from its middle: the floor, the wall rising straight to the rim, the sand beyond falling back to it. */
export const craterAt = (Cr, d) => (d < Cr.rf ? Cr.floor : d < Cr.r ? Cr.floor + ((d - Cr.rf) / (Cr.r - Cr.rf)) * (Cr.y - Cr.floor) : Cr.y + (d - Cr.r) * 0.8);

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// (the samplers below make nothing: no Math.hypot, which boxes its arguments, and no for-of, whose iterators the field made by the
// hundred million on a phone: Petra's measure, 2026-10-26; CASEBOOK 309)
const len2 = (x, z) => Math.sqrt(x * x + z * z);

export function park() {
  const WP = wavePool(); // (the wave pool: its basin's bed cut into the ground, its still level the water here: surf/wavepool.js, surf/surfpool.js)
  const H = PARK.hub, Rp = PARK.repose, CRATERS = PARK.craters, PIPES = PARK.pipes, PITS = PARK.pits;
  const PP = WP.POOL, PB = poolBanksOf(PP), bankReach = PB.flat + PB.fall;
  /** The wave pool's banks over the ground h at (x, z): inside the basin the deck's level (the bed is cut under it after), round it the
   *  deck or the beach's sand, flat out to PB.flat, then the dunes eased back over PB.fall (a smoothstep: never a face). */
  function poolBanks(x, z, h) {
    const u = WP.toU(x, z), v = WP.toV(x, z), ou = u < 0 ? -u : u > PP.L ? u - PP.L : 0, ov = v < -PP.beach ? -PP.beach - v : v > PP.W ? v - PP.W : 0;
    if (ou > bankReach || ov > bankReach) return h;
    const d = len2(ou, ov); if (d >= bankReach) return h;
    const bk = 1 - sstep(-PP.beach, -PP.beach + PB.blendV, v); // (1 on the beach's side, 0 along the deck)
    const T = PB.deck + (PB.beach - PB.deck) * bk + PB.rise * bk * Math.min(d, PB.flat);
    return T + (h - T) * sstep(PB.flat, bankReach, d);
  }
  /** The beach inside the basin (v from -beach to 0): the sand eased from the bank's top down to the bed's foot at v = 0, so it runs into
   *  the water with no step at either end (bedAt's beach term, surf/wavepool.js, leaves a 1.6 m step at each: the other builder's file). */
  const beachAt = (v) => PB.beach + (PP.y - PP.depth.foot - PB.beach) * sstep(-PP.beach, 0, v);
  const tracks = [track({ ...SUN, control: CONTROL, features: FEATURES, branch: BRANCH }, (x, z) => groundAt(x, z)), track(GORGE, (x, z) => groundAt(x, z)), track(COASTER, (x, z) => groundAt(x, z))];
  // the lakes: the park's, and each track's fords and its branch's pools, laid as ellipses along the line where they lie
  const lakes = PARK.lakes.map((L) => ({ rot: 0, ...L }));
  for (const T of tracks) {
    for (const Fd of T.features.fords || []) { const f = T.frame(T.sOf(Fd.cp, Fd.at + Fd.len / 2)); lakes.push({ id: `${T.id}.ford`, x: f.x, z: f.z, rx: f.w + 4, rz: Fd.len / 2, rot: Math.atan2(f.fx, f.fz), y: f.y, depth: Fd.depth }); }
    for (const Pl of T.branch?.def?.pools || []) { const f = T.branch.frame(Pl.at + Pl.len / 2); lakes.push({ id: `${T.id}.pool`, x: f.x, z: f.z, rx: f.w - 0.5, rz: Pl.len / 2, rot: Math.atan2(f.fx, f.fz), y: f.y, depth: Pl.depth }); }
  }
  const lakeE = (L, x, z) => { const dx = x - L.x, dz = z - L.z, c = Math.cos(L.rot), s = Math.sin(L.rot), u = dx * c - dz * s, v = dx * s + dz * c; return len2(u / L.rx, v / L.rz); };
  /** The open sand as the park shapes it before the tracks: the hub's plaza flattened, the craters sunk (a track laid in one is pulled
   *  to its own surface as anywhere). */
  function groundAt(x, z) {
    let h = sandAt(x, z);
    { const d = len2(x - H.x, z - H.z); if (d < H.r + H.blend) h += (H.y - h) * (1 - sstep(H.r, H.r + H.blend, d)); }
    for (let k = 0; k < CRATERS.length; k++) { const Cr = CRATERS[k], d = len2(x - Cr.x, z - Cr.z); if (d < Cr.r + 60) h = Math.min(h, craterAt(Cr, d)); }
    // the build lot (progress/trackdef.js LOT: TRACK-EDITOR.md 3): a square laid flat for made tracks, blended back to the sand round it
    { const d = Math.max(Math.abs(x - LOT.x), Math.abs(z - LOT.z)); if (d < LOT.half + LOT.blend) h += (LOT.y - h) * (1 - sstep(LOT.half, LOT.half + LOT.blend, d)); }
    return h;
  }
  /** The ground with every track pulled in, before the park's cut shapes. */
  function tracksAt(x, z) {
    let sum = groundAt(x, z), wt = 1, on = 0, n = 0;
    for (let k = 0; k < tracks.length; k++) { const P = tracks[k].pull(x, z); if (!P) continue; if (P.hasOn) { on += P.on; n++; } sum += P.sum; wt += P.wt; }
    return n ? on / n : sum / wt;
  }
  function heightAt(x, z) {
    let h = tracksAt(x, z);
    h = slopeShape(x, z, h); // (the slope: a long dune laid over the sand in the park's south, surf/slope.js)
    // the half-pipes: the floor, the quarter circles, the deck beyond, blended back over 20 m
    for (let q = 0; q < PIPES.length; q++) {
      const Pp = PIPES[q];
      const fx = Math.sin(Pp.dir), fz = Math.cos(Pp.dir), dx = x - Pp.x, dz = z - Pp.z, along = dx * fx + dz * fz, lat = Math.abs(dx * -fz + dz * fx);
      if (Math.abs(along) > Pp.len / 2 + 20 || lat > Pp.w + Pp.r + 20) continue;
      const a = Math.min(Pp.r * 0.97, Math.max(0, lat - Pp.w)), wall = Pp.y + Pp.r - Math.sqrt(Pp.r * Pp.r - a * a), shape = lat > Pp.w + Pp.r * 0.97 ? Pp.y + Pp.r * 0.76 : wall;
      const k = (1 - sstep(Pp.len / 2, Pp.len / 2 + 20, Math.abs(along))) * (1 - sstep(Pp.w + Pp.r, Pp.w + Pp.r + 20, lat));
      h += (shape - h) * k;
    }
    // the lakes' beds: under the water `depth` down, the shore rising out of it
    for (let k = 0; k < lakes.length; k++) { const Lk = lakes[k], e = lakeE(Lk, x, z); if (e < 1.3) h = Math.min(h, e < 1 ? Lk.y - Lk.depth * (1 - sstep(0.7, 1, e)) : Lk.y + (e - 1) * 40); }
    // the antlion pits: cones at the angle of repose, cut into whatever is there (a track crossing a rim drops in)
    for (let k = 0; k < PITS.length; k++) { const Pt = PITS[k], d = len2(x - Pt.x, z - Pt.z); if (d < Pt.r + 8) h = Math.min(h, Pt.y - Math.max(0, Pt.r - d) * Rp + (d > Pt.r ? (d - Pt.r) * 1.5 : 0)); }
    h = poolBanks(x, z, h); // (the wave pool's banks: the ground graded down to its coping and its beach)
    if (WP.inPool(x, z)) { const v = WP.toV(x, z); h = v < 0 ? beachAt(v) : Math.min(h, WP.bedAt(x, z) ?? h); } // (the wave pool's basin, cut under the deck's level; its beach the sand's own)
    return h;
  }
  /** The water's surface over the ground here, or null: the lakes, and each track's fords. */
  function waterAt(x, z) {
    if (WP.inPool(x, z)) return WP.POOL.y; // (the wave pool's still level; its moving surface is the Raceway's: surf/surfpool.js rideY)
    for (let k = 0; k < lakes.length; k++) if (lakeE(lakes[k], x, z) < 1) return lakes[k].y;
    return null;
  }
  return { tracks, track: (id) => tracks.find((T) => T.id === id), heightAt, waterAt, groundAt, pits: PARK.pits, pipes: PARK.pipes, lakes, craters: PARK.craters, hub: H };
}
