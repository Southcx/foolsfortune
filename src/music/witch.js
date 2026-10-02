// ---------------------------------------------------------------------------------------
// HEX AND KETTLE: the witch's. In seven (2+2+3, the lopsided Balkan step), 220 in eighths, on E's Hungarian minor (E F# G A# B C D#:
// two augmented seconds, the scale of every fortune-teller's tent). The cauldron is a pizzicato ostinato and bubbles; a Moog creeps
// E, E, D#; the tabla's slaps keep the seven. The theremin is her voice: the hex (E up the tritone to A#, B, then down G, F#: the
// devil's interval, then a shrug), sliding between its notes. The coven's turn: a fiddle takes the hex with the tritone sounded
// against it (the devil's fiddle, tuned to it), a choir hums under, and the theremin swoops over them all. It loops.
//
// Prior art: Saint-Saëns's "Danse macabre" (the fiddle's tritone at midnight), Mussorgsky's "Night on Bald Mountain" and the
// Baba Yaga of his Pictures, the Balkan aksak meters (7/8 as 2+2+3), the theremin of 1950s films (Herrmann, Rózsa's Spellbound),
// and the bubbling cauldron of every witch in every cartoon.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const HEX = [[0, 2, 76], [2, 2, 82], [4, 1, 83], [5, 1, 79], [6, 1, 78]]; // (E A# B G F#: the hex)
const CH = { Em: [52, 55, 59, 63], C: [48, 52, 55, 59], Asdim: [46, 49, 52, 58], B7: [47, 51, 54, 57] };
const ROOT = { Em: 40, C: 36, Asdim: 46, B7: 35 };
const PROG = ['Em', 'Em', 'C', 'B7', 'Em', 'Asdim', 'B7', 'Em'];
const cauldron = (c, { v = 1 } = {}) => [
  ...[0, 7, 0, 7, 0, 3, 6].map((x, k) => E('pizz', k, 1, ROOT[c] + 12 + x, (k === 0 || k === 2 || k === 4 ? 0.4 : 0.26) * v)),
  E('moog', 0, 2, ROOT[c], 0.4 * v, { cutoff: 900, res: 8 }), E('moog', 2, 2, ROOT[c], 0.32 * v, { cutoff: 900, res: 8 }), E('moog', 4, 3, ROOT[c] - 1, 0.36 * v, { cutoff: 1100, res: 8 }),
  E('tabla', 0, 1, null, 0.45 * v, { stroke: 'dha', m: 64 }), E('tabla', 2, 1, null, 0.32 * v, { stroke: 'na', m: 64 }), E('tabla', 4, 1, null, 0.4 * v, { stroke: 'ge' }),
  E('tabla', 5, 1, null, 0.22 * v, { stroke: 'na', m: 64 }), E('tabla', 6, 1, null, 0.3 * v, { stroke: 'ka' }),
  ...[1.5, 3.3, 5.6].map((b, k) => E('bubble', b, 0.2, null, 0.12, { size: 0.7 + k * 0.4 })),
];
const SPELL = [
  () => HEX.map(([b, d, n], k) => E('theremin', b, d, n, 0.36, { from: k ? 0 : -5 })),
  () => [E('theremin', 0, 3, 79, 0.34), E('theremin', 3, 4, 76, 0.34, { from: 3, glide: 0.3 })],
  () => [[0, 2, 72], [2, 2, 76], [4, 3, 79]].map(([b, d, n]) => E('theremin', b, d, n, 0.34)),
  () => [E('theremin', 0, 4, 78, 0.34, { from: 5, glide: 0.4 }), E('theremin', 4, 3, 75, 0.32)],
  () => HEX.map(([b, d, n]) => E('theremin', b, d, n, 0.36)),
  () => [[0, 2, 82], [2, 2, 79], [4, 3, 76]].map(([b, d, n]) => E('theremin', b, d, n, 0.34)),
  () => [[0, 2, 75], [2, 2, 78], [4, 3, 81]].map(([b, d, n]) => E('theremin', b, d, n, 0.34)),
  () => [E('theremin', 0, 7, 76, 0.34, { vib: 0.04 })],
];

export const WITCH = {
  title: 'Hex and Kettle', root: 64, bpm: 220, beats: 7, arrange: true, loopFrom: 1,
  sections: [
    { id: 'brew', bars: 4, gain: 1.3, bar: (i) => [...cauldron(PROG[i], { v: 0.7 + i * 0.1 }), ...(i === 3 ? [E('celesta', 5, 1, 88, 0.15), E('celesta', 6, 1, 82, 0.15)] : [])] },
    { id: 'hex', bars: 8, gain: 1.3, bar: (i) => [...cauldron(PROG[i]), ...SPELL[i](), ...(i % 4 === 0 ? [E('pad', 0, 14, CH[PROG[i]].map((n) => n + 12), 0.05, { cutoff: 1100 })] : [])] },
    // the coven: the fiddle takes the hex with the tritone against it, the choir hums, the theremin swoops over
    { id: 'coven', bars: 8, gain: 1.35, bar: (i) => {
      const ev = [...cauldron(PROG[i], { v: 1.1 }), E('hum', 0, 6.5, CH[PROG[i]].slice(0, 3).map((n) => n + 12), 0.2, { attack: 0.4 })];
      if (i % 2 === 0) ev.push(...HEX.flatMap(([b, d, n]) => [E('fiddle', b, d, n - 12, 0.32, { pan: 0.3 }), E('fiddle', b, d, n - 18, 0.2, { pan: 0.3 })]));
      else ev.push(E('theremin', 0, 3, 87, 0.3, { from: -12, glide: 0.6 }), E('theremin', 3, 4, 82, 0.3, { from: 2, glide: 0.25 }));
      if (i === 7) ev.push(E('bell', 0, 1, 76, 0.2), E('celesta', 4, 1, 82, 0.15));
      return ev;
    } },
  ],
};
