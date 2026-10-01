// ---------------------------------------------------------------------------------------
// THE JINGLES: the short cues every JRPG is built out of, each made from the main theme's Five (music/fortune.js), as Koji Kondo
// makes Zelda's: the item fanfare, the secret chime, the inn's lullaby are all the same few notes in another coat. They play once
// (loopFrom: null). The first three:
//   FANFARE  a battle won, a trial cleared: the Five's answer (G A B D E) in the brass as a pickup, up to G, then B, and home
//   FOUND    something precious found: the answer run up to E6 on the celesta and the flute, a bell on top (the item-get)
//   REST     a rest, a save: the Five slowly on the piano in G major, the flute answering, a celesta at the end (the inn)
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const G = [43, 50, 55, 59], C = [48, 52, 55, 60], D = [50, 54, 57, 62], Em = [52, 59, 64, 67];

export const FANFARE = {
  title: 'Fanfare of the Five', bpm: 125, arrange: true, loopFrom: null, tail: 3,
  sections: [{ id: 'fanfare', bars: 3, gain: 1.6, bar: (i) => {
    if (i === 0) return [
      ...[67, 69, 71].map((n, k) => E('brass', k / 3, 0.33, n, 0.4, { stab: true })), E('brass', 1, 0.5, 74, 0.42, { stab: true }), E('brass', 1.5, 0.5, 76, 0.42, { stab: true }),
      E('brass', 2, 2, 79, 0.45), ...G.map((n) => E('brass', 2, 2, n + 12, 0.3)), E('strings', 2, 2, G.map((n) => n + 12), 0.2, { attack: 0.05 }),
      E('taiko', 2, 1, null, 0.6), E('crash', 2, 1, null, 0.4), E('flute', 2, 2, 91, 0.25),
    ];
    if (i === 1) return [
      E('brass', 0, 1, 81, 0.42), E('brass', 1, 1, 79, 0.4), E('brass', 2, 2, 83, 0.45), ...C.map((n) => E('brass', 0, 2, n + 12, 0.28)), ...D.map((n) => E('brass', 2, 2, n + 12, 0.28)),
      E('strings', 0, 4, [64, 72, 79], 0.18, { attack: 0.05 }), E('taiko', 0, 1, null, 0.4), E('taiko', 2, 1, null, 0.45),
    ];
    return [
      E('brass', 0, 4, 79, 0.45), ...G.map((n) => E('brass', 0, 4, n + 12, 0.3)), E('strings', 0, 4, [67, 74, 79, 83], 0.22, { attack: 0.05 }), E('flute', 0, 4, 91, 0.25),
      E('impact', 0, 1, null, 0.4), ...[0, 0.25, 0.5, 0.75, 1, 1.25].map((b) => E('taiko', b, 0.25, null, 0.25 + b * 0.2, { size: 0.9 })), E('bell', 0, 1, 79, 0.3),
    ];
  } }],
};

export const FOUND = {
  title: 'Found', bpm: 125, arrange: true, loopFrom: null, tail: 3,
  sections: [{ id: 'found', bars: 2, gain: 1.6, bar: (i) => (i === 0 ? [
    ...[79, 81, 83, 86, 88].map((n, k) => E('celesta', k * 0.25, 0.5, n, 0.35)), ...[67, 69, 71, 74, 76].map((n, k) => E('flute', k * 0.25, 0.3, n, 0.35)),
    E('strings', 0, 4, G.map((n) => n + 12), 0.14, { attack: 0.2 }), E('flute', 1.25, 2.5, 79, 0.4), E('bell', 1.25, 1, 88, 0.4), E('piano', 1.25, 2, 43, 0.3, { pedal: 1 }),
  ] : [E('celesta', 0, 1, 83, 0.2), E('celesta', 0.5, 1, 88, 0.18)]) }],
};

export const REST = {
  title: 'A Place to Rest', bpm: 75, arrange: true, loopFrom: null, tail: 4,
  sections: [{ id: 'rest', bars: 4, gain: 1.6, bar: (i) => {
    const chords = [G, C, D, G], mel = [[[0, 1.5, 76], [1.5, 0.5, 74], [2, 1, 71], [3, 1, 67]], [[0, 3, 69], [3, 1, 71]], [[0, 1, 74], [1, 1, 72], [2, 2, 71]], [[0, 4, 67]]][i];
    const ev = chords[i].map((n, k) => E('piano', k * 0.5, 2, n, 0.22, { pedal: 1 }));
    ev.push(...mel.map(([b, d, n]) => E('piano', b, d, n + 12, 0.38, { pedal: 0.4 })));
    if (i === 1 || i === 2) ev.push(E('flute', 2, 2, i === 1 ? 79 : 78, 0.3));
    if (i === 3) ev.push(...[79, 83, 86, 91].map((n, k) => E('celesta', 1 + k * 0.5, 1, n, 0.2)), E('strings', 0, 4, G.map((n) => n + 12), 0.08, { attack: 1 }));
    return ev;
  } }],
};

export { Em as _EM }; // (kept for the next cues: the minor jingles, the game over)
