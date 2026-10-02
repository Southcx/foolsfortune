// ---------------------------------------------------------------------------------------
// SONG OF THE SIREN: a lullaby that wants you in the water. 6/8, rocking like a swell (132 in eighths), E Phrygian: the chords lean
// between E minor and F major, and the F is the game's Tear, so the harmony itself sighs. A voice with no words slides down from high
// C onto E (her call) and sings the Tear; a harp rolls under her, the waves breathe in and out, the strings hold a low chord. The
// second time a sister sings a third below, a phased guitar shimmers like light through water, and something very large calls far
// off. It loops; she does not stop.
//
// Prior art: Homer's sirens (the song no sailor can sail past), Debussy's "Sirènes" (Nocturnes: women's voices without words over
// the sea), the Phrygian half step as allure and menace (Spain's, and every film's), Ocarina of Time's Serenade of Water.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const PHRYG = [52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
const below = (n) => PHRYG[Math.max(0, PHRYG.indexOf(n) - 2)] ?? n - 3;
const CH = { Em: [52, 59, 64, 67, 71, 76], F: [53, 60, 65, 69, 72, 77], Am: [57, 64, 69, 72, 76, 81], G: [55, 62, 67, 71, 74, 79] };
const PROG = ['Em', 'F', 'Em', 'F', 'Am', 'G', 'F', 'Em'];
// her song: [beat (eighths), eighths, midi, options]
const SONG = [
  [[0, 6, 76, { from: 8, glide: 0.9 }]], // (the call: down from C6 onto E)
  [[0, 3, 77], [3, 3, 76]], // (the Tear)
  [[0, 2, 79], [2, 1, 77], [3, 3, 76]],
  [[0, 6, 72, { vowel: 'o' }]],
  [[0, 3, 76], [3, 3, 72]],
  [[0, 3, 74], [3, 2, 71], [5, 1, 74]],
  [[0, 3, 77, { from: -2 }], [3, 3, 81]],
  [[0, 6, 76, { vowel: 'o' }]],
];
const sea = (i, { deep = false } = {}) => {
  const c = CH[PROG[i]], ev = [
    ...c.map((n, k) => E('harp', k, 2, n, 0.2)),
    E('strings', 0, 6, [c[0] - 12, c[1] - 12], 0.06, { attack: 1.2 }),
    E('upright', 0, 6, c[0] - 12, 0.25),
  ];
  if (i % 2 === 0) ev.push(E('breath', 0, 6, null, 0.16), E('bubble', 4.5, 0.2, null, 0.08, { size: 1.4 }));
  if (deep && i === 2) ev.push(E('whale', 0, 10, 52, 0.22, { to: 47, pan: -0.5 }));
  if (deep && i % 4 === 0) ev.push(E('phaseguitar', 0, 12, [c[2], c[3], c[4]], 0.12, { rate: 0.2, pan: 0.3 }));
  return ev;
};
const sing = (i, v = 0.34, o = {}, map = (n) => n) => SONG[i].map(([b, d, n, oo]) => E('voice', b, d * 0.97, map(n), v, { vowel: 'a', ...o, ...(oo || {}) }));

export const SIREN = {
  title: 'Song of the Siren', root: 64, bpm: 132, beats: 6, arrange: true, loopFrom: 1,
  sections: [
    { id: 'waves', bars: 2, gain: 1.7, bar: (i) => sea(i * 2) },
    { id: 'song', bars: 8, gain: 1.7, bar: (i) => [...sea(i), ...sing(i)] },
    { id: 'sisters', bars: 8, gain: 1.75, bar: (i) => [...sea(i, { deep: true }), ...sing(i, 0.32, { pan: -0.2 }), ...sing(i, 0.24, { pan: 0.25, vowel: 'o' }, below), ...(i === 7 ? [E('celesta', 3, 2, 88, 0.12), E('celesta', 4, 2, 83, 0.1)] : [])] },
  ],
};
