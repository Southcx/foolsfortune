// ---------------------------------------------------------------------------------------
// "LACHRYMA": the main theme, on the black keys. E flat minor pentatonic is the five black keys of the piano (E flat, G flat, A flat,
// B flat, D flat): five notes, the game's number, and black like the Lachryma. E flat and G flat are E and G in shadow. The Five
// (the leitmotif: music/fortune.js) is here on the black keys, E flat D flat B flat A flat G flat, falling, and its answer climbs.
// The harmony is space-fantasy jazz: minor ninths, major sevenths with a raised eleventh (the B major seven over the E flat bass
// line's fall is the colour of a nebula), a suspended thirteenth that never quite resolves, a dominant with a sharp ninth.
//
//   I    NEBULA      5 bars. A choir's "aah", a pad, a celesta, the Rhodes in long chords, the Five on the vibraphone, no time yet
//   II   BLACK KEYS  10 bars. The Rhodes comps, the upright plays in two, brushes and the ride, swung; the vibes take the A melody
//   III  ORBIT       10 bars. The soprano saxophone takes the B melody (higher, longer), the bass walks, the choir comes in
//   IV   DRIFT       10 bars. The sax wanders the pentatonic over the A changes (a solo, written out), the ride picks up
//   V    BLACK KEYS  10 bars, again: the sax and the vibes in octaves, the strings under, and at the end the Leap: E flat to E flat
//   VI   CODA        5 bars. The answer on the celesta, climbing, and the last chord E flat MAJOR nine (the light at the end)
// It loops from II. About two minutes a time round, at 100 (the walking tempo); phrases of five bars and ten.
//
// Prior art: Yoko Kanno (Cowboy Bebop's and Macross Plus's space jazz: a soprano sax over lush extended chords, a choir in the
// distance, "Space Lion"), Kota Hoshino's Evergrace (ethereal fantasy over a slow pulse, choir and synth and acoustic colour),
// Bill Evans' rootless voicings (the Rhodes plays the colour tones, the bass the root), and the pentatonic as jazz's oldest friend
// (McCoy Tyner's fourths, Herbie Hancock's "Maiden Voyage" with its suspended chords).
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

// chords: the bass root, and a rootless voicing for the Rhodes (the colour tones)
const CH = {
  Ebm9: { r: 39, v: [54, 58, 61, 65] },
  B7s11: { r: 35, v: [51, 54, 58, 65] }, // (B major seven, sharp eleven: Cb, the flat six of E flat minor)
  Abm9: { r: 44, v: [47, 51, 54, 58] },
  Db13: { r: 37, v: [54, 59, 63, 70] }, // (D flat thirteen, suspended)
  Gbm9: { r: 42, v: [53, 58, 61, 68] }, // (G flat major nine)
  Fm7b5: { r: 41, v: [51, 56, 59, 63] },
  Bb7s9: { r: 34, v: [50, 56, 61, 66] }, // (B flat seven, sharp nine, flat thirteen)
  Dbm7: { r: 37, v: [52, 56, 59, 63] },
  Gb7: { r: 42, v: [52, 58, 61, 66] },
  EbM9: { r: 39, v: [55, 58, 62, 65] }, // (E flat major nine: the Picardy third)
};
const A_CH = ['Ebm9', 'B7s11', 'Abm9', 'Db13', 'Gbm9', 'Ebm9', 'B7s11', 'Fm7b5', 'Bb7s9', 'Ebm9'];
const B_CH = ['Gbm9', 'Fm7b5', 'Ebm9', 'Dbm7', 'B7s11', 'Abm9', 'Db13', 'Gbm9', 'Fm7b5', 'Bb7s9'];
// (in B, bars 2 and 4 have two chords: the second half of the bar)
const B_CH2 = { 1: 'Bb7s9', 3: 'Gb7' };

// THE A MELODY: it opens with the Five on the black keys (E flat D flat B flat A flat), and climbs the answer at bar six
const A = [
  [[0, 1.5, 75], [1.5, 0.5, 73], [2, 1, 70], [3, 1, 68]],
  [[0, 3, 66], [3, 1, 68]],
  [[0, 1.5, 70], [1.5, 0.5, 68], [2, 1, 66], [3, 1, 63]],
  [[0, 2, 68], [2, 2, 73]],
  [[0, 4, 70]],
  [[0, 1, 75], [1, 0.5, 78], [1.5, 0.5, 80], [2, 2, 82]],
  [[0, 1.5, 85], [1.5, 0.5, 82], [2, 2, 78]],
  [[0, 2, 80], [2, 1, 78], [3, 1, 75]],
  [[0, 2, 73], [2, 1, 70], [3, 1, 66]],
  [[0, 4, 75]],
];
// THE B MELODY (the sax): higher, longer
const B = [
  [[0, 1, 82], [1, 1, 85], [2, 2, 87]],
  [[0, 2, 85], [2, 1, 82], [3, 1, 80]],
  [[0, 3, 78], [3, 1, 80]],
  [[0, 2, 82], [2, 2, 80]],
  [[0, 4, 78]],
  [[0, 1, 75], [1, 1, 78], [2, 1, 80], [3, 1, 82]],
  [[0, 2, 85], [2, 2, 82]],
  [[0, 2, 80], [2, 2, 78]],
  [[0, 2, 75], [2, 2, 80]],
  [[0, 2, 78], [2, 2, 73]],
];
// the solo, written out: pentatonic runs that answer the changes (seeded, so it is the same every time round)
const PENTA = [63, 66, 68, 70, 73, 75, 78, 80, 82, 85, 87];
let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const SOLO = A_CH.map((c, i) => {
  const out = [], start = [5, 6, 7, 8, 6, 5, 7, 8, 9, 5][i];
  let k = start, b = i % 2 ? 0.66 : 0;
  while (b < 4) {
    const d = b % 1 ? 0.34 : rnd() < 0.3 ? 1 : 0.66;
    out.push([b, Math.min(d, 4 - b), PENTA[Math.max(0, Math.min(PENTA.length - 1, k))]]);
    k += rnd() < 0.55 ? -1 : 1; if (rnd() < 0.15) k += rnd() < 0.5 ? -2 : 2;
    b += d;
  }
  return out;
});

const tune = (inst, notes, v, o = {}, shift = 0) => notes.map(([b, d, n]) => E(inst, b, d, n + shift, v, o));
// the Rhodes comps: on one and on the "and" of two, swung (2.66), and a stab before four in the busier bars
const comp = (c, v, busy = false) => {
  const C = CH[c].v, ev = [...C.map((n) => E('rhodes', 0, 1.4, n, v)), ...C.map((n) => E('rhodes', 1.66, 1, n, v * 0.75))];
  if (busy) ev.push(...C.map((n) => E('rhodes', 3.66, 0.3, n + 12 * (n < 56 ? 1 : 0), v * 0.6)));
  return ev;
};
// the bass: in two (root, then the fifth), or walking (root, a chord tone, the fifth, a step into the next root)
const two = (c, v) => { const r = CH[c].r; return [E('upright', 0, 1.8, r, v), E('upright', 2, 1.8, r + 7, v * 0.85)]; };
const walk = (c, next, v) => { const r = CH[c].r, nr = CH[next]?.r ?? r; return [r, r + (CH[c].v[0] % 12 === (r + 3) % 12 ? 3 : 4), r + 7, nr + (nr > r ? -1 : 1)].map((n, i) => E('upright', i, 0.9, n, i ? v * 0.8 : v)); };
// the drums: the ride's swing (ding, ding-da, ding, ding-da), brushes on two and four
const swing = (v) => [0, 1, 1.66, 2, 3, 3.66].map((b) => E('ride', b, 0.3, null, b % 1 ? v * 0.6 : v)).concat([1, 3].map((b) => E('brush', b, 0.5, null, v * 1.1)));
const pad = (c, v, d = 4) => [E('strings', 0, d, CH[c].v.map((n) => n + 12), v, { attack: 0.8, bright: 1600 })];

export const LACHRYMA = {
  title: 'Lachryma', bpm: 100, arrange: true, loopFrom: 1, pumpDepth: 1,
  sections: [
    { id: 'nebula', bars: 5, gain: 1, bar: (i) => {
      const c = ['Ebm9', 'B7s11', 'Abm9', 'Db13', 'Ebm9'][i];
      const ev = [E('hum', 0, 4, CH[c].v.map((n) => n + 12), 0.2, { open: true, attack: 1.2 }), ...pad(c, 0.06), ...CH[c].v.map((n) => E('rhodes', 0, 3.5, n, 0.22)), E('upright', 0, 3.8, CH[c].r, 0.3)];
      if (i < 4) ev.push(...[[0, 75], [1, 73], [2, 70], [3, 68]].slice(0, i === 3 ? 4 : 2 + (i % 2)).map(([b, n]) => E('vibes', b, 1, n, 0.3)));
      ev.push(...[0.5, 1.5, 2.75, 3.5].map((b, k) => E('celesta', b, 0.5, [87, 85, 82, 90][(k + i) % 4], 0.08)));
      if (i === 4) ev.push(E('ride', 3, 0.3, null, 0.15), E('ride', 3.66, 0.3, null, 0.1));
      return ev;
    } },
    { id: 'blackkeys', bars: 10, gain: 1, bar: (i) => {
      const c = A_CH[i];
      return [...comp(c, 0.2, i % 5 === 4), ...two(c, 0.48), ...swing(0.22), ...tune('vibes', A[i], 0.42), ...(i >= 5 ? pad(c, 0.05) : [])];
    } },
    { id: 'orbit', bars: 10, gain: 1.1, bar: (i) => {
      const c = B_CH[i], c2 = B_CH2[i], next = B_CH[i + 1] || 'Ebm9';
      const ev = [...comp(c, 0.18, true), ...walk(c, c2 || next, 0.5), ...swing(0.25), ...tune('sax', B[i], 0.5), E('hum', 0, 4, CH[c].v.map((n) => n + 12), 0.1, { open: true, attack: 0.6 })];
      if (c2) ev.push(...CH[c2].v.map((n) => E('rhodes', 2.66, 1, n, 0.16)));
      return ev;
    } },
    { id: 'drift', bars: 10, gain: 1.1, bar: (i) => {
      const c = A_CH[i];
      return [...comp(c, 0.18, true), ...walk(c, A_CH[i + 1] || 'Ebm9', 0.5), ...swing(0.27), E('hat', 1, 0.2, null, 0.05), E('hat', 3, 0.2, null, 0.05), ...tune('sax', SOLO[i], 0.44), ...(i % 2 ? [E('vibes', 2, 2, CH[c].v[3] + 12, 0.15)] : [])];
    } },
    { id: 'blackkeys2', bars: 10, gain: 1.3, bar: (i) => {
      const c = A_CH[i];
      // the end of the phrase: the Leap, E flat to the E flat above, everything under it
      const mel = i === 9 ? [[0, 1, 75], [1, 3, 87]] : A[i];
      const ev = [...comp(c, 0.2, true), ...walk(c, A_CH[i + 1] || 'Ebm9', 0.52), ...swing(0.3), ...tune('sax', mel, 0.5), ...tune('vibes', mel, 0.32, {}, -12), ...pad(c, 0.09), E('hum', 0, 4, CH[c].v.map((n) => n + 12), 0.12, { open: true, attack: 0.5 })];
      if (i === 9) ev.push(E('crash', 1, 1, null, 0.3), E('bell', 1, 1, 87, 0.3), E('timbale', 1, 0.5, null, 0.3));
      return ev;
    } },
    { id: 'coda', bars: 5, gain: 0.95, bar: (i) => {
      const c = ['Gbm9', 'B7s11', 'Abm9', 'Bb7s9', 'EbM9'][i];
      const ev = [...CH[c].v.map((n) => E('rhodes', 0, 3.6, n, 0.2)), E('upright', 0, 3.6, CH[c].r, 0.4), ...pad(c, 0.07), E('ride', 0, 0.4, null, 0.12)];
      if (i === 4) ev.push(...[67, 68, 70, 73, 75].map((n, k) => E('celesta', k * 0.5, 1, n + 12, 0.22)), E('bell', 3, 1, 87, 0.25), E('hum', 0, 4, CH[c].v.map((n) => n + 12), 0.15, { open: true, attack: 1 }));
      else ev.push(E('vibes', 2, 2, [82, 80, 78, 73][i], 0.25));
      return ev;
    } },
  ],
};
