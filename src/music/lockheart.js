// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S MUSIC: the cue under the Opening (tools/lockheart/ultimate.js), one for each of the Lockheart's modes (the coffin
// worn sets it: tools/lockheart/table.js HEARTS), and the chord it lands on. Every one of them is held together by a pedal E (the
// game's key) with something pressing against it that never quite breaks it: the Lockheart is power in a box, opened a crack.
//   SUMMONING   "Barely Bound": contained chaos. 7/8 at 138, stamped strings on E minor with a major seventh (the Augurs' stamping,
//               its accents moved round the bar), the harmony turning between E and F over the pedal (the Tear, F to E, made into
//               the whole floor: Phrygian), taiko on the uneven beats, an octatonic glitter of keys above, a choir on B and C. It lands
//               on E major: the thing let out, and on your side
//   CASTING     "Spellwheel" (the owner's "Magic"): a calmer, natural flow. 6/8, the harp running up and down E Lydian (the raised
//               fourth, A sharp, is the magic in it and the only thing not at rest), a flute singing long notes, water on the shaker
//   CONVERSION  "House Edge": casino jazz. Swung at 176, a walking bass, the ride and the hat's foot, a piano's Charleston comping
//               on Em9, A13, F#m7b5 and an altered B7, the sax on the hook, a muted brass stab pushing into each bar; it lands on the
//               jackpot (an E six-nine shouted by the brass, bells)
// Each cue opens with a bar for the invocation (the circle, the keys going in), then loops for as long as the wheel turns; when
// the wheel lands, its landing (LANDED) cuts in at once (`lead`, `fadeIn`, `cut`: arranger.js) and rings out under the outcome.
//
// Prior art: Stravinsky's "Augurs of Spring" (one stamped chord, the accents moving: barbarism held in a rhythm), the Phrygian
// floor of every Spanish and metal cadence, Messiaen's octatonic glitter, Uematsu's summon fanfares (Final Fantasy) and Shimomura's
// for Kingdom Hearts; the Lydian of film magic (John Williams's flying, Joe Hisaishi's skies); the casino's lounge band (the Rat Pack
// at the Sands, Persona 5's Casino), the tritone-substituted turnaround and the altered dominant; the slot machine's bells.
//
//   import { LOCK_CUES, LOCK_LANDED } from './lockheart.js'   LOCK_CUES[mode]   LOCK_LANDED[mode]   (music/choose.js picks them)
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const chord = (i, b, d, ns, v, o) => ns.map((n) => E(i, b, d, n, v, o)); // (an instrument that plays one note at a time, voiced)

// ---- SUMMONING: Barely Bound (7/8: 2+2+3)
const ST = [[52, 55, 59, 63], [53, 57, 60, 64], [52, 55, 59, 63], [47, 51, 54, 57, 60]]; // (Em(maj7), Fmaj7 over E, Em(maj7), B7b9: the floor stays E)
const ACC = [[0, 1, 2], [0, 1.5, 2.5], [0, 1, 2], [0.5, 1.5, 2.5]]; // (the accents, moved round the bar)
const OCT = [76, 77, 79, 80, 82, 83, 85, 86, 88]; // (E octatonic: half, whole, half...)
const stamp = (i, v = 1) => [...Array(7)].flatMap((_, k) => {
  const b = k * 0.5, acc = ACC[i].includes(b);
  return [E('strings', b, 0.4, ST[i], (acc ? 0.2 : 0.09) * v, { spic: true, attack: 0.005, bright: acc ? 4200 : 2400 }),
    ...(acc ? [E('taiko', b, 1, null, 0.26 * v, { size: b === 0 ? 1.1 : 0.85 })] : [])];
});
const keys = (i) => [...Array(7)].map((_, k) => E('celesta', k * 0.5 + 0.25, 0.25, OCT[(i * 3 + k * 2) % OCT.length], 0.12));
const SUMMONING = {
  title: 'Barely Bound', root: 64, bpm: 138, beats: 3.5, arrange: true, loopFrom: 1, moodless: true, lead: 0.03, fadeIn: 0.2, cut: true,
  sections: [
    { id: 'invoke', bars: 1, gain: 2.4, bar: () => [E('strings', 0, 3.5, [40, 41, 47], 0.1, { attack: 1.2 }), E('riser', 0, 3.5, null, 0.22), E('sub', 0, 3.5, 40, 0.12),
      E('voice', 1, 2.5, 71, 0.14, { vowel: 'o', from: -1 }), ...[0, 1, 2, 2.5, 3].map((b, k) => E('taiko', b, 1, null, 0.2 + k * 0.08, { size: 1.2 }))] },
    { id: 'bound', bars: 4, gain: 2.6, bar: (i) => [...stamp(i), ...keys(i),
      E('sub', 0, 3.5, 40, 0.1), E('hum', 0, 3.6, [52, 59], 0.1, { attack: 0.3 }),
      E('brass', 0, 1.5, 77, 0.22), E('brass', 1.5, 2, 76, 0.24), // (the Tear, every bar: F leaning on E, and held back)
      E('voice', 0, 3.5, i % 2 ? 72 : 71, 0.12, { vowel: 'o' }), ...(i === 3 ? [E('riser', 0, 3.5, null, 0.14), E('tom', 3, 0.5, null, 0.4, { pitch: 90 })] : [])] },
  ],
};
const SUMMONING_LANDED = {
  title: 'Barely Bound (let out)', root: 64, bpm: 138, arrange: true, loopFrom: null, tail: 4, lead: 0.02, fadeIn: 0.01, cut: true,
  sections: [{ id: 'out', bars: 1, gain: 2.4, bar: () => [E('impact', 0, 1, null, 0.6), E('taiko', 0, 1, null, 0.8, { size: 1.4 }), E('crash', 0, 1, null, 0.5), 
    E('brass', 0, 4, 64, 0.32), E('brass', 0, 4, 68, 0.28), E('brass', 0, 4, 71, 0.28), E('brass', 0, 4, 76, 0.3),
    E('strings', 0, 6, [40, 52, 56, 59, 64, 68, 71], 0.18, { attack: 0.02 }), E('voice', 0, 5, 68, 0.16, { vowel: 'a' }), E('voice', 0, 5, 76, 0.14, { vowel: 'a' }),
    E('bell', 0, 1, 88, 0.3), E('sub', 0, 4, 40, 0.15)] }],
};

// ---- CASTING: Spellwheel (6/8, a beat an eighth)
const CA = [[52, 56, 59, 63, 66, 70], [49, 56, 59, 64, 68, 71], [45, 52, 57, 61, 64, 68], [47, 54, 59, 61, 64, 66]]; // (Emaj9#11, C#m9, Amaj9, B6/9sus)
const flow = (i) => { const ch = CA[i], up = [...ch, ch[2] + 12, ch[3] + 12]; return [...Array(12)].map((_, k) => E('harp', k * 0.5, 1, up[k < 8 ? k : 14 - k], 0.24 - (k % 6 ? 0.06 : 0))); };
const CAST_MEL = [[[0, 4, 71], [4, 2, 70]], [[0, 6, 68]], [[0, 3, 69], [3, 3, 73]], [[0, 4, 71], [4, 2, 66]]];
const CASTING = {
  title: 'Spellwheel', root: 64, bpm: 216, beats: 6, arrange: true, loopFrom: 1, lead: 0.03, fadeIn: 0.3, cut: true, scale: [0, 4, 6, 7, 11], moodless: true,
  sections: [
    { id: 'invoke', bars: 1, gain: 5, bar: () => [...[52, 56, 59, 63, 66, 70, 71, 75, 78, 82].map((n, k) => E('harp', k * 0.5, 2, n, 0.22)), E('riser', 0, 6, null, 0.12),
      E('strings', 0, 6, [40, 47, 59], 0.07, { attack: 1 }), E('celesta', 5, 1, 82, 0.2)] },
    { id: 'wheel', bars: 4, gain: 2.5, bar: (i) => [...flow(i), ...CAST_MEL[i].map(([b, d, n]) => E('flute', b, d, n + 12, 0.24)),
      E('upright', 0, 3, CA[i][0] - 12, 0.2), E('upright', 3, 3, CA[i][0] - 5, 0.14), E('strings', 0, 6.2, CA[i].slice(1, 4), 0.06, { attack: 0.8 }),
      ...[0, 1, 2, 3, 4, 5].map((b) => E('shaker', b, 0.5, null, b % 3 ? 0.04 : 0.07)), ...(i % 2 ? [E('celesta', 4.5, 1, CA[i][5] + 12, 0.14)] : []),
      E('vibes', 0, 6, CA[i][4] + 12, 0.1)] },
  ],
};
const CASTING_LANDED = {
  title: 'Spellwheel (the spell)', root: 64, bpm: 216, beats: 6, arrange: true, loopFrom: null, tail: 4, lead: 0.02, fadeIn: 0.01, cut: true,
  sections: [{ id: 'spell', bars: 1, gain: 3.5, bar: () => [...[64, 66, 68, 70, 71, 75, 76, 78, 80, 82, 83, 87].map((n, k) => E('harp', k * 0.25, 2, n, 0.24)),
    ...[76, 80, 83].map((n, k) => E('bell', 1 + k * 0.5, 1, n, 0.22)), E('strings', 0, 9, [40, 52, 56, 59, 63, 66], 0.12, { attack: 0.1 }), E('flute', 1, 5, 83, 0.24), E('crash', 0, 1, null, 0.25),
    E('vibes', 0, 6, 68, 0.2), E('vibes', 0, 6, 75, 0.18)] }],
};

// ---- CONVERSION: House Edge (swung)
const SW = 0.66; // (the swing: the "and" late)
const CV = [{ r: 40, v: [62, 66, 67, 71] }, { r: 45, v: [61, 66, 67, 71] }, { r: 42, v: [60, 64, 66, 69] }, { r: 47, v: [63, 67, 69, 72] }]; // (Em9, A13, F#m7b5, B7#9b13: rootless)
const WALK = [[40, 43, 45, 46], [45, 49, 52, 51], [42, 45, 48, 46], [47, 46, 45, 41]]; // (a quarter a beat, chromatic into each bar)
const HOOK = [[[0, SW, 71], [SW, 1 - SW, 74], [1, 1, 76], [2, SW, 79], [2 + SW, 1.34, 78]], [[0.66, 0.34, 76], [1, 0.66, 73], [1.66, 1.34, 71], [3, 1, 69]],
  [[0, 1, 72], [1, SW, 70], [1 + SW, 1 - SW, 69], [2, 2, 66]], [[0, 0.66, 75], [0.66, 0.34, 74], [1, 0.66, 72], [1.66, 0.34, 71], [2, 1.5, 70], [3.66, 0.34, 71]]];
const swing = () => [E('ride', 0, 1, null, 0.22), E('ride', 1, 1, null, 0.26), E('ride', 1 + SW, 0.34, null, 0.14), E('ride', 2, 1, null, 0.22), E('ride', 3, 1, null, 0.26), E('ride', 3 + SW, 0.34, null, 0.14),
  E('hat', 1, 0.5, null, 0.1), E('hat', 3, 0.5, null, 0.1), E('kick', 0, 1, null, 0.18), E('brush', 2 + SW, 0.3, null, 0.12)];
const CONVERSION = {
  title: 'House Edge', root: 64, bpm: 176, arrange: true, loopFrom: 1, moodless: true, lead: 0.03, fadeIn: 0.2, cut: true,
  sections: [
    { id: 'invoke', bars: 1, gain: 1.15, bar: () => [...[64, 67, 69, 70, 71, 74, 76, 79, 81, 82, 83, 86].map((n, k) => E('piano', k * 0.25, 0.4, n, 0.2)),
      ...[2, 2.5, 3, 3.25, 3.5, 3.75].map((b, k) => E('snare', b, 0.25, null, 0.2 + k * 0.06)), E('crash', 0, 1, null, 0.25), E('upright', 0, 2, 40, 0.4)] },
    { id: 'house', bars: 4, gain: 1.15, bar: (i) => [...WALK[i].map((n, k) => E('upright', k, 1, n, 0.45)), ...swing(),
      ...[0, 1.5].flatMap((b) => chord('piano', b, b ? 0.4 : 0.6, CV[i].v, 0.14)), // (the Charleston)
      ...HOOK[i].map(([b, d, n]) => E('sax', b, d, n, 0.32)), E('vibes', 2, 2, CV[i].v[3] + 12, 0.1),
      E('brass', 3 + SW, 0.5, CV[(i + 1) % 4].v[2] + 12, 0.18, { stab: true }), E('brass', 3 + SW, 0.5, CV[(i + 1) % 4].v[3] + 12, 0.16, { stab: true }),
      ...(i === 3 ? [E('bell', 3, 1, 88, 0.12)] : [])] },
  ],
};
const CONVERSION_LANDED = {
  title: 'House Edge (the jackpot)', root: 64, bpm: 176, arrange: true, loopFrom: null, tail: 4, lead: 0.02, fadeIn: 0.01, cut: true,
  sections: [{ id: 'jackpot', bars: 2, gain: 1.8, bar: (i) => (i === 0
    ? [...[64, 68, 71, 73, 78].map((n) => E('brass', 0, 3, n, 0.26, { stab: false })), E('crash', 0, 1, null, 0.45), E('kick', 0, 1, null, 0.5), E('upright', 0, 4, 40, 0.5),
      ...[0, 0.33, 0.66, 1, 1.33, 1.66].map((b, k) => E('bell', b, 1, [88, 91, 93, 88, 91, 93][k], 0.2)), // (the bells: ding ding ding)
      ...[64, 68, 71, 73, 76, 80, 83, 85, 88].map((n, k) => E('vibes', 1 + k * 0.125, 2, n, 0.16)), ...chord('piano', 0, 4, [52, 56, 61, 66], 0.2)]
    : [E('sax', 0, 3, 76, 0.3), E('brass', 0, 3, 64, 0.2), E('ride', 0, 1, null, 0.2)]) }],
};

export const LOCK_CUES = { summoning: SUMMONING, casting: CASTING, conversion: CONVERSION };
export const LOCK_LANDED = { summoning: SUMMONING_LANDED, casting: CASTING_LANDED, conversion: CONVERSION_LANDED };
