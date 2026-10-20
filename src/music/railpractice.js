// ---------------------------------------------------------------------------------------
// THE RAIL'S PRACTICE CUE (docs/plans/RAIL-MODULES.md 8: each view plays alone first, as a practice leg of 16 bars): one 16-bar loop,
// a variant a view, at the crossing's tempo (160 bpm, a bar 1.5 real s, as BAR_S; a quicker ship passes its own `bpm`). Who it is for:
// whoever is learning or testing one view's patterns, so the grid is the loudest thing in it: a tick on every beat, a crash on every
// four-bar phrase's first bar, the kick on 1 and 3. The tune stays under it, Em C D B (the Crude Sea's own turn, music/emocean.js), so
// a view's practice sounds like the crossing it will join.
//   overhead   wide and steady: an arpeggio in sixteenths, the bass on the beat (Ikaruga, Gummi's top-down stretches)
//   side       syncopated: off-beat stabs and a pushing bass (Gradius, R-Type's side-on runs)
//   chase      driving: four on the floor, a supersaw lead, the bass in eighths (Star Fox, Rez's chase)
// Prior art: a rhythm game's practice track (the click before the music), KH2's Gummi Ship sections (a loop per area, the threat on it).
//
//   import { railPractice, RAIL_PRACTICE } from './railpractice.js'   railPractice({ view: 'overhead' | 'side' | 'chase', bpm = 160 })
//   -> a score (family 'railpractice', 16 bars, looping)   RAIL_PRACTICE[view]: the three at 160 bpm (the sound test lists them)
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const CH = [[52, [0, 3, 7]], [48, [0, 4, 7]], [50, [0, 4, 7]], [47, [0, 4, 7]]]; // (Em C D B)
const chordOf = (i) => CH[Math.floor(i / 4) % 4];
const triad = (i, up = 12) => { const [r, iv] = chordOf(i); return iv.map((x) => r + up + x); };

// the grid, the same in every view: a tick a beat, the kick on 1 and 3, a crash on a phrase's first bar
const grid = (i) => [...[0, 1, 2, 3].map((b) => E('tick', b, 0.25, null, b === 0 ? 0.32 : 0.2)), E('kick', 0, 1, null, 0.6), E('kick', 2, 1, null, 0.5),
  ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.35)] : []), E('pad', 0, 4, triad(i, 0), 0.04, { cutoff: 1200 })];

const VIEWS = {
  overhead: (i) => { const n = triad(i, 24); return [...grid(i), ...[0, 1, 2, 3].map((b) => E('sub', b, 0.9, chordOf(i)[0] - 12, 0.32)),
    ...[...Array(16).keys()].map((k) => E('celesta', k / 4, 0.25, n[[0, 1, 2, 1][k % 4]] + (k >= 8 ? 12 : 0), 0.12))]; },
  side: (i) => { const n = triad(i, 12); return [...grid(i), E('snare', 1, 1, null, 0.4), E('snare', 3, 1, null, 0.4),
    ...[0.5, 1.5, 2.5, 3.5].map((b) => E('brass', b, 0.3, n[(b * 2) % 3 | 0], 0.18)), ...[0, 0.75, 1.5, 2, 2.75, 3.5].map((b) => E('sub', b, 0.4, chordOf(i)[0] - 12, 0.32))]; },
  chase: (i) => { const n = triad(i, 24); return [...grid(i), E('kick', 1, 1, null, 0.5), E('kick', 3, 1, null, 0.5), E('snare', 1, 1, null, 0.35), E('snare', 3, 1, null, 0.35),
    ...[...Array(8).keys()].map((k) => E('sub', k / 2, 0.45, chordOf(i)[0] - 12, 0.32)), ...[...Array(8).keys()].map((k) => E('supersaw', k / 2, 0.45, [n[[0, 1, 2, 1][k % 4]]], 0.1, { cutoff: 2800 }))]; },
};

export function railPractice({ view = 'chase', bpm = 160 } = {}) {
  const bar = VIEWS[view] || VIEWS.chase;
  return { title: `Rail practice (${view})`, family: 'railpractice', root: 64, bpm, arrange: true, loopFrom: 0, moodless: true, tail: 2, scale: [0, 2, 3, 7, 9],
    sections: [{ id: `practice.${view}`, bars: 16, gain: 2.2, bar }] };
}
export const RAIL_PRACTICE = { overhead: railPractice({ view: 'overhead' }), side: railPractice({ view: 'side' }), chase: railPractice({ view: 'chase' }) };
