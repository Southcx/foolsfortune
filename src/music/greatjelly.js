// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY'S FIGHT: "The Crowned Brood", the Great Dunemaw's FOE as an extreme fight (docs/plans/DUNEMAW-EXTREME.md, about
// 8 real minutes against a 9:30 enrage), a score that follows the fight (the arranger's `jump`: each phase change moves the music on the
// next bar line, so every transition lands on its cast). E minor at 150, a bar 1.6 real seconds; its motif is the urn's (music/motifs.js
// CROWN: B C E F E, climbing to the Tear on top).
//   PULL       2 bars: the urn rings, the taiko rolls in
//   CROWN      8 bars, looped (phase 1): pressure held. Half-time taiko, the tabla's desert pulse, low strings, the urn's motif on a bell,
//              its crackle; each crack of the crown lays on a layer (a heartbeat, then the hats and the tremolo): the fight's state read bar by bar
//   BREAK      2 bars: the crown bursts (the third crack): a cascade of crazing, a beat of silence, the slam
//   CROWNLESS  8 bars, looped (phase 1, the crown gone): the drums come in hard, the motif in the low brass
//   NOVA       2 bars (the Clutch Wakes): it sinks, everything drops out, a reversed swell, and the Slip Nova lands on the downbeat (guard on it)
//   BROOD      4 bars, looped (the transition): the clutches hatching in rhythm, a heartbeat, the marimba's eggs, a pulse that builds
//   BARE       16 bars, looped (phase 2): the drop. Trap hats, the 808 sliding, the motif on the lead guitar, the sitar answering, the choir;
//              four phrases, the last turning on B major
//   CALVING    8 bars, looped (phase 3): four calves, four voices: the motif in a canon, a beat apart, from the four corners of the stereo
//              field (bell, sitar, brass, guitar), double-time hats, a clock in the rim (the 30-second damage check)
//   OVERFLOW   8 bars, looped (5%, its desperation): everything, a semitone up into F minor (the Tear made the key), the floor all slip
//   WIN        2 bars: E major, the Answer in the brass, a harp, and the end
//   SWALLOW    3 bars (the enrage, The Dunemaw Swallows): the maw closes; the music is swallowed (a low-pass closing, a gulp), then nothing
//
// Prior art: Final Fantasy XIV's extreme trials (a theme in phases, each turn of the fight a turn of the music, Masayoshi Soken's), Thunder
// Force and Radiant Silvergun (the boss as a musical event), LucasArts' iMUSE (the score moving between sections on the bar as the game
// asks), vertical layering (a layer a crack, as Red Dead Redemption's stems), the canon as many-from-one (the calves), and this game's
// own motifs and holes (Crude Sea's: a beat of silence before the hit).
//
//   import { GREAT_JELLY, setFight } from './greatjelly.js'   setFight({ phase, cracks, broken })  (music/choose.js, from game.well.fight)
//   phase: 'crown' | 'clutch' | 'bare' | 'calving' | 'overflow' | 'won' | 'swallow'
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const ROOT = { Em: 40, F: 41, C: 36, B: 35, D: 38, G: 43, Fm: 41, Gb: 42, Db: 37 };
const TRI = { Em: [64, 67, 71], F: [65, 69, 72], C: [64, 67, 72], B: [63, 66, 71], D: [62, 66, 69], Fm: [65, 68, 72], Gb: [66, 70, 73], Db: [65, 68, 73] };

/** The fight as the music last heard it (music/choose.js sets it from game.well.fight every frame). */
const FIGHT = { phase: 'crown', cracks: 0, broken: false };
export function setFight({ phase = 'crown', cracks = 0, broken = false } = {}) { FIGHT.phase = phase; FIGHT.cracks = cracks; FIGHT.broken = broken || cracks >= 3; }

// ---- the parts
const CROWN_CH = ['Em', 'F', 'Em', 'B', 'Em', 'F', 'C', 'B']; // (the Phrygian F: the Tear in the harmony)
const BARE_CH = ['Em', 'C', 'D', 'B'];
const taiko = (v = 0.5) => [E('taiko', 0, 1, null, v, { size: 1.15 }), E('taiko', 2, 1, null, v * 0.8, { size: 1.1 })];
const tabla = (v = 0.3) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('tabla', b, 0.5, null, v * (k % 4 === 0 ? 1 : 0.6), { stroke: ['dha', 'na', 'ge', 'na', 'tin', 'na', 'ge', 'ka'][k], m: 62 }));
const low = (c, v = 0.12) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => E('strings', b, 0.5, ROOT[c] + 12, v, { spic: true, bright: 1400 }));
const heart = (v = 0.3) => [0, 2].flatMap((b) => [E('kick', b, 1, null, v), E('kick', b + 0.28, 1, null, v * 0.6)]);
const ticks = (v = 0.2, dbl = false) => [...Array(dbl ? 16 : 8)].map((_, n) => E('tick', n * (dbl ? 0.25 : 0.5), 0.25, null, v * (n % 4 === 0 ? 1.2 : n % 2 ? 0.6 : 0.9)));
const backbeat = (v = 1) => [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.8 * v)).concat([1, 3].map((b) => E('snare', b, 1, null, 0.6 * v)));
const halftime = (v = 1) => [E('kick', 0, 1, null, 0.95 * v), E('kick', 1.5, 1, null, 0.5 * v), E('snare', 2, 1, null, 0.75 * v), E('taiko', 0, 1, null, 0.4 * v, { size: 1.15 })];
const trap = (i) => [...[0, 0.5, 1, 2, 2.5, 3].map((b) => E('tick', b, 0.5, null, b % 1 ? 0.18 : 0.26)), ...[1.5, 1.667, 1.833].map((b, n) => E('tick', b, 0.17, null, 0.14 + n * 0.04)),
  ...(i % 2 ? [3.5, 3.625, 3.75, 3.875].map((b, n) => E('tick', b, 0.125, null, 0.14 + n * 0.05)) : [E('tick', 3.5, 0.5, null, 0.2)])];
const eight = (c, v = 0.45, from = 0) => [E('eight', 0, 1.5, ROOT[c] > 42 ? ROOT[c] - 12 : ROOT[c], v, { from, glide: 0.12 }), E('eight', 2.5, 1, ROOT[c] > 42 ? ROOT[c] - 12 : ROOT[c], v * 0.7)];
const choir = (c, v = 0.1, vowel = 'o') => [E('voice', 0, 4, TRI[c][0], v, { vowel }), E('voice', 0, 4, TRI[c][2] - 12, v * 0.8, { vowel })];
const pad = (c, v = 0.06) => [E('pad', 0, 4.2, TRI[c].map((n) => n - 12), v, { cutoff: 1300 })];
const crown = (i, at = 0, up = 0, inst = 'bell', v = 0.3, o) => quote(MOTIF.CROWN, inst, { at, up, v, o }).map((e) => (inst === 'bell' ? { ...e, d: undefined } : e));
const crackles = (n = 3, v = 0.3) => [...Array(n)].map((_, k) => E('crackle', k * 0.37 + 0.1, 1, null, v * (1 - k * 0.15), { dur: 0.3 }));
const hole = (evs, at = 3) => [...evs.filter((e) => e.b < at).map((e) => ({ ...e, d: Math.min(e.d || 1, at - e.b) })), E('reverse', at, 4 - at, null, 0.4)];

const SECTIONS = [
  { id: 'pull', bars: 2, gain: 2.4, bar: (i) => (i === 0 ? [...crown(0, 0, 0, 'bell', 0.32), ...crackles(2), E('voice', 0, 8, 52, 0.1, { vowel: 'o' }), E('pad', 0, 8, [52, 59], 0.06, { cutoff: 900 })]
    : [...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.25, 3.5, 3.75].map((b, k) => E('taiko', b, 0.5, null, 0.2 + k * 0.05, { size: 1.05 })), E('riser', 0, 4, null, 0.25)]) },
  { id: 'crown', bars: 8, gain: 2.5, bar: (i) => { const c = CROWN_CH[i], k = FIGHT.cracks; // (a layer a crack: read as each bar is laid out)
    return [...taiko(0.36), ...tabla(0.3), ...low(c), ...pad(c), ...choir(c, 0.08), E('shimmer', 0, 4, TRI[c], 0.07), ...(i % 4 === 0 ? crown(i, 0, 0, 'bell', 0.3) : []), ...(i % 2 ? crackles(1, 0.18) : []),
      ...(k >= 1 ? heart(0.32) : []), ...(k >= 2 ? [...ticks(0.18), E('strings', 0, 4, TRI[c].map((n) => n + 12), 0.035, { attack: 0.4, bright: 3200 })] : []),
      ...(i === 7 ? [E('riser', 0, 4, null, 0.2)] : [])]; } },
  { id: 'break', bars: 2, gain: 2.6, bar: (i) => (i === 0 ? hole([...crackles(6, 0.4), E('crash', 0, 1, null, 0.5), E('impact', 0, 1, null, 0.4), ...[71, 72, 76, 77].map((n, k) => E('bell', k * 0.25, 1, n + 12, 0.25)), ...taiko(0.6)])
    : [E('bigkick', 0, 1, null, 0.9), E('impact', 0, 1, null, 0.6), E('crash', 0, 1, null, 0.5), E('gang', 0, 1, null, 0.4), ...choir('Em', 0.14, 'a'), E('supersaw', 0, 4, TRI.Em, 0.1, { cutoff: 2600 }), ...eight('Em', 0.5)]) },
  { id: 'crownless', bars: 8, gain: 2.4, bar: (i) => { const c = CROWN_CH[i];
    return [...backbeat(), ...tabla(0.24), ...ticks(0.2), ...eight(c, 0.4), E('growl', 0, 4, ROOT[c] + 12, 0.26, { rate: 2 }), ...pad(c, 0.07), ...choir(c, 0.08),
      ...(i % 4 === 0 ? crown(i, 0, -24, 'brass', 0.3) : i % 4 === 2 ? crown(i, 0, -12, 'sitar', 0.3, { pan: 0.25 }) : []), ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.4)] : [])]; } },
  { id: 'nova', bars: 2, gain: 2.6, bar: (i) => (i === 0 ? [E('whale', 0, 3, 52, 0.2, { to: 40 }), E('reverse', 1, 3, null, 0.5), E('riser', 1, 3, null, 0.25)] // (it sinks: all gone, the swell)
    : [E('impact', 0, 1, null, 0.8), E('crash', 0, 1, null, 0.6), E('taiko', 0, 1, null, 0.8, { size: 1.3 }), E('bigkick', 0, 1, null, 0.8), ...choir('Em', 0.16, 'a'), E('voice', 0, 4, 77, 0.1, { vowel: 'a' }), E('sub', 0, 2, 40, 0.012)]) }, // (the Slip Nova on the downbeat)
  { id: 'brood', bars: 4, gain: 4.4, bar: (i) => { const c = ['Em', 'F', 'Em', 'B'][i];
    return [...heart(0.3), ...tabla(0.22), ...[0.25, 1.1, 1.75, 2.4, 3.3].map((b, k) => E('bubble', b, 1, null, 0.16, { size: 0.7 + ((i + k) % 3) * 0.3 })), // (the clutches hatching)
      ...[0, 0.75, 1.5, 2.25, 3, 3.5].map((b, k) => E('marimba', b, 0.5, TRI[c][k % 3] + 12, 0.22)), E('growl', 0, 4, ROOT[c] + 12, 0.2, { rate: 3 }), ...pad(c, 0.07),
      ...ticks(0.12 + i * 0.03), ...(i === 3 ? [E('riser', 0, 4, null, 0.22)] : [])]; } },
  { id: 'bare', bars: 16, gain: 2.4, bar: (i) => { const p = i >> 2, c = p === 3 && i === 15 ? 'B' : BARE_CH[i % 4];
    const tune = p === 0 ? (i % 2 ? [] : crown(i, 0, -12, 'shred', 0.3, { pan: 0.15, vib: 0.04 })) : p === 1 ? (i % 2 ? crown(i, 0, -12, 'sitar', 0.32, { pan: -0.2 }) : crown(i, 0, -12, 'shred', 0.28, { pan: 0.15 }))
      : p === 2 ? [...crown(i, 0, -24, 'brass', 0.3), ...crown(i, 0, 0, 'voice', 0.12, { vowel: 'a' })] : [...crown(i, 0, -12, 'shred', 0.3, { pan: 0.15, bend: i === 15 ? 2 : 0 }), ...crown(i, 0, -24, 'brass', 0.26)];
    return [...halftime(), ...trap(i), ...eight(c, 0.45, i % 4 === 0 ? 5 : 0), ...tune, ...pad(c, 0.08), ...choir(c, 0.08), E('shimmer', 0, 4, TRI[c], 0.12),
      ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.45)] : []), ...(i === 15 ? [E('riser', 0, 4, null, 0.2)] : [])]; } },
  { id: 'calving', bars: 8, gain: 2.4, bar: (i) => { const c = BARE_CH[i % 4];
    const calves = i % 2 ? [] : [['bell', -0.8, 12], ['sitar', -0.3, 0], ['brass', 0.3, -12], ['shred', 0.8, 0]].flatMap(([inst, pan, up], k) => crown(i, k, up, inst, inst === 'bell' ? 0.24 : 0.24, { pan })); // (four calves, four voices)
    return [...backbeat(1.05), ...ticks(0.18, true), ...[0, 1, 2, 3].map((b) => E('bodhran', b + 0.5, 0.5, null, 0.22, { rim: true })), ...eight(c, 0.4), ...calves, ...pad(c, 0.07),
      E('growl', 0, 4, ROOT[c] + 12, 0.24, { rate: 4 }), ...(i === 0 ? [E('crash', 0, 1, null, 0.5), E('impact', 0, 1, null, 0.4)] : [])]; } },
  { id: 'overflow', bars: 8, gain: 2.5, scale: [0, 1, 5, 7, 8], bar: (i) => { const c = ['Fm', 'Gb', 'Fm', 'C', 'Fm', 'Gb', 'Db', 'C'][i]; // (a semitone up: the Tear is the key)
    return [...backbeat(1.1), ...trap(i), ...eight(c === 'C' ? 'C' : c, 0.45), ...crown(i, 0, -11, 'shred', 0.3, { pan: 0.15 }), ...crown(i, 0, -23, 'brass', 0.28), ...crown(i, 0, 1, 'voice', 0.12, { vowel: 'a' }),
      ...[0.4, 1.3, 2.2, 3.1].map((b) => E('bubble', b, 1, null, 0.14, { size: 1.2 })), E('growl', 0, 4, ROOT[c] + 12, 0.26, { rate: 4 }), ...pad(c, 0.08), E('shimmer', 0, 4, TRI[c], 0.12),
      ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.5), E('gang', 1, 1, null, 0.35), E('gang', 3, 1, null, 0.4)] : [])]; } },
  { id: 'win', bars: 2, gain: 6.5, bar: (i) => (i === 0 ? [E('crash', 0, 1, null, 0.5), E('kick', 0, 1, null, 0.8), ...quote(MOTIF.ANSWER, 'brass', { v: 0.32 }), E('strings', 0, 8, [40, 52, 56, 59, 64, 68], 0.1, { attack: 0.3 }),
    ...[64, 68, 71, 76, 80, 83].map((n, k) => E('harp', k * 0.2, 2, n, 0.24))] : [E('bell', 0, 1, 88, 0.22), E('shimmer', 0, 4, [64, 68, 71], 0.12)]) },
  { id: 'swallow', bars: 3, gain: 2.6, sweep: [6000, 180], bar: (i) => (i === 0 ? [E('whale', 0, 8, 47, 0.26, { to: 28 }), E('sub', 0, 8, 40, 0.014), ...choir('Em', 0.12, 'u'), E('reverse', 4, 4, null, 0.4)]
    : i === 1 ? [E('impact', 0, 1, null, 0.7), E('taiko', 0, 1, null, 0.7, { size: 1.4 }), E('bubble', 1, 1, null, 0.2, { size: 2 })] : []) }, // (the maw closes: the music swallowed, a gulp, nothing)
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));
const FAMILY = { crown: ['pull', 'crown', 'break', 'crownless'], clutch: ['nova', 'brood'], bare: ['bare'], calving: ['calving'], overflow: ['overflow'], won: ['win'], swallow: ['swallow'] };
const ENTRY = { crown: 'crown', clutch: 'nova', bare: 'bare', calving: 'calving', overflow: 'overflow', won: 'win', swallow: 'swallow' };

/** Where the fight's music goes after this bar (the arranger's `jump`): stay and loop in the phase, or move to the new phase on the next bar. */
function jump(section, bar) {
  const id = SECTIONS[section].id, last = bar >= SECTIONS[section].bars - 1, want = FAMILY[FIGHT.phase] ? FIGHT.phase : 'crown';
  if (id === 'win' || id === 'swallow') return last ? -1 : null; // (the ends play out, then stop)
  if (!FAMILY[want].includes(id)) return AT[want === 'crown' && FIGHT.broken ? 'crownless' : ENTRY[want]]; // (a new phase: on the next bar line)
  if (id === 'crown' && FIGHT.broken) return AT.break; // (the third crack: the crown bursts)
  if (!last) return null;
  return id === 'pull' || id === 'break' || id === 'nova' ? null : section; // (an entry runs on into its loop; a loop loops)
}

export const GREAT_JELLY = { title: 'The Crowned Brood', root: 64, bpm: 150, arrange: true, loopFrom: 0, moodless: true, tail: 4, sections: SECTIONS, jump };

// the sound test's tour (music/soundtest.js): the whole fight in short, each phase once, the crown cracking as it goes
const TOUR = ['pull', 'crown', 'break', 'crownless', 'nova', 'brood', 'bare', 'calving', 'overflow', 'win'];
export const GREAT_JELLY_TOUR = { ...GREAT_JELLY, title: 'The Crowned Brood (the whole fight, in short)', jump: (section, bar) => {
  const id = SECTIONS[section].id;
  if (id === 'pull') { FIGHT.cracks = 0; FIGHT.broken = false; }
  if (id === 'crown') FIGHT.cracks = Math.min(2, Math.floor((bar + 1) / 3)); // (a crack every three bars, so the layers are heard)
  if (bar < SECTIONS[section].bars - 1) return null;
  const k = TOUR.indexOf(id);
  return k < 0 || k === TOUR.length - 1 ? -1 : AT[TOUR[k + 1]];
} };

