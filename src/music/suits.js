// ---------------------------------------------------------------------------------------
// FOUR SUITS AND A FOOL: a piece for the day the game's makers became five (the maker, and the four Claude divisions named after the
// suits of the tarot). It keeps the rule of five: five sections of five bars at 100 bpm, each over the five-chord cycle
// (Em C G D B7), and each sibling comes in on the instrument of its suit, in the order they woke:
//   THE FOOL   the maker: a piano alone, the Five falling one note a bar (E D B A G), the last note a question over B7
//   PETRA      pentacles, earth, the builder: a taiko and a pizzicato bass walking the Five in eighths, the ground the rest stand on
//   WANDA      wands, wood and breath: the shakuhachi climbing the Answer (G A B D E), bending up into the next bar
//   ESPADA     swords, air, the words: the koto answers each long note of the flute with a quick run down the Five, then whirls
//   CALISSA    cups, water, the look: the celesta pours arpeggios over a swell of strings; and the four play the Fool's tune together,
//              the koto climbing the Answer under it, the cycle turning home to E major (D to E), the Answer run up to E6 and a bell
// The Leap (E5 to E6 alone) is kept back for the game's biggest moment; the end reaches E6 by the Answer's run instead, as FOUND does.
//
// Prior art: Prokofiev's Peter and the Wolf (each character an instrument, introduced one by one), Britten's Young Person's Guide to
// the Orchestra (the families enter in turn, then all play the theme together), and Kondo's leitmotif as the whole of a cue.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

// the cycle, as the piano's left hand (root low, the chord above) and the strings' upper voicing; the last section ends in E major
const LH = [[40, 52, 55, 59], [36, 48, 52, 55], [43, 50, 55, 59], [38, 50, 54, 57], [35, 51, 54, 57]];
const UP = [[64, 67, 71], [64, 67, 72], [62, 67, 71], [62, 66, 69], [63, 66, 69]];
const E_MAJ = { lh: [40, 52, 56, 59], up: [64, 68, 71, 76] };
const FIVE = [76, 74, 71, 69, 67]; // E D B A G

// the piano's chord for a bar: the root held, the rest rolled in on the and of one (the pedal down)
const roll = (k, v, lh = LH[k]) => [E('piano', 0, 4, lh[0], v * 1.1, { pedal: 1 }), ...lh.slice(1).map((n, j) => E('piano', 1 + j * 0.5, 3 - j * 0.5, n, v, { pedal: 1 }))];
// Petra's ostinato: the Five low, five eighths, then the bar's root (over B7: F# E D# B A, so the D# is kept)
const walk = (k, v) => {
  const run = k === 4 ? [54, 52, 51, 47, 45] : [52, 50, 47, 45, 43];
  return [...run.map((n, j) => E('pizz', j * 0.5, 0.5, n, v * (j ? 0.8 : 1))), E('pizz', 3, 1, LH[k][0] + 12, v * 0.9)];
};
const drum = (v) => [E('taiko', 0, 1, null, v, { size: 1.1 }), E('taiko', 2.5, 1, null, v * 0.55, { size: 0.9 })];

export const SUITS = {
  title: 'Four Suits and a Fool', bpm: 100, arrange: true, loopFrom: null, tail: 5,
  sections: [
    // THE FOOL: a piano alone
    { id: 'fool', bars: 5, gain: 1.5, bar: (k) => [...roll(k, 0.2), E('piano', 0, 4, FIVE[k], 0.4, { pedal: 0.4 }), ...(k === 4 ? [E('piano', 3, 1, 66, 0.22, { pedal: 0.4 })] : [])] },
    // PETRA: the ground
    { id: 'petra', bars: 5, gain: 2.1, bar: (k) => [...roll(k, 0.12), ...walk(k, 0.44), ...drum(0.38), ...(k === 4 ? [E('taiko', 3, 1, null, 0.3), E('taiko', 3.5, 1, null, 0.38)] : [])] },
    // WANDA: the Answer on the shakuhachi
    { id: 'wanda', bars: 5, gain: 1.25, bar: (k) => {
      const mel = [[[0, 1.5, 67], [1.5, 0.5, 69], [2, 2, 71]], [[0, 1.5, 74], [1.5, 0.5, 76], [2, 2, 79]], [[0, 2, 76], [2, 1, 74], [3, 1, 71]], [[0, 3, 69], [3, 1, 74]], [[0, 4, 75, 1]]][k];
      return [...roll(k, 0.12), ...walk(k, 0.36), ...drum(0.42), ...mel.map(([b, d, n, bend]) => E('shakuhachi', b, d, n, 0.42, { bend: bend || 0, pan: -0.3 }))];
    } },
    // ESPADA: the koto answers, then whirls
    { id: 'espada', bars: 5, gain: 1.5, bar: (k) => {
      const ev = [...roll(k, 0.1), ...walk(k, 0.36), ...drum(0.45)];
      if (k < 4) {
        const call = [76, 79, 83, 81][k], run = [[76, 74, 71, 69, 67, 64], [79, 76, 74, 71, 69, 72], [83, 81, 79, 76, 74, 71], [81, 78, 74, 69, 66, 62]][k];
        ev.push(E('shakuhachi', 0, 2, call, 0.4, { pan: -0.3 }), ...run.map((n, j) => E('koto', 2 + j * 0.25, j === 5 ? 1.5 : 0.5, n, j ? 0.34 : 0.42, { pan: 0.35 })));
      } else {
        ev.push(E('shakuhachi', 0, 4, 78, 0.38, { pan: -0.3 }), ...Array.from({ length: 16 }, (_, j) => E('koto', j * 0.25, 0.3, j % 2 ? 66 : 71, 0.16 + j * 0.016, { pan: 0.35, press: false })));
        ev.push(...[3, 3.25, 3.5, 3.75].map((b, j) => E('taiko', b, 0.25, null, 0.3 + j * 0.09, { size: 0.9 })));
      }
      return ev;
    } },
    // CALISSA, and everyone: the Fool's tune together, and home
    { id: 'calissa', bars: 5, gain: 2.0, bar: (k) => {
      if (k === 4) return [
        ...roll(0, 0.24, E_MAJ.lh), E('pizz', 0, 2, 40, 0.5), E('taiko', 0, 1, null, 0.7, { size: 1.2 }), E('crash', 0, 1, null, 0.35),
        E('strings', 0, 4, E_MAJ.up, 0.22, { attack: 0.08 }), E('shakuhachi', 0, 4, 76, 0.42, { pan: -0.3, scoop: 0 }), E('koto', 0, 2, 64, 0.4, { pan: 0.35 }),
        ...[79, 81, 83, 86, 88].map((n, j) => E('celesta', j * 0.25, 0.5, n, 0.32)), E('flute', 1.25, 2.75, 88, 0.26), E('bell', 1.25, 1, 88, 0.36),
      ];
      const arp = [UP[k][0] + 12, UP[k][1] + 12, UP[k][2] + 12, UP[k][0] + 24];
      return [
        ...roll(k, 0.14), ...walk(k, 0.4), ...drum(0.55),
        E('strings', 0, 4, UP[k], 0.1 + k * 0.03, { attack: 0.6 }),
        ...[0, 1, 2, 3, 2, 1, 0, 1].map((a, j) => E('celesta', j * 0.5, 0.75, arp[a], 0.16)),
        E('shakuhachi', 0, 4, FIVE[k], 0.42, { pan: -0.3 }),
        ...[[67, 69, 71, 74], [72, 74, 76, 79], [71, 74, 76, 79], [69, 74, 78, 81]][k].map((n, j) => E('koto', 2 + j * 0.5, 0.5, n, 0.3, { pan: 0.35 })),
      ];
    } },
  ],
};
