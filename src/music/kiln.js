// ---------------------------------------------------------------------------------------
// THE TRIBULATION'S CUE: "The Heavenly Kiln", a Firing crossed at the Chimney (docs/plans/SPIRIT-GARDEN.md, section 6; Espada's
// names: Candling, Sinter, Lustre, Salt, Reduction, Anagama): the soul refired as clay is, under a darkening sky, lightning sent back by
// the hand's flick or dodged by a hop. A score that follows the trial (the arranger's `jump`, read as each bar is laid out):
//   OPEN    2 bars: the kiln opens. A gong, the roar drawn up, the sky closing (a low-pass over everything)
//   STORM   8 bars, looped: the heat. Taiko thunder, a guzheng (the koto) running the In scale, an erhu's line (the fiddle, wide vibrato),
//           the kiln's roar under it all; lightning on the downbeat of every other bar (the strikes' clock). Each Firing is a harder
//           heat: its tier lays on more (from the third the drums double, from the fifth the choir and the lead guitar)
//   FIRED   2 bars: passed. The gong in major, a bell's chord, the Answer in the brass: "Second Firing: Sinter. Complete."
//   COOLED  2 bars: failed. The roar falls away and a single koto line descends: "Try again when you are ready."
// E, the In scale (the Tear, F on E, in it): the kiln's dread, and the brightness when it is crossed.
//
// Prior art: xianxia's heavenly tribulation (lightning as the test of a cultivator), the Chinese orchestra's guzheng and erhu, the
// anagama's firing (a roar for days, the ash glaze its reward), and Final Fantasy XIV's trials (a theme that turns with the fight).
//
//   import { KILN, setKiln } from './kiln.js'   setKiln({ tier, outcome: null | 'passed' | 'failed' })  (music/choose.js, from game.garden.tribulation)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const T = { tier: 1, outcome: null };
export function setKiln({ tier = 1, outcome = null } = {}) { T.tier = tier; T.outcome = outcome; }

const IN = [64, 65, 69, 71, 72, 76, 77, 81]; // (E In: E F A B C, up an octave)
const CH = ['Em', 'F', 'Em', 'C', 'Em', 'F', 'Am', 'B'];
const ROOT = { Em: 40, F: 41, C: 36, Am: 45, B: 35 };
const TRI = { Em: [64, 67, 71], F: [65, 69, 72], C: [64, 67, 72], Am: [64, 69, 72], B: [63, 66, 71] };
const roar = (v = 0.2) => [E('riser', 0, 4, null, v * 0.5), E('breath', 0, 4, null, v)]; // (the kiln's breath, drawn up and let go)
const thunder = (v = 0.6) => [E('taiko', 0, 1, null, v, { size: 1.1 }), E('taiko', 0.75, 1, null, v * 0.5, { size: 1.0 }), E('taiko', 2, 1, null, v * 0.8, { size: 1.05 })];
const guzheng = (i, v = 0.22) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('koto', b, 0.5, IN[(k * 3 + i) % IN.length], v * (k % 2 ? 0.7 : 1)));
const erhu = (i, v = 0.24) => (i % 2 ? [E('fiddle', 0, 2, IN[(i + 2) % 5] , v, { vib: 0.02, from: -2 }), E('fiddle', 2, 2, IN[(i + 1) % 5], v * 0.9, { vib: 0.02 })] : [E('fiddle', 0, 4, IN[i % 5] + 12, v, { vib: 0.025, from: -1 })]);

const SECTIONS = [
  { id: 'open', bars: 2, gain: 2.6, sweep: [8000, 1400], bar: (i) => (i === 0 ? [E('bell', 0, 1, 40, 0.5), E('impact', 0, 1, null, 0.4), ...roar(0.3), E('pad', 0, 8, [52, 53, 59], 0.07, { cutoff: 800 })]
    : [...thunder(0.5), E('bell', 2, 1, 41, 0.35), ...roar(0.35)]) }, // (a gong; the Tear's F in the second)
  { id: 'storm', bars: 8, gain: 2.4, sweep: [3500, 9000], bar: (i) => { const c = CH[i], k = T.tier;
    return [...thunder(0.4), ...roar(0.22), E('shimmer', 0, 4, TRI[c], 0.08), ...guzheng(i), ...erhu(i), E('pad', 0, 4.2, TRI[c].map((n) => n - 12), 0.06, { cutoff: 1200 }), E('growl', 0, 4, ROOT[c] + 12, 0.2, { rate: 2 }),
      ...(i % 2 === 0 ? [E('impact', 0, 1, null, 0.35), E('crash', 0, 1, null, 0.4)] : []), // (lightning on the downbeat, every other bar)
      ...(k >= 3 ? [...[0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.6)), ...[1, 3].map((b) => E('snare', b, 1, null, 0.5)), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('tick', b, 0.5, null, 0.2))] : []),
      ...(k >= 5 ? [E('voice', 0, 4, TRI[c][0], 0.12, { vowel: 'a' }), E('voice', 0, 4, TRI[c][2] - 12, 0.1, { vowel: 'a' }), ...(i % 4 === 0 ? quote(MOTIF.TEAR, 'shred', { up: 12, v: 0.28 }) : [])] : [])]; } },
  { id: 'fired', bars: 2, gain: 5.3, bar: (i) => (i === 0 ? [E('bell', 0, 1, 40, 0.5), E('crash', 0, 1, null, 0.5), ...quote(MOTIF.ANSWER, 'brass', { v: 0.34 }), ...[64, 68, 71, 76].map((n) => E('bell', 0.5, 1, n + 12, 0.18)),
    E('strings', 0, 8, [52, 56, 59, 64, 68], 0.1, { attack: 0.2 })] : [...[64, 68, 71, 76, 80].map((n, k) => E('harp', k * 0.2, 2, n, 0.24)), E('shimmer', 0, 4, [64, 68, 71], 0.12)]) }, // (E major: complete)
  { id: 'cooled', bars: 2, gain: 9, sweep: [5000, 900], bar: (i) => (i === 0 ? [...[76, 72, 71, 69, 65, 64].map((n, k) => E('koto', k * 0.6, 1, n, 0.24)), E('breath', 0, 4, null, 0.15)]
    : [E('koto', 0, 4, 52, 0.2), E('pad', 0, 4, [52, 59], 0.05, { cutoff: 700 })]) }, // (the roar gone, a line coming down: try again)
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));

function jump(section, bar) {
  const id = SECTIONS[section].id, last = bar >= SECTIONS[section].bars - 1;
  if (id === 'fired' || id === 'cooled') return last ? -1 : null; // (the end plays out, then the garden's cue comes back)
  if (T.outcome === 'passed') return AT.fired;
  if (T.outcome === 'failed') return AT.cooled;
  return last ? (id === 'open' ? null : section) : null; // (the opening runs on into the storm; the storm loops)
}

export const KILN = { title: 'The Heavenly Kiln', root: 64, bpm: 132, arrange: true, loopFrom: 1, moodless: true, tail: 4, scale: [0, 1, 5, 7, 8], sections: SECTIONS, jump };

/** The sound test's tour: the kiln opened, the storm at the fifth Firing's heat, and the Firing complete. */
export const KILN_TOUR = { ...KILN, title: 'The Heavenly Kiln (a Firing)', jump: (section, bar) => {
  const id = SECTIONS[section].id;
  if (id === 'open' && bar === 0) { T.tier = 5; T.outcome = null; }
  if (id === 'storm' && bar >= 7) { T.outcome = 'passed'; return AT.fired; }
  if (id === 'fired' && bar >= 1) { T.outcome = null; return -1; }
  return null;
} };
