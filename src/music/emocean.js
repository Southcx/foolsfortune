// ---------------------------------------------------------------------------------------
// THE EMOCEAN STAGE'S CUE: "Crude Sea", the music of one hop across the Emocean (docs/plans/SLICE.md, E4), a rail of 150 seconds that is
// paced to it (Rez: the stage and its cue are one thing). 100 bars at 160 bpm, a bar 1.5 s, so the stage's fraction is simply the bar
// over 100 and every wave of src/progress/econ/emocean.js STAGE lands on a bar line:
//   LAUNCH    0 to 8     the calm opening: the sloop leaves the pier; a pad and a Rhodes, the sea's whale far off, a pulse finding itself
//   SCHOOLS   8 to 26    the first schools (8, 16): four on the floor, a rolling Moog, a koto arpeggio; from 16 the sax sails the Answer
//   PINCER    26 to 36   from both sides (26): the supersaw opens, brass stabs on the off-beats, the Answer an octave up
//   DARTERS   36 to 50   the first things to dodge (36, 44): a two-step break, the growl's wobble, the theremin swooping past
//   BREATHER  50 to 62   no drums: the choir holds the Tear (F to E), the whale sings, bubbles; a pulse builds back under the last bars
//   PUSH      62 to 84   the mixed push (62, 68, 74): everything, the sax on the Answer, then the brass shouting the Five
//   HEAVY     84 to 96   the heavy and its escort (84, 86): half time, taiko under the kick, the Five as a war cry in the low brass
//   ARRIVE    96 to 100  Margarite in sight: E major, a harp up two octaves, a bell; it ends (the stage is done when its cue is)
// E minor, the game's key, over Em C D Bm (the trance's lift, the anime's ache), the Emocean's fusion: a trance groove under space jazz.
//
// Prior art: Rez (Mizuguchi: the stage paced by the music, waves on its bars), the trance of the late nineties (four on the floor, the
// rolling off-beat bass, the supersaw's lift, the breakdown and the build), drum and bass's two-step at 160, Panzer Dragoon's sea of
// choirs, Star Fox's on-rails pacing (a breather before the last push), and this game's own motifs (the Answer, the Five, the Tear).
//
//   import { CRUDE_SEA, STAGE_BARS, stageAt } from './emocean.js'   stageAt(game.music) -> the stage's fraction now (0..1, as heard), or null
//   when the cue is not playing (music/choose.js plays it while game.emocean.stage.active; the rail and the waves follow this)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
export const STAGE_BARS = 100;
const CH = ['Em', 'C', 'D', 'Bm'];
const ROOT = { Em: 40, C: 36, D: 38, Bm: 47, E: 40, Am: 45, B: 47 };
const TRI = { Em: [64, 67, 71], C: [64, 67, 72], D: [62, 66, 69], Bm: [62, 66, 71], E: [64, 68, 71] };
const chordOf = (bar) => CH[bar % 4];

// ---- the parts
const four = (v = 1, { clap = true } = {}) => [...[0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.85 * v)), ...(clap ? [1, 3].map((b) => E('clap', b, 1, null, 0.4 * v)) : []),
  ...[0.5, 1.5, 2.5, 3.5].map((b) => E('hat', b, 0.5, null, 0.18 * v, true)), ...[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((b) => E('hat', b, 0.25, null, 0.06 * v))];
const twostep = (v = 1) => [E('kick', 0, 1, null, 0.9 * v), E('kick', 2.5, 1, null, 0.7 * v), E('snare', 1, 1, null, 0.6 * v), E('snare', 3, 1, null, 0.65 * v),
  ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('hat', b, 0.5, null, (k % 2 ? 0.08 : 0.14) * v)), E('snare', 3.75, 0.25, null, 0.2 * v)];
const halftime = (v = 1) => [E('kick', 0, 1, null, 0.95 * v), E('taiko', 0, 1, null, 0.5 * v, { size: 1.2 }), E('snare', 2, 1, null, 0.75 * v), E('kick', 1.5, 1, null, 0.5 * v),
  E('taiko', 3, 1, null, 0.3 * v), ...[0, 1, 2, 3].map((b) => E('hat', b + 0.5, 0.5, null, 0.12 * v, true))];
const roll = (c, v = 0.45) => [0.5, 1.5, 2.5, 3.5].flatMap((b) => [E('moog', b, 0.45, ROOT[c], v, { cutoff: 900 }), E('moog', b + 0.25, 0.2, ROOT[c] + 12, v * 0.5, { cutoff: 1400 })]); // (the off-beat roll)
const arp = (c, v = 0.2) => { const t = TRI[c], up = [t[0], t[1], t[2], t[0] + 12]; return [...Array(16)].map((_, k) => E('koto', k * 0.25, 0.3, up[[0, 1, 2, 3, 2, 1][k % 6]] + 12, k % 4 ? v * 0.7 : v)); };
const pad = (c, v = 0.1) => [E('supersaw', 0, 4, TRI[c], v, { cutoff: 2400 })];
const keys = (c, v = 0.25) => TRI[c].map((n) => E('rhodes', 0, 3.8, n - 12, v));
const fill = (v = 0.6) => [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((b, k) => E('snare', b, 0.25, null, v * (0.5 + k * 0.07)));
const answer = (bar, i = 'sax', up = 0, v = 0.36) => (bar % 2 === 0 ? quote(MOTIF.ANSWER, i, { up, v, at: 0 }) : [E(i, 0, 2, 74 + up, v * 0.9), E(i, 2, 2, 71 + up, v * 0.8)]);
const five = (i = 'brass', up = -12, v = 0.34) => quote(MOTIF.FIVE, i, { up, v, x: 0.8 }); // (five falling notes in a bar: 0.8 a beat)
const swoop = (b, v = 0.2) => E('theremin', b, 1.5, 83, v, { from: 9, glide: 0.6 }); // (a darter going by)

export const CRUDE_SEA = {
  title: 'Crude Sea', root: 64, bpm: 160, arrange: true, loopFrom: null, tail: 4,
  sections: [
    { id: 'launch', bars: 8, gain: 2.9, bar: (i) => { const c = chordOf(i); return [...keys(c, 0.22), ...(i % 4 === 0 ? [E('pad', 0, 16, TRI.Em.map((n) => n - 12), 0.08, { cutoff: 900 })] : []),
      ...(i === 0 ? [E('whale', 0, 8, 52, 0.18, { to: 47 })] : []), ...(i >= 4 ? [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.12 * (i - 3))) : []),
      ...(i >= 2 ? [0.5, 1.5, 2.5, 3.5].map((b) => E('hat', b, 0.5, null, 0.05 + 0.01 * i)) : []), ...(i === 6 ? [E('riser', 0, 8, null, 0.25)] : [])]; } },
    { id: 'schools', bars: 18, gain: 2, bar: (i) => { const c = chordOf(i); return [...four(i < 2 ? 0.8 : 1), ...roll(c), ...arp(c), ...keys(c, 0.12),
      ...(i === 0 || i === 8 ? [E('crash', 0, 1, null, 0.4)] : []), ...(i >= 8 ? answer(i, 'sax') : []), ...(i === 17 ? fill() : [])]; } },
    { id: 'pincer', bars: 10, gain: 2.25, bar: (i) => { const c = chordOf(i); return [...four(), ...roll(c, 0.5), ...arp(c, 0.22), ...pad(c),
      ...[0.5, 1.5, 2.5, 3.5].map((b) => E('brass', b, 0.3, TRI[c][2], 0.14, { stab: true })), ...answer(i, 'sax', 12, 0.34),
      ...(i === 0 ? [E('crash', 0, 1, null, 0.45)] : []), ...(i === 9 ? [...fill(0.7), E('riser', 0, 4, null, 0.2)] : [])]; } },
    { id: 'darters', bars: 14, gain: 2.6, bar: (i) => { const c = chordOf(i); return [...twostep(), E('growl', 0, 4, ROOT[c], 0.32, { rate: 4 }), ...arp(c, 0.18),
      ...(i % 2 ? [swoop(1), swoop(3)] : [swoop(2)]), ...(i === 0 || i === 8 ? [E('crash', 0, 1, null, 0.45), E('impact', 0, 1, null, 0.3)] : []), ...(i === 13 ? fill(0.6) : [])]; } },
    { id: 'breather', bars: 12, gain: 3.1, bar: (i) => { const c = chordOf(i); return [...keys(c, 0.2), E('pad', 0, 4.2, TRI[c].map((n) => n - 12), 0.07, { cutoff: 1100 }),
      ...(i % 4 === 0 ? [E('voice', 0, 6, 65, 0.16, { vowel: 'o' }), E('voice', 6, 10, 64, 0.16, { vowel: 'o' })] : []), // (the Tear, held by the choir)
      ...(i === 2 || i === 7 ? [E('whale', 0, 6, 59, 0.2, { to: 52 })] : []), ...[0.5, 2.25, 3.1].map((b) => E('bubble', b + (i % 3) * 0.2, 1, null, 0.12, { size: 1 + (i % 4) * 0.3 })),
      ...(i >= 9 ? [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.2 * (i - 8))) : []), ...(i === 10 ? [E('riser', 0, 8, null, 0.3)] : [])]; } },
    { id: 'push', bars: 22, gain: 2.3, bar: (i) => { const c = chordOf(i); return [...four(1.05), ...roll(c, 0.5), ...arp(c, 0.22), ...pad(c, 0.12),
      ...(i < 12 ? answer(i, 'sax', 12, 0.36) : five('brass', 0, 0.3)), ...(i >= 6 && i < 12 && i % 2 ? [swoop(2.5)] : []), // (the darters at 68)
      ...(i === 0 || i === 6 || i === 12 ? [E('crash', 0, 1, null, 0.5)] : []), ...(i === 21 ? [...fill(0.8), E('riser', 0, 4, null, 0.3)] : [])]; } },
    { id: 'heavy', bars: 12, gain: 2.7, bar: (i) => { const c = chordOf(i); return [...halftime(), E('growl', 0, 4, ROOT[c] + 12, 0.34, { rate: 2 }),
      ...five('brass', -12, 0.34), ...pad(c, 0.12), E('voice', 0, 4, TRI[c][0], 0.12, { vowel: 'a' }), ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.5), E('impact', 0, 1, null, 0.35)] : []),
      ...(i === 11 ? [...fill(0.8)] : [])]; } },
    { id: 'arrive', bars: 4, gain: 3.6, bar: (i) => (i === 0
      ? [E('crash', 0, 1, null, 0.5), E('kick', 0, 1, null, 0.8), E('supersaw', 0, 16, TRI.E, 0.12, { cutoff: 2000 }), E('strings', 0, 16, [40, 52, 56, 59, 64, 68], 0.12, { attack: 0.3 }),
        ...[64, 66, 68, 71, 73, 76, 78, 80, 83, 85, 88].map((n, k) => E('harp', k * 0.18, 2, n, 0.26)), E('bell', 2, 1, 88, 0.25), E('sax', 2, 6, 76, 0.32)]
      : i === 2 ? [E('bell', 0, 1, 83, 0.18), E('rhodes', 0, 8, 56, 0.2), E('rhodes', 0, 8, 64, 0.2)] : []) },
  ],
};

/** Where the stage is, as heard: the fraction of its hundred bars that have sounded (0..1), read off the arranger playing CRUDE_SEA, or null. */
export function stageAt(music) {
  const A = music?.arr;
  if (!A?.alive || A.score !== CRUDE_SEA) return null;
  if (A.ended) return 1;
  let bars = A.bar; for (let k = 0; k < A.section; k++) bars += CRUDE_SEA.sections[k].bars; // (the next bar to be laid out, at A.next)
  const ahead = (A.next - A.ctx.currentTime) / (A.spb * 4);
  return Math.max(0, Math.min(1, (bars - ahead) / STAGE_BARS));
}
