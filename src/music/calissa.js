// ---------------------------------------------------------------------------------------
// OVERFLOWING: Calissa's theme (cups: water, beauty, the look of things). Calypso in E major at 116: the steel pan carries the pour
// (MOTIF.CALISSA: a major arpeggio tumbling down in three, three and two, and a hop back up), a marimba strums the off-beats the
// way a calypso guitar chucks them, an upright plays the tresillo under it, bongos and a shaker and a timbale's fills, a clap on two
// and four. The bridge gives the Answer (the game's climbing motif, here on E's pentatonic) to the pan and the horns in turn, and
// the last time round the horns stab the off-beats with the pan rolled over everything.
//
// Prior art: Trinidad's steelbands and calypso (Lord Kitchener's road marches: I IV V, the 3+3+2 under a sung line), soca's horn
// stabs, and the islands' music the era's games used for water and sun (Koji Kondo's Delfino Plaza, the Wind Waker's islands).
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const CH = { E: [64, 68, 71], Csm: [61, 64, 68], A: [61, 64, 69], B7: [63, 66, 69, 71], Gsm: [63, 68, 71] };
const ROOT = { E: 40, Csm: 37, A: 45, B7: 47, Gsm: 44 };
const groove = (c, { horns = false, v = 1 } = {}) => {
  const r = ROOT[c], ev = [
    E('upright', 0, 0.75, r, 0.55 * v), E('upright', 1.5, 0.5, r + 7, 0.45 * v), E('upright', 2, 1, r, 0.5 * v), E('upright', 3, 0.5, r + 4, 0.4 * v), E('upright', 3.5, 0.5, r + 5, 0.35 * v),
    ...[0.5, 1.5, 2.5, 3.5].flatMap((b) => CH[c].map((n) => E('marimba', b, 0.25, n + 12, 0.2 * v))),
    ...[0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.4 * v)), E('clap', 1, 1, null, 0.3 * v), E('clap', 3, 1, null, 0.3 * v),
    ...Array.from({ length: 16 }, (_, k) => E('shaker', k * 0.25, 0.25, null, (k % 4 === 2 ? 0.14 : 0.07) * v)),
    ...[[0.5, true], [1, false], [1.5, true], [2.5, true], [3, false], [3.5, true]].map(([b, hi]) => E('bongo', b, 0.5, null, 0.3 * v, { hi })),
  ];
  if (horns) ev.push(...[1.5, 3.5].flatMap((b) => CH[c].map((n) => E('brass', b, 0.3, n + 12, 0.22, { stab: true }))));
  return ev;
};
const pan = (rows, v = 0.46, o = {}) => rows.map(([b, d, n, oo]) => E('steelpan', b, d, n, v, { ...o, ...(oo || {}) }));
const fill = () => [2, 2.5, 3, 3.25, 3.5, 3.75].map((b, k) => E('timbale', b, 0.25, null, 0.3 + k * 0.05));

const VERSE = ['E', 'Csm', 'A', 'B7', 'E', 'Csm', 'A', 'B7'];
const TUNE = [
  () => quote(MOTIF.CALISSA, 'steelpan', { v: 0.48 }),
  () => pan([[0, 0.5, 73], [0.5, 0.5, 75], [1, 0.5, 76], [1.5, 0.5, 80], [2, 2, 78]]),
  () => quote(MOTIF.CALISSA, 'steelpan', { v: 0.48, up: -2 }).map((e, k) => (k === 2 ? { ...e, n: 76 } : k === 3 ? { ...e, n: 73 } : e)), // (A F# E C# E)
  () => pan([[0, 0.5, 75], [0.5, 0.5, 78], [1, 0.5, 81], [1.5, 0.5, 83], [2, 1, 81], [3, 1, 78]]),
  () => quote(MOTIF.CALISSA, 'steelpan', { v: 0.48 }),
  () => pan([[0, 0.75, 80], [0.75, 0.75, 76], [1.5, 0.5, 73], [2, 0.5, 71], [2.5, 1.5, 73]]),
  () => pan([[0, 0.5, 73], [0.5, 0.5, 76], [1, 0.5, 78], [1.5, 0.5, 81], [2, 1, 85], [3, 1, 83]]),
  () => pan([[0, 2, 83], [2, 0.5, 81], [2.5, 0.5, 78], [3, 1, 75]]),
];
const BRIDGE = ['A', 'B7', 'Gsm', 'Csm', 'A', 'B7', 'E', 'E'];
const ANSWER_E = (up) => quote(MOTIF.ANSWER, 'steelpan', { v: 0.46, up }).map((e) => ({ ...e, n: { 67: 64, 69: 66, 71: 68, 74: 71, 76: 73 }[e.n - up] + up })); // (the Answer on E's pentatonic: E F# G# B C#)

export const CALISSA = {
  title: 'Overflowing', root: 61, bpm: 116, arrange: true, loopFrom: 1,
  sections: [
    // a roll on the bongos and a pan chord rolled, then the groove comes in on the B7
    { id: 'intro', bars: 2, gain: 0.9, bar: (i) => (i === 0
      ? [...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((b, k) => E('bongo', b, 0.25, null, 0.2 + k * 0.03, { hi: k % 2 === 0 })), ...CH.E.map((n) => E('steelpan', 2, 2, n + 12, 0.3))]
      : [...groove('B7', { v: 0.8 }), ...fill()]) },
    { id: 'verse', bars: 8, gain: 0.85, bar: (i) => [...groove(VERSE[i]), ...TUNE[i](), ...(i === 7 ? fill() : [])] },
    // the bridge: the Answer climbing on the pan, the horns echoing it a bar behind
    { id: 'bridge', bars: 8, gain: 0.9, bar: (i) => {
      const ev = [...groove(BRIDGE[i])];
      if (i < 3) ev.push(...ANSWER_E(12 + [0, 2, 4][i]), ...(i ? quote(MOTIF.ANSWER, 'brass', { v: 0.3, up: 0 }).map((e) => ({ ...e, n: { 67: 64, 69: 66, 71: 68, 74: 71, 76: 73 }[e.n] + [0, 0, 2][i] })) : []));
      if (i === 3) ev.push(...pan([[0, 1, 80], [1, 1, 78], [2, 2, 76]]));
      if (i === 4) ev.push(...pan([[0, 4, 73]]), E('strings', 0, 4, CH.A.map((n) => n + 12), 0.1, { attack: 0.5 }));
      if (i === 5) ev.push(...pan([[0, 2, 75], [2, 2, 78]]), E('strings', 0, 4, CH.B7.map((n) => n + 12), 0.1, { attack: 0.5 }));
      if (i === 6) ev.push(...quote(MOTIF.CALISSA, 'steelpan', { v: 0.5 }));
      if (i === 7) ev.push(...pan([[0, 3, 76]]), ...fill());
      return ev;
    } },
    // the verse again: horns on the off-beats, the pan doubled an octave down on the marimba
    { id: 'verse2', bars: 8, gain: 0.95, bar: (i) => {
      const tune = TUNE[i]();
      return [...groove(VERSE[i], { horns: true }), ...tune, ...tune.map((e) => ({ ...e, i: 'marimba', n: e.n - 12, v: 0.3 })), ...(i === 0 ? [E('crash', 0, 1, null, 0.3)] : []), ...(i === 7 ? fill() : [])];
    } },
  ],
};
