// ---------------------------------------------------------------------------------------
// THE CROSSING AS A ROLLERCOASTER: its cue, a leg at a time (docs/plans/RAIL-OVERHAUL.md, the owner's of 2026-10-08). A crossing is a
// launch (4 bars), its legs (one a waypoint of the passage drafted on the sea chart, 24 to 64 bars each), a turn of the rail between two
// (4 bars) and the arrive (4 bars), at 160 bpm, a bar 1.5 real seconds, so the stage clock is the cue and everything lands on a bar line.
//   A LEG  open (8 bars: one idea alone), build (the idea and one other), peak (the leg's big object: its boss theme), release (4: the
//          parts falling); a hole into the peak (a beat of silence and a reversed swell: the owner's ear). Each leg has its own key and
//          groove, and its own theme on top:
//          the shoal       E minor, four on the floor       the Answer on the sax, its reply varied (Crude Sea's)
//          the Wreckers    A minor, a jig over the drive    the shanty's verse on the fiddle; at the peak the chorus in the brass and
//                                                           the crew's shout (the False Light alongside)
//          Old Nobody      C# minor, half time and taiko    the Leviathan's motif in the low brass; the whale; the choir on the Tear
//          the eyewall     E Phrygian, two-step at 160      the Five in the lead guitar, the warp's growl
//          the graveyard   F minor (Lachryma's key)         the Beacon: a foghorn and the drowned lighthouse's lamp turning
//          the maelstrom   E in the place's feeling's mode  the Whirl, round and down, on the feeling's own voice (Charybdis)
//          a calm          G major                          a music box (the harp and the celesta), the whale; no drums but a tick
//          a bounty        B minor, four on the floor       the Five as a WANTED poster: brass stabs
//   THE STACK (Rez's layers, Mizuguchi's: the music thickens as you play): how many of a leg's eight parts sound (a pad and a pulse, the
//          hats, the bass, the arpeggio, the snare and the shimmer, the theme, its counter and the choir, the boss's line). Each phase
//          has its own (open builds a part every two bars, the peak is the thickest, a boss's peak thicker still), and every lock, down
//          and part shot off a boss adds heat that lifts it (railHeat); the heat cools a quarter of a part a bar. Bars are laid out one
//          ahead, so a layer joins on the next bar line (quantised: the lock tones themselves wait for the sixteenth, audio/rail.js).
//   THE TURN 4 bars: the drums cut on the third beat with a reversed swell, a riser and a whoosh as the rail bends, the next leg's
//          dominant under it, toms and a snare roll, and the next leg's first bar lands with a crash in its own key.
// The trip's pressures (PASSAGE.md section 14): a waypoint's feeling recolours its leg (each note to the same degree of the feeling's mode:
// wonder Lydian, mirth major, desire Dorian, grief as written, dread Locrian; the key and the themes stay the leg's own); a storm leg
// is a part thicker and louder; low fuel lays a heartbeat under every leg, adrift takes the drums away (the current, not the engine); a
// calm is the campfire (a crackle under it), its release holding for the choice of mend or reckon.
// Under the surface (the Umbral form) the whole mix is low-passed, and breaching lifts it (music/player.js setUnder, audio/core.js).
//
// Prior art: Rez (Mizuguchi, 2001: the stage's music built from the player's own shots, layer by layer), Child of Eden, Panzer Dragoon
// Orta's forms, Star Fox 64's leg-by-leg score, KH2's Gummi missions, the trance arrangement (open, build, drop, breakdown), Crywolf's
// drop and the owner's holes (docs/archive/2026-10-06-ost-the-owners-ear.md), and this game's own motifs and Crude Sea (music/emocean.js), whose parts it keeps.
//
//   import { tripCue, tripLayout, railHeat, HEAT, LEGS, setEncounter } from './legs.js'
//   tripCue(legs) -> the crossing's score (cached): legs = [{ id: 'shoal'|'wreckers'|'nobody'|'eyewall'|'graveyard'|'maelstrom'|'calm'|'bounty'|'encounter',
//     bars?: 24..64 (or each leg's own phases, RAIL-OVERHAUL.md section 6), aspect?: the maelstrom's feeling, phases?: { open, build, peak,
//     release }, encounter?: an encounter's id (src/progress/rail/encounters.js) }]   (music/choose.js, game.emocean.stage.legs)
//   setEncounter(waiting): an encounter's (or a calm's campfire) choice pending holds its cue on the bar line   setTrip({ lowFuel, adrift, figures })
//   a crossing's score is of `family: 'crossing'`: relaid with new legs ahead (adrift), it carries on from the bar playing (Arranger.swap)
//   legs[k].feeling (an aspect, or none: fair) and legs[k].storm   setFoeUnder(under): a boss diving takes its line under
//   tripLayout(legs) -> { bars, legs: [{ id, at, open, build, peak, release, end }], turns: [bar] } (the stage's bars, for the runtime)
//   railHeat(n) adds heat (HEAT.lock, .volley, .down, .part, .core: music/choose.js hears the rail's events)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';
import { VERSE, CHORUS } from './shanty.js';
import { MODES } from './mood.js';
import { LEGS as RAIL } from '../progress/rail/legs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
export const BPM = 160;
const R = { heat: 0 };
export const HEAT = { lock: 0.12, volley: 0.4, down: 0.3, part: 1, core: 2 };
/** The trip's pressures (PASSAGE.md 14.2): fuel running low, or adrift on the current; read from the next bar. */
export function setTrip({ lowFuel = false, adrift = false, figures = null } = {}) { R.lowFuel = !!lowFuel; R.adrift = !!adrift; R.figures = figures; }
/** An encounter's choice pending (music/choose.js, from game.emocean.stage.encounter): its hold loops on the bar line until it is made. */
export function setEncounter(waiting) { R.waiting = !!waiting; }
/** The boss under the surface (Charybdis's dives: game.emocean.stage.foe.under): its line alone low-passed from the next bar. */
export function setFoeUnder(under) { R.foeUnder = !!under; }
export function railHeat(n = 0) { R.heat = Math.max(0, Math.min(3, R.heat + n)); }

// ---- each leg: its key (semitones from E), its four chords ([semitones from the key, minor?]), its groove, its voices
const m = true, M = false;
export const LEGS = {
  shoal: { tr: 0, prog: [[0, m], [8, M], [10, M], [7, m]], groove: 'four', arp: 'koto', lead: 'sax', boss: false },
  wreckers: { tr: 5, prog: [[0, m], [10, M], [0, m], [7, m]], groove: 'jig', arp: 'twinkle', lead: 'fiddle', boss: true },
  nobody: { tr: -3, prog: [[0, m], [8, M], [5, m], [7, M]], groove: 'half', arp: 'harp', lead: 'brass', boss: true },
  eyewall: { tr: 0, prog: [[0, m], [1, M], [0, m], [10, m]], groove: 'two', arp: 'koto', lead: 'shred', boss: false },
  graveyard: { tr: 1, prog: [[0, m], [8, M], [3, M], [7, M]], groove: 'half', arp: 'celesta', lead: 'brass', boss: true },
  maelstrom: { tr: 0, prog: null, groove: 'break', arp: 'twinkle', lead: null, boss: true },
  calm: { tr: 3, prog: [[0, M], [9, m], [5, M], [7, M]], groove: 'none', arp: 'harp', lead: 'celesta', boss: false },
  encounter: { tr: 0, prog: [[0, m], [8, M], [3, M], [10, M]], groove: 'none', arp: 'harp', lead: null, boss: false },
  bounty: { tr: 7, prog: [[0, m], [8, M], [3, M], [10, M]], groove: 'four', arp: 'koto', lead: 'brass', boss: true },
};
const VOICE = { wonder: 'theremin', mirth: 'steelpan', desire: 'sax', grief: 'fiddle', dread: 'voice' }; // (the maelstrom's Figment sings in its feeling)
// the maelstrom's chords: the feeling's own mode, its five notes as four chords (I, the colour, a turn, home)
const MODE_PROG = { wonder: [[0, M], [2, M], [11, m], [7, M]], mirth: [[0, M], [9, m], [5, M], [7, M]], desire: [[0, m], [5, M], [0, m], [10, M]],
  grief: [[0, m], [8, M], [5, m], [7, M]], dread: [[0, m], [1, M], [10, m], [0, m]] };

const pc = (n) => ((n % 12) + 12) % 12;
function chordOf(L, i) {
  const [off, minor] = L.prog[Math.floor(i / 2) % L.prog.length], r = pc(L.tr + off); // (a chord every two bars: 3 real seconds)
  const bass = 40 + r > 47 ? 28 + r : 40 + r, root = 55 + pc(r - 3) ; // (the bass E2..D#3; the keys' root G3..F#4)
  return { r, bass, tri: [root, root + (minor ? 3 : 4), root + 7], minor };
}
const keyed = (n, L) => n + (pc(L.tr + 6) - 6); // (a motif written in E, moved to the leg's key the short way)

// ---- the eight parts, in the order the stack adds them
const PAD = (L, c, v) => [E('supersaw', 0, 4.1, c.tri, 0.06 * v, { cutoff: 1400 })];
const PULSE = (L) => (L.groove === 'none' ? [E('tick', 0, 0.5, null, 0.18)] : [E('kick', 0, 1, null, 0.7)]);
const GROOVE = {
  four: () => [...[1, 2, 3].map((b) => E('kick', b, 1, null, 0.75)), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, 0.22)), ...[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((b) => E('tick', b, 0.25, null, 0.1))],
  jig: () => [E('kick', 2, 1, null, 0.6), E('bodhran', 0, 1, null, 0.45), E('bodhran', 2, 1, null, 0.4), ...[0, 2 / 3, 4 / 3, 2, 8 / 3, 10 / 3].map((b, k) => E('tick', b, 0.3, null, k % 3 ? 0.1 : 0.18))],
  half: () => [E('taiko', 0, 1, null, 0.32, { size: 1.1 }), E('kick', 2.5, 1, null, 0.5), E('taiko', 3, 1, null, 0.25), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, 0.16))],
  two: () => [E('kick', 2.5, 1, null, 0.65), ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('tick', b, 0.5, null, k % 2 ? 0.1 : 0.16)), E('ohat', 3.5, 0.5, null, 0.18)],
  break: () => [E('kick', 1.75, 1, null, 0.55), E('kick', 2.5, 1, null, 0.65), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, 0.2)), E('tom', 3.25, 0.5, null, 0.3, { pitch: 150 }), E('tom', 3.5, 0.5, null, 0.3, { pitch: 110 })],
  none: () => [...[1, 2, 3].map((b) => E('tick', b, 0.5, null, 0.12))],
};
const BASS = (L, c, i, peakBoss) => (peakBoss ? [E('eight', 0, 2.5, c.bass, 0.32, { from: i % 2 ? 5 : -12 }), E('eight', 3, 1, c.bass + 7, 0.22)]
  : L.groove === 'none' ? [E('upright', 0, 2, c.bass, 0.1), E('upright', 2, 2, c.bass + 7, 0.08)]
    : [0.5, 1.5, 2.5, 3.5].flatMap((b) => [E('moog', b, 0.45, c.bass, 0.32, { cutoff: 900 }), E('moog', b + 0.25, 0.2, c.bass + 12, 0.16, { cutoff: 1400 })]));
const ARP = (L, c, i) => { const up = [c.tri[0], c.tri[1], c.tri[2], c.tri[0] + 12], P = (i >> 2) % 2 ? [3, 2, 1, 0, 1, 2] : [0, 1, 2, 3, 2, 1];
  return [...Array(16)].map((_, k) => E(L.arp, k * 0.25, 0.3, up[P[k % 6]] + 12, k % 4 ? 0.13 : 0.19)); };
const SNARE = (L, c) => [...(L.groove === 'none' ? [] : L.groove === 'half' ? [E('snare', 2, 1, null, 0.6)] : L.groove === 'two' ? [E('snare', 1, 1, null, 0.55), E('snare', 3, 1, null, 0.6)] : [1, 3].map((b) => E('clap', b, 1, null, 0.4))),
  E('shimmer', 0, 4, c.tri, 0.07)];
const fill = (v = 0.5) => [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((b, k) => E('snare', b, 0.25, null, v * (0.45 + k * 0.08)));

// the themes: what each leg sings on top (stack 6), in two-bar phrases; and the boss's line (stack 8, the peak of a boss leg)
const REPLY = [[[0, 2, 74], [2, 2, 71]], [[0, 2, 76], [2, 2, 79]], [[0, 1.5, 79], [1.5, 2.5, 78]]];
const shanty = (T, i, inst, L, v) => T.tune[Math.floor(i / 1) % 4].map(([b, d, n]) => E(inst, b * 2 / 3, d * 2 / 3, keyed(n, L), v)); // (a 6/8 line laid over a bar of 4: the jig's lilt)
const THEME = {
  shoal: (L, i) => (i % 2 === 0 ? quote(MOTIF.ANSWER, 'sax', { v: 0.32 }) : REPLY[(i >> 1) % 3].map(([b, d, n]) => E('sax', b, d, n, 0.28))),
  wreckers: (L, i) => shanty(VERSE, i, 'fiddle', L, 0.3),
  nobody: (L, i) => (i % 2 === 0 ? quote(MOTIF.LEVIATHAN, 'brass', { up: keyed(12, L), v: 0.3 }) : [E('voice', 0, 4, keyed(77, L) - 12, 0.08, { vowel: 'o' })]),
  eyewall: (L, i) => (i % 2 === 0 ? quote(MOTIF.FIVE, 'shred', { x: 0.75, v: 0.3 }) : quote(MOTIF.TEAR, 'shred', { up: 12, v: 0.26, o: { vib: 0.04 } })),
  graveyard: (L, i) => (i % 4 === 0 ? quote(MOTIF.BEACON, 'brass', { up: keyed(0, L), v: 0.3 }).map((e, k) => (k > 1 ? { ...e, i: 'bell', v: 0.22, n: e.n + 12 } : e)) : []),
  maelstrom: (L, i) => quote(MOTIF.WHIRL, VOICE[L.aspect] || 'theremin', { v: 0.26 }).map((e) => ({ ...e, n: modal(e.n, L) })),
  calm: (L, i) => (i % 2 === 0 ? quote(MOTIF.ANSWER, 'celesta', { up: keyed(12, L) - 12, x: 1.5, v: 0.22 }) : [E('whale', 0, 4, keyed(52, L), 0.12)]),
  bounty: (L, i) => quote(MOTIF.FIVE, 'brass', { up: keyed(0, L), v: 0.3, o: { stab: true } }),
};
const BOSS = {
  wreckers: (L, i) => [...shanty(CHORUS, i, 'brass', L, 0.26), ...(i % 2 === 0 ? [E('gang', 0, 1, null, 0.35)] : [])],
  nobody: (L, i) => (i % 2 ? [E('whale', 0, 4, keyed(40, L), 0.14), E('growl', 0, 4, keyed(40, L), 0.18, { rate: 2 })] : quote(MOTIF.LEVIATHAN, 'voice', { up: keyed(24, L), v: 0.1, o: { vowel: 'a' } })),
  graveyard: (L, i) => [E('voice', 0, 4, keyed(65, L), 0.09, { vowel: 'u' }), E('voice', 0, 4, keyed(64, L) - 12, 0.08, { vowel: 'u' }), ...(i % 2 ? [E('bell', 0, 1, keyed(52, L), 0.3)] : [E('whoosh', 2, 2, null, 0.25)])], // (the choir on the Tear; the lamp's beam sweeping)
  maelstrom: (L, i) => quote(MOTIF.TEAR, 'shred', { up: 12 + (i >> 2) % 3 * 2, v: 0.26 }),
  bounty: (L, i) => (i % 2 ? quote(MOTIF.FIVE, 'shred', { up: keyed(12, L) - 12, x: 0.75, v: 0.26 }) : [E('impact', 0, 1, null, 0.3)]),
};
function modal(n, L) { // (a note of the Whirl, written in E minor, moved onto the feeling's mode: the nearest note of its five)
  const mode = MODES[L.aspect] || MODES.grief, d = pc(n - 64), best = mode.reduce((a, x) => (Math.abs(x - d) < Math.abs(a - d) ? x : a), mode[0]);
  return n - d + best;
}

// how many parts sound: the phase's own, the heat on top; a boss's peak is the thickest
function stackOf(phase, i, L, len) {
  const base = phase === 'open' ? Math.min(4, 1 + Math.floor(4 * i / len)) : phase === 'build' ? Math.min(6, 4 + Math.floor(3 * i / len)) : phase === 'peak' ? (L.boss ? 7 : 6) : 3; // (the open and the build ramp over their own length, however long the rail makes them)
  return Math.min(8, base + Math.round(R.heat) + (L.storm && phase !== 'open' && phase !== 'release' ? 1 : 0)); // (a storm leg: a part thicker)
}
function layBar(L, phase, i, len) {
  R.heat = Math.max(0, R.heat - 0.25); // (the heat cools a quarter of a part a bar)
  const c = chordOf(L, i), s = stackOf(phase, i, L, len), peakBoss = phase === 'peak' && L.boss, out = [...PAD(L, c, 1), ...PULSE(L)];
  const last = i === len - 1;
  if (s >= 2) out.push(...GROOVE[L.groove]());
  if (s >= 3) out.push(...BASS(L, c, i, peakBoss));
  if (s >= 4) out.push(...ARP(L, c, i));
  if (s >= 5) out.push(...SNARE(L, c));
  if (s >= 6) out.push(...THEME[L.id](L, i));
  if (s >= 7) out.push(E('voice', 0, 4, c.tri[0], 0.06, { vowel: 'a' }), E('voice', 0, 4, c.tri[2], 0.05, { vowel: 'a' }));
  if (s >= 8 || (peakBoss && s >= 7)) { const line = BOSS[L.id]?.(L, i) || []; // (a boss under the surface: its line alone heard through the crude, and its bubbles)
    out.push(...(R.foeUnder ? [...line.map((e) => ({ ...e, deep: true })), E('bubble', 1.5, 0.5, null, 0.2, { size: 1.6 }), E('bubble', 3.25, 0.5, null, 0.15, { size: 1.2 })] : line)); }
  if (i === 0 && phase !== 'release') out.push(E('crash', 0, 1, null, phase === 'peak' ? 0.5 : 0.35), ...(phase === 'peak' ? [E('impact', 0, 1, null, 0.4)] : []));
  if (phase === 'peak' && i % 8 === 7 && L.groove !== 'none') out.push(...fill(0.45));
  if (last && phase === 'build') return [...out.filter((e) => e.b < 2), E('reverse', 2, 2, null, 0.4)]; // (the hole into the peak: cut at the third beat)
  if (phase === 'release') return [...out.filter((e) => !['kick', 'clap', 'snare', 'eight', 'moog'].includes(e.i)), ...(i === 0 ? [E('crash', 0, 1, null, 0.3)] : []), // (the parts falling: the theme, softer, over what is left)
    ...(s < 6 ? THEME[L.id](L, i).map((e) => ({ ...e, v: (e.v ?? 0.3) * 0.7 })) : [])];
  return out;
}

// ---- the trip's pressures (PASSAGE.md section 14): the waypoint's feeling recolours its leg; a storm is heavier; low fuel and adrift
// are heard in every leg; a calm is the campfire. Each is read as the bar is laid out, so it lands on the next bar line.
const MODE7 = { wonder: [0, 2, 4, 6, 7, 9, 11], mirth: [0, 2, 4, 5, 7, 9, 11], desire: [0, 2, 3, 5, 7, 9, 10], grief: [0, 2, 3, 5, 7, 8, 10], dread: [0, 1, 3, 5, 6, 8, 10], fury: [0, 2, 3, 6, 7, 8, 10], gall: [0, 1, 4, 5, 7, 8, 10] }; // (dread Locrian: the flat fifth sounds in every chord; fury the minor with its fourth raised; gall Phrygian dominant, Hijaz whole)
const MINOR = MODE7.grief; // (every leg is written in its key's natural minor: a feeling moves each note to the same degree of its mode)
function recolour(n, root, mode) {
  if (n == null || !mode) return n;
  if (Array.isArray(n)) return n.map((x) => recolour(x, root, mode));
  const d = pc(n - root), k = MINOR.indexOf(d);
  return k < 0 ? n : n - d + mode[k]; // (a note outside the minor scale is left as written: a chromatic passing note stays one)
}
function legBar(L, phase, i, len) {
  let out = layBar(L, phase, i, len);
  if (R.adrift) out = [...out.filter((e) => !['kick', 'clap', 'snare', 'eight', 'moog', 'taiko', 'tom', 'bodhran', 'ohat'].includes(e.i)), // (the engine quiet, carried on the current)
    ...(i % 2 === 0 ? [E('breath', 0, 4, null, 0.18)] : [E('harp', 0, 2, chordOf(L, i).tri[0] + 12, 0.12), E('harp', 1, 2, chordOf(L, i).tri[2] + 12, 0.1)])];
  if (R.lowFuel && !R.adrift) out.push(E('sub', 0, 0.5, chordOf(L, i).bass, 0.12), E('sub', 0.5, 0.5, chordOf(L, i).bass, 0.08), ...(i % 2 ? [E('vibes', 3, 1, chordOf(L, i).tri[1] - 1, 0.1)] : [])); // (a heartbeat, and the gauge's needle dropping a half step)
  if (L.id === 'calm') out.push(E('crackle', 0, 0.5, null, 0.12, { dur: 3.8 })); // (the campfire)
  const mode = L.id !== 'maelstrom' && L.feeling && MODE7[L.feeling] !== MINOR ? MODE7[L.feeling] : null, root = 64 + keyed(0, L);
  return mode ? out.map((e) => (e.n == null || ['bell'].includes(e.i) && e.n < 50 ? e : { ...e, n: recolour(e.n, root, mode) })) : out;
}

// ---- the turn of the rail: from one leg's key into the next's, four bars
// the figure the rail flies through the turn (world/emocean/railpath.js, game.emocean.figures): a crest rises into its top, a corkscrew
// and a loop drop the bottom out at the inverted bar (the third), a weave swells a cymbal on each bank
function figureBar(fig, out, i) {
  if (fig === 'crest') return i === 1 ? [...out.filter((e) => e.i !== 'riser'), E('riser', 0, 4, null, 0.35)] : i === 2 ? [E('crash', 0, 1, null, 0.45), E('shimmer', 0, 4, [76, 80, 83], 0.08), ...out.filter((e) => e.i !== 'kick')] : i === 3 ? [...out, E('whoosh', 0, 3, null, 0.3)] : out;
  if (fig === 'corkscrew' || fig === 'verticalLoop') return i === 2 ? [...out.filter((e) => !['kick', 'sub', 'tom', 'supersaw'].includes(e.i)), E('reverse', 0, 4, null, 0.3), E('shimmer', 0, 4, [76, 83, 88], 0.09), E('breath', 0, 4, null, 0.15)] : out; // (weightless: no floor under you)
  if (fig === 'weave') return i === 1 || i === 3 ? [...out, E('reverse', 2, 2, null, 0.25), E('ride', 0, 1, null, 0.25)] : out;
  return out;
}
function turnBar(A, B, i, k) { return figureBar(R.figures?.[k - 1], turnBarOf(A, B, i), i); }
function turnBarOf(A, B, i) {
  const ca = chordOf(A, 0), nb = chordOf(B, 0), dom = { ...nb, tri: [nb.tri[0] + 7, nb.tri[0] + 11, nb.tri[0] + 14].map((n) => (n > 72 ? n - 12 : n)), bass: nb.bass + 7 > 47 ? nb.bass - 5 : nb.bass + 7 };
  if (i === 0) return [E('kick', 0, 1, null, 0.7), ...PAD(A, ca, 1), E('reverse', 2, 2, null, 0.4), E('whoosh', 1, 3, null, 0.35)];
  if (i === 1) return [E('riser', 0, 12, null, 0.3), E('supersaw', 0, 4.1, dom.tri, 0.06, { cutoff: 1800 }), E('sub', 0, 4, dom.bass, 0.18), E('tom', 3, 0.5, null, 0.3, { pitch: 140 })];
  if (i === 2) return [E('kick', 0, 1, null, 0.6), E('kick', 2, 1, null, 0.6), E('supersaw', 0, 4.1, dom.tri, 0.07, { cutoff: 3000 }), ...[0, 1, 2, 3].map((k) => E(B.arp, 2 + k * 0.5, 0.4, nb.tri[k % 3] + 12, 0.16)), E('whoosh', 0, 4, null, 0.3)];
  return [E('kick', 0, 1, null, 0.7), E('supersaw', 0, 4.1, dom.tri, 0.08, { cutoff: 6000 }), ...fill(0.55), ...[0, 0.5, 1, 1.5].map((b, k) => E('tom', b, 0.5, null, 0.35, { pitch: 180 - k * 25 }))];
}

// ---- the encounters at sea (PASSAGE.md section 13, src/progress/rail/encounters.js; Espada's names): a cue under the sequence (arrive,
// 4 bars), then a hold of 2 bars looped while the choice waits (no drums: a choice is not hurried), then the turn of the rail; each
// its own level (`ga`, `gh`: rendered and measured to about -31 and -33 dB RMS)
const drone = (n, v = 0.05) => [E('pad', 0, 4.2, n, v, { cutoff: 1100 })];
const STEP = [[0, 0.5, 69], [0.5, 0.5, 71], [1, 1, 72], [2, 2, 76]]; // (the Fool's Step: A B C, a leap to E)
const ENCOUNTER = {
  ghostConvoy: { ga: 1.82, gh: 1.5, // the Dead Reckoners: ghost ships in the fog, the shanty slowed to a dirge on a concertina, a ship's bell
    arrive: (L, i) => [...drone([52, 59, 64]), ...(i % 2 === 0 ? VERSE.tune[i >> 1].map(([b, d, n]) => E('concertina', b * 2 / 3, d * 2 / 3, n - 12, 0.18)) : []), ...(i === 0 ? [E('bell', 0, 1, 64, 0.3)] : [])],
    hold: (L, i) => [...drone([52, 59, 63]), E('voice', 0, 8, 64, 0.06, { vowel: 'o' }), ...(i ? [] : [E('bell', 0, 1, 52, 0.22)])] },
  lettysCutter: { ga: 0.84, gh: 2.4, // the Last Word: Letty Marque and Poll alongside, a sly pizzicato and a flute
    arrive: (L, i) => [...drone([55, 62, 67]), ...[0, 1, 2, 3].map((b) => E('pizz', b, 0.5, [55, 59, 62, 66][(b + i) % 4], 0.22)), ...(i % 2 ? quote(MOTIF.ANSWER, 'flute', { v: 0.22 }) : [])],
    hold: (L, i) => [...drone([55, 59, 66]), E('pizz', 0, 0.5, 55, 0.18), E('pizz', 2, 0.5, 62, 0.15)] },
  lightWhale: { ga: 2.4, gh: 3.8, // the Cantor: a whale singing under the crude, the choir answering, the Answer slowly on the celesta
    arrive: (L, i) => [...drone([52, 59, 64, 71]), E('whale', 0, 4, i % 2 ? 57 : 52, 0.16, { to: i % 2 ? 52 : 59 }), ...(i === 2 ? quote(MOTIF.ANSWER, 'celesta', { x: 2, v: 0.18 }) : [])],
    hold: (L, i) => [...drone([52, 59, 64, 71]), E('voice', 0, 8, 71, 0.05, { vowel: 'u' }), ...(i ? [E('whale', 0, 4, 64, 0.1, { to: 59 })] : [])] },
  castaway: { ga: 2.75, gh: 4.3, // Hap Lagan: a Contractor alone on a raft, the Fool's Step on a harmonica; Bob the cork bobbing (a soft pop off the beat)
    arrive: (L, i) => [...drone([52, 59]), ...quote(STEP, 'harmonica', { v: 0.24 }), E('bubble', 1.5, 0.5, null, 0.15), E('bubble', 3.5, 0.5, null, 0.12)],
    hold: (L, i) => [...drone([52, 59]), E('harmonica', 0, 4, i ? 71 : 67, 0.12), E('bubble', 2.5, 0.5, null, 0.12)] },
  pursersBarge: { ga: 0.48, gh: 0.52, // the Bourse: the barge at anchor, lanterns lit: a lounge, the Rhodes and the upright on brushes
    arrive: (L, i) => [...[55, 59, 62, 66].map((n) => E('rhodes', 0, 3.8, n, 0.16)), E('upright', 0, 2, 43, 0.12), E('upright', 2, 2, 50, 0.1), E('brush', 1, 1, null, 0.3), E('brush', 3, 1, null, 0.3), ...(i === 3 ? [E('vibes', 0, 2, 71, 0.18)] : [])],
    hold: (L, i) => [...(i ? [52, 55, 59, 62] : [55, 59, 62, 66]).map((n) => E('rhodes', 0, 3.8, n, 0.13)), E('upright', 0, 4, i ? 40 : 43, 0.1), E('brush', 2, 1, null, 0.22)] },
  mirrorSea: { ga: 0.76, gh: 1.66, // the Glass: your double beside you: the Answer and its echo a beat behind, an octave up, on glass
    arrive: (L, i) => [...drone([52, 59, 64]), ...quote(MOTIF.ANSWER, 'vibes', { v: 0.22 }), ...quote(MOTIF.ANSWER, 'celesta', { at: 1, up: 12, v: 0.14 }), E('shimmer', 0, 4, [64, 67, 71], 0.06)],
    hold: (L, i) => [...drone([52, 59, 64]), E('vibes', 0, 2, 76, 0.14), E('celesta', 1, 2, 88, 0.09), E('shimmer', 0, 4, [64, 67, 71], 0.05)] },
  driftBottle: { ga: 2.3, gh: 5.6, // a drift bottle: a music box in the light, a cork's pop
    arrive: (L, i) => [...drone([64, 71], 0.04), ...(i % 2 === 0 ? quote(MOTIF.AWAKEN, 'celesta', { up: 12, v: 0.18 }) : []), ...(i === 0 ? [E('bubble', 0, 0.5, null, 0.2)] : [])],
    hold: (L, i) => [...drone([64, 71], 0.04), E('harp', 0, 2, 76, 0.14), E('harp', 2, 2, 83, 0.1)] },
};

// ---- the launch and the arrive (the island rising: the tally over it)
const LAUNCH = (i) => [E('pad', 0, 4.2, [52, 59, 64], 0.06, { cutoff: 1200 }), ...(i === 0 ? quote(MOTIF.ANSWER, 'bell', { up: -12, v: 0.25 }) : []), ...(i === 1 ? [E('whale', 0, 4, 52, 0.12)] : []),
  ...(i >= 2 ? [E('kick', 0, 1, null, 0.6), E('kick', 2, 1, null, 0.5), E('tick', 1, 0.5, null, 0.12), E('tick', 3, 0.5, null, 0.12)] : []), ...(i === 3 ? [E('riser', 0, 4, null, 0.3), ...fill(0.5)] : [])];
const ARRIVE = (i) => (i === 0 ? [E('crash', 0, 1, null, 0.45), E('bell', 0, 1, 76, 0.32), ...quote(MOTIF.ANSWER, 'brass', { v: 0.3 }), E('strings', 0, 8, [52, 56, 59, 64, 68], 0.08, { attack: 0.2 }), E('kick', 0, 1, null, 0.7)]
  : i === 1 ? [...[64, 68, 71, 76, 80].map((n, k) => E('harp', k * 0.2, 2, n + 12, 0.2)), E('shimmer', 0, 4, [64, 68, 71], 0.1)]
    : [E('pad', 0, 4.2, [52, 56, 59, 64], 0.05, { cutoff: 1600 }), ...(i === 3 ? [E('bell', 0, 2, 88, 0.14)] : [])]);

/** The bars of each part of a leg: its own (the runtime hands the schedule's), else the rail's table (Dovina's LEGS: one source, so the
 *  cue and the leg runner never disagree), else open 8, release 4 and the rest split between the build and the peak. */
const RAIL_ID = { nobody: 'leviathan' }; // (the music's name for Old Nobody's leg; the rail's is its director's)
export function phasesOf(leg) {
  if (leg.phases) return leg.phases;
  const P = !leg.bars && RAIL[RAIL_ID[leg.id] || leg.id]?.phases;
  if (P) return { open: P.open, build: P.build, peak: P.peak, release: P.release };
  const bars = Math.max(16, leg.bars || 48), mid = bars - 12, build = Math.round(mid / 2);
  return { open: 8, build, peak: mid - build, release: 4 };
}
/** Where everything falls, in bars from the launch's first: the runtime's schedule reads the same numbers. */
export function tripLayout(legs) {
  let at = 4; const out = [], turns = [];
  legs.forEach((leg, k) => {
    if (k > 0) { turns.push(at); at += 4; }
    if (leg.id === 'encounter') { out.push({ id: 'encounter', at, end: at + 6, held: true }); at += 6; return; } // (its hold loops until the choice: what follows moves with it)
    const p = phasesOf(leg), o = { id: leg.id, at, open: at, build: at + p.open, peak: at + p.open + p.build, release: at + p.open + p.build + p.peak };
    o.end = o.release + p.release; at = o.end; out.push(o);
  });
  return { bars: at + 4, legs: out, turns };
}

const CACHE = new Map();
/** The crossing's score for a passage's legs (cached by their ids, lengths and feelings). */
export function tripCue(legs) {
  const key = legs.map((l) => `${l.id}:${l.bars || ''}:${l.aspect || ''}:${l.feeling || ''}:${l.storm ? 's' : ''}`).join('|');
  if (CACHE.has(key)) return CACHE.get(key);
  const sections = [{ id: 'launch', bars: 4, gain: 4, sweep: [1200, 18000], bar: LAUNCH }];
  const Ls = legs.map((leg) => {
    const base = LEGS[leg.id] || LEGS.shoal, aspect = leg.aspect || 'grief';
    return { ...base, id: LEGS[leg.id] ? leg.id : 'shoal', aspect, feeling: leg.feeling || null, storm: !!leg.storm, prog: base.prog || MODE_PROG[aspect] || MODE_PROG.grief };
  });
  Ls.forEach((L, k) => {
    if (k > 0) sections.push({ id: `turn:${k}`, bars: 4, gain: 2.6, sweep: [700, 16000], root: 64 + keyed(0, L), bar: (i) => turnBar(Ls[k - 1], L, i, k) });
    if (L.id === 'encounter') { const C = ENCOUNTER[legs[k].encounter] || ENCOUNTER.driftBottle;
      sections.push({ id: `encounter:${k}:arrive`, bars: 4, gain: 4 * C.ga, root: 64, bar: (i) => C.arrive(L, i) }, { id: `encounter:${k}:hold`, bars: 2, gain: 4 * C.gh, root: 64, hold: true, bar: (i) => C.hold(L, i) });
      return; }
    const p = phasesOf(legs[k]);
    for (const ph of ['open', 'build', 'peak', 'release']) {
      if (!p[ph]) continue; // (a calm has no peak)
      sections.push({ id: `${L.id}:${ph}`, bars: p[ph], gain: (ph === 'peak' ? 3.2 : ph === 'release' ? 4 : 2.6) * (L.storm && ph !== 'release' ? 1.15 : 1), pump: ph === 'peak' && L.groove !== 'none' && L.groove !== 'half',
        sweep: ph === 'release' ? [9000, 2200] : null, hold: L.id === 'calm' && ph === 'release', root: 64 + keyed(0, L), scale: L.id === 'maelstrom' ? MODES[L.aspect] : L.feeling && MODES[L.feeling] ? MODES[L.feeling] : L.id === 'calm' ? MODES.mirth : null,
        bar: (i) => legBar(L, ph, i, p[ph]) });
    }
  });
  sections.push({ id: 'arrive', bars: 4, gain: 5.5, bar: ARRIVE });
  const score = { title: 'Crude Sea: the Crossing', family: 'crossing', root: 64, bpm: BPM, arrange: true, loopFrom: null, moodless: true, tail: 4, sections,
    jump: (sec, bar) => (sections[sec].hold && bar >= sections[sec].bars - 1 && R.waiting ? sec : null) }; // (an encounter's hold waits for the choice)
  CACHE.set(key, score);
  return score;
}

/** The sound test's crossing (music/soundtest.js): four legs, each a minute long, so every boss is heard, and the Cantor between. */
export const CROSSING_TOUR = tripCue([{ id: 'shoal', bars: 40 }, { id: 'wreckers', bars: 40 }, { id: 'encounter', encounter: 'lightWhale' }, { id: 'graveyard', bars: 40 }, { id: 'nobody', bars: 40 }]);
