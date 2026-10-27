// ---------------------------------------------------------------------------------------
// OFF THE LANES (a placeholder title, Espada's to name): the open sea's cue (docs/plans/OPEN-SEA.md), the Emocean sailed at a free
// helm. A swell in 6/8, two long pulses a bar like a hull lifting and settling, keyed to E. The sea itself sets it:
//   - the square's COLUMN is its law, so it is the mode: Lydian by Margarite (Law), Ionian, Dorian in the middle (Anagami's, the
//     shanty's), Aeolian, Phrygian by Entropolis (Chaos). One tune, written in scale degrees, sung in whichever mode the bar is in, so
//     sailing east the same phrase darkens a step a column.
//   - the ROW off the lanes is how far from any shipping: the deck (bodhran, concertina) plays only on the lanes and one row off; two
//     rows out the cue opens into the deep (a drone, a whale's call, glass motes, the tune's head alone), Sunless Sea's rule: the
//     further from home, the stranger.
//   - DOUBT (lost, dead reckoning) frays the tune: notes drop out and slide in from below, and with two squares of doubt a theremin
//     wanders over it.
//   - MOORED at an islet: a music box (the celesta) plays the tune slowly over the harp; at a quay, the deck comes aboard.
// The night thins it and the weather's mood layer colours it, as every looping cue (music/player.js, mood.js).
//
// Prior art: The Legend of Zelda: The Wind Waker's "The Great Sea" (a broad 6/8 sailing tune under open sky); Sunless Sea (Maribel
// Hounslow's zone themes, quieter and stranger the further from London); iMUSE's horizontal resequencing (the section chosen at the bar
// line from what the game says); the church modes ordered bright to dark (Lydian to Phrygian), as music theory has taught them.
//
//   setSea({ law, off, doubt, moored, hunt, coiled })   OPEN_SEA (the score)   SEA_TOUR (the sound test's, once through)   SEA_MODES   seaMode(law)
// ---------------------------------------------------------------------------------------

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

/** The modes from Law to Chaos, bright to dark, each with its progression (scale degrees: I, its colour chord, ...) and its lead. */
export const SEA_MODES = [
  { id: 'lydian', steps: [0, 2, 4, 6, 7, 9, 11], prog: [0, 1, 0, 4], lead: 'flute' }, // (the raised fourth: Margarite's clear water)
  { id: 'ionian', steps: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 5, 4], lead: 'fiddle' },
  { id: 'dorian', steps: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 0, 6], lead: 'fiddle' }, // (the bright sixth: Anagami's, the shanty's)
  { id: 'aeolian', steps: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 2, 6], lead: 'shakuhachi' },
  { id: 'phrygian', steps: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 0, 6], lead: 'shakuhachi' }, // (the flat second: Entropolis's)
];
const SEA = { law: 0, off: 0, doubt: 0, moored: null, hunt: false, coiled: false };
/** What the open sea says, each frame (music/choose.js): `law` the square's (-2 Law .. +2 Chaos), `off` rows off the lane, `doubt` squares
 *  of it, `moored` 'islet' | 'quay' | null. */
export function setSea({ law = 0, off = 0, doubt = 0, moored = null, hunt = false, coiled = false } = {}) { SEA.law = law; SEA.off = off; SEA.doubt = doubt; SEA.moored = moored; SEA.hunt = hunt; SEA.coiled = coiled; }
/** The mode for a square's law (-2 .. +2). */
export const seaMode = (law = 0) => SEA_MODES[Math.max(0, Math.min(4, Math.round(law) + 2))];

const ROOT = 52; // (E3)
const note = (M, d, oct = 0) => ROOT + 12 * (oct + Math.floor(d / 7)) + M.steps[((d % 7) + 7) % 7];
const triad = (M, d, oct = 1) => [note(M, d, oct), note(M, d + 2, oct), note(M, d + 4, oct)];
// a deterministic flicker for a bar's choices (the same bar plays the same way), 0..1
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// the tune, in degrees above E4 (7 = E5): a broad call that climbs, settles, climbs higher and comes home. [eighth, length, degree]
const TUNE = [
  [[0, 3, 7], [3, 2, 9], [5, 1, 8]], [[0, 3, 7], [3, 3, 4]], [[0, 2, 5], [2, 1, 6], [3, 2, 7], [5, 1, 9]], [[0, 6, 8]],
  [[0, 3, 11], [3, 2, 9], [5, 1, 10]], [[0, 2, 9], [2, 1, 8], [3, 3, 7]], [[0, 2, 5], [2, 1, 4], [3, 2, 5], [5, 1, 6]], [[0, 6, 7]],
];

// the swell under everything: the bass on the two pulses, the harp rolling the chord up and back
const swell = (M, i, v = 1) => {
  const d = M.prog[i % 4], c = triad(M, d, 0);
  return [E('upright', 0, 3, note(M, d, -1), 0.42 * v), E('upright', 3, 3, note(M, d + 4, -1), 0.34 * v),
    ...[0, 1, 2, 3, 2, 1].map((k, j) => E('harp', j, 1.6, k === 3 ? c[0] + 12 : c[k], (j % 3 === 0 ? 0.3 : 0.22) * v, { pan: -0.2 + j * 0.08 }))];
};
// the deck, near the lanes: the bodhran on the pulses, the concertina breathing the chord
const deck = (M, i, busy = false) => [E('bodhran', 0, 1, null, 0.34), E('bodhran', 3, 1, null, 0.28), E('bodhran', 5, 1, null, 0.16, { rim: true }),
  ...(busy ? [E('bodhran', 2, 1, null, 0.14, { rim: true }), E('stomp', 0, 1, null, 0.3), E('stomp', 3, 1, null, 0.26)] : []),
  E('concertina', 1, 1.8, triad(M, M.prog[i % 4], 1), busy ? 0.24 : 0.16), E('concertina', 4, 1.8, triad(M, M.prog[i % 4], 1), busy ? 0.2 : 0.13)];
// the tune in the bar's mode, frayed by doubt: notes drop (a quarter a square, at most 60%) and slide in from below
const tune = (st, M, i, { lead = M.lead, v = 0.36, up = 0 } = {}) => TUNE[i % 8].flatMap(([b, d, deg], k) => {
  const lost = st.doubt > 0 && hash(i, k) < Math.min(0.6, st.doubt * 0.25), n = note(M, deg, 1) + up;
  if (lost && k > 0) return [];
  const o = lead === 'fiddle' ? { pan: 0.25, vib: 0.01, from: st.doubt > 0 ? -1 : 0 } : lead === 'flute' ? { pan: -0.1 } : lead === 'shakuhachi' ? { pan: -0.1, scoop: st.doubt > 0 ? 2 : 1 } : {};
  return [E(lead, b, d * 0.95, n, v, o)];
});
const wander = (st, M, i) => (st.doubt >= 2 && i % 2 === 0 ? [E('theremin', 1, 5, note(M, 4 + (i % 3), 1), 0.12, { from: -2, glide: 0.6 })] : []);

const deep = (M, i) => {
  const c = triad(M, 0, 1), ev = [E('pad', 0, 6, [note(M, 0, -1), note(M, 4, -1)], 0.32, { cutoff: 800 }), E('tanpura', 0, 6, note(M, 0, -1), 0.34)];
  if (i % 4 === 0) ev.push(E('whale', 1, 4, note(M, 4, 0), 0.3, { to: note(M, 0, 0) })); // (something large answering, far off)
  for (let k = 0; k < 3; k++) if (hash(i, k + 7) < 0.7) ev.push(E('celesta', Math.floor(hash(i, k + 3) * 6), 2, c[k] + 12, 0.22));
  if (i % 2 === 1) ev.push(E('voice', 0, 4, note(M, TUNE[i % 8][0][2], 1), 0.22, { vowel: 'o', from: -1 })); // (the tune's head alone)
  return ev;
};
const isletBar = (M, i) => [...swell(M, i, 0.6), ...TUNE[i % 8].map(([b, d, deg]) => E('celesta', b, d * 0.9, note(M, deg, 1) + 12, 0.34))];

// THE HUNT (a sea serpent turned on you: game.seaFight.serpent's brain hunting): the swell doubled into a gallop, the taiko and the bodhran on
// every pulse, a low brass ostinato on the mode's root and flat sixth (its colour), the tune's head stabbed on the fiddle; coiled, the
// brass holds a cluster and the strings tremble on a tritone while the hull is held
const hunt = (st, M, i) => {
  const c = M.prog[i % 4], r = note(M, c, -1), ev = [E('taiko', 0, 1, null, 0.6), E('taiko', 3, 1, null, 0.5), ...[1, 2, 4, 5].map((b) => E('bodhran', b, 1, null, 0.3)),
    E('upright', 0, 1.5, r, 0.5), E('upright', 3, 1.5, r, 0.45),
    ...[0, 1.5, 3, 4.5].map((b, k) => E('brass', b, 1.3, note(M, k % 2 ? c + 5 : c, 0), 0.16, { stab: true }))];
  if (st.coiled) ev.push(...[0, 1, 3].map((d) => E('brass', 0, 5.8, note(M, d, 0), 0.1)), E('strings', 0, 6, [note(M, 0, 1), note(M, 0, 1) + 6], 0.07, { attack: 0.1 })); // (the brass plays one note an event: a chord is three)
  else ev.push(...TUNE[i % 8].slice(0, 2).map(([b, d, deg]) => E('fiddle', b, d * 0.6, note(M, deg, 1), 0.3, { pan: 0.2, vib: 0.006 })));
  if (i % 4 === 3) ev.push(E('crash', 5, 1, null, 0.2), E('riser', 3, 3, null, 0.15));
  return ev;
};
const GROUP = { swell: 'open', tune: 'open', deep: 'deep', deepTune: 'deep', islet: 'islet', hunt: 'hunt' };
const NEXT = { swell: 'tune', tune: 'swell', deep: 'deepTune', deepTune: 'deep', islet: 'islet', hunt: 'hunt' };
const near = (st) => st.off <= 1;
/** The cue's five sections, read from a sea's state `st` ({ law, off, doubt, moored }) as each bar is laid. */
const seaSections = (st) => {
  const M = () => seaMode(st.law);
  return [
    { id: 'swell', bars: 4, gain: 1.2, bar: (i) => [...swell(M(), i), ...(near(st) ? deck(M(), i, st.moored === 'quay') : [])] },
    { id: 'tune', bars: 8, gain: 1.3, bar: (i) => [...swell(M(), i), ...(near(st) ? deck(M(), i, st.moored === 'quay') : []), ...tune(st, M(), i), ...wander(st, M(), i)] },
    { id: 'deep', bars: 4, gain: 1.6, bar: (i) => deep(M(), i) },
    { id: 'deepTune', bars: 8, gain: 1.6, bar: (i) => [...deep(M(), i), ...(i % 2 ? [] : tune(st, M(), i, { lead: 'voice', v: 0.22 })), ...wander(st, M(), i)] },
    { id: 'islet', bars: 8, gain: 1.3, bar: (i) => isletBar(M(), i) },
    { id: 'hunt', bars: 8, gain: 1.4, bpm: 186, bar: (i) => hunt(st, M(), i) },
  ];
};
const pentatonic = (law) => { const s = seaMode(law).steps; return [s[0], s[1], s[2], s[4], s[5]]; };

export const OPEN_SEA = {
  title: 'Off the Lanes', root: 64, bpm: 150, beats: 6, arrange: true, loopFrom: 0,
  get scale() { return pentatonic(SEA.law); }, // (the Crucibelle plays along in the square's mode: player.scale())
  sections: seaSections(SEA),
  // the sea chooses at the bar line: a change of group moves at once (the next bar line); within one, each section plays through
  jump(sec, bar) {
    const S = OPEN_SEA.sections, at = S[sec], w = SEA.hunt ? 'hunt' : SEA.moored === 'islet' ? 'islet' : SEA.off >= 2 ? 'deep' : 'open';
    if (GROUP[at.id] !== w) return S.findIndex((s) => GROUP[s.id] === w);
    if (bar < at.bars - 1) return null;
    return S.findIndex((s) => s.id === NEXT[at.id]);
  },
};

/** The sound test's tour of the open sea (once through): the tune by Margarite, in the middle at a quay, by Entropolis, then the deep
 *  three rows out and lost, then moored at an islet. Each stretch keeps its own state, so the live cue is never touched. */
const stretch = (st, ids) => seaSections(st).filter((s) => ids.includes(s.id)).map((s) => ({ ...s, id: `${st.name}:${s.id}` }));
export const SEA_TOUR = {
  title: 'Off the Lanes (a tour)', root: 64, bpm: 150, beats: 6, arrange: true, loopFrom: null, tail: 4, scale: pentatonic(0),
  sections: [
    ...stretch({ name: 'law', law: -2, off: 0, doubt: 0, moored: null }, ['tune']),
    ...stretch({ name: 'middle', law: 0, off: 1, doubt: 0, moored: 'quay' }, ['tune']),
    ...stretch({ name: 'chaos', law: 2, off: 1, doubt: 0, moored: null }, ['tune']),
    ...stretch({ name: 'lost', law: 1, off: 3, doubt: 2, moored: null }, ['deep', 'deepTune']),
    ...stretch({ name: 'islet', law: 0, off: 2, doubt: 0, moored: 'islet' }, ['islet']),
    ...stretch({ name: 'hunted', law: 1, off: 2, doubt: 0, moored: null, hunt: true }, ['hunt']),
  ],
};
