// ---------------------------------------------------------------------------------------
// THE SLOPE (plain name; South's ask, 2026-11-06: the Solar Skiff "encapsulating wave rider, snowboarding and surfing mechanics";
// docs/ref/WAVE-RIDING.md section 3): one long dune in the Raceway park's south, laid as a pure height shape over the sand (as park.js's
// half-pipes are): a gentle back (about 6 degrees) the sail can climb, a short crest, then the steep face, the slip face of a dune (pitches
// of 26 to 30 degrees, the sand's angle of repose and a little past it) broken by two rollers and a bench with a line of three kickers,
// eased into a floor and a rise back to the sand as the run-out. Furled on its face, the board rides it as a snowboard
// (courier/skiff/sloperide.js).
//
// The profile is given as the ground's grade (degrees, + up) at knots along the dune's line, linearly between them, integrated once into
// a table of heights a half metre apart: the rollers and kickers are only knots, and every join is smooth in height. Across the line the
// shape is flat for `w` metres each side, then blended back to the sand over a width that grows with how far it stands off it (sides of
// about 30 degrees, a dune's, never a cliff).
//
// Prior art: a barchan dune's profile (a gentle stoss side, a slip face at the angle of repose: Bagnold, "The Physics of Blown Sand"),
// SSX's and Shaun White Snowboarding's runs (a drop-in, rollers, a kicker line, a run-out), the house's park.js (a pure height function
// shared by the game, the field and the Node map).
//
//   SLOPE (the numbers)   slopeLocal(x, z) -> { u, v }   slopeShape(x, z, h) -> h' (the hook in park.js heightAt)   slopeTop() -> { x, z, yaw }
//   addSlopePlace(game, places) (the /goto place 'raceway.slope': world/places.js)
// ---------------------------------------------------------------------------------------

/** The dune, park-local metres: its line from A (the back's foot, west) to B (the run-out's end, east), the back's foot's height `y0`, its
 *  half-width `w` (flat), the side blend's least width and its growth a metre of standing off the sand, the ends' blend along the line,
 *  and the grade's knots [u (metres along the line from A), grade (degrees)]. Clear of the tracks (Sun Circuit to the north-west, the
 *  Gorge's crater to the east) by 40 m at its ends, more along its middle; inside the barrier (the park's edge, 1270 m). */
export const SLOPE = {
  A: { x: -619, z: -885 }, B: { x: 334, z: -1027 },
  y0: 23, w: 55, side: 28, sideK: 1.7, ends: 30, step: 0.5,
  top: 425, // (the place's spot: on the crest, the face ahead)
  knots: [
    [0, 0], [25, 6], [400, 6], [412, 0], [440, 0], // the back (6 degrees, climbed with the sail), the crest
    [452, -30], [482, -30], // the drop-in
    [492, -8], [500, 7], [508, -8], // roller 1
    [518, -28], [548, -28], [558, -3], // the second pitch, onto the bench
    [574, -3], [578, 18], [584, 18], [586, -14], [593, -3], // kicker 1
    [608, -3], [612, 18], [618, 18], [620, -14], [627, -3], // kicker 2
    [642, -3], [646, 20], [653, 20], [655, -16], [663, -3], // kicker 3 (the biggest)
    [680, -3], [692, -26], [716, -26], // the third pitch
    [724, -12], [731, 5], [738, -12], // roller 2
    [746, -22], [776, 0], [810, 0], // eased into the floor
    [822, 8], [945, 8], [955, 0], // the rise back to the sand (a brake)
  ],
};

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;
const S = SLOPE, dx = S.B.x - S.A.x, dz = S.B.z - S.A.z, LEN = Math.sqrt(dx * dx + dz * dz), ux = dx / LEN, uz = dz / LEN;
/** The table: the shape's height every `step` metres along the line, from the grade's knots. */
const TABLE = (() => {
  const n = Math.ceil(LEN / S.step) + 2, Y = new Float32Array(n), K = S.knots;
  const grade = (u) => { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); } return K[K.length - 1][1]; };
  let y = S.y0; Y[0] = y;
  for (let i = 1; i < n; i++) { const u = (i - 0.5) * S.step; y += Math.tan(grade(u) * D2R) * S.step; Y[i] = y; }
  return Y;
})();
const shapeY = (u) => { const f = Math.min(TABLE.length - 1.001, Math.max(0, u / S.step)), i = Math.floor(f), t = f - i; return TABLE[i] * (1 - t) + TABLE[i + 1] * t; };

/** A park-local point in the dune's frame: u along its line from A, v across it (+: to the line's left, the park's north side). */
export function slopeLocal(x, z) { const px = x - S.A.x, pz = z - S.A.z; return { u: px * ux + pz * uz, v: px * -uz + pz * ux }; }

/** The hook (park.js heightAt): the sand `h` here, with the dune laid over it. No allocation: the field calls it 1.1 million times. */
export function slopeShape(x, z, h) {
  const px = x - S.A.x, pz = z - S.A.z, u = px * ux + pz * uz;
  if (u < -S.ends || u > LEN + S.ends) return h;
  const v = Math.abs(px * -uz + pz * ux);
  if (v > S.w + 260) return h; // (past the widest blend: the dune stands at most ~130 m off the sand)
  const y = shapeY(u), off = Math.abs(y - h), b = S.side + S.sideK * off;
  if (v > S.w + b) return h;
  const k = (1 - sstep(S.w, S.w + b, v)) * sstep(-S.ends, 0, u) * (1 - sstep(LEN, LEN + S.ends, u));
  return h + (y - h) * k;
}

/** On the dune's face (park-local): past its crest along the line and within its flat width and a little of its blend. The slope ride
 *  begins only here, so the board on every other downslope rides exactly as before (Petra's gate, 2026-11-06). */
export function onSlope(x, z) {
  const px = x - S.A.x, pz = z - S.A.z, u = px * ux + pz * uz;
  return u > S.top - 20 && u < LEN && Math.abs(px * -uz + pz * ux) < S.w + S.side;
}

/** The crest's spot (park-local) and the yaw facing down the face (the skiff's heading: atan2(x, z) of the way). */
export function slopeTop() { const u = S.top; return { x: S.A.x + ux * u, z: S.A.z + uz * u, y: shapeY(u), yaw: Math.atan2(ux, uz) }; }
/** The dune's line's length (m) and its height at u (m along the line), for the tools. */
export const slopeLen = LEN;
export const slopeAt = shapeY;

/** The /goto place on the crest ('raceway.slope'): into the Raceway as its own place goes, then set down on the crest facing the face. */
export function addSlopePlace(game, places) {
  const R = game.raceway; if (!R) return;
  const T = slopeTop(), RW = () => R.center; // (the park's middle in the world: raceway.js)
  const spot = () => { const c = RW(); const p = new game.player.pos.constructor(c.x + T.x, 0, c.z + T.z); p.y = R.heightAt(p.x, p.z) + 0.05; return p; };
  places.add('raceway.slope', {
    name: 'the slope', at: spot, note: 'a long dune in the Raceway park\'s south: its back climbed with the sail, its face ridden furled (a snowboard\'s)',
    via: () => { const off = game.events?.on?.('raceway.enter', () => { off?.(); game.course.teleport(spot(), T.yaw); }); R.arrive(); return true; },
  });
}
