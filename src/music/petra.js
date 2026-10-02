// ---------------------------------------------------------------------------------------
// STONE AND COIN: Petra's theme (pentacles: earth, the coin, the builder). Desert blues-rock in E at 92: the riff (MOTIF.PETRA) on
// an electric guitar over a stomp, a kick and a snare, a shaker for the coins, a hammer now and then (the workshop is Petra's).
// Twelve-bar blues, the riff on the even bars and an answer on the odd: the harmonica's the first time round, the guitar's own the
// second (one player answering the riff). Then a stop-time bridge: the band hits the downbeat and the guitar sings the Five alone,
// high, with long bends; and back to the top.
//
// Prior art: the call and response of the Delta blues (a line, a harmonica's reply), Tinariwen's desert blues (the drone and the
// stomp under a guitar), Hendrix's bends and vibrato, and the stop-time break (the band hits one and leaves the soloist alone).
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const ROOTS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7]; // (the twelve bars: I I I I IV IV I I V IV I V)

const riff = (up, v = 0.5) => [
  ...quote(MOTIF.PETRA, 'guitar', { up, v, o: { pan: -0.2, vib: 0.01 } }),
  ...quote(MOTIF.PETRA, 'upright', { up: up - 12, v: v * 1.1 }),
];
// an answer bar: a power chord stabbed on one (root and fifth), the bass on root and fifth
const stab = (up) => [E('guitar', 0, 0.4, 52 + up, 0.36, { pan: -0.2 }), E('guitar', 0, 0.4, 59 + up, 0.3, { pan: -0.2 }), E('upright', 0, 1, 40 + up, 0.5), E('upright', 2, 1, 47 + up, 0.45), E('upright', 3, 1, 45 + up, 0.4)];
const kit = (i, hard = 1) => [
  E('kick', 0, 1, null, 0.8 * hard), E('kick', 1.5, 1, null, 0.5 * hard), E('kick', 2, 1, null, 0.7 * hard),
  E('snare', 1, 1, null, 0.55 * hard), E('snare', 3, 1, null, 0.6 * hard), E('stomp', 0, 1, null, 0.45),
  ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => E('hat', b, 0.5, null, b % 1 ? 0.12 : 0.18)),
  ...[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((b) => E('shaker', b, 0.25, null, 0.09)),
  ...(i % 4 === 0 ? [E('hammer', 0, 1, null, 0.22)] : []),
];
// the harmonica's answers (E blues: E G A B flat B D), one for each odd bar
const HARP = [
  [[0, 0.5, 71, { blue: true }], [0.5, 0.5, 69], [1, 1, 67], [2, 1.5, 64]],
  [[0, 1, 67], [1, 0.5, 69], [1.5, 0.5, 70, { blue: true }], [2, 2, 71, { bend: -1 }]],
  [[0, 0.5, 76], [0.5, 0.5, 74], [1, 1, 72, { blue: true }], [2, 2, 69]],
  [[0, 1.5, 71, { blue: true }], [1.5, 0.5, 69], [2, 2, 64]],
  [[0, 0.5, 74], [0.5, 0.5, 76], [1, 2, 79, { blue: true }], [3, 1, 76]],
  [[0, 0.5, 71], [0.5, 0.5, 74], [1, 0.5, 75], [1.5, 2.5, 71, { blue: true }]],
];
// the guitar's own answers the second time round, high, with bends
const LICK = [
  [[0, 0.5, 76], [0.5, 0.5, 79], [1, 2.5, 81, { bend: 2, bendAt: 0.3, vib: 0.03 }]],
  [[0, 0.25, 83], [0.25, 0.25, 81], [0.5, 0.5, 79], [1, 0.5, 76], [1.5, 2, 79, { bend: 1, bendAt: 0.4 }]],
  [[0, 1, 81], [1, 0.5, 84], [1.5, 2.5, 81, { vib: 0.04 }]],
  [[0, 0.5, 88], [0.5, 0.5, 86], [1, 0.5, 83], [1.5, 0.5, 81], [2, 2, 79, { bend: 2, bendAt: 0.35 }]],
  [[0, 0.5, 81], [0.5, 0.5, 83], [1, 0.5, 86], [1.5, 2.5, 88, { vib: 0.04 }]],
  [[0, 0.5, 83], [0.5, 0.5, 86], [1, 0.5, 87], [1.5, 2.5, 83, { bend: 1, bendAt: 0.6 }]],
];
const answer = (lines, k, i, o) => lines[k].map(([b, d, n, oo]) => E(i, b, d, n, 0.42, { ...o, ...(oo || {}) }));

const chorus = (second) => (i) => {
  const up = ROOTS[i], ev = kit(i, second ? 1.1 : 1);
  if (i % 2 === 0 || i === 11) ev.push(...riff(up, second ? 0.52 : 0.5));
  else ev.push(...stab(up), ...(second ? answer(LICK, (i - 1) / 2, 'guitar', { pan: 0.2 }) : answer(HARP, (i - 1) / 2, 'harmonica', { pan: 0.25 })));
  if (i === 11) ev.push(E('crash', 3.5, 1, null, 0.3));
  return ev;
};

export const PETRA = {
  title: 'Stone and Coin', root: 64, bpm: 92, arrange: true, loopFrom: 1,
  sections: [
    // the riff alone, then the ground comes in under it
    { id: 'intro', bars: 2, gain: 1.0, bar: (i) => [...riff(0, 0.5), ...(i ? [E('kick', 0, 1, null, 0.7), E('stomp', 0, 1, null, 0.5), E('kick', 2, 1, null, 0.6), E('stomp', 2, 1, null, 0.4)] : [])] },
    { id: 'harp', bars: 12, gain: 0.95, bar: chorus(false) },
    { id: 'guitar', bars: 12, gain: 1.0, bar: chorus(true) },
    // stop time: the band hits one; the guitar sings the Five an octave up, alone
    { id: 'five', bars: 4, gain: 1.3, bar: (i) => {
      const hit = [52, 50, 47, 45][i];
      const ev = [E('kick', 0, 1, null, 0.9), E('crash', 0, 1, null, 0.35), E('upright', 0, 1, hit - 12, 0.6), E('guitar', 0, 0.5, hit, 0.32, { pan: -0.2 }), E('guitar', 0, 0.5, hit + 7, 0.28, { pan: -0.2 }), E('stomp', 0, 1, null, 0.5)];
      if (i === 0) ev.push(E('guitar', 0.5, 3.5, 88, 0.44, { pan: 0.2, from: -2, vib: 0.035 }));
      if (i === 1) ev.push(E('guitar', 0, 3.5, 86, 0.44, { pan: 0.2, bend: 2, bendAt: 0.7, vib: 0.03 }));
      if (i === 2) ev.push(E('guitar', 0, 1.75, 83, 0.44, { pan: 0.2, vib: 0.03 }), E('guitar', 2, 2, 81, 0.44, { pan: 0.2, bend: -2, bendAt: 0.6 }));
      if (i === 3) ev.push(E('guitar', 0, 2.5, 79, 0.46, { pan: 0.2, vib: 0.04 }), ...[3, 3.25, 3.5, 3.75].map((b, k) => E('snare', b, 0.25, null, 0.3 + k * 0.1)), E('guitar', 3, 0.5, 52, 0.4, { pan: -0.2 }), E('guitar', 3.5, 0.5, 52, 0.42, { pan: -0.2 }));
      return ev;
    } },
  ],
};
