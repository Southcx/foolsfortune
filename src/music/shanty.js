// ---------------------------------------------------------------------------------------
// HAUL AWAY THE FORTUNE: a shanty for the Solar Skiff (sailing the dunes, and the pond). 6/8 in E Dorian (E minor with the bright
// sixth, C#), a capstan's swing: two strong beats a bar, the crew's feet on them. A concertina sings the call; the crew answers with
// the chorus, which is the Five falling and the Answer rising again (the game's two motifs as a work song's refrain), a grunt on the
// heave. Then a fiddle takes a jig round, and the last chorus has everyone: the harmonica on the tune, the fiddle a third above.
// It loops: a shanty goes on as long as the work does.
//
// Prior art: the capstan and halyard shanties of the age of sail (the shantyman's call, the crew's refrain on the pull: "Haul Away
// Joe", "Leave Her, Johnny"), the Irish session (the jig in 6/8, the bodhrán, the concertina), and the sea songs games have sailed
// to (the Wind Waker's, Assassin's Creed IV's).
// ---------------------------------------------------------------------------------------

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const CH = { Em: [55, 59, 64], D: [54, 57, 62], G: [55, 59, 62], A: [57, 61, 64], Bm: [54, 59, 62] };
const ROOT = { Em: 40, D: 38, G: 43, A: 45, Bm: 47 };
const DORIAN = [52, 54, 55, 57, 59, 61, 62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 85, 86, 88];
const third = (n) => DORIAN[DORIAN.indexOf(n) + 2] ?? n + 4;

// a bar's chords: [beat, chord] (two halves of the 6/8, or one chord for the whole bar)
const VERSE = { tune: [[[0, 2, 64], [2, 1, 67], [3, 2, 71], [5, 1, 69]], [[0, 2, 69], [2, 1, 66], [3, 3, 62]], [[0, 2, 64], [2, 1, 67], [3, 2, 71], [5, 1, 73]], [[0, 3, 76], [3, 2, 74], [5, 1, 71]]],
  chords: [[[0, 'Em']], [[0, 'D']], [[0, 'Em']], [[0, 'A']]] };
// the chorus: the Five falling (E D B, A G E), then the Answer climbing (E G A B, D E)
const CHORUS = { tune: [[[0, 2, 76], [2, 1, 74], [3, 3, 71]], [[0, 2, 69], [2, 1, 67], [3, 3, 64]], [[0, 2, 64], [2, 1, 67], [3, 2, 69], [5, 1, 71]], [[0, 3, 74], [3, 3, 76]]],
  chords: [[[0, 'Em']], [[0, 'G']], [[0, 'Em'], [3, 'A']], [[0, 'D'], [3, 'Em']]] };
const JIG = [[76, 74, 71, 71, 69, 67], [66, 69, 74, 74, 73, 71], [67, 71, 76, 79, 76, 74], [73, 74, 76, 71, 67, 64]];
const JIG_CH = [[[0, 'Em']], [[0, 'D']], [[0, 'Em']], [[0, 'A'], [3, 'Em']]];

// the deck: bodhrán on the two beats (a rim tap between), the crew's feet, the bass on root and fifth, the concertina's oom-pah
const deck = (chords, { feet = 0.5, busy = false, squeeze = 0.3 } = {}) => {
  const ev = [E('bodhran', 0, 1, null, 0.55), E('bodhran', 3, 1, null, 0.45), E('bodhran', 2, 1, null, 0.3, { rim: true }), E('bodhran', 5, 1, null, 0.3, { rim: true }),
    E('stomp', 0, 1, null, feet), E('stomp', 3, 1, null, feet * 0.85)];
  if (busy) ev.push(...[1, 4].map((b) => E('bodhran', b, 1, null, 0.22)));
  for (const [b, c] of chords) {
    const half = chords.length > 1;
    ev.push(E('upright', b, 2, ROOT[c], 0.5), ...(half ? [] : [E('upright', 3, 2, ROOT[c] + 7, 0.42)]));
    for (const at of half ? [b + 1] : [1, 4]) ev.push(E('concertina', at, 1.6, CH[c], squeeze));
  }
  return ev;
};
const sing = (rows, v = 0.34) => rows.flatMap(([b, d, n]) => [E('hum', b, d * 0.95, [n, n - 12], v, { open: true, attack: 0.06 })]);
const play = (rows, i, v, o = {}, up = 0) => rows.map(([b, d, n]) => E(i, b, d * 0.95, n + up, v, o));

export const SHANTY = {
  title: 'Haul Away the Fortune', root: 64, bpm: 198, beats: 6, arrange: true, loopFrom: 0,
  sections: [
    { id: 'call', bars: 4, gain: 1.0, bar: (i) => [...deck(VERSE.chords[i], { feet: 0.4, squeeze: 0.18 }), ...play(VERSE.tune[i], 'concertina', 0.4, { pan: -0.15 })] },
    { id: 'chorus', bars: 4, gain: 1.1, bar: (i) => [...deck(CHORUS.chords[i], { feet: 0.6 }), ...sing(CHORUS.tune[i]), E('huh', 0, 1, null, 0.3), E('clap', 3, 1, null, 0.25)] },
    { id: 'jig', bars: 4, gain: 1.05, bar: (i) => [...deck(JIG_CH[i], { busy: true, squeeze: 0.24 }), ...JIG[i].map((n, k) => E('fiddle', k, 1, n, 0.4, { pan: 0.3, vib: 0.006, from: k % 3 === 0 ? -1 : 0 }))] },
    { id: 'chorus2', bars: 4, gain: 1.3, bar: (i) => {
      const t = CHORUS.tune[i];
      return [...deck(CHORUS.chords[i], { feet: 0.65, busy: true }), ...sing(t, 0.38), ...play(t, 'harmonica', 0.3, { pan: -0.3 }, 12), ...play(t.map(([b, d, n]) => [b, d, third(n)]), 'fiddle', 0.3, { pan: 0.3 }, 12),
        E('huh', 0, 1, null, 0.34), E('clap', 3, 1, null, 0.3), ...(i === 3 ? [E('crash', 3, 1, null, 0.2)] : [])];
    } },
  ],
};
