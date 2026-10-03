// ---------------------------------------------------------------------------------------
// MORE SONGS OF THE SEA, beside "Haul Away the Fortune" (music/shanty.js):
//   ROLL THE MOON DOWN   a halyard shanty, 4/4 at 88 in G Mixolydian (G major with the sailor's flat seventh, F): the harmonica
//                        sings each call, the crew answers it in one breath with the pull on its downbeats (a stomp, a grunt), and
//                        the moon they roll down is the spiral one over the title's board. Second verse: the fiddle doubles the call,
//                        the crew sings in thirds; then a concertina round; it loops
//   LEAVE HER, LACHRYMA  a forebitter (the songs sung off watch, not at the ropes): a slow waltz in E minor at 84 for the end of a
//                        voyage. A fiddle sings the verse over the concertina's oom-pah-pah and an upright; the crew hums the
//                        chorus with a harp under it; the second time a voice with no words takes the verse, and the chorus ends on
//                        the Tear (F, D#, home to E)
//
// Prior art: the halyard shanty's form (a solo line, a short refrain on the pull: "Blow the Man Down", "Haul on the Bowline"),
// "Leave Her, Johnny" (the song for the end of a voyage), the forebitter and the Irish waltz (the fiddle, the concertina's chords on
// two and three), and Stan Hugill's "Shanties from the Seven Seas", the shantyman's own book.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const line = (rows, i, v = 0.4, o = {}, up = 0) => rows.map(([b, d, n, oo]) => E(i, b, d * 0.95, n + up, v, { ...o, ...(oo || {}) }));
const crew = (rows, v = 0.34, below = null) => rows.flatMap(([b, d, n]) => [E('hum', b, d * 0.92, [n, n - 12, ...(below ? [below(n)] : [])], v, { open: true, attack: 0.05 })]);

// ---- roll the moon down
const MIXO = [55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];
const third = (n) => MIXO[Math.max(0, MIXO.indexOf(n) - 2)] ?? n - 4;
const RM = {
  // [chord, call (the harmonica), answer (the crew)], two bars each
  phrases: [
    ['G', [[0, 1, 67], [1, 0.5, 71], [1.5, 0.5, 74], [2, 1, 74], [3, 1, 76]], 'F', [[0, 1.5, 77], [1.5, 0.5, 76], [2, 2, 74]]],
    ['C', [[0, 1, 72], [1, 0.5, 76], [1.5, 0.5, 79], [2, 1, 79], [3, 1, 76]], 'G', [[0, 1.5, 74], [1.5, 0.5, 71], [2, 2, 67]]],
    ['G', [[0, 0.5, 74], [0.5, 0.5, 76], [1, 1, 79], [2, 1, 77], [3, 1, 76]], 'F', [[0, 1.5, 77], [1.5, 0.5, 76], [2, 2, 72]]],
    ['D', [[0, 1, 74], [1, 1, 72], [2, 1, 71], [3, 1, 69]], 'G', [[0, 1.5, 71], [1.5, 0.5, 69], [2, 2, 67]]],
  ],
  CH: { G: [55, 59, 62], F: [53, 57, 60], C: [55, 60, 64], D: [54, 57, 62] },
  ROOT: { G: 43, F: 41, C: 36, D: 38 },
};
const rmBar = (k, { second = false, round = false } = {}) => {
  const P = RM.phrases[k >> 1], call = k % 2 === 0, c = call ? P[0] : P[2], ev = [];
  ev.push(E('upright', 0, 2, RM.ROOT[c], 0.45), E('upright', 2, 2, RM.ROOT[c] + 7, 0.38));
  ev.push(...[0.5, 1.5, 2.5, 3.5].map((b) => E('concertina', b, 0.4, RM.CH[c], round ? 0.26 : 0.16)));
  if (call) {
    ev.push(E('bodhran', 0, 1, null, 0.4), E('bodhran', 2, 1, null, 0.3), E('bodhran', 1, 1, null, 0.18, { rim: true }), E('bodhran', 3, 1, null, 0.18, { rim: true }));
    if (round) ev.push(...line(P[1], 'concertina', 0.36, { pan: -0.2 }, 12));
    else ev.push(...line(P[1], 'harmonica', 0.4, { pan: -0.2 }), ...(second ? line(P[1], 'fiddle', 0.28, { pan: 0.3 }) : []));
  } else { // (the pull: two heaves a bar, on one and three)
    ev.push(E('stomp', 0, 1, null, 0.6), E('stomp', 2, 1, null, 0.5), E('bodhran', 0, 1, null, 0.55), E('bodhran', 2, 1, null, 0.45), E('huh', 0, 1, null, 0.3), E('huh', 2, 1, null, 0.22), E('clap', 3, 1, null, 0.2));
    ev.push(...crew(P[3], second ? 0.36 : 0.33, second ? third : null));
  }
  return ev;
};
export const ROLL_THE_MOON = {
  title: 'Roll the Moon Down', root: 64, bpm: 88, arrange: true, loopFrom: 0,
  sections: [
    { id: 'verse', bars: 8, gain: 1.2, bar: (k) => rmBar(k) },
    { id: 'verse2', bars: 8, gain: 1.3, bar: (k) => rmBar(k, { second: true }) },
    { id: 'round', bars: 8, gain: 1.2, bar: (k) => rmBar(k, { round: true }) },
  ],
};

// ---- leave them, lachryma
const LH = {
  verse: { ch: ['Em', 'C', 'G', 'D', 'Em', 'Am', 'B7', 'Em'], mel: [
    [[0, 2, 71], [2, 1, 69]], [[0, 2, 67], [2, 1, 64]], [[0, 1, 67], [1, 1, 71], [2, 1, 74]], [[0, 3, 74]],
    [[0, 2, 76], [2, 1, 74]], [[0, 2, 72], [2, 1, 71]], [[0, 1, 71], [1, 1, 69], [2, 1, 66]], [[0, 3, 64]]] },
  chorus: { ch: ['C', 'G', 'Am', 'Em', 'C', 'D', 'B7', 'Em'], mel: [
    [[0, 2, 72], [2, 1, 71]], [[0, 2, 74], [2, 1, 71]], [[0, 2, 72], [2, 1, 69]], [[0, 3, 71]],
    [[0, 1, 72], [1, 1, 76], [2, 1, 79]], [[0, 2, 78], [2, 1, 74]], [[0, 2, 77], [2, 1, 75]], [[0, 3, 76]]] }, // (the last two bars: the Tear, F to D# to E)
  CH: { Em: [55, 59, 64], C: [55, 60, 64], G: [55, 59, 62], D: [54, 57, 62], Am: [57, 60, 64], B7: [54, 57, 63] },
  ROOT: { Em: 40, C: 36, G: 43, D: 38, Am: 45, B7: 47 },
};
const waltz = (c, v = 1) => [E('upright', 0, 1, LH.ROOT[c], 0.42 * v), E('concertina', 1, 0.8, LH.CH[c], 0.14 * v), E('concertina', 2, 0.8, LH.CH[c], 0.12 * v)];
const harpArp = (c) => [...LH.CH[c], LH.CH[c][0] + 12, LH.CH[c][1] + 12].map((n, k) => E('harp', k * 0.5, 1.5, n, 0.16));

export const LEAVE_HER = {
  title: 'Leave Her, Lachryma', root: 64, bpm: 84, beats: 3, arrange: true, loopFrom: 0,
  sections: [
    { id: 'verse', bars: 8, gain: 1.6, bar: (k) => [...waltz(LH.verse.ch[k]), ...line(LH.verse.mel[k], 'fiddle', 0.4, { pan: 0.25, vib: 0.016, from: k % 4 === 0 ? -1 : 0 })] },
    { id: 'chorus', bars: 8, gain: 1.6, bar: (k) => [...waltz(LH.chorus.ch[k]), ...harpArp(LH.chorus.ch[k]), ...crew(LH.chorus.mel[k].map(([b, d, n]) => [b, d, n]), 0.28).map((e) => ({ ...e, o: { open: false, attack: 0.15 } })), ...line(LH.chorus.mel[k], 'fiddle', 0.22, { pan: 0.25 }, 12)] },
    { id: 'verse2', bars: 8, gain: 1.6, bar: (k) => [...waltz(LH.verse.ch[k]), ...line(LH.verse.mel[k], 'voice', 0.32, { vowel: 'o', from: k % 2 ? 0 : -2, glide: 0.18 }), ...line(LH.verse.mel[k], 'fiddle', 0.16, { pan: 0.3 }, 12)] },
    { id: 'chorus2', bars: 8, gain: 1.7, bar: (k) => [...waltz(LH.chorus.ch[k], 1.15), ...harpArp(LH.chorus.ch[k]), ...crew(LH.chorus.mel[k], 0.32), ...line(LH.chorus.mel[k], 'fiddle', 0.28, { pan: 0.25 }, 12), ...line(LH.chorus.mel[k], 'harmonica', 0.2, { pan: -0.3 })] },
  ],
};
