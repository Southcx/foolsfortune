// ---------------------------------------------------------------------------------------
// THE FOOL'S PRECIPICE: the title's three cues (docs/PLAN.md, piece 1; music/choose.js picks among them by the scene's state).
//   TITLE      while they sit on the edge. An intro as the clay logo is fired (the kiln's roar rising, a strike, the glaze's glitter),
//              then a loop at 100 (walking music: about to set out) in E minor that the board's giant pieces move to, a step a bar:
//              piano rolling in eighths like a music box, brushes, an upright, the flute singing the Fool's Step (A B C and up to E,
//              the Courier's motif); the second half, the four suits come by the edge one at a time, each with its motif on its own
//              instrument (Petra's riff, Wanda's spark, Espada's edge, Calissa's pour), as the game plays itself around them
//   THE_STEP   PRESS START: they stand, the jar yaps twice, the Fool's Step in the brass and then the Leap (E5 to E6), the motif kept
//              for the moment everything turns: the Fool stepping off the cliff is what it was kept for. The harp falls after them.
//   FALL       under the menu, while they fall slowly: the loop's harmony with no drums, through a closed low-pass (heard from inside
//              the fall), the Five on the vibraphone; the board keeps its beat
//
// Prior art: Yoko Shimomura's "Dearly Beloved" (Kingdom Hearts: a piano alone over a world drifting by), the tarot's Fool, Kondo's
// leitmotif cameos (every character's tune heard once in the file select), the music box under a title, and the harp's falling
// glissando for a fall (every cartoon's, and Disney's).
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const V = {
  Em: [40, 47, 52, 55, 59], C: [36, 43, 48, 52, 55], G: [43, 50, 55, 59, 62], D: [38, 45, 50, 54, 57], Am: [45, 52, 57, 60, 64], B7: [35, 47, 51, 54, 57],
  E: [40, 47, 52, 56, 59], A: [45, 52, 57, 61, 64],
};
const ARP = [0, 1, 2, 3, 4, 3, 2, 1];
const roll = (c, v = 0.2) => ARP.map((k, j) => E('piano', j * 0.5, 0.9, V[c][k] + 12, j ? v * 0.8 : v, { pedal: 0.6 }));
const ground = (c, { v = 1, shaker = false } = {}) => [
  E('upright', 0, 2, V[c][0], 0.45 * v), E('upright', 2, 2, V[c][1], 0.35 * v),
  E('kick', 0, 1, null, 0.4 * v), E('kick', 2.5, 1, null, 0.2 * v), E('brush', 1, 1, null, 0.35 * v), E('brush', 3, 1, null, 0.35 * v),
  ...[0, 1, 2, 3].map((b) => E('hat', b + 0.5, 0.5, null, 0.06 * v)),
  ...(shaker ? [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((b) => E('shaker', b, 0.25, null, 0.06)) : []),
];
const line = (rows, i, v = 0.4, o = {}) => rows.map(([b, d, n, oo]) => E(i, b, d, n, v, { ...o, ...(oo || {}) }));

// the first half: the Fool's Step on the flute
const A_CH = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B7'];
const A_MEL = [
  [[2, 0.5, 69], [2.5, 0.5, 71], [3, 1, 72]],
  [[0, 2.5, 76], [2.5, 0.5, 74], [3, 1, 72]],
  [[0, 1.5, 71], [1.5, 0.5, 67], [2, 2, 74]],
  [[0, 3, 69], [3, 1, 66]],
  [[2, 0.5, 69], [2.5, 0.5, 71], [3, 1, 72]],
  [[0, 2, 76], [2, 1, 79], [3, 1, 76]],
  [[0, 1, 74], [1, 1, 72], [2, 2, 69]],
  [[0, 2, 75], [2, 2, 71]],
];
// the second half: the suits come by, each on its own instrument
const B_CH = ['Em', 'Em', 'G', 'G', 'E', 'E', 'A', 'B7'];
const B_MEL = [
  () => quote(MOTIF.PETRA, 'guitar', { v: 0.36, o: { pan: -0.3, vib: 0.01 } }),
  () => line([[0, 0.5, 71, { blue: true }], [0.5, 0.5, 69], [1, 1, 67], [2, 1.5, 64]], 'harmonica', 0.36, { pan: -0.3 }),
  () => quote(MOTIF.WANDA, 'sax', { v: 0.38, o: { pan: 0.25 } }).filter((e) => e.b < 4),
  () => line([[0, 1, 83], [1, 0.5, 81], [1.5, 0.5, 79], [2, 2, 74]], 'sax', 0.36, { pan: 0.25 }),
  () => quote(MOTIF.ESPADA, 'sitar', { v: 0.42, o: { pan: -0.2 } }),
  () => line([[0, 1, 65, { to: 64, meend: 0.3 }], [1, 1, 64], [2, 0.5, 68], [2.5, 0.5, 69], [3, 1, 71]], 'sitar', 0.4, { pan: -0.2 }),
  () => quote(MOTIF.CALISSA, 'steelpan', { v: 0.42, o: { pan: 0.25 } }),
  () => line([[2, 0.5, 69], [2.5, 0.5, 71], [3, 1, 72]], 'flute', 0.36),
];

export const TITLE = {
  title: "The Fool's Precipice", root: 64, bpm: 100, arrange: true, loopFrom: 1,
  sections: [
    // the logo fired: the kiln's roar rising under a low roll, then the strike and the glaze's glitter
    { id: 'kiln', bars: 2, gain: 1.3, bar: (i) => (i === 0
      ? [E('riser', 0, 4, null, 0.22), E('breath', 2, 2, null, 0.3), ...[0, 1, 2, 3, 3.5].map((b, k) => E('taiko', b, 1, null, 0.15 + k * 0.08, { size: 1.2 })), E('strings', 0, 4, [40, 47], 0.08, { attack: 2 })]
      : [E('impact', 0, 1, null, 0.4), E('taiko', 0, 1, null, 0.6, { size: 1.3 }), E('bell', 0, 1, 88, 0.3), E('strings', 0, 4, [52, 59, 64, 66, 71], 0.12, { attack: 0.05 }),
        ...[76, 79, 81, 83, 86, 88, 91].map((n, k) => E('celesta', 0.25 + k * 0.125, 0.5, n, 0.22)), E('piano', 0, 4, 40, 0.3, { pedal: 1 })]) },
    { id: 'edge', bars: 8, gain: 1.35, bar: (i) => [...roll(A_CH[i]), ...ground(A_CH[i], { v: i < 2 ? 0.6 : 1 }), ...line(A_MEL[i], 'flute', 0.38),
      ...(i % 4 === 0 ? [E('pad', 0, 8, V[A_CH[i]].slice(2).map((n) => n + 12), 0.06, { cutoff: 1500 })] : [])] },
    { id: 'suits', bars: 8, gain: 1.35, bar: (i) => [...roll(B_CH[i], 0.16), ...ground(B_CH[i], { shaker: true }), ...B_MEL[i]()] },
  ],
};

export const THE_STEP = {
  title: "The Fool's Step", root: 64, bpm: 100, arrange: true, loopFrom: null, tail: 4,
  sections: [{ id: 'step', bars: 2, gain: 2.0, bar: (i) => (i === 0
    ? [
      E('strings', 0, 4, [52, 59, 64], 0.12, { attack: 0.6 }), E('bongo', 0.5, 0.25, null, 0.35, { hi: true }), E('bongo', 0.75, 0.25, null, 0.4, { hi: true }), // (they stand; the jar yaps)
      ...[[1, 69], [1.5, 71], [2, 72]].flatMap(([b, n]) => [E('brass', b, 0.5, n, 0.36), E('flute', b, 0.5, n + 12, 0.3)]),
      E('brass', 2.5, 0.5, 76, 0.4), E('flute', 2.5, 0.5, 88, 0.3), E('riser', 1, 2, null, 0.18),
      // the Leap: E5 to E6, the moment everything turns
      E('brass', 3, 1, 76, 0.42), E('brass', 3, 1, 64, 0.32), E('flute', 3, 1, 88, 0.36), E('crash', 3, 1, null, 0.4), E('taiko', 3, 1, null, 0.6, { size: 1.2 }),
      E('strings', 3, 5, [52, 56, 59, 64, 68, 71, 76], 0.18, { attack: 0.03 }), E('bell', 3, 1, 88, 0.3),
    ]
    : [
      // the fall: the harp down two octaves from E6, a breath of wind, the celesta catching the light
      ...[88, 86, 83, 81, 79, 76, 74, 71, 69, 67, 64, 62, 59, 57, 55, 52].map((n, k) => E('harp', k * 0.125, 0.5, n, 0.3)),
      E('breath', 0, 3, null, 0.25), E('flute', 0, 3, 88, 0.22), ...[79, 83, 88].map((n, k) => E('celesta', 2 + k * 0.33, 1, n, 0.15)),
    ]) }],
};

export const FALL = {
  title: 'The Fall', root: 64, bpm: 100, arrange: true, loopFrom: 0,
  sections: [{ id: 'fall', bars: 8, gain: 1.6, sweep: [1900, 1900], bar: (i) => [
    ...roll(A_CH[i], 0.14), E('upright', 0, 4, V[A_CH[i]][0], 0.18), E('pad', 0, 4.2, V[A_CH[i]].slice(2).map((n) => n + 12), 0.07, { cutoff: 1200 }),
    ...(i < 5 ? [E('vibes', 0, 4, MOTIF.FIVE[i][2], 0.3)] : []),
    ...(i === 7 ? [...[64, 67, 69, 71, 74, 76].map((n, k) => E('harp', 2 + k * 0.25, 0.5, n, 0.18))] : []),
  ] }],
};
