// ---------------------------------------------------------------------------------------
// THE SMASH CHALLENGES (docs/plans/MECHS.md 11; South, 2026-11-02 night: "have fun with the giant mech module"). The Incredible Hulk:
// Ultimate Destruction's minigames at the mech's scale, in the proving ground: each begun at its lectern, played against a limit (tries or
// real seconds), scored off the events the mech already says (a prop's throw landing, a building's cells breaking, one felled), and paid
// in bronze, silver and gold. Nothing here is new physics: a challenge only lays out its targets and reads what happened, so it teaches
// the mech's own verbs (the throw's arc, the javelin's line, where a building gives) by asking for them well.
//
//   javelin    a post or girder thrown from the line, best of three by distance (Ultimate Destruction's Javelin, track's own)
//   bullseye   three throws at rings on the ground, scored by ring (Gamma Golf's green, darts' board)
//   bowling    one frame, two balls, the water tower thrown at ten clay pins; a strike, a spare (Ultimate Destruction's Bowling)
//   demolition 60 real s to break as many cells of the toy city as you can (Rampage, scored as Red Faction's salvage)
//   wrecking   120 real s to bring down as many buildings as you can (Ultimate Destruction's "Wreck" challenges)
//
// Prior art: The Incredible Hulk: Ultimate Destruction (2005: Gamma Golf, Bowling, the Javelin, the timed wrecks, each with a medal),
// Rampage (a city brought down against the clock), Wii Sports' bowling (a frame's strike and spare as the only rules worth keeping),
// darts (rings worth more toward the middle), Pilotwings' landing targets (medals by points at fixed bars).
//
//   CHALLENGES[id] = { label, line, kind ('throw' | 'timed'), props?, tries?, secs?, unit, medals [bronze, silver, gold], at }
//   LANE   RINGS   PINS   pinSpots()   newChallenge(id) -> run   throwLand(run, { from, at, prop }) -> { add, what } | null
//   ball(run, knocked, standingBefore) -> { add, what }   brokeCells(run, n)   felled(run)   tick(run, dt) -> bool (over)
//   over(run)   medalOf(id, score) -> 0 none .. 3 gold   ringOf(d) -> { r, pts } | null   pinChain(pins, struck, dir) -> Set(indices)
// ---------------------------------------------------------------------------------------

/** The throwing lane: along the yard's north strip (local metres from PROVING.at), clear of the city's lots (z -60 .. 60) and the blocks.
 *  The line is at x -150; throws go east (+x). `lectern` is where each challenge is begun (F), a few metres behind the line. */
export const LANE = { z: -155, line: -150, east: 1, lectern: { x: -162, z: -140 }, width: 30 };

/** The bullseye's rings: radius (m) and points, innermost first (darts' bull, about the frame's own footprint at 4 m). */
export const RINGS = [{ r: 4, pts: 100 }, { r: 10, pts: 50 }, { r: 18, pts: 25 }, { r: 28, pts: 10 }];

/** The pins: ten in a triangle (4-3-2-1 from the back), `gap` m apart, the head pin `at` m down the lane from the line; a pin is struck
 *  when a thrown thing passes within `r` of it, and a falling pin knocks those within `reach` beyond it (pinChain). Sized to the water
 *  tower (about 8 m across in flight): a straight throw at the head pin takes the pocket, a wide one a corner. */
export const PINS = { at: 140, gap: 6, h: 8, r: 3, reach: 7.5, cone: 0.85 }; // (cone: the cosine of the angle off its fall a pin still takes another: 32 degrees, a row's diagonal)

export const CHALLENGES = {
  javelin: { label: 'Javelin', line: 'Throw a post or girder from the line: your best of three, in metres.', kind: 'throw', props: ['post', 'girder'], tries: 3, unit: 'm', medals: [60, 100, 140] },
  bullseye: { label: 'Bullseye', line: 'Three throws at the rings. The middle is worth the most.', kind: 'throw', props: ['chunk', 'tower'], tries: 3, unit: 'points', medals: [100, 175, 250], target: 110 },
  bowling: { label: 'Bowling', line: 'Throw the water tower at the pins. Two throws: knock all ten.', kind: 'throw', props: ['tower'], tries: 2, unit: 'pins', medals: [7, 9, 10], from: 70 },
  demolition: { label: 'Demolition', line: 'Sixty seconds: break as much of the city as you can.', kind: 'timed', secs: 60, unit: 'cells', medals: [400, 900, 1600] },
  wrecking: { label: 'Wrecking Crew', line: 'Two minutes: bring down as many buildings as you can.', kind: 'timed', secs: 120, unit: 'buildings', medals: [2, 4, 6] },
};
export const CHALLENGE_IDS = Object.keys(CHALLENGES);

/** The medals' bars, each with its reason (to be measured at the gate's play and retuned: MECHS.md 11.3):
 *  javelin   a post at 40 m/s on 45 degrees under the yard's gravity lands about 160 m off: 60 is a lob, 100 a good arc, 140 near the ideal.
 *  bullseye  three throws: 100 is one bull or two greens, 175 a bull and a 50 and a 25, 250 two bulls and a 50.
 *  bowling   7 a fair frame, 9 a near thing, 10 every pin (a strike or a spare: both count all ten; the strike is its own achievement).
 *  demolition a fist breaks about 30 cells of brick, a Ground Pound about 120, a felled house 600: 400 is steady work, 1600 a tower down.
 *  wrecking  a house falls in about 15 s of blows, a tower in 40: 2 is a start, 6 the whole east side. */

/** The pins' spots (local metres from PROVING.at): the head pin `PINS.at` down the lane, the rows going on east. */
export function pinSpots() {
  const out = [], x0 = LANE.line + PINS.at, g = PINS.gap;
  for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) out.push({ x: x0 + row * g * 0.866, z: LANE.z + (k - row / 2) * g });
  return out;
}

/** Which ring a landing `d` m from the bull is in (null: off the board). */
export const ringOf = (d) => RINGS.find((R) => d <= R.r) || null;

/** A run of one challenge: its id, what it has scored, what is left. */
export function newChallenge(id) {
  const C = CHALLENGES[id]; if (!C) return null;
  return { id, score: 0, tries: C.tries ?? null, left: C.secs ?? null, best: 0, balls: 0, standing: 10, strike: false, spare: false, log: [] };
}

/** A thrown thing has landed (props.js mech.prop.throw, its `from` and `at` in local metres): what it scored. Javelin: its horizontal
 *  distance from the throw (a throw from past the line counts from the line), the best kept. Bullseye: the ring it landed in. A throw of
 *  the wrong prop, or with no tries left, is ignored (null). */
export function throwLand(run, { from, at, prop }) {
  const C = CHALLENGES[run?.id]; if (!C || C.kind !== 'throw' || run.id === 'bowling' || run.tries <= 0 || (C.props && !C.props.includes(prop))) return null;
  run.tries--;
  if (run.id === 'javelin') {
    const x0 = Math.min(from[0], LANE.line), d = Math.max(0, Math.hypot(at[0] - x0, at[2] - from[2]) * Math.sign(at[0] - x0 || 1));
    const m = Math.round(Math.max(0, d)); run.log.push(m);
    const add = Math.max(0, m - run.best); run.best = Math.max(run.best, m); run.score = run.best;
    return { add, what: `${m} m` };
  }
  const tx = LANE.line + C.target, d = Math.hypot(at[0] - tx, at[2] - LANE.z), R = ringOf(d), pts = R?.pts || 0;
  run.score += pts; run.log.push(pts);
  return { add: pts, what: R ? `${pts} (${Math.round(d)} m out)` : `off the board (${Math.round(d)} m out)` };
}

/** A bowling ball thrown: `knocked` pins went down (pinChain's count), of `standingBefore`. A strike (all ten on the first), a spare (the
 *  rest on the second). The score is pins down (0..10). */
export function ball(run, knocked) {
  if (run?.id !== 'bowling' || run.tries <= 0) return null;
  const n = Math.max(0, Math.min(run.standing, knocked | 0)); run.tries--; run.balls++; run.standing -= n; run.score = 10 - run.standing; run.log.push(n);
  if (run.balls === 1 && run.standing === 0) { run.strike = true; run.tries = 0; return { add: n, what: 'STRIKE' }; }
  if (run.balls === 2 && run.standing === 0) { run.spare = true; return { add: n, what: 'SPARE' }; }
  return { add: n, what: `${n} down` };
}

/** Which pins fall: those `struck` (indices) by the ball, falling along `dir` (its way, [x, z]), and from each falling pin those within
 *  PINS.reach lying within PINS.cone of the way it fell (a pin knocked by another falls on along the line between them: real pins
 *  deflect, they do not spray). Returns the whole set. A straight hit on the head pin alone takes the triangle's two edges and leaves the
 *  middle standing (7); the pocket (the head pin and one beside it) takes nine, leaving a pin for the spare; the three in front together,
 *  the strike. Measured by scripts/mechs.mjs. */
export function pinChain(pins, struck, dir) {
  const L = Math.hypot(dir[0], dir[1]) || 1, down = new Set(), q = [];
  for (const i of struck) if (!down.has(i)) { down.add(i); q.push([i, dir[0] / L, dir[1] / L]); }
  while (q.length) {
    const [i, dx, dz] = q.shift(), p = pins[i];
    pins.forEach((o, j) => {
      if (down.has(j)) return;
      const ox = o.x - p.x, oz = o.z - p.z, d = Math.hypot(ox, oz);
      if (d > 0 && d <= PINS.reach && (ox * dx + oz * dz) / d >= PINS.cone) { down.add(j); q.push([j, ox / d, oz / d]); }
    });
  }
  return down;
}

/** The timed ones: cells broken (city.break's `cells`, the Courier's) and buildings felled (city.felled). */
export function brokeCells(run, n) { if (run?.id === 'demolition' && run.left > 0) { run.score += n | 0; return { add: n | 0, what: `${run.score} cells` }; } return null; }
export function felled(run) { if (run?.id === 'wrecking' && run.left > 0) { run.score += 1; return { add: 1, what: `${run.score} down` }; } return null; }

/** The clock: real seconds run off a timed challenge. True once it is over. */
export function tick(run, dt) { if (run?.left != null) run.left = Math.max(0, run.left - dt); return over(run); }
/** Over: a timed one at 0, a throwing one out of tries (or a strike). */
export const over = (run) => !!run && ((run.left != null && run.left <= 0) || (run.tries != null && run.tries <= 0));

/** The medal a score earns: 0 none, 1 bronze, 2 silver, 3 gold. */
export function medalOf(id, score) { const M = CHALLENGES[id]?.medals; if (!M) return 0; let m = 0; M.forEach((bar, i) => { if (score >= bar) m = i + 1; }); return m; }
export const MEDAL_NAMES = ['no medal', 'bronze', 'silver', 'gold'];
