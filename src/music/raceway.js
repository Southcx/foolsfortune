// ---------------------------------------------------------------------------------------
// THE RACEWAY'S CUE (docs/plans/SKIFF-RACING.md; the place is world/raceway/, Dovina's): one score that follows the time trial. Who it
// is for: the Courier alone on a test track in the sun, against their own ghost. E major with its flat seventh (I bVII IV V: the open,
// sunlit turnaround of a driving song) at 140 bpm.
//   PADDOCK  the place while nothing runs: a phaser guitar's chords, a shaker, an upright walking under; wind and light, waiting
//   GRID     the countdown held on the line: the heartbeat kick on one, a riser drawn over the bar, the hats ticking (one bar, looped)
//   RACE     from GO: four on the floor and the offbeat hats, the sub in eighths, a supersaw's arpeggio, a guitar's stab on the turn
//   FINAL    the last lap: all of the race, with the Answer (the game's motif of a thing done) on brass over it, and the crash every bar
//   FLAG     the finish: the turnaround landed on E and rung out, then back to the paddock
// It moves on the bar line (the arranger's jump), so GO lands within half a real second of the countdown's last beep.
// Prior art: Mario Kart's final lap (the same tune, faster and fuller: here, fuller), F-Zero's and Wipeout's driving loops, Gran Turismo's
// licence tests (music that waits while you line up).
//
//   import { RACEWAY, hearRace } from './raceway.js'   hearRace(game) (once: listens for race.*)   RACEWAY (a score, family 'raceway')
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const R = { state: 'idle', lap: 1, laps: 3, flag: false, heard: false }; // (laps: RACE.laps in world/raceway/race.js, imported once that module is on main)

const CH = [[52, [0, 4, 7]], [50, [0, 4, 7]], [45, [0, 4, 7]], [47, [0, 4, 7]]]; // (E D A B: I bVII IV V)
const chordAt = (i) => CH[Math.floor(i / 2) % 4];
const tri = (i, up = 12) => { const [r, iv] = chordAt(i); return iv.map((x) => r + up + x); };
const four = (v = 0.7) => [0, 1, 2, 3].map((b) => E('kick', b, 1, null, v));
const offHats = (v = 0.22) => [0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, v));
const backbeat = (v = 0.5) => [1, 3].map((b) => E('snare', b, 1, null, v));
const subLine = (i, v = 0.35) => [...Array(8).keys()].map((k) => E('sub', k / 2, 0.45, chordAt(i)[0] - 12 + (k % 4 === 3 ? 12 : 0), v));
const arp = (i, v = 0.12) => { const n = tri(i, 24); return [...Array(8).keys()].map((k) => E('supersaw', k / 2, 0.45, [n[[0, 1, 2, 1][k % 4]] + (k >= 4 ? 12 : 0)], v, { cutoff: 2600 })); };

const SECTIONS = [
  { id: 'paddock', bars: 8, gain: 2.2, bar: (i) => [E('phaseguitar', 0, 3.5, tri(i), 0.16), E('upright', 0, 1, chordAt(i)[0], 0.3), E('upright', 2, 1, chordAt(i)[0] + 7, 0.26),
    ...[0.5, 1.5, 2.5, 3.5].map((b) => E('shaker', b, 0.5, null, 0.12)), ...(i % 4 === 0 ? [E('pad', 0, 8, tri(i, 0), 0.05, { cutoff: 1400 })] : [])] },
  { id: 'grid', bars: 1, gain: 2.4, bar: () => [E('kick', 0, 1, null, 0.6), E('riser', 0, 4, null, 0.18), ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => E('hat', b, 0.5, null, 0.12)),
    E('pad', 0, 4, [52, 59, 64], 0.05, { cutoff: 900 })] },
  { id: 'race', bars: 8, gain: 2.4, bar: (i) => [...four(), ...offHats(), ...backbeat(0.45), ...subLine(i), ...arp(i),
    ...(i % 2 === 1 ? [E('guitar', 3, 0.5, tri(i)[0], 0.3), E('guitar', 3.5, 0.5, tri(i)[2], 0.28)] : []), ...(i === 0 ? [E('crash', 0, 1, null, 0.45)] : [])] },
  { id: 'final', bars: 8, gain: 2.3, bar: (i) => [...four(0.75), ...offHats(0.26), ...backbeat(0.5), ...subLine(i, 0.38), ...arp(i, 0.13), E('crash', 0, 1, null, 0.3),
    ...(i % 4 === 0 ? quote(MOTIF.ANSWER, 'brass', { v: 0.3 }) : []), ...(i % 4 === 2 ? quote(MOTIF.ANSWER, 'brass', { up: 12, v: 0.26 }) : []),
    E('strings', 0, 4, tri(i, 12), 0.06, { attack: 0.1 })] },
  { id: 'flag', bars: 2, gain: 2.6, bar: (i) => (i === 0 ? [E('crash', 0, 1, null, 0.5), E('impact', 0, 1, null, 0.4), ...[64, 68, 71, 76].map((n, k) => E('brass', k * 0.25, 3.5 - k * 0.25, n, 0.26)),
    E('sub', 0, 4, 40, 0.4), E('strings', 0, 8, [52, 56, 59, 64, 68], 0.09, { attack: 0.05 })] : [...[76, 80, 83, 88].map((n, k) => E('bell', k * 0.25, 1, n, 0.18)), E('shimmer', 0, 4, [64, 68, 71], 0.1)]) },
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));

function jump(section, bar) {
  const id = SECTIONS[section].id, last = bar >= SECTIONS[section].bars - 1;
  if (id === 'flag') { if (!last) return null; R.flag = false; return AT.paddock; } // (the finish rung out, then the place again)
  if (R.flag) return AT.flag;
  if (R.state === 'grid') return id === 'grid' ? section : AT.grid;
  if (R.state === 'run') { const want = R.lap >= R.laps ? AT.final : AT.race; return want !== section ? want : last ? section : null; } // (the last lap lifts on the next bar line)
  return id !== 'paddock' ? AT.paddock : last ? section : null;
}

export const RACEWAY = { title: 'The Raceway', family: 'raceway', root: 64, bpm: 140, arrange: true, loopFrom: 0, moodless: true, tail: 3, scale: [0, 2, 4, 7, 9], sections: SECTIONS, jump };

/** Listen for the race once (world/raceway/race.js's events): the countdown, GO, each lap's line, the finish, a race left. */
export function hearRace(game) {
  if (R.heard || !game.events) return; R.heard = true;
  const on = (e, f) => game.events.on(e, f);
  on('race.start', () => { R.state = 'grid'; R.lap = 1; R.flag = false; });
  on('race.go', () => { R.state = 'run'; R.lap = 1; });
  on('race.lap', (e) => { R.lap = (e.lap || R.lap) + 1; });
  on('race.finish', () => { R.state = 'idle'; R.flag = true; });
  on('race.end', () => { R.state = 'idle'; });
}

/** The sound test's tour: the paddock, the grid, a lap, the final lap and the flag. */
export const RACEWAY_TOUR = { ...RACEWAY, title: 'The Raceway (a time trial)', jump: (section, bar) => {
  const id = SECTIONS[section].id;
  if (id === 'paddock' && bar >= 3) return AT.grid;
  if (id === 'grid') return AT.race;
  if (id === 'race' && bar >= 7) return AT.final;
  if (id === 'final' && bar >= 7) return AT.flag;
  if (id === 'flag' && bar >= 1) return -1;
  return null;
} };
