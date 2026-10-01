// ---------------------------------------------------------------------------------------
// "FOOL'S FORTUNE": the main theme. Two ways of hearing the same few notes, East and West, taking turns and then playing at once.
//
// THE LEITMOTIF, the Fool's step: A - B - C, and a leap up to E (a step off the edge of the cliff, the Fool's card). What follows
// the leap says which world it is in:
//   EAST  F - E - C - B   the Japanese In scale on E (E F A B C): the half step down from F to E is its sigh. The shakuhachi and
//                          the koto speak it; the harmony is a drone of A and E (the open fifth of the gagaku sho).
//   WEST  D - C - B - G   the Guidonian hexachord (ut re mi fa sol la): the harmonica and the brass speak it, over i - VI - III - VII
//                          (Am F C G), the progression of a thousand anthems. In the breakdown the hexachord "mutates" to its soft
//                          form (molle, on F: the B goes flat), as Guido's singers changed hexachords mid-melody: Dm Bb F C, the
//                          same tune lifted into a softer light; the second build climbs the hard hexachord (durum, on G) to E,
//                          the dominant, and drops.
// The two scales meet on A, C, E and F, so either can take the tune from the other mid-phrase.
//
// FORM (140 bpm; the drops are half-time): INTRO 8 (the shakuhachi alone, a drone, wind) | EAST 8 (koto ostinato, taiko, the flute
// develops the motif) | WEST 8 (harmonica and horns, the backbeat) | BUILD 8 (the snare roll, the riser, a filter opening, a brass
// swell, the In flute holding E and bending; a breath in) | DROP 16 (half-time kit and taiko, sub and growl, supersaws pumped
// against the kick, the electric guitar wailing the motif, the shakuhachi answering it) | BREAKDOWN 8 (the soft hexachord: a
// harmonica and koto duet) | BUILD 8 (a brass fanfare up the hard hexachord, a taiko roll) | DROP 16 (everything, and the brass) |
// OUTRO 8 (the shakuhachi says the motif once more; a bell). Then round again from EAST. About two and a half minutes a time.
//
// Prior art: Crywolf's "Datura" (the shape: an aching intro, a long tension build, a drop that opens like a flower), the main themes
// of Final Fantasy and Kingdom Hearts (a motif that comes back in every arrangement), Okami's and Ghost of Tsushima's scores (Japanese
// instruments and scales inside a modern orchestra), Guido of Arezzo's hand (the hexachords, their mutation), and breath as the line:
// a flute, a reed, a horn.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const CH = {
  Am: { root: 33, saw: [69, 72, 76], low: [57, 60, 64] }, F: { root: 29, saw: [65, 69, 72], low: [53, 57, 60] },
  C: { root: 36, saw: [67, 72, 76], low: [55, 60, 64] }, G: { root: 31, saw: [67, 71, 74], low: [55, 59, 62] },
  E: { root: 28, saw: [68, 71, 76], low: [56, 59, 64] }, Dm: { root: 38, saw: [69, 74, 77], low: [57, 62, 65] },
  Bb: { root: 34, saw: [70, 74, 77], low: [58, 62, 65] },
};
const SONG = ['Am', 'F', 'C', 'G'];
const MOLLE = ['Dm', 'Bb', 'F', 'C'];
// the koto's ostinato in the In scale (E F A B C), two bars
const OST = [[57, 64, 65, 69, 71, 69, 65, 64], [57, 64, 65, 72, 71, 69, 65, 64]];

// ---- the tunes: per bar, [beat, beats, midi, options]
const SHAKU_INTRO = [[], [[0, 2, 69], [2, 1, 71], [3, 1, 72]], [[0, 3.5, 76, { bend: 1 }]], [[0, 1, 77], [1, 1, 76], [2, 1, 72], [3, 1, 71]], [[0, 4, 69]], [], [[0, 1.5, 76], [1.5, 0.5, 77], [2, 1, 76], [3, 1, 72]], [[0, 2, 71], [2, 2, 69]]];
const SHAKU_EAST = [[[0, 1, 69], [1, 1, 71], [2, 2, 72]], [[0, 2, 76], [2, 1, 77], [3, 1, 76]], [[0, 1.5, 72], [1.5, 0.5, 71], [2, 2, 69]], [[3, 1, 71]],
  [[0, 1, 72], [1, 1, 76], [2, 2, 77]], [[0, 2, 81], [2, 1, 77], [3, 1, 76]], [[0, 1, 72], [1, 1, 71], [2, 1, 69], [3, 1, 65]], [[0, 4, 64, { bend: 1 }]]];
const HARP_WEST = [[[0, 1, 69], [1, 1, 71], [2, 1, 72, { blue: true }], [3, 1, 76]], [[0, 1.5, 74], [1.5, 0.5, 72], [2, 2, 69]], [[0, 1, 67], [1, 1, 69], [2, 1, 72], [3, 1, 74]], [[0, 3, 71, { bend: -1 }], [3, 1, 67]],
  [[0, 1, 69], [1, 1, 71], [2, 1, 72], [3, 1, 76]], [[0, 2, 77], [2, 1, 76], [3, 1, 74]], [[0, 1, 76], [1, 1, 74], [2, 1, 72], [3, 1, 71]], [[0, 2, 74], [2, 1, 71], [3, 1, 67]]];
const GUITAR = [[[0, 1.5, 69], [1.5, 0.5, 71], [2, 1, 72], [3, 1, 76]], [[0, 3, 77, { from: -2 }], [3, 1, 76]], [[0, 1, 79], [1, 1, 76], [2, 1, 72], [3, 1, 74]], [[0, 2, 71, { vib: 0.03 }], [2, 2, 67]],
  [[0, 1.5, 69], [1.5, 0.5, 71], [2, 1, 72], [3, 1, 76]], [[0, 2, 81, { from: -2 }], [2, 1, 79], [3, 1, 77]], [[0, 1, 76], [1, 1, 79], [2, 2, 84, { bend: 2, bendAt: 0.4 }]], [[0, 3, 83, { vib: 0.035 }], [3, 1, 79]],
  [[0, 1.5, 69], [1.5, 0.5, 71], [2, 1, 72], [3, 1, 76]], [[0, 3, 77, { from: -2 }], [3, 1, 76]], [[0, 1, 79], [1, 1, 76], [2, 1, 72], [3, 1, 74]], [[0, 2, 71, { vib: 0.03 }], [2, 2, 67]],
  [[0, 1.5, 69], [1.5, 0.5, 71], [2, 1, 72], [3, 1, 76]], [[0, 2, 81, { from: -2 }], [2, 1, 79], [3, 1, 77]], [[0, 2, 84, { from: -1 }], [2, 1, 83], [3, 1, 79]], [[0, 4, 76, { bend: 2, bendAt: 0.35, vib: 0.03 }]]];
const ANSWER = [[2, 0.5, 77], [2.5, 0.5, 76], [3, 0.5, 72], [3.5, 0.5, 71]]; // (the In answer: F E C B)
const HARP_MOLLE = [[[0, 1, 74], [1, 1, 77], [2, 1, 79], [3, 1, 81]], [[0, 2, 82], [2, 1, 81], [3, 1, 77]], [[0, 1, 77], [1, 1, 79], [2, 2, 81]], [[0, 3, 79], [3, 1, 77]]];
const KOTO_MOLLE = [[62, 65, 69, 72, 76, 72, 69, 65], [58, 62, 65, 69, 70, 69, 65, 62], [53, 60, 65, 69, 72, 69, 65, 60], [48, 55, 60, 64, 67, 64, 60, 55]];

const tune = (inst, bars, v, extra = {}) => (i) => (bars[i] || []).map(([b, d, n, o]) => E(inst, b, d, n, v, { ...extra, ...o }));
const ost = (i, v, pat = OST) => pat[i % pat.length].map((n, k) => E('koto', k * 0.5, 0.5, n, v * (k % 2 ? 0.8 : 1), { pan: k % 2 ? 0.35 : 0.15 }));

export const FORTUNE = {
  title: "Fool's Fortune", bpm: 140, arrange: true, loopFrom: 1,
  sections: [
    { id: 'intro', bars: 8, bar: (i) => [
      ...(i === 0 ? [E('pad', 0, 32, [45, 52, 57], 0.22, { cutoff: 900 }), E('breath', 0, 16, null, 0.08)] : []),
      ...(i === 4 ? [E('breath', 0, 16, null, 0.07)] : []),
      E('koto', 0, 2, [76, 81][i % 2], 0.18, { press: false }), E('koto', 2.5, 1.5, [69, 72, 71, 77][i % 4], 0.14, { press: false }),
      ...tune('shakuhachi', SHAKU_INTRO, 0.55)(i),
      ...(i === 3 ? [E('taiko', 0, 1, null, 0.45)] : []), ...(i === 7 ? [E('taiko', 0, 1, null, 0.55), E('taiko', 2, 1, null, 0.75)] : []),
    ] },
    { id: 'east', bars: 8, bar: (i) => [
      ...(i === 0 ? [E('pad', 0, 32, [45, 52, 57], 0.15, { cutoff: 1100 })] : []),
      ...ost(i, 0.24), E('sub', 0, 4, 33, 0.34),
      E('kick', 0, 1, null, 0.55), E('taiko', 0, 1, null, 0.32), E('taiko', 2.5, 1, null, 0.2, { size: 0.8 }),
      ...[0.5, 1.5, 2.5, 3.5, 1, 3].map((b) => E('shaker', b, 0.25, null, b % 1 ? 0.18 : 0.1)),
      ...tune('shakuhachi', SHAKU_EAST, 0.6)(i),
    ] },
    { id: 'west', bars: 8, bar: (i) => { const c = CH[SONG[i % 4]]; return [
      ...c.low.map((n, k) => E('brass', 0, 4, n, 0.15, { pan: (k - 1) * 0.3 })),
      ...ost(i, 0.1), E('sub', 0, 4, c.root, 0.38),
      E('kick', 0, 1, null, 0.6), E('kick', 2.5, 1, null, 0.45), E('snare', 1, 1, null, 0.34), E('snare', 3, 1, null, 0.4),
      ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => E('hat', b, 0.25, null, b % 1 ? 0.12 : 0.2)),
      ...tune('harmonica', HARP_WEST, 0.55)(i),
    ]; } },
    { id: 'build', bars: 8, sweep: [1000, 16000], bar: (i) => { const ch = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'][i], c = CH[ch]; const ev = [];
      const step = [1, 1, 0.5, 0.5, 0.25, 0.25, 0.125, 0.125][i];
      for (let b = 0; b < (i === 7 ? 2 : 4); b += step) ev.push(E('snare', b, step, null, 0.2 + (i * 4 + b) / 32 * 0.6, { tone: 190 + i * 22 + b * 6 }));
      if (i < 7) for (let b = 0; b < 4; b += 0.5) ev.push(E('supersaw', b, 0.4, c.saw, 0.16 + i * 0.02, { cutoff: 900 + i * 600 }));
      if (i < 7) ev.push(E('sub', 0, 4, c.root, 0.45));
      if (i >= 4 && i < 7) for (let b = 0; b < 4; b += 1) ev.push(E('kick', b, 1, null, 0.75));
      if (i === 0) ev.push(E('riser', 0, 30, null, 0.35));
      if (i < 4) ev.push(...tune('harmonica', HARP_WEST, 0.5)(i));
      if (i === 4) ev.push(E('shakuhachi', 0, 14, 76, 0.6, { bend: 2 }));
      if (i >= 6) ev.push(...c.low.map((n) => E('brass', 0, i === 7 ? 2 : 4, n + 12, 0.32)));
      if (i === 7) ev.push(E('breath', 2, 2, null, 0.5));
      return ev; } },
    { id: 'drop', bars: 16, pump: true, bar: (i) => drop(i, false) },
    { id: 'breakdown', bars: 8, bar: (i) => { const c = CH[MOLLE[i % 4]], ev = [E('pad', 0, 4, c.low.map((n) => n + 12), 0.2, { cutoff: 1800 }), E('sub', 0, 4, c.root, 0.3)];
      if (i < 4) ev.push(...tune('harmonica', HARP_MOLLE, 0.6)(i), ...ost(i, 0.12, KOTO_MOLLE));
      else { ev.push(...ost(i, 0.34, KOTO_MOLLE)); ev.push(...tune('shakuhachi', [[[0, 4, 69]], [[0, 4, 65]], [[0, 2, 69], [2, 2, 72]], [[0, 4, 67]]], 0.45)(i - 4)); }
      if (i >= 4) for (let b = 0; b < 4; b += 0.5) ev.push(E('hat', b, 0.25, null, 0.08 + (b % 1 ? 0 : 0.05)));
      if (i === 0) ev.push(E('bell', 0, 1, 74, 0.35));
      return ev; } },
    { id: 'build2', bars: 8, sweep: [900, 16000], bar: (i) => { const ch = ['Dm', 'Bb', 'F', 'C', 'Am', 'F', 'G', 'E'][i], c = CH[ch]; const ev = [];
      const step = [1, 1, 0.5, 0.5, 0.25, 0.25, 0.125, 0.125][i];
      for (let b = 0; b < (i === 7 ? 2 : 4); b += step) ev.push(E('snare', b, step, null, 0.2 + (i * 4 + b) / 32 * 0.6, { tone: 200 + i * 22 + b * 6 }));
      if (i >= 4) for (let b = 0; b < (i === 7 ? 2 : 4); b += i >= 6 ? 0.25 : 0.5) ev.push(E('taiko', b, 0.5, null, 0.3 + i * 0.05, { size: 0.9 }));
      if (i < 7) for (let b = 0; b < 4; b += 0.5) ev.push(E('supersaw', b, 0.4, c.saw, 0.16 + i * 0.02, { cutoff: 900 + i * 600 }));
      if (i < 7) ev.push(E('sub', 0, 4, c.root, 0.45));
      if (i === 0) ev.push(E('riser', 0, 30, null, 0.38));
      if (i < 4) ev.push(...ost(i, 0.2, KOTO_MOLLE));
      // the fanfare: up the hard hexachord, ut re mi fa sol la on G, to the E
      if (i === 4) ev.push(...[67, 69, 71, 72].map((n, k) => E('brass', k, 1, n, 0.42, { stab: false })), ...[67, 69, 71, 72].map((n, k) => E('brass', k, 1, n - 12, 0.3)));
      if (i === 5) ev.push(E('brass', 0, 2, 74, 0.45), E('brass', 2, 2, 76, 0.48), E('brass', 0, 4, 62, 0.3));
      if (i === 6) ev.push(...CH.G.low.map((n) => E('brass', 0, 4, n + 12, 0.36)), E('brass', 0, 4, 76, 0.5));
      if (i === 7) { ev.push(...CH.E.low.map((n) => E('brass', 0, 2, n + 12, 0.4)), E('brass', 0, 2, 76, 0.5), E('breath', 2, 2, null, 0.55)); }
      return ev; } },
    { id: 'drop2', bars: 16, pump: true, bar: (i) => drop(i, true) },
    { id: 'outro', bars: 8, bar: (i) => { const c = CH[SONG[i % 4]], ev = [E('pad', 0, 4, c.low, 0.18, { cutoff: 1000 })];
      if (i < 7) ev.push(...[0, 1, 2, 3].map((b, k) => E('koto', b, 1, c.low[k % 3] + 12, 0.18)));
      ev.push(...tune('shakuhachi', [[], [], [[0, 2, 69], [2, 1, 71], [3, 1, 72]], [[0, 4, 76, { bend: 1 }]], [[0, 1, 77], [1, 1, 76], [2, 1, 72], [3, 1, 71]], [[0, 4, 69]], [], []], 0.55)(i));
      if (i === 7) ev.push(E('taiko', 0, 1, null, 0.6), E('bell', 0, 1, 69, 0.5), E('bell', 0.5, 1, 76, 0.35));
      return ev; } },
  ],
};

// the drops: half-time kit with the taiko inside it, sub and growl, the supersaws, the guitar wailing the motif, the flute answering
function drop(i, second) {
  const c = CH[SONG[i % 4]], ev = [];
  if (i === 0) ev.push(E('impact', 0, 1, null, 0.8));
  if (i === 8) ev.push(E('crash', 0, 1, null, 0.45));
  ev.push(E('kick', 0, 1, null, 1), E('kick', 2.75, 1, null, 0.8), E('clap', 2, 1, null, 0.72), E('snare', 2, 1, null, 0.6));
  if (i % 2) ev.push(E('kick', 1.5, 1, null, 0.6));
  ev.push(E('taiko', 0, 1, null, 0.62), E('taiko', 1.5, 1, null, 0.38, { size: 0.8 }), E('taiko', 3.5, 1, null, 0.32, { size: 0.7 }));
  for (let b = 0; b < 4; b += 0.5) ev.push(E('hat', b, 0.25, null, b % 1 ? 0.14 : 0.22));
  if (i % 4 === 3) for (let b = 3; b < 4; b += 0.125) ev.push(E('hat', b, 0.125, null, 0.12 + (b - 3) * 0.2));
  ev.push(E('sub', 0, 4, c.root, 0.82));
  ev.push(E('growl', 0, 1.5, c.root + 12, 0.44, { rate: 4.67 }), E('growl', 2, 0.75, c.root + 12, 0.4, { rate: 9.33 }), E('growl', 3, 1, c.root + 24, 0.34, { rate: 4.67 }));
  ev.push(E('supersaw', 0, 4, c.saw, 0.34, { cutoff: second ? 5600 : 4600 }));
  const g = GUITAR[i] || [];
  for (const [b, d, n, o] of g) ev.push(E('guitar', b, d, second && i >= 8 && n < 80 ? n + 12 : n, 0.62, o || {}));
  if (i % 4 === 3) ev.push(...ANSWER.map(([b, d, n]) => E('shakuhachi', b, d, n, 0.55, { scoop: 0 })));
  if (second) {
    for (const b of [0, 1.5]) ev.push(...c.low.map((n) => E('brass', b, 0.5, n + 12, 0.42, { stab: true })));
    if (i < 8) ev.push(E('harmonica', 0, 4, c.saw[1], 0.34));
  }
  return ev;
}
