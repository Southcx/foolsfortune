// ---------------------------------------------------------------------------------------
// THE WINGS (a placeholder title): the cue in the wings of Strawman's Well (Dovina's world/strawmanwell/, docs/plans/STRAWMANS-WELL.md),
// the toy theatre inside Strawman's head, while you stand among its doors. Who it is for: Strawman, who never gets to play the lead,
// waiting for curtain-up with you. It opens on the pit tuning (an A held on the strings and the flute, open fifths plucked under it),
// then settles into a music-hall soft-shoe in 3/4 for a toy pit band: a piano's oom-pah-pah, the bass plucked, brushes on two and
// three, the tune on a celesta like a music box, a flute doubling it the second time round. A stage itself is left quiet, so the
// Pit's retries and a clear's sting have the room.
//   TUNE    four bars: the A, the fifths, a last plucked note and the hush before the band
//   WINGS   sixteen bars, looped: F, the C7 walk, F7 lifting to Bb, its minor's sigh (Bbm), home
//   ARENA   the same tune as a galop at 138 for the fighter stages' fights (Dovina's platform fighter): brass on the tune, the snare on
//           the off, a crash every eight bars; back to the soft-shoe on the bar line when the fight is over; the flat stage's a
//           fourth higher with a taiko on each downbeat and the brass doubled low (FIGHT_STAGES)
// Prior art: a pit orchestra tuning before the curtain (every theatre, and Fantasia's opening), the soft-shoe of the music hall and
// vaudeville, Paper Mario's stage shows, Puppeteer's theatre of the head.
//
//   import { WINGS, setWings, FIGHT_STAGES } from './wings.js'   (music/choose.js: the wings, and a fighter stage with setWings({ stage }))
// ---------------------------------------------------------------------------------------

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
// the chords, one a bar: [bass root, chord tones]
const F = [41, [57, 60, 65]], C7 = [36, [58, 60, 64]], F7 = [41, [57, 63, 65]], BB = [46, [58, 62, 65]], BBM = [46, [58, 61, 65]];
const PROG = [F, F, C7, C7, C7, C7, F, F, F, F7, BB, BBM, F, C7, F, F];
// the tune, a bar each: [beat, beats, midi] in F
const TUNE = [
  [[0, 1, 72], [1, 2, 69]], [[0, 1, 72], [1, 1, 74], [2, 1, 72]], [[0, 1, 70], [1, 2, 67]], [[0, 3, 64]],
  [[0, 1, 70], [1, 1, 72], [2, 1, 70]], [[0, 1, 67], [1, 2, 64]], [[0, 1, 65], [1, 1, 69], [2, 1, 72]], [[0, 3, 77]],
  [[0, 1, 77], [1, 1, 76], [2, 1, 75]], [[0, 2, 74], [2, 1, 75]], [[0, 1, 74], [1, 2, 70]], [[0, 1, 73], [1, 2, 70]],
  [[0, 1, 72], [1, 2, 69]], [[0, 1, 67], [1, 1, 70], [2, 1, 64]], [[0, 3, 65]], [],
];

const tuning = (i) => {
  const ev = [E('strings', 0, 3, [57, 69], i === 3 ? 0.05 : 0.09)]; if (i < 3) ev.push(E('flute', 0.5, 2.4, 69, 0.07));
  if (i < 3) [[50, 57], [43, 50], [55, 62]][i].forEach((n, k) => ev.push(E('pizz', 1 + k * 0.75, 0.5, n, 0.18, { pan: k ? 0.3 : -0.3 }))); // (open fifths, plucked)
  else ev.push(E('pizz', 2, 0.5, 48, 0.2)); // (a last pluck, the hush)
  return ev;
};

const band = (i) => {
  const k = i % 16, [root, ch] = PROG[k], ev = [];
  ev.push(E('pizz', 0, 0.8, root, 0.26), E('piano', 0, 0.9, root + 12, 0.1)); // (oom)
  for (const b of [1, 2]) ch.forEach((n) => ev.push(E('piano', b, 0.6, n, 0.06))); // (pah-pah)
  for (const b of [1, 2]) ev.push(E('brush', b, 0.8, null, 0.12));
  for (const [b, d, n] of TUNE[k]) {
    ev.push(E('celesta', b, d, n + 12, 0.16));
    if (i >= 16) ev.push(E('flute', b, d * 0.95, n, 0.07)); // (the flute doubling it the second time)
  }
  if (k === 15) [[0, 48], [1, 50], [2, 52]].forEach(([b, n]) => ev.push(E('pizz', b, 0.5, n, 0.2))); // (the turnaround: C D E up to F)
  return ev;
};

/** The platform fighter's stages (Dovina's, FIGHTER.md 5), each the galop in its own colour: the Arena's as written; the flat stage's
 *  (Final Destination's) a fourth higher, a taiko under each downbeat and the brass doubled an octave down, for the bare stage's grandeur.
 *  A stage not here is left quiet. */
export const FIGHT_STAGES = { arena: { up: 0 }, flatstage: { up: 5, taiko: true, low: true } };
/** A fight on (set by music/choose.js with the stage's id): the band strikes up its galop, in that stage's colour. */
const W = { arena: false, up: 0, taiko: false, low: false };
export function setWings({ stage = null, arena = false } = {}) {
  const F = FIGHT_STAGES[stage] || (arena ? FIGHT_STAGES.arena : null);
  W.arena = !!F; W.up = F?.up ?? 0; W.taiko = !!F?.taiko; W.low = !!F?.low;
}

// the Arena's galop: the same tune at a fighting pace, two bars of 2/4 a bar of the waltz, the brass on the tune, a snare on the off
const galop = (i) => {
  const k = Math.floor(i / 2) % 16, half = i % 2, [root, ch] = PROG[k], ev = [];
  const u = W.up;
  ev.push(E('pizz', 0, 0.5, (half ? root + 7 : root) + u, 0.3), E('kick', 0, 1, null, 0.3));
  if (W.taiko && !half) ev.push(E('taiko', 0, 1, null, 0.3)); // (the flat stage's downbeat)
  ev.push(E('snare', 1, 1, null, 0.2), E('hat', 0.5, 0.5, null, 0.08), E('hat', 1.5, 0.5, null, 0.08));
  ch.forEach((n) => ev.push(E('piano', 1, 0.4, n + u, 0.07)));
  for (const [b, d, n] of TUNE[k]) {
    const bb = b * (2 / 3) - half * 2; if (bb < 0 || bb >= 2) continue; // (the waltz's three beats squeezed into two bars of two)
    ev.push(E('brass', bb, Math.min(d * 0.66, 2 - bb), n + u, 0.12), E('celesta', bb, 0.4, n + 12 + u, 0.1));
    if (W.low) ev.push(E('brass', bb, Math.min(d * 0.66, 2 - bb), n + u - 12, 0.08)); // (doubled an octave down)
  }
  if (i % 8 === 7) ev.push(E('crash', 0, 1, null, 0.12));
  return ev;
};

export const WINGS = {
  title: 'The Wings', root: 65, bpm: 100, beats: 3, arrange: true, loopFrom: 1, moodless: true, fadeIn: 1.2, scale: [0, 2, 4, 7, 9],
  sections: [
    { id: 'tune', bars: 4, gain: 2, bar: (i) => tuning(i) },
    { id: 'wings', bars: 32, gain: 2, bar: (i) => band(i) },
    { id: 'arena', bars: 32, bpm: 138, beats: 2, gain: 2, bar: (i) => galop(i) },
  ],
  // the Arena's galop while a fight is on, the wings' soft-shoe again when it is over, each on the bar line (iMUSE's resequencing)
  jump: (section, bar) => (W.arena ? 2 : section === 0 ? null : section === 2 || bar >= 31 ? 1 : null),
};
