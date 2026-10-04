// ---------------------------------------------------------------------------------------
// THE OVERTURE: "Fortune Favours the Fool", the opening the title begins with. A JRPG anime opening played by a hair-metal band:
// tonally apart from everything else in the game (the soundtrack is space jazz and the world's folk; this is the one cue that is pure
// adrenaline), and then it hands on, on the bar line, into the title theme (music/title.js: then: TITLE), so the opening's last
// chord is still ringing when the kiln roars and the logo is struck.
//
// E minor (the title's key), 150 bpm, 4/4, TV size (about 80 seconds before the title takes it):
//   FUSE      a pinch-harmonic scream and a run up the pentatonic, the band's first hit, a fill round the toms
//   RIFF      the hook: the Fool's Step (A B C and up to E, the Courier's motif) as a riff over a palm-muted E, synth brass under it
//   VERSE     driving eighths, the lead singing the Five (E D B A G) where a voice would sing the verse
//   CLIMB     the pre-chorus: half time, open chords on Am and B, the lead climbing the Answer (G A B D E) to the leading tone
//   CHORUS    the "royal road" (C D Bm Em: the progression of a thousand anime openings), the Fool's Step as an anthem, a gang's "hey!"
//   SOLO      a pentatonic run, a bend, sequences in fours, tapped sextuplets on B, then twin leads in thirds (the Five and the
//             Answer harmonized) and a pinch harmonic dived two octaves into the break
//   BREAK     stop time: the band's hits, the gang, a drum fill
//   CHORUS 2  the anthem again, a wordless choir an octave under the lead, the kick doubled
//   ASCEND    the hand-off: the drums and guitars move to dotted quarters (three eighths at 150 is a quarter at 100), so the title's
//             tempo is felt a few bars before it arrives (a metric modulation)
//   HOLD      one bar at 100: the last chord struck and held, the lead's feedback on B, toms walking the new beat into the kiln's
//             taiko roll; the chord rings until the logo's strike and stops dead on it
//
// Prior art: the owner's three: B'z's "Into Free -Dangan-" (Tak Matsumoto's riff-driven hard rock, the stop-time hits), Steve Conte's
// "Stray" (Wolf's Rain: the anthem chorus over driving eighths) and Masahiko Arimachi's "Through the Night" (the eighties' night-drive
// gloss: synth brass and strings on a rock band); the 王道進行 ("royal road", IV V iii vi) of anime openings; Van Halen's tapping and
// Iron Maiden's twin leads; the metric modulation (Elliott Carter's, and every prog band's tempo pivot).
// ---------------------------------------------------------------------------------------
import { TITLE } from './title.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const ROOT = { Em: 40, E: 40, C: 48, D: 50, G: 43, Am: 45, A: 45, B: 47, Bm: 47 }; // (the guitar's power-chord roots)
const TRIAD = { C: [60, 64, 67], D: [62, 66, 69], Bm: [62, 66, 71], Em: [64, 67, 71], E: [64, 68, 71], Am: [60, 64, 69], B: [63, 66, 71], G: [62, 67, 71] };
const bassOf = (c) => ROOT[c] - 12;
const LOUD = 1.8; // (the band's level against the rest of the soundtrack: the chorus about -24 dB RMS, the title's music box -27)
const line = (rows, i = 'shred', v = 0.42, o = {}) => rows.map(([b, d, n, oo]) => E(i, b, d, n, v, { ...o, ...(oo || {}) }));
const PENT = [64, 67, 69, 71, 74, 76, 79, 81, 83, 86, 88]; // (E minor pentatonic, E4 up)
const MINOR = [52, 54, 55, 57, 59, 60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 81, 83, 84, 86, 88];
const third = (n) => { const k = MINOR.indexOf(n); return k < 0 ? n + 3 : MINOR[k + 2]; }; // (a diatonic third up: the twin lead)

// ---- the band's parts
const muted8 = (c, { open = [0], v = 0.5 } = {}) => [...Array(8)].map((_, k) => E('chug', k * 0.5, 0.5, ROOT[c], open.includes(k * 0.5) ? v : v * 0.8, { mute: !open.includes(k * 0.5) }));
const open8 = (c, v = 0.45) => [...Array(8)].map((_, k) => E('chug', k * 0.5, 0.5, ROOT[c], k % 2 ? v * 0.85 : v));
const bass8 = (c, v = 0.5) => [...Array(8)].map((_, k) => E('pick', k * 0.5, 0.45, bassOf(c), k % 2 ? v * 0.8 : v));
const hats = (v = 0.14, open = false) => [...Array(8)].map((_, k) => E('hat', k * 0.5, 0.5, null, k % 2 ? v * 0.7 : v, open && k % 2 === 0));
const drive = ({ v = 1, crash = false, dbl = false } = {}) => [
  ...[0, 1.5, 2.5].map((b) => E('bigkick', b, 1, null, 0.75 * v)), ...(dbl ? [0.5, 1, 2, 3, 3.5].map((b) => E('bigkick', b, 1, null, 0.4 * v)) : []),
  E('bigsnare', 1, 1, null, 0.7 * v), E('bigsnare', 3, 1, null, 0.75 * v), ...hats(0.14 * v, crash), ...(crash ? [E('crash', 0, 1, null, 0.45)] : []),
];
const half = ({ v = 1, crash = false } = {}) => [E('bigkick', 0, 1, null, 0.75 * v), E('bigkick', 2.5, 1, null, 0.5 * v), E('bigsnare', 2, 1, null, 0.75 * v),
  ...[0, 1, 2, 3].map((b) => E('hat', b, 1, null, 0.12 * v, true)), ...(crash ? [E('crash', 0, 1, null, 0.4)] : [])];
const fill = (from = 2, v = 0.6) => [...Array((4 - from) * 4)].map((_, k) => E('tom', from + k * 0.25, 0.25, null, v * (0.7 + 0.3 * (k / ((4 - from) * 4))), { pitch: [190, 160, 130, 100, 82][Math.floor(k / ((4 - from) * 4) * 5)] }));
const glossy = (c, v = 0.12) => [E('supersaw', 0, 4, TRIAD[c], v, { cutoff: 2600 })];

// ---- the tunes
const FUSE_LEAD = [[[0, 1.5, 64, { pinch: true, vib: 0.04 }], [1.5, 0.25, 67], [1.75, 0.25, 69], [2, 0.25, 71], [2.25, 0.25, 74], [2.5, 0.25, 76], [2.75, 0.25, 79], [3, 1, 81, { bend: 2, bendAt: 0.2 }]],
  [[0, 2, 83, { vib: 0.045 }]]];
const RIFF_CH = ['Em', 'C', 'Em', 'D'];
const RIFF = [
  [[0, 0.5, 64], [0.5, 0.5, 64], [1, 0.5, 69], [1.5, 0.5, 71], [2, 0.75, 72], [2.75, 0.25, 71], [3, 0.5, 69], [3.5, 0.5, 67]],
  [[0, 1.5, 76, { vib: 0.04 }], [1.5, 0.5, 74], [2, 0.5, 72], [2.5, 0.5, 71], [3, 0.5, 67], [3.5, 0.5, 69]],
  [[0, 0.5, 64], [0.5, 0.5, 64], [1, 0.5, 69], [1.5, 0.5, 71], [2, 0.75, 72], [2.75, 0.25, 71], [3, 0.5, 69], [3.5, 0.5, 67]],
  [[0, 0.5, 76], [0.5, 0.5, 79], [1, 1, 81, { from: -2 }], [2, 2, 83, { vib: 0.045 }]],
];
const VERSE_CH = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'];
const VERSE = [
  [[1, 0.5, 71], [1.5, 0.5, 71], [2, 0.5, 74], [2.5, 1.5, 76]],
  [[0, 0.5, 74], [0.5, 0.5, 71], [1, 1, 69], [2, 0.5, 67], [2.5, 1.5, 69]],
  [[1, 0.5, 72], [1.5, 0.5, 72], [2, 0.5, 71], [2.5, 0.5, 69], [3, 1, 67]],
  [[0, 1.5, 66], [1.5, 0.5, 67], [2, 2, 69, { bend: 2, bendAt: 0.5 }]],
  [[1, 0.5, 71], [1.5, 0.5, 71], [2, 0.5, 74], [2.5, 1.5, 76]],
  [[0, 0.5, 74], [0.5, 0.5, 76], [1, 1, 79], [2, 0.5, 76], [2.5, 1.5, 74]],
  [[0, 1, 72], [1, 1, 76], [2, 1.5, 79], [3.5, 0.5, 76]],
  [[0, 2, 75, { vib: 0.035 }], [2, 2, 71]],
];
const CLIMB_CH = ['Am', 'Am', 'B', 'B'];
const CLIMB = [[[0, 2, 67], [2, 2, 69]], [[0, 2, 71], [2, 2, 74]], [[0, 4, 75, { vib: 0.04 }]], [[0, 1, 78], [1, 1, 75], [2, 0.5, 71], [2.5, 0.5, 75], [3, 0.5, 78], [3.5, 0.5, 83, { pinch: true }]]];
const CHORUS_CH = ['C', 'D', 'Bm', 'Em', 'C', 'D', 'E', 'E'];
const CHORUS = [
  [[0, 0.5, 69], [0.5, 0.5, 71], [1, 1, 72], [2, 2, 76, { vib: 0.04 }]],
  [[0, 0.5, 74], [0.5, 0.5, 76], [1, 1, 78], [2, 1.5, 74], [3.5, 0.5, 72]],
  [[0, 1.5, 71], [1.5, 0.5, 74], [2, 1, 78], [3, 1, 76]],
  [[0, 3, 76, { vib: 0.045 }], [3, 0.5, 74], [3.5, 0.5, 76]],
  [[0, 0.5, 69], [0.5, 0.5, 71], [1, 1, 72], [2, 2, 76, { vib: 0.04 }]],
  [[0, 0.5, 74], [0.5, 0.5, 76], [1, 1, 78], [2, 2, 81, { vib: 0.045 }]],
  [[0, 2, 80], [2, 1, 76], [3, 1, 78]],
  [[0, 4, 76, { from: -2, vib: 0.05 }]],
];
const SOLO_CH = ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B'];
const run = (idx, at = 0, step = 0.25) => idx.map((k, j) => [at + j * step, step, PENT[k]]);
const TAP = [71, 75, 78, 83, 78, 75]; // (B major, tapped: the left hand's two, the right hand's one)
const SOLO = [
  run([0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 5, 6, 7, 8, 9]),
  [[0, 1.5, 83, { bend: 1, bendAt: 0.2, vib: 0.04 }], [1.5, 0.5, 81], [2, 1, 79, { bend: 2, bendAt: 0.3 }], [3, 1, 76]],
  run([9, 8, 7, 6, 8, 7, 6, 5, 7, 6, 5, 4, 6, 5, 4, 3]),
  [...Array(24)].map((_, j) => [j / 6, 1 / 6, TAP[j % 6] + (j >= 18 ? 12 : 0)]),
  [[0, 1, 76], [1, 1, 74], [2, 1, 71], [3, 1, 69]],
  [[0, 2, 67], [2, 0.5, 69], [2.5, 0.5, 71], [3, 1, 72]],
  [[0, 0.5, 69], [0.5, 0.5, 71], [1, 0.5, 72], [1.5, 0.5, 74], [2, 2, 76, { vib: 0.045 }]],
  [[0, 1, 78], [1, 1, 75]],
];
const TWIN = (i) => i >= 4 && i <= 7; // (the bars played by two)

export const OVERTURE = {
  title: 'Fortune Favours the Fool', root: 64, bpm: 150, arrange: true, loopFrom: null, then: TITLE,
  sections: [
    { id: 'fuse', bars: 2, gain: 1 * LOUD, bar: (i) => (i === 0
      ? [...line(FUSE_LEAD[0], 'shred', 0.44), E('riser', 0, 4, null, 0.12)]
      : [...line(FUSE_LEAD[1], 'shred', 0.44), E('chug', 0, 1.5, 40, 0.6), E('pick', 0, 1.5, 28, 0.6), E('bigkick', 0, 1, null, 0.9), E('crash', 0, 1, null, 0.5),
        E('bigsnare', 1, 1, null, 0.6), E('bigsnare', 1.5, 1, null, 0.6), ...fill(2, 0.6)]) },
    { id: 'riff', bars: 4, gain: 0.85 * LOUD, bar: (i) => [...muted8(RIFF_CH[i], { open: [0, 1.5] }), ...bass8(RIFF_CH[i]), ...drive({ crash: i === 0 }), ...line(RIFF[i]),
      ...line(RIFF[i], 'brass', 0.16, { pan: -0.2 }).map((e) => ({ ...e, n: e.n - 12 })), ...(i === 3 ? [E('gang', 3, 1, null, 0.5)] : [])] },
    { id: 'verse', bars: 8, gain: 0.75 * LOUD, bar: (i) => [...muted8(VERSE_CH[i]), ...bass8(VERSE_CH[i], 0.45), ...drive({ v: 0.9 }), ...line(VERSE[i], 'shred', 0.36, { verb: 0.3, echo: 0.2 }),
      ...(i >= 4 && i % 2 === 0 ? [E('strings', 0, 8, TRIAD[VERSE_CH[i]].map((n) => n - 12), 0.07, { attack: 1 })] : [])] },
    { id: 'climb', bars: 4, gain: 0.85 * LOUD, bar: (i) => [E('chug', 0, 4, ROOT[CLIMB_CH[i]], 0.5), E('pick', 0, 4, bassOf(CLIMB_CH[i]), 0.5), ...line(CLIMB[i], 'shred', 0.4),
      E('strings', 0, 4, TRIAD[CLIMB_CH[i]], 0.08, { attack: 0.8 }),
      ...(i < 3 ? half({ crash: i === 0 }) : [...[0, 0.5, 1, 1.5].map((b, k) => E('bigsnare', b, 0.5, null, 0.35 + k * 0.08)), ...[2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((b, k) => E('bigsnare', b, 0.25, null, 0.5 + k * 0.05)),
        E('riser', 0, 4, null, 0.2)])] },
    { id: 'chorus', bars: 8, gain: 1 * LOUD, bar: (i) => [...open8(CHORUS_CH[i]), ...bass8(CHORUS_CH[i]), ...drive({ crash: i % 4 === 0 }), ...glossy(CHORUS_CH[i]), ...line(CHORUS[i], 'shred', 0.44),
      ...(i % 4 === 3 ? [E('gang', 3.5, 1, null, 0.55)] : [])] },
    { id: 'solo', bars: 8, gain: 0.9 * LOUD, bar: (i) => [...(i % 2 ? open8(SOLO_CH[i], 0.4) : muted8(SOLO_CH[i], { open: [0, 2] })), ...bass8(SOLO_CH[i]), ...drive({ crash: i % 4 === 0 }),
      ...line(SOLO[i], 'shred', 0.42, TWIN(i) ? { pan: -0.35 } : {}),
      ...(TWIN(i) ? line(SOLO[i].map(([b, d, n, o]) => [b, d, third(n), o]), 'shred', 0.36, { pan: 0.35 }) : []),
      ...(i === 7 ? line([[2, 2, 83, { pinch: true, vib: 0.05, dive: 24 }]], 'shred', 0.46) : [])] },
    { id: 'break', bars: 2, gain: 1 * LOUD, bar: (i) => (i === 0
      ? [...[0, 0.75].flatMap((b) => [E('chug', b, 0.6, 40, 0.6), E('pick', b, 0.6, 28, 0.6), E('bigkick', b, 1, null, 0.85), E('bigsnare', b, 1, null, 0.6)]), E('crash', 0, 1, null, 0.5),
        E('gang', 2, 1, null, 0.6), E('chug', 2.5, 0.4, 40, 0.55, { mute: true }), E('chug', 3, 0.4, 40, 0.55, { mute: true }), E('gang', 3, 1, null, 0.6)]
      : [...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((b, k) => E('bigsnare', b, 0.25, null, 0.35 + k * 0.05)), ...fill(2, 0.7), E('bigkick', 0, 1, null, 0.7)]) },
    { id: 'chorus2', bars: 8, gain: 1.1 * LOUD, bar: (i) => [...open8(CHORUS_CH[i], 0.48), ...bass8(CHORUS_CH[i]), ...drive({ crash: i % 2 === 0, dbl: true }), ...glossy(CHORUS_CH[i], 0.14),
      ...line(CHORUS[i], 'shred', 0.46), ...line(CHORUS[i], 'voice', 0.2, { vowel: 'a', vib: 0.02 }).map((e) => ({ ...e, n: e.n - 12 })),
      ...(i % 4 === 3 ? [E('gang', 3.5, 1, null, 0.6)] : [])] },
    // the hand-off: dotted quarters at 150 (0.6 s apart) are the title's quarters at 100
    { id: 'ascend', bars: 4, gain: 1.1 * LOUD, bar: (i) => {
      const hits = [...Array(11)].map((_, k) => k * 1.5).filter((p) => p >= i * 4 && p < i * 4 + 4).map((p) => p - i * 4), c = ['C', 'D', 'Am', 'B'][i];
      return [...hits.flatMap((b, k) => [E('chug', b, 1.5, ROOT[c], 0.55), E('pick', b, 1.4, bassOf(c), 0.55), E('bigkick', b, 1, null, 0.8), ...(k % 2 ? [E('bigsnare', b, 1, null, 0.7)] : [E('crash', b, 1, null, 0.3)])]),
        ...line([[[0, 4, 71, { vib: 0.04 }]], [[0, 4, 74, { vib: 0.04 }]], [[0, 4, 76, { vib: 0.045 }]], [[0, 4, 78, { vib: 0.05 }]]][i], 'shred', 0.42),
        E('strings', 0, 4.2, TRIAD[c], 0.06 + i * 0.02, { attack: 1.2 }), ...glossy(c, 0.08 + i * 0.02), ...(i >= 2 ? [E('riser', 0, 4, null, 0.12 + (i - 2) * 0.1)] : [])];
    } },
    // one bar at 100: the last chord struck and held to the logo's strike (two bars on: the kiln's), toms walking the new beat
    { id: 'hold', bars: 1, bpm: 100, gain: 1.1 * LOUD, bar: () => [
      E('chug', 0, 8, 40, 0.6), E('pick', 0, 8, 28, 0.55), E('shred', 0, 8, 83, 0.4, { pinch: true, vib: 0.05 }), E('strings', 0, 8, [52, 59, 64, 67, 71], 0.1, { attack: 0.05 }),
      E('bigkick', 0, 1, null, 1), E('bigsnare', 0, 1, null, 0.8), E('crash', 0, 1, null, 0.6), E('gang', 0, 1, null, 0.6),
      ...[1, 2, 3].map((b, k) => E('tom', b, 1, null, 0.3 + k * 0.05, { pitch: 95 - k * 6 })),
    ] },
  ],
};
