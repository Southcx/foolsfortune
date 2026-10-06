// ---------------------------------------------------------------------------------------
// THE EMOCEAN STAGE'S CUE: "Crude Sea", the music of one hop across the Emocean (docs/plans/SLICE.md, E4), a rail of 150 seconds that is
// paced to it (Rez: the stage and its cue are one thing). 100 bars at 160 bpm, a bar 1.5 s, so the stage's fraction is simply the bar
// over 100 and every wave of src/progress/econ/emocean.js STAGE lands on a bar line:
//   LAUNCH    0 to 9     the calm opening: the sloop leaves the pier; a pad and a Rhodes, the sea's whale far off, a pulse finding itself
//   SCHOOLS   9 to 26    the first schools: four on the floor, a rolling Moog, a koto arpeggio; from 17 the sax sails the Answer
//   PINCER    26 to 36   from both sides (26): the supersaw opens, brass stabs on the off-beats, the Answer an octave up
//   DARTERS   36 to 50   the first things to dodge (36, 44): a two-step break, the growl's wobble, darters whooshing past
//   BREATHER  50 to 62   no drums: the choir holds the Tear (F to E), the whale sings, bubbles; a pulse builds back under the last bars
//   PUSH      62 to 84   the mixed push (62, 68, 74): everything, the sax on the Answer, then the brass shouting the Five
//   HEAVY     84 to 96   the heavy and its escort (84, 86): half time, taiko under the kick, in three phrases: the Five as a war cry
//                        answered by the lead guitar, the pursuit (four on the floor, the brass in canon), the turn home (B major)
//   ARRIVE    96 to 100  Margarite in sight: E major, a harp up two octaves, a bell; it ends (the stage is done when its cue is)
// E minor, the game's key, over Em C D Bm (the trance's lift, the anime's ache), the Emocean's fusion: a trance groove under space jazz.
// Over it, the owner's ear (docs/OST.md section 6; the A/B of 2026-10-06, which the owner chose, "significantly better"): air on top (a
// shimmer, crisp hats and their rolls), a clean tapped guitar answering the koto from the other side, an 808 under the heavy that
// slides between the roots, and three holes (a beat of silence and a reversed swell: into the darters, into the heavy, in its middle).
// The sax's answer to the Answer (its sixth and seventh notes) varies each time round, and the arpeggios turn over every other phrase
// (the owner: "the whole song is pretty repetitive").
//
// Prior art: Rez (Mizuguchi: the stage paced by the music, waves on its bars), the trance of the late nineties (four on the floor, the
// rolling off-beat bass, the supersaw's lift, the breakdown and the build), drum and bass's two-step at 160, Panzer Dragoon's sea of
// choirs, Star Fox's on-rails pacing (a breather before the last push), future bass and trap (the shimmer, the hat rolls, the 808's
// slides, the drop's held breath), and this game's own motifs (the Answer, the Five, the Tear).
//
//   import { CRUDE_SEA, STAGE_BARS, stageAt, stageCue } from './emocean.js'   stageAt(game.music) -> the stage's fraction now (0..1, as heard), or null
//   stageCue(seconds) -> the cue played in that many seconds (the same hundred bars at another tempo: a sloop's 120 s is 200 bpm)
//   when the cue is not playing (music/choose.js plays it while game.emocean.stage.active; the rail and the waves follow this)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
export const STAGE_BARS = 100;
const CH = ['Em', 'C', 'D', 'Bm'];
const ROOT = { Em: 40, C: 36, D: 38, Bm: 47, E: 40, Am: 45, B: 47 };
const TRI = { Em: [64, 67, 71], C: [64, 67, 72], D: [62, 66, 69], Bm: [62, 66, 71], E: [64, 68, 71], B: [63, 66, 71] };
const chordOf = (bar) => CH[bar % 4];

// ---- the parts
const four = (v = 1, { clap = true } = {}) => [...[0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.85 * v)), ...(clap ? [1, 3].map((b) => E('clap', b, 1, null, 0.4 * v)) : []),
  ...[0.5, 1.5, 2.5, 3.5].map((b) => E('hat', b, 0.5, null, 0.18 * v, true)), ...[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((b) => E('hat', b, 0.25, null, 0.06 * v))];
const twostep = (v = 1) => [E('kick', 0, 1, null, 0.9 * v), E('kick', 2.5, 1, null, 0.7 * v), E('snare', 1, 1, null, 0.6 * v), E('snare', 3, 1, null, 0.65 * v),
  ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('hat', b, 0.5, null, (k % 2 ? 0.08 : 0.14) * v)), E('snare', 3.75, 0.25, null, 0.2 * v)];
const halftime = (v = 1) => [E('kick', 0, 1, null, 0.95 * v), E('taiko', 0, 1, null, 0.5 * v, { size: 1.2 }), E('snare', 2, 1, null, 0.75 * v), E('kick', 1.5, 1, null, 0.5 * v),
  E('taiko', 3, 1, null, 0.3 * v), ...[0, 1, 2, 3].map((b) => E('hat', b + 0.5, 0.5, null, 0.12 * v, true))];
const roll = (c, v = 0.45) => [0.5, 1.5, 2.5, 3.5].flatMap((b) => [E('moog', b, 0.45, ROOT[c], v, { cutoff: 900 }), E('moog', b + 0.25, 0.2, ROOT[c] + 12, v * 0.5, { cutoff: 1400 })]); // (the off-beat roll)
const arp = (c, v = 0.2, bar = 0) => { const t = TRI[c], up = [t[0], t[1], t[2], t[0] + 12], P = (bar >> 2) % 2 ? [3, 2, 1, 0, 1, 2] : [0, 1, 2, 3, 2, 1]; // (up, or down every other phrase)
  return [...Array(16)].map((_, k) => E('koto', k * 0.25, 0.3, up[P[k % 6]] + 12, k % 4 ? v * 0.7 : v)); };
const pad = (c, v = 0.1) => [E('supersaw', 0, 4, TRI[c], v, { cutoff: 2400 })];
const keys = (c, v = 0.25) => TRI[c].map((n) => E('rhodes', 0, 3.8, n - 12, v));
const fill = (v = 0.6) => [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((b, k) => E('snare', b, 0.25, null, v * (0.5 + k * 0.07)));
// the answer to the Answer: the phrase's sixth and seventh notes, D and B the first time, then varied with the chord under them (the owner)
const REPLY = { C: [[[0, 2, 74], [2, 2, 71]], [[0, 2, 76], [2, 2, 79]], [[0, 1.5, 79], [1.5, 2.5, 78]]], // (D B; E G, rising; G and the raised fourth)
  Bm: [[[0, 2, 74], [2, 2, 71]], [[0, 2, 78], [2, 2, 76]], [[0, 1.5, 81], [1.5, 2.5, 78]]] }; // (D B; F# E; up to A, down to F#)
const answer = (bar, n = 0, i = 'sax', up = 0, v = 0.36) => (bar % 2 === 0 ? quote(MOTIF.ANSWER, i, { up, v, at: 0 })
  : REPLY[chordOf(bar) === 'C' ? 'C' : 'Bm'][n % 3].map(([b, d, m], k) => E(i, b, d, m + up > 86 ? m + up - 12 : m + up, v * (k ? 0.8 : 0.9)))); // (never above D6: no squeal)
const five = (i = 'brass', up = -12, v = 0.34) => quote(MOTIF.FIVE, i, { up, v, x: 0.8 }); // (five falling notes in a bar: 0.8 a beat)
const swoop = (b, v = 0.3, dir = 1) => E('whoosh', b, 1.5, null, v, { from: -0.9 * dir, to: 0.9 * dir }); // (a darter going by, side to side)

// the heavy: twelve bars in three phrases after the drop, so it never says the same bar twice in a row (the owner: "more variance
// after the first bar"). The war cry (0 to 3): the Five in the low brass, answered by the rock rig's lead guitar (the overture's);
// the pursuit (4 to 7): the kick goes four to the floor under the half time, the brass in canon, the hole and the dive at 5, a bar of
// toms and choir after it, the gang's "hey!"; the turn home (8 to 11): the choir sings the Five, the lead holds and bends, and the last
// bar's chord is B major (Bm's third raised), the dominant that pulls into the arrival's E major.
const heavyChord = (i) => (i === 11 ? 'B' : chordOf(i));
const ride = (v = 0.3) => [0, 1, 2, 3].map((b) => E('ride', b, 1, null, v));
const toms = (v = 0.6) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('tom', b, 0.5, null, v * (0.7 + k * 0.05), { pitch: 210 - k * 18 }));
const heavy = (i) => {
  const c = heavyChord(i), phrase = i >> 2, rate = [2, 3, 4][phrase];
  const drums = phrase === 1 && i !== 6 ? [...halftime(), ...[1, 3].map((b) => E('kick', b, 1, null, 0.6)), ...ride(0.28)] : i === 6 ? toms() : halftime();
  const bass = i === 6 ? [] : [E('growl', 0, 4, ROOT[c] + 12, 0.34, { rate })];
  const tune = phrase === 0 ? (i === 0 || i === 2 ? five('brass', i ? 0 : -12, 0.34) // (the war cry, then the same an octave up)
    : i === 1 ? quote(MOTIF.ANSWER, 'shred', { v: 0.32, o: { pan: 0.15 } }).map((e, k) => (k === 4 ? { ...e, o: { ...e.o, bend: 2, bendAt: 0.4 } } : e)) // (the lead answers)
      : five('shred', 0, 0.3).map((e, k) => (k ? e : { ...e, o: { pinch: true } })))
    : phrase === 1 ? (i === 6 ? [E('voice', 0, 4, 64, 0.16, { vowel: 'o' }), E('voice', 0, 4, 59, 0.12, { vowel: 'o' })] // (after the hole: the choir alone over the toms)
      : [...five('brass', -12, 0.3), ...five('brass', 0, 0.24).map((e) => ({ ...e, b: e.b + 0.8 }))]) // (the Five in canon, a note behind)
      : i === 8 ? [...five('voice', 0, 0.2).map((e) => ({ ...e, o: { vowel: 'a' } })), ...five('brass', -12, 0.28), E('shred', 0, 4, 76, 0.3, { bend: 2, bendAt: 0.5, vib: 0.04 })]
        : i === 9 ? [...five('voice', 0, 0.2).map((e) => ({ ...e, o: { vowel: 'a' } })), E('shred', 0, 4, 78, 0.3, { bend: -2, bendAt: 0.5, vib: 0.04 })]
          : i === 10 ? [...quote(MOTIF.ANSWER, 'shred', { v: 0.3 }), ...toms(0.4).filter((e) => e.b >= 2)]
            : TRI.B.map((n) => E('brass', 0, 3, n - 12, 0.26)).concat(fill(0.8)); // (B major: home is next)
  return [...drums, ...bass, ...tune, ...pad(c, 0.12), ...(i === 6 ? [] : [E('voice', 0, 4, TRI[c][0], 0.12, { vowel: 'a' })]),
    ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.5), E('impact', 0, 1, null, 0.35)] : []), ...(i === 7 || i === 8 ? [E('gang', 1, 1, null, 0.4), E('gang', 3, 1, null, 0.45)] : [])];
};
const BASE = {
  title: 'Crude Sea', root: 64, bpm: 160, arrange: true, loopFrom: null, tail: 4,
  sections: [
    { id: 'launch', bars: 9, gain: 2.9, bar: (i) => { const c = chordOf(i), j = i - 1; return [...keys(c, 0.22), ...(i % 4 === 0 && i < 8 ? [E('pad', 0, 16, TRI.Em.map((n) => n - 12), 0.08, { cutoff: 900 })] : []),
      ...(i === 0 ? [E('whale', 0, 8, 52, 0.18, { to: 47 })] : []), ...(j >= 4 ? [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.12 * (j - 3))) : []),
      ...(j >= 2 ? [0.5, 1.5, 2.5, 3.5].map((b) => E('hat', b, 0.5, null, 0.05 + 0.01 * j)) : []), ...(j === 6 ? [E('riser', 0, 8, null, 0.25)] : [])]; } }, // (a bar longer than first written: the owner)
    { id: 'schools', bars: 17, gain: 2, bar: (i) => { const c = chordOf(i); return [...four(i < 2 ? 0.8 : 1), ...roll(c), ...arp(c, 0.2, i), ...keys(c, 0.12),
      ...(i === 0 || i === 8 ? [E('crash', 0, 1, null, 0.4)] : []), ...(i >= 8 ? answer(i, (i - 8) >> 1, 'sax') : []), ...(i === 16 ? fill() : [])]; } },
    { id: 'pincer', bars: 10, gain: 2.25, bar: (i) => { const c = chordOf(i); return [...four(), ...roll(c, 0.5), ...arp(c, 0.22, i), ...pad(c),
      ...[0.5, 1.5, 2.5, 3.5].map((b) => E('brass', b, 0.3, TRI[c][2], 0.14, { stab: true })), ...answer(i, (i >> 1) + 1, 'sax', 12, 0.34),
      ...(i === 0 ? [E('crash', 0, 1, null, 0.45)] : []), ...(i === 9 ? [...fill(0.7), E('riser', 0, 4, null, 0.2)] : [])]; } },
    { id: 'darters', bars: 14, gain: 2.6, bar: (i) => { const c = chordOf(i); return [...twostep(), E('growl', 0, 4, ROOT[c], 0.32, { rate: 4 }), ...arp(c, 0.18, i),
      ...(i % 2 ? [swoop(1), swoop(3, 0.3, -1)] : [swoop(2, 0.3, (i >> 1) % 2 ? -1 : 1)]), ...(i === 0 || i === 8 ? [E('crash', 0, 1, null, 0.45), E('impact', 0, 1, null, 0.3)] : []), ...(i === 13 ? fill(0.6) : [])]; } },
    { id: 'breather', bars: 12, gain: 3.1, bar: (i) => { const c = chordOf(i); return [...keys(c, 0.2), E('pad', 0, 4.2, TRI[c].map((n) => n - 12), 0.07, { cutoff: 1100 }),
      ...(i % 4 === 0 ? [E('voice', 0, 6, 65, 0.16, { vowel: 'o' }), E('voice', 6, 10, 64, 0.16, { vowel: 'o' })] : []), // (the Tear, held by the choir)
      ...(i === 2 || i === 7 ? [E('whale', 0, 6, 59, 0.2, { to: 52 })] : []), ...[0.5, 2.25, 3.1].map((b) => E('bubble', b + (i % 3) * 0.2, 1, null, 0.12, { size: 1 + (i % 4) * 0.3 })),
      ...(i >= 9 ? [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.2 * (i - 8))) : []), ...(i === 10 ? [E('riser', 0, 8, null, 0.3)] : [])]; } },
    { id: 'push', bars: 22, gain: 2.3, bar: (i) => { const c = chordOf(i); return [...four(1.05), ...roll(c, 0.5), ...arp(c, 0.22, i), ...pad(c, 0.12),
      ...(i < 12 ? answer(i, (i >> 1) + 2, 'sax', 12, 0.36) : five('brass', 0, 0.3)), ...(i >= 6 && i < 12 && i % 2 ? [swoop(2.5)] : []), // (the darters at 68)
      ...(i === 0 || i === 6 || i === 12 ? [E('crash', 0, 1, null, 0.5)] : []), ...(i === 21 ? [...fill(0.8), E('riser', 0, 4, null, 0.3)] : [])]; } },
    { id: 'heavy', bars: 12, gain: 2.7, chord: heavyChord, bar: (i) => heavy(i) },
    { id: 'arrive', bars: 4, gain: 3.6, bar: (i) => (i === 0
      ? [E('crash', 0, 1, null, 0.5), E('kick', 0, 1, null, 0.8), E('supersaw', 0, 16, TRI.E, 0.12, { cutoff: 2000 }), E('strings', 0, 16, [40, 52, 56, 59, 64, 68], 0.12, { attack: 0.3 }),
        ...[64, 66, 68, 71, 73, 76, 78, 80, 83, 85, 88].map((n, k) => E('harp', k * 0.18, 2, n, 0.26)), E('bell', 2, 1, 88, 0.25), E('sax', 2, 6, 76, 0.32)]
      : i === 2 ? [E('bell', 0, 1, 83, 0.18), E('rhodes', 0, 8, 56, 0.2), E('rhodes', 0, 8, 64, 0.2)] : []) },
  ],
};

/** Where the stage is, as heard: the fraction of its hundred bars that have sounded (0..1), read off the arranger playing CRUDE_SEA, or null. */
export function stageAt(music) {
  const A = music?.arr;
  if (!A?.alive || (A.score !== CRUDE_SEA && A.score?.of !== CRUDE_SEA)) return null;
  if (A.ended) return 1;
  let bars = A.bar; for (let k = 0; k < A.section; k++) bars += A.score.sections[k].bars; // (the next bar to be laid out, at A.next)
  const ahead = (A.next - A.ctx.currentTime) / (A.spb * 4);
  return Math.max(0, Math.min(1, (bars - ahead) / STAGE_BARS));
}

/** The cue fitted to a stage of `seconds` (hop()'s, by the ship): the same hundred bars at the tempo that fills it (made once a length,
 *  so music/choose.js sees the same score every frame). 150 s is the cue as written; a quicker ship's is faster, a slower one's broader. */
const FITTED = new Map();
export function stageCue(seconds = 150) {
  const bpm = Math.round(160 * 150 / Math.max(60, seconds));
  if (bpm === 160) return CRUDE_SEA;
  if (!FITTED.has(bpm)) FITTED.set(bpm, { ...CRUDE_SEA, bpm, of: CRUDE_SEA });
  return FITTED.get(bpm);
}

// ---- the owner's ear, laid over the score (layers and texture, not a rescoring: the owner, 2026-10-06)
const V = { Em: [64, 67, 71, 74, 78], C: [60, 64, 67, 71, 78], D: [62, 66, 69, 71, 76], Bm: [59, 62, 66, 69, 76] }; // (Em9, Cmaj7#11, D6/9, Bm11)
const TAP = [[0, 2, 4, 1, 3, 4, 2, 0, 1, 3, 4, 2, 4, 3, 1, 2], [4, 2, 0, 3, 1, 0, 2, 4, 3, 1, 0, 2, 0, 1, 3, 2]]; // (climbing, then its mirror every other phrase)
const twinkle = (c, v = 0.2, bar = 0) => TAP[(bar >> 2) % 2].map((p, n) => E('twinkle', n * 0.25, 0.5, V[c][p] + (n >= 8 && p < 2 ? 12 : 0), v * (n % 4 ? 0.75 : 1)));
const sparkle = (c, v = 0.2) => [E('shimmer', 0, 4, TRI[c], v)];
const ticks = (i, k = 1, rolls = false) => [...Array(rolls && i % 2 ? 12 : 16)].map((_, n) => E('tick', n * 0.25, 0.25, null, (n % 4 === 0 ? 0.32 : n % 2 ? 0.14 : 0.22) * k))
  .concat(rolls && i % 2 ? [3, 3.25, 3.5, 3.75].map((b, n) => E('tick', b, 0.25, null, (0.14 + n * 0.02) * k)) : []); // (an even roll, not a fizz)
const ohats = (v = 0.18) => [0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, v));
const trap = (i) => [...[0, 0.5, 1, 2, 2.5, 3].map((b) => E('tick', b, 0.5, null, b % 1 ? 0.18 : 0.26)), ...[1.5, 1.667, 1.833].map((b, n) => E('tick', b, 0.17, null, 0.14 + n * 0.04)),
  ...(i % 2 ? [3.5, 3.625, 3.75, 3.875].map((b, n) => E('tick', b, 0.125, null, 0.14 + n * 0.05)) : [E('tick', 3.5, 0.5, null, 0.2)])];
const low = (c) => ROOT[c] - (ROOT[c] > 42 ? 12 : 0); // (the 808's root, E1 to E2)
const eights = (i, ch = chordOf) => { const c = ch(i), r = low(c), p = low(ch(i + 3)); return [E('eight', 0, 1.5, r, 0.55, { from: p - r, glide: 0.12 }), E('eight', 2.5, 1, r, 0.4),
  ...(i % 2 ? [E('eight', 3.5, 0.5, r + 12, 0.3, { from: -12, glide: 0.1 })] : [])]; };
/** A bar cut off at beat `at` (what sounds is shortened to end there), then a reversed swell into the next bar's downbeat: the hole. */
const holed = (evs, at = 3) => [...evs.filter((e) => e.b < at).map((e) => ({ ...e, d: Math.min(e.d || 1, at - e.b) })), E('reverse', at, 4 - at, null, 0.4)];
const LAYERS = {
  launch: (i, c) => [...(i >= 3 ? sparkle(c, 0.05 + 0.01 * i) : []), ...(i >= 5 ? ticks(i, 0.3 + 0.15 * (i - 5)) : [])],
  schools: (i, c) => [...ticks(i), ...(i >= 8 ? ohats(0.14) : []), ...twinkle(c, i < 8 ? 0.2 : 0.16, i)],
  pincer: (i, c) => [...ticks(i, 1.1), ...ohats(), ...sparkle(c, 0.16), E('snap', 1, 1, null, 0.35), E('snap', 3, 1, null, 0.35)],
  darters: (i, c) => [...ticks(i, 0.9, true), ...sparkle(c, 0.1)], // (no guitar here: the darters have the air to themselves)
  breather: (i, c) => [...sparkle(c, 0.1), ...(i % 2 ? [] : [0, 1.5, 2.5].map((b, k) => E('twinkle', b, 2, V[c][[4, 2, 3][k]], 0.18)))],
  push: (i, c) => [...ticks(i, 1.1, i >= 12), ...ohats(0.16), ...twinkle(c, 0.15, i), ...sparkle(c, 0.16)],
  heavy: (i, c) => [...trap(i), ...(i === 6 ? [] : i === 5 ? [E('eight', 0, 1.5, low(c), 0.55), E('eight', 2, 1, low(c) - 12, 0.5, { from: 12, glide: 0.35 })] : eights(i, heavyChord)),
    ...sparkle(c, 0.14), ...(i >= 8 ? ohats(0.14) : [])],
  arrive: (i) => (i === 0 ? [E('shimmer', 0, 16, TRI.E, 0.12)] : []),
};
const HOLES = { pincer: 9, push: 21, heavy: 5 }; // (the bar of each that ends in a hole)
export const CRUDE_SEA = { ...BASE, sections: BASE.sections.map((s) => ({ ...s, bar: (i) => {
  const all = [...s.bar(i), ...(LAYERS[s.id]?.(i, (s.chord || chordOf)(i)) || [])];
  return HOLES[s.id] === i ? holed(all) : all;
} })) };
