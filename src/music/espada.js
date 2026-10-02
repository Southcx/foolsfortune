// ---------------------------------------------------------------------------------------
// THE EDGE OF THE WORD: Espada's theme (swords: air, the word, the lore). A raga in E on the scale of Bhairav (E F G# A B C D#: the
// half step F to E is the game's Tear, the augmented second F to G# is the edge), over a tanpura drone, told the way a raga is told:
//   ALAP   free and slow (60): the sitar alone with the drone, finding the notes one at a time, bending between them
//   JOR    a pulse (92): melody and the high drone string (the chikari) in turn, the tabla's first strokes
//   GAT    the composition (112), over teental, the sixteen-beat cycle (dha dhin dhin dha...): the draw and the cut (MOTIF.ESPADA)
//          on the sitar; the second cycle the fiddle takes it up an octave, and they come down together to the Tear
//   JHALA  fast: the melody climbing between strokes of the chikari, the tabla on every beat, and a tihai to end it: the motif three
//          times, landing on the first beat of the cycle
// The fusion is the fiddle (and the upright under the gat): East and West at one fire.
//
// Prior art: the form of a Hindustani performance (alap, jor, gat, jhala; the tihai that lands on sam), raga Bhairav (the morning
// raga), Ravi Shankar's sitar, and Shakti (John McLaughlin, L. Shankar's violin, Zakir Hussain's tabla): the East-West quartet.
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const SA = 52; // (E3: the drone's Sa)
const drone = (beats, v = 0.15) => [E('tanpura', 0, beats, SA, v)];
const line = (rows, i, v = 0.46, o = {}) => rows.map(([b, d, n, oo]) => E(i, b, d, n, v, { ...o, ...(oo || {}) }));
const S = (rows, v) => line(rows, 'sitar', v, { pan: 0.15 });
const F = (rows, v = 0.36) => line(rows, 'fiddle', v, { pan: -0.3 });

// teental: dha dhin dhin dha | dha dhin dhin dha | dha tin tin na | na dhin dhin dha (four bars of four)
const THEKA = [['dha', 'dhin', 'dhin', 'dha'], ['dha', 'dhin', 'dhin', 'dha'], ['dha', 'tin', 'tin', 'na'], ['na', 'dhin', 'dhin', 'dha']];
const theka = (k, v = 1) => THEKA[k % 4].flatMap((s, b) => [
  E('tabla', b, 1, null, (s === 'dha' ? 0.55 : s === 'dhin' ? 0.42 : 0.38) * v, { stroke: s === 'dhin' ? 'dha' : s, m: 64 }),
  E('tabla', b + 0.5, 0.5, null, 0.16 * v, { stroke: 'na', m: 64 }),
]);

const GAT = [
  () => [...quote(MOTIF.ESPADA, 'sitar', { v: 0.5, o: { pan: 0.15 } }), ...S([[2.5, 0.5, 71], [3, 0.5, 69], [3.5, 0.5, 68]])],
  () => S([[0, 1, 65, { to: 64, meend: 0.3 }], [1, 1, 64], [2, 0.5, 68], [2.5, 0.5, 69], [3, 1, 71]]),
  () => S([[0, 0.5, 72], [0.5, 0.5, 71], [1, 0.5, 72], [1.5, 0.5, 75], [2, 2, 76]]),
  () => S([[0, 0.5, 77], [0.5, 0.5, 76], [1, 0.5, 75], [1.5, 0.5, 72], [2, 1, 71], [3, 1, 68]]),
  () => [...quote(MOTIF.ESPADA, 'fiddle', { up: 12, v: 0.38, o: { pan: -0.3 } }), ...S([[2.5, 0.5, 83], [3, 0.5, 81], [3.5, 0.5, 80]], 0.4)],
  () => F([[0, 1, 77, { from: -1 }], [1, 1, 76], [2, 0.5, 80], [2.5, 0.5, 81], [3, 1, 83]]),
  () => { const r = [[0, 0.5, 84], [0.5, 0.5, 83], [1, 0.5, 80], [1.5, 0.5, 77], [2, 1, 76], [3, 1, 75]]; return [...F(r), ...S(r.map(([b, d, n]) => [b, d, n - 12]))]; },
  () => [...F([[0, 1, 77, { from: -1 }], [1, 3, 76]]), ...S([[0, 1, 65, { to: 64, meend: 0.3 }], [1, 3, 64]])],
];

export const ESPADA = {
  title: 'The Edge of the Word', root: 64, bpm: 112, arrange: true, loopFrom: 2,
  sections: [
    { id: 'alap', bars: 4, bpm: 60, gain: 2.4, bar: (i) => [
      ...drone(4, 0.19),
      ...[() => S([[0, 2, 64], [2, 2, 65, { to: 64, meend: 0.5 }]]),
        () => S([[0, 1.5, 68], [1.5, 0.5, 69], [2, 2, 72, { to: 71, meend: 0.5 }]]),
        () => S([[0, 1, 75], [1, 2, 76], [3, 1, 77, { to: 76, meend: 0.4 }]]),
        () => quote(MOTIF.ESPADA, 'sitar', { x: 2, v: 0.5, o: { pan: 0.15 } })][i](),
      ...(i >= 2 ? [E('strings', 0, 4, [40, 47, 52], 0.07, { attack: 1.5 })] : []),
    ] },
    { id: 'jor', bars: 4, bpm: 92, gain: 2.2, bar: (i) => {
      const mel = [[64, 65, 68, 69], [71, 72, 71, 69], [68, 69, 71, 72], [75, 76, 77, 76]][i];
      const ev = [...drone(4), ...mel.flatMap((n, b) => [E('sitar', b, 0.5, n, 0.46, { pan: 0.15, taraf: 0.3 }), E('sitar', b + 0.5, 0.5, 76, 0.18, { pan: 0.15, taraf: 0 })])];
      if (i >= 2) ev.push(E('tabla', 0, 1, null, 0.4, { stroke: 'ge' }), E('tabla', 2, 1, null, 0.32, { stroke: 'ge' }), ...[1, 3, 3.5].map((b) => E('tabla', b, 0.5, null, 0.25, { stroke: 'na', m: 64 })));
      return ev;
    } },
    { id: 'gat', bars: 8, gain: 1.6, bar: (i) => [...drone(4, 0.12), ...theka(i), E('upright', 0, 2, 40, 0.28), E('upright', 2, 2, 47, 0.22), ...GAT[i]()] },
    { id: 'jhala', bars: 4, gain: 1.8, bar: (i) => {
      const ev = [...drone(4, 0.12), E('upright', 0, 4, 40, 0.28), ...[0, 1, 2, 3].map((b) => E('tabla', b, 1, null, 0.5, { stroke: 'dha', m: 64 })), ...[0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.25, 3.5, 3.75].map((b) => E('tabla', b, 0.25, null, 0.15, { stroke: 'na', m: 64 }))];
      if (i < 3) {
        const mel = [64, 65, 68, 69, 71, 72, 75, 76, 77, 80, 81, 83].slice(i * 4, i * 4 + 4);
        mel.forEach((n, b) => ev.push(E('sitar', b, 0.25, n, 0.46, { pan: 0.15, taraf: 0.2 }), ...[0.25, 0.5, 0.75].map((x) => E('sitar', b + x, 0.25, 76, 0.16, { pan: 0.15, taraf: 0 }))));
        ev.push(E('fiddle', 0, 4, [76, 80, 83][i], 0.3, { pan: -0.3 }));
      } else {
        // the tihai: the motif three times, landing on the first beat of the cycle
        for (const at of [0, 1.375, 2.75]) {
          ev.push(...[64, 65, 68, 71, 72].map((n, k) => E('sitar', at + k * 0.25, 0.25, n, 0.5, { pan: 0.15, taraf: 0 })));
          ev.push(...[64, 65, 68, 71, 72].map((n, k) => E('fiddle', at + k * 0.25, 0.25, n + 12, 0.3, { pan: -0.3 })));
        }
        ev.push(E('sitar', 4, 2, 76, 0.55, { pan: 0.15 }), E('fiddle', 4, 2, 88, 0.34, { pan: -0.3 }), E('tabla', 4, 1, null, 0.7, { stroke: 'dha', m: 64 }), E('bell', 4, 1, 88, 0.2));
      }
      return ev;
    } },
  ],
};
