// ---------------------------------------------------------------------------------------
// KINDLING: Wanda's theme (wands: fire, wood and breath, the music). Space jazz in five, 144 bpm, G Lydian (the raised fourth that
// makes a major chord float): a Rhodes vamp in three and two (Gmaj7#11, Em9), a Moog bass walking the same five beats, a ride with
// its skip notes, a space pad and a phased guitar breathing behind. The saxophone carries the spark (MOTIF.WANDA): stated, answered,
// sent up a fifth; the burn (A/G, Bm7) gives the motif to the guitar at half speed and lets sax and guitar trade fours; the head
// comes back harmonised in fourths, and the Answer climbs out of it each time round.
//
// Prior art: Brubeck and Desmond's "Take Five" (the 5/4 vamp in three and two, the alto over it), the Lydian sound of the Mahavishnu
// and Weather Report records, Pink Floyd's phased guitars, Herbie Hancock's Rhodes and Moog (Head Hunters), McCoy Tyner's fourths.
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const CH = {
  G: { rh: [55, 59, 62, 66, 73], bass: [43, 50, 55, 54, 50], pad: [67, 71, 73, 78] },
  Em: { rh: [52, 55, 59, 62, 66], bass: [40, 47, 52, 50, 47], pad: [64, 67, 71, 74] },
  AG: { rh: [55, 61, 64, 69, 73], bass: [43, 50, 55, 57, 49], pad: [69, 73, 76, 79] },
  Bm: { rh: [59, 62, 66, 69, 73], bass: [47, 54, 59, 57, 54], pad: [66, 69, 74, 78] },
};
// the vamp: three and two (hits on one, the and of two, four), the bass in the same five, the kit
const vamp = (c, { v = 0.24, moog = 1 } = {}) => {
  const C = CH[c], ev = [];
  for (const [b, d] of [[0, 1.4], [1.5, 0.9], [3, 1.8]]) for (const n of C.rh) ev.push(E('rhodes', b, d, n, v * (b ? 0.8 : 1)));
  [[0, 1], [1, 0.5], [1.5, 1.5], [3, 1], [4, 1]].forEach(([b, d], k) => ev.push(E('moog', b, d, C.bass[k], 0.42 * moog, { cutoff: 1100 + moog * 500, res: 6 })));
  ev.push(...[0, 1, 1.67, 2, 3, 3.67, 4, 4.67].map((b) => E('ride', b, 0.5, null, b % 1 ? 0.12 : 0.2)));
  ev.push(E('hat', 1, 0.5, null, 0.14), E('hat', 3, 0.5, null, 0.14), E('kick', 0, 1, null, 0.55), E('kick', 3, 1, null, 0.4), E('snare', 4, 1, null, 0.22), E('snare', 2.67, 1, null, 0.08));
  return ev;
};
const air = (c, i) => (i % 2 === 0 ? [E('pad', 0, 10, CH[c].pad, 0.1, { cutoff: 1300 }), E('phaseguitar', 0, 4.5, CH[c].pad.slice(0, 3), 0.16, { pan: -0.35 })] : []);
const line = (rows, i, v = 0.44, o = {}) => rows.map(([b, d, n, oo]) => E(i, b, d, n, v, { ...o, ...(oo || {}) }));

// the head: the spark stated, answered, sent up a fifth, and the Answer climbing out
const HEAD = [
  (h) => quote(MOTIF.WANDA, 'sax', { v: 0.46, up: h }),
  () => line([[0, 1, 83], [1, 0.5, 81], [1.5, 0.5, 79], [2, 1, 78], [3, 2, 74]], 'sax'),
  (h) => quote(MOTIF.WANDA, 'sax', { v: 0.46, up: 7 + h }),
  () => line([[0, 3, 86, { bend: -1 }], [3, 1, 83], [4, 1, 79]], 'sax'),
  (h) => quote(MOTIF.WANDA, 'sax', { v: 0.46, up: h }),
  () => line([[0, 0.5, 83], [0.5, 0.5, 81], [1, 1, 79], [2, 1, 76], [3, 2, 71]], 'sax'),
  () => quote(MOTIF.ANSWER, 'sax', { v: 0.46, up: 12 }),
  () => line([[0, 4.5, 88]], 'sax', 0.42),
];
const CHORDS_HEAD = ['G', 'Em', 'G', 'Em', 'G', 'Em', 'G', 'Em'];
const CHORDS_BURN = ['AG', 'Bm', 'AG', 'Bm', 'AG', 'Bm', 'AG', 'Bm'];

export const WANDA = {
  title: 'Kindling', root: 64, bpm: 144, beats: 5, arrange: true, loopFrom: 1,
  sections: [
    { id: 'vamp', bars: 4, gain: 1.5, bar: (i) => [...vamp(i % 2 ? 'Em' : 'G', { moog: i < 2 ? 0.7 : 1 }), ...air(i % 2 ? 'Em' : 'G', i)] },
    { id: 'head', bars: 8, gain: 1.6, bar: (i) => [...vamp(CHORDS_HEAD[i]), ...air(CHORDS_HEAD[i], i), ...HEAD[i](0)] },
    // the burn: the spark at half speed on the phased guitar, then sax and guitar trading
    { id: 'burn', bars: 8, gain: 1.7, bar: (i) => {
      const c = CHORDS_BURN[i], ev = [...vamp(c, { moog: 1.25 }), ...air(c, i)];
      if (i === 0) ev.push(...quote(MOTIF.WANDA, 'phaseguitar', { x: 2, v: 0.5, o: { pan: 0.3 } }));
      if (i === 2) ev.push(...quote(MOTIF.WANDA, 'phaseguitar', { x: 2, v: 0.5, o: { pan: 0.3, bend: 0 } }));
      if (i === 4) ev.push(...line([[0, 0.25, 79], [0.25, 0.25, 81], [0.5, 0.5, 83], [1, 0.5, 85], [1.5, 1.5, 86], [3, 2, 81]], 'sax'));
      if (i === 5) ev.push(...line([[0, 0.5, 74], [0.5, 0.5, 73], [1, 3, 74, { bend: 2 }]], 'phaseguitar', 0.5, { pan: 0.3 }));
      if (i === 6) ev.push(...line([[0, 0.5, 86], [0.5, 0.5, 85], [1, 0.5, 83], [1.5, 0.5, 81], [2, 0.5, 79], [2.5, 0.5, 78], [3, 2, 74]], 'sax'));
      if (i === 7) ev.push(...line([[0, 4.5, 81, { bend: 2 }]], 'phaseguitar', 0.5, { pan: 0.3 }), E('riser', 1, 4, null, 0.18));
      if (i % 2) ev.push(...[[1, 79], [2, 81], [3, 83]].map(([b, n]) => E('vibes', b, 0.5, n, 0.14)));
      return ev;
    } },
    // the head again, the spark harmonised a fourth below on the guitar, the vibes doubling, a crash at the top
    { id: 'head2', bars: 8, gain: 1.85, bar: (i) => {
      const ev = [...vamp(CHORDS_HEAD[i], { moog: 1.15 }), ...air(CHORDS_HEAD[i], i), ...HEAD[i](0)];
      ev.push(...HEAD[i](0).map((e) => ({ ...e, i: 'phaseguitar', n: e.n - 5, v: 0.32, o: { pan: 0.3 } })));
      if (i === 0) ev.push(E('crash', 0, 1, null, 0.3));
      if (i === 6) ev.push(...quote(MOTIF.ANSWER, 'vibes', { up: 24, v: 0.2 }));
      return ev;
    } },
  ],
};
