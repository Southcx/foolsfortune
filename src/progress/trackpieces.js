// ---------------------------------------------------------------------------------------
// THE TRACK EDITOR'S PIECES (docs/plans/TRACK-EDITOR.md 3): what the hand raises on a made track besides its line and its traps. A piece
// is either something the board RIDES (its height over the lot's floor, read by raceway.rideHeight through `pieceHeight`) or something
// SOLID (a collider in the world, counted for near misses), or a MARK on the line (a sun plate, a vein lane, a geyser: the Raceway's own
// furniture). Each is made with a god power (Sculpt raises ramps and pillars, Manifest walls, Shape a hill ...) and is open when that
// power is yours, as the editor's palette shows (TRACK-EDITOR.md 3: the editor grows with your domains). Placeholders' sizes; the looks
// are Calissa's.
//
// Prior art: Trackmania's blocks and Hot Wheels Unleashed's pieces (a kit of shapes, each one job); ModNation Racers' props; the god
// hand's own creations (godhand/creations.js: a pillar, an arch, a ramp).
//
//   PIECES[kind] = { label, line, power, cost, ride?: { len, w, h, shape }, solid?: { parts: [{ x, y, z, sx, sy, sz }] }, mark?: 'plate' | 'lane' | 'geyser' }
//   pieceHeight(P, lx, lz) -> metres over the floor | 0 (lot-local x, z)   pieceRadius(P) -> metres   localOf(P, lx, lz) -> { a (along), c (across) }
// ---------------------------------------------------------------------------------------

/** The kit. `power`: the god power that makes it (open when that power is yours: progress/godpowers.js, the System's arts); `cost`: of the
 *  track's budget. Ride shapes: a WEDGE rising along its yaw (a ramp, a kicker: off its top edge is a jump), a HILL (a cosine bump). */
export const PIECES = {
  ramp: { label: 'Ramp', line: 'A long rise; off its top, a jump.', power: 'sculpt', cost: 4, ride: { shape: 'wedge', len: 14, w: 8, h: 3.4 } },
  kicker: { label: 'Kicker', line: 'A short steep lip: a pop off it goes high.', power: 'sculpt', cost: 3, ride: { shape: 'wedge', len: 5, w: 6, h: 1.8 } },
  hill: { label: 'Hill', line: 'A smooth hump: carry speed over it, or air off its crest.', power: 'shape', cost: 3, ride: { shape: 'hill', len: 24, w: 24, h: 3.2 } },
  pillar: { label: 'Pillar', line: 'A standing stone to weave round (a near miss past it counts).', power: 'sculpt', cost: 2, solid: { parts: [{ x: 0, y: 3.5, z: 0, sx: 2.2, sy: 7, sz: 2.2 }] } },
  wall: { label: 'Wall', line: 'A clay wall: a lane closed, a line chosen for you.', power: 'manifest', cost: 3, solid: { parts: [{ x: 0, y: 1.5, z: 0, sx: 10, sy: 3, sz: 0.9 }] } },
  arch: { label: 'Arch', line: 'Two posts and a lintel: thread it.', power: 'sculpt', cost: 4, solid: { parts: [{ x: -5, y: 3.5, z: 0, sx: 1.6, sy: 7, sz: 1.6 }, { x: 5, y: 3.5, z: 0, sx: 1.6, sy: 7, sz: 1.6 }, { x: 0, y: 7.6, z: 0, sx: 12, sy: 1.2, sz: 1.8 }] } },
  plate: { label: 'Boost pad', line: 'A sun plate: a flare\'s push for free.', power: 'manifest', cost: 2, mark: 'plate', size: { len: 8, w: 3 } },
  lane: { label: 'Recharge strip', line: 'A vein lane: ride it and the pool refills.', power: 'transmute', cost: 3, mark: 'lane', size: { len: 30, w: 2.5 } },
  geyser: { label: 'Geyser', line: 'A slip geyser: it throws the board high on its cycle.', power: 'scoop', cost: 4, mark: 'geyser' },
};
export const PIECE_KINDS = Object.keys(PIECES);

/** A lot-local point in a piece's own frame: `a` along its yaw (forward), `c` across it (to its right). */
export function localOf(P, lx, lz) {
  const dx = lx - P.x, dz = lz - P.z, s = Math.sin(P.yaw || 0), c = Math.cos(P.yaw || 0);
  return { a: dx * s + dz * c, c: dx * c - dz * s };
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** A ridden piece's height over the lot's floor at a lot-local point (0 off it). A wedge rises from its foot to its lip (its sides bevelled
 *  over a metre); a hill is a cosine bump to its edge. */
export function pieceHeight(P, lx, lz) {
  const R = PIECES[P.kind]?.ride; if (!R) return 0;
  const { a, c } = localOf(P, lx, lz);
  if (R.shape === 'wedge') {
    const u = (a + R.len / 2) / R.len; if (u < 0 || u > 1) return 0;
    const side = 1 - sstep(R.w / 2 - 1, R.w / 2, Math.abs(c)); if (side <= 0) return 0;
    return R.h * Math.pow(u, 1.4) * side;
  }
  if (R.shape === 'hill') {
    const d = Math.hypot(a / (R.len / 2), c / (R.w / 2)); if (d >= 1) return 0;
    return R.h * 0.5 * (1 + Math.cos(Math.PI * d));
  }
  return 0;
}
/** How far from its middle a piece reaches (for the cell grid and picking). */
export function pieceRadius(P) {
  const K = PIECES[P.kind]; if (!K) return 0;
  if (K.ride) return Math.hypot(K.ride.len, K.ride.w) / 2;
  if (K.solid) return Math.max(...K.solid.parts.map((p) => Math.hypot(Math.abs(p.x) + p.sx / 2, Math.abs(p.z) + p.sz / 2)));
  if (K.size) return Math.hypot(K.size.len, K.size.w) / 2;
  return 4;
}
