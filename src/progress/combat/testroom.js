// ---------------------------------------------------------------------------------------
// THE TESTING ROOM'S RULES AS DATA (the owner, 2026-10-06: "pots should respawn only if in a designated testing area, not the whole
// workshop. Let's also move the target plates away from the Kiln to a side room, lump Strawman in there too. In fact, make it a whole
// thing with the calibration room/Index as a means of testing aim and recoil."). One side room off the Workshop holds the Index (the
// calibration console), the targets (say "target": a "plate" is a Veritome photograph), Strawman, a clay spray wall and the only pots
// that come back. Petra builds the room and its bodies against this; the numbers and the counting are here.
//
// What it is for: MEASURING, never earning. So nothing in it pays (no cubes, no curios, no finds), its pots and Strawman never reach the
// ledger, and a drill run on a tuned game is said but never recorded (debug/tuned.js: a record set with the fire interval halved is no
// record). Records and medals are kept, as the circuits' are, because a measure you can't beat is no use.
//
// Prior art: Aim Lab's and KovaaK's drills (flick, track: accuracy, time to hit, a score per drill); Counter-Strike's spray-pattern
// practice (a wall that keeps where every bullet went: the pattern read from the wall itself, no numbers); Apex Legends' firing range
// and Valorant's range (one room for every test, set from a console in it); a fighting game's training mode (Strawman).
//
//   DRILLS[id] = { name, what, targets?, window?, shots?, seconds?, range, medals, unit, better: 'lo' | 'hi' }   score(id, run) -> number
//   medalOf(id, score) -> 'gold' | 'silver' | 'bronze' | null   group(points, aim) -> { radius, drift } (the spray wall's read, in cm)
//   recordable(tunedKnobs) -> bool   POTS   WALL   INDEX
// ---------------------------------------------------------------------------------------

/** The drills, each begun at the Index in the room (a trial is begun in its own room) and ended by its own clock. */
export const DRILLS = {
  flick: { // aim: targets rise one at a time anywhere in a 120° arc, 4 to 14 m off; hit each within its window
    name: 'Flick', targets: 20, window: 1.5, arc: 120, range: [4, 14],
    unit: 'ms', better: 'lo', medals: { gold: 450, silver: 600, bronze: 800 }, // (the mean time to hit, a miss counted as the whole window)
  },
  track: { // aim: one target crosses the room at 3 to 6 m/s for 15 s; land as many shots on it as you can
    name: 'Track', seconds: 15, speed: [3, 6], range: [6, 12],
    unit: '%', better: 'hi', medals: { gold: 80, silver: 65, bronze: 50 }, // (shots that hit, out of shots fired)
  },
  spray: { // recoil: 20 shots held at the spray wall from 10 m; the wall keeps every dent, and the group is read from it
    name: 'Spray', shots: 20, range: [10, 10],
    unit: 'cm', better: 'lo', medals: { gold: 18, silver: 28, bronze: 40 }, // (the group's radius: the mean distance from its centre)
  },
  recover: { // recoil: three bursts of five at three targets in a row (left, centre, right at 8 m); recoil pulled down between them
    name: 'Recover', bursts: 3, shots: 5, range: [8, 8],
    unit: '%', better: 'hi', medals: { gold: 87, silver: 73, bronze: 60 }, // (shots on their target, of 15)
  },
};

/** A run's score: the drill's own measure (`run` is what the body counted: hits, shots, times in ms, the spray group). */
export function score(id, run = {}) {
  const D = DRILLS[id];
  if (!D) return null;
  if (id === 'flick') { const t = run.times || []; const all = [...t, ...Array(Math.max(0, D.targets - t.length)).fill(D.window * 1000)]; return Math.round(all.reduce((a, b) => a + b, 0) / D.targets); }
  if (id === 'spray') return Math.round(run.group?.radius ?? Infinity);
  return run.shots ? Math.round((100 * (run.hits || 0)) / run.shots) : 0;
}
export function medalOf(id, s) {
  const D = DRILLS[id];
  if (!D || s == null) return null;
  const ok = (m) => (D.better === 'lo' ? s <= D.medals[m] : s >= D.medals[m]);
  return ok('gold') ? 'gold' : ok('silver') ? 'silver' : ok('bronze') ? 'bronze' : null;
}

/** The spray wall's read of a group of dents (points on the wall in metres, the aim point too): its radius (mean distance from the
 *  group's centre) and its drift (how far the centre sits from where you aimed), both in centimetres. */
export function group(points = [], aim = { x: 0, y: 0 }) {
  if (!points.length) return { radius: Infinity, drift: 0 };
  const cx = points.reduce((a, p) => a + p.x, 0) / points.length, cy = points.reduce((a, p) => a + p.y, 0) / points.length;
  const radius = points.reduce((a, p) => a + Math.hypot(p.x - cx, p.y - cy), 0) / points.length;
  return { radius: +(radius * 100).toFixed(1), drift: +(Math.hypot(cx - aim.x, cy - aim.y) * 100).toFixed(1) };
}

/** A run is recorded only on the stock game: any tuned knob (debug/tuned.js) and it is said, marked tuned, and kept out of the ledger.
 *  The player's own settings (sensitivity, resolution, volume) never count against it. */
export const recordable = (tunedKnobs = []) => tunedKnobs.length === 0;

/** The pots: only the testing room's come back. They pay nothing (no cubes, no curios, no finds); they give Lachryma, so the psygun can
 *  keep firing, and never reach the ledger (`training`). Everywhere else a broken pot stays broken. */
export const POTS = { count: 12, respawn: 8, cubes: 0, finds: 0, baubles: 2, training: true }; // (8 sim seconds after it breaks, in place)

/** The spray wall: soft clay at 10 m that keeps every dent for a while, so the pattern is read from the wall itself (no numbers on it). */
export const WALL = { distance: 10, width: 4, height: 3, keep: 30, maxDents: 60 }; // (dents kept 30 real seconds, at most 60 on it)

/** What the Index shows in the testing room (its window: feedback/indexmenu.js, Petra's), beside the calibration it shows already. */
export const INDEX = {
  page: 'Testing', // (a page of its own in the Index here: the drills to begin, each drill's best and medal)
  shows: ['drills', 'bests', 'tuned', 'strawman', 'calibration'],
  // drills: begin one; bests: each drill's record and medal (by the drill's unit); tuned: a line naming any tuned knob, and "runs are
  // not recorded" while there is one; strawman: its last bout, and its mode; calibration: the live movement values, as today.
};

/** The ledger's keys (the rules: feedback/tracking/testroom.js): a run counted, a best kept, a medal won. Strawman and the pots: none. */
export const KEYS = { runs: (id) => `drill.${id}`, best: (id) => `drill.${id}.best`, medal: (id, m) => `drill.${id}.${m}` };
