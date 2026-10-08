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
//          the storm wall  E Phrygian, two-step at 160      the Five in the lead guitar, the warp's growl
//          the graveyard   F minor (Lachryma's key)         the Beacon: a foghorn and the drowned lighthouse's lamp turning
//          the maelstrom   E in the place's feeling's mode  the Whirl, round and down, on the feeling's own voice
//          a calm          G major                          a music box (the harp and the celesta), the whale; no drums but a tick
//          a bounty        B minor, four on the floor       the Five as a WANTED poster: brass stabs
//   THE STACK (Rez's layers, Mizuguchi's: the music thickens as you play): how many of a leg's eight parts sound (a pad and a pulse, the
//          hats, the bass, the arpeggio, the snare and the shimmer, the theme, its counter and the choir, the boss's line). Each phase
//          has its own (open builds a part every two bars, the peak is the thickest, a boss's peak thicker still), and every lock, down
//          and part shot off a boss adds heat that lifts it (railHeat); the heat cools a quarter of a part a bar. Bars are laid out one
//          ahead, so a layer joins on the next bar line (quantised: the lock tones themselves wait for the sixteenth, audio/rail.js).
//   THE TURN 4 bars: the drums cut on the third beat with a reversed swell, a riser and a whoosh as the rail bends, the next leg's
//          dominant under it, toms and a snare roll, and the next leg's first bar lands with a crash in its own key.
// Under the surface (the Umbral form) the whole mix is low-passed, and breaching lifts it (music/player.js setUnder, audio/core.js).
//
// Prior art: Rez (Mizuguchi, 2001: the stage's music built from the player's own shots, layer by layer), Child of Eden, Panzer Dragoon
// Orta's forms, Star Fox 64's leg-by-leg score, KH2's Gummi missions, the trance arrangement (open, build, drop, breakdown), Crywolf's
// drop and the owner's holes (docs/OST.md section 6), and this game's own motifs and Crude Sea (music/emocean.js), whose parts it keeps.
//
//   import { tripCue, tripLayout, railHeat, HEAT, LEGS } from './legs.js'
//   tripCue(legs) -> the crossing's score (cached): legs = [{ id: 'shoal'|'wreckers'|'nobody'|'stormwall'|'graveyard'|'maelstrom'|'calm'|'bounty',
//     bars: 24..64, aspect?: the maelstrom's feeling, phases?: { open, build, peak, release } }]   (music/choose.js, game.emocean.stage.legs)
//   tripLayout(legs) -> { bars, legs: [{ id, at, open, build, peak, release, end }], turns: [bar] } (the stage's bars, for the runtime)
//   railHeat(n) adds heat (HEAT.lock, .volley, .down, .part, .core: music/choose.js hears the rail's events)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';
import { VERSE, CHORUS } from './shanty.js';
import { MODES } from './mood.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
export const BPM = 160;
const R = { heat: 0 };
export const HEAT = { lock: 0.12, volley: 0.4, down: 0.3, part: 1, core: 2 };
export function railHeat(n = 0) { R.heat = Math.max(0, Math.min(3, R.heat + n)); }

// ---- each leg: its key (semitones from E), its four chords ([semitones from the key, minor?]), its groove, its voices
const m = true, M = false;
export const LEGS = {
  shoal: { tr: 0, prog: [[0, m], [8, M], [10, M], [7, m]], groove: 'four', arp: 'koto', lead: 'sax', boss: false },
  wreckers: { tr: 5, prog: [[0, m], [10, M], [0, m], [7, m]], groove: 'jig', arp: 'twinkle', lead: 'fiddle', boss: true },
  nobody: { tr: -3, prog: [[0, m], [8, M], [5, m], [7, M]], groove: 'half', arp: 'harp', lead: 'brass', boss: true },
  stormwall: { tr: 0, prog: [[0, m], [1, M], [0, m], [10, m]], groove: 'two', arp: 'koto', lead: 'shred', boss: false },
  graveyard: { tr: 1, prog: [[0, m], [8, M], [3, M], [7, M]], groove: 'half', arp: 'celesta', lead: 'brass', boss: true },
  maelstrom: { tr: 0, prog: null, groove: 'break', arp: 'twinkle', lead: null, boss: true },
  calm: { tr: 3, prog: [[0, M], [9, m], [5, M], [7, M]], groove: 'none', arp: 'harp', lead: 'celesta', boss: false },
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
  half: () => [E('taiko', 0, 1, null, 0.4, { size: 1.1 }), E('kick', 2.5, 1, null, 0.5), E('taiko', 3, 1, null, 0.25), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, 0.16))],
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
  stormwall: (L, i) => (i % 2 === 0 ? quote(MOTIF.FIVE, 'shred', { x: 0.75, v: 0.3 }) : quote(MOTIF.TEAR, 'shred', { up: 12, v: 0.26, o: { vib: 0.04 } })),
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
function stackOf(phase, i, L) {
  const base = phase === 'open' ? Math.min(4, 1 + (i >> 1)) : phase === 'build' ? Math.min(6, 4 + (i >> 3)) : phase === 'peak' ? (L.boss ? 7 : 6) : 3;
  return Math.min(8, base + Math.round(R.heat));
}
function legBar(L, phase, i, len) {
  R.heat = Math.max(0, R.heat - 0.25); // (the heat cools a quarter of a part a bar)
  const c = chordOf(L, i), s = stackOf(phase, i, L), peakBoss = phase === 'peak' && L.boss, out = [...PAD(L, c, 1), ...PULSE(L)];
  const last = i === len - 1;
  if (s >= 2) out.push(...GROOVE[L.groove]());
  if (s >= 3) out.push(...BASS(L, c, i, peakBoss));
  if (s >= 4) out.push(...ARP(L, c, i));
  if (s >= 5) out.push(...SNARE(L, c));
  if (s >= 6) out.push(...THEME[L.id](L, i));
  if (s >= 7) out.push(E('voice', 0, 4, c.tri[0], 0.06, { vowel: 'a' }), E('voice', 0, 4, c.tri[2], 0.05, { vowel: 'a' }));
  if (s >= 8 || (peakBoss && s >= 7)) out.push(...(BOSS[L.id]?.(L, i) || []));
  if (i === 0 && phase !== 'release') out.push(E('crash', 0, 1, null, phase === 'peak' ? 0.5 : 0.35), ...(phase === 'peak' ? [E('impact', 0, 1, null, 0.4)] : []));
  if (phase === 'peak' && i % 8 === 7 && L.groove !== 'none') out.push(...fill(0.45));
  if (last && phase === 'build') return [...out.filter((e) => e.b < 2), E('reverse', 2, 2, null, 0.4)]; // (the hole into the peak: cut at the third beat)
  if (phase === 'release') return [...out.filter((e) => !['kick', 'clap', 'snare', 'eight', 'moog'].includes(e.i)), ...(i === 0 ? [E('crash', 0, 1, null, 0.3)] : [])];
  return out;
}

// ---- the turn of the rail: from one leg's key into the next's, four bars
function turnBar(A, B, i) {
  const ca = chordOf(A, 0), nb = chordOf(B, 0), dom = { ...nb, tri: [nb.tri[0] + 7, nb.tri[0] + 11, nb.tri[0] + 14].map((n) => (n > 72 ? n - 12 : n)), bass: nb.bass + 7 > 47 ? nb.bass - 5 : nb.bass + 7 };
  if (i === 0) return [E('kick', 0, 1, null, 0.7), ...PAD(A, ca, 1), E('reverse', 2, 2, null, 0.4), E('whoosh', 1, 3, null, 0.35)];
  if (i === 1) return [E('riser', 0, 12, null, 0.3), E('supersaw', 0, 4.1, dom.tri, 0.06, { cutoff: 1800 }), E('sub', 0, 4, dom.bass, 0.18), E('tom', 3, 0.5, null, 0.3, { pitch: 140 })];
  if (i === 2) return [E('kick', 0, 1, null, 0.6), E('kick', 2, 1, null, 0.6), E('supersaw', 0, 4.1, dom.tri, 0.07, { cutoff: 3000 }), ...[0, 1, 2, 3].map((k) => E(B.arp, 2 + k * 0.5, 0.4, nb.tri[k % 3] + 12, 0.16)), E('whoosh', 0, 4, null, 0.3)];
  return [E('kick', 0, 1, null, 0.7), E('supersaw', 0, 4.1, dom.tri, 0.08, { cutoff: 6000 }), ...fill(0.55), ...[0, 0.5, 1, 1.5].map((b, k) => E('tom', b, 0.5, null, 0.35, { pitch: 180 - k * 25 }))];
}

// ---- the launch and the arrive (the island rising: the tally over it)
const LAUNCH = (i) => [E('pad', 0, 4.2, [52, 59, 64], 0.06, { cutoff: 1200 }), ...(i === 0 ? quote(MOTIF.ANSWER, 'bell', { up: -12, v: 0.25 }) : []), ...(i === 1 ? [E('whale', 0, 4, 52, 0.12)] : []),
  ...(i >= 2 ? [E('kick', 0, 1, null, 0.6), E('kick', 2, 1, null, 0.5), E('tick', 1, 0.5, null, 0.12), E('tick', 3, 0.5, null, 0.12)] : []), ...(i === 3 ? [E('riser', 0, 4, null, 0.3), ...fill(0.5)] : [])];
const ARRIVE = (i) => (i === 0 ? [E('crash', 0, 1, null, 0.45), E('bell', 0, 1, 76, 0.32), ...quote(MOTIF.ANSWER, 'brass', { v: 0.3 }), E('strings', 0, 8, [52, 56, 59, 64, 68], 0.08, { attack: 0.2 }), E('kick', 0, 1, null, 0.7)]
  : i === 1 ? [...[64, 68, 71, 76, 80].map((n, k) => E('harp', k * 0.2, 2, n + 12, 0.2)), E('shimmer', 0, 4, [64, 68, 71], 0.1)]
    : [E('pad', 0, 4.2, [52, 56, 59, 64], 0.05, { cutoff: 1600 }), ...(i === 3 ? [E('bell', 0, 2, 88, 0.14)] : [])]);

/** The bars of each part of a leg: its own, or open 8, release 4 and the rest split between the build and the peak. */
export function phasesOf(leg) {
  if (leg.phases) return leg.phases;
  const bars = Math.max(16, leg.bars || 48), mid = bars - 12, build = Math.round(mid / 2);
  return { open: 8, build, peak: mid - build, release: 4 };
}
/** Where everything falls, in bars from the launch's first: the runtime's schedule reads the same numbers. */
export function tripLayout(legs) {
  let at = 4; const out = [], turns = [];
  legs.forEach((leg, k) => {
    if (k > 0) { turns.push(at); at += 4; }
    const p = phasesOf(leg), o = { id: leg.id, at, open: at, build: at + p.open, peak: at + p.open + p.build, release: at + p.open + p.build + p.peak };
    o.end = o.release + p.release; at = o.end; out.push(o);
  });
  return { bars: at + 4, legs: out, turns };
}

const CACHE = new Map();
/** The crossing's score for a passage's legs (cached by their ids, lengths and feelings). */
export function tripCue(legs) {
  const key = legs.map((l) => `${l.id}:${l.bars || ''}:${l.aspect || ''}`).join('|');
  if (CACHE.has(key)) return CACHE.get(key);
  const sections = [{ id: 'launch', bars: 4, gain: 4, sweep: [1200, 18000], bar: LAUNCH }];
  const Ls = legs.map((leg) => {
    const base = LEGS[leg.id] || LEGS.shoal, aspect = leg.aspect || 'grief';
    return { ...base, id: LEGS[leg.id] ? leg.id : 'shoal', aspect, prog: base.prog || MODE_PROG[aspect] || MODE_PROG.grief };
  });
  Ls.forEach((L, k) => {
    if (k > 0) sections.push({ id: `turn:${k}`, bars: 4, gain: 2.6, sweep: [700, 16000], root: 64 + keyed(0, L), bar: (i) => turnBar(Ls[k - 1], L, i) });
    const p = phasesOf(legs[k]);
    for (const ph of ['open', 'build', 'peak', 'release']) {
      sections.push({ id: `${L.id}:${ph}`, bars: p[ph], gain: ph === 'peak' ? 2.4 : ph === 'release' ? 2.8 : 2.6, pump: ph === 'peak' && L.groove !== 'none' && L.groove !== 'half',
        sweep: ph === 'release' ? [9000, 2200] : null, root: 64 + keyed(0, L), scale: L.id === 'maelstrom' ? MODES[L.aspect] : L.id === 'calm' ? MODES.mirth : null,
        bar: (i) => legBar(L, ph, i, p[ph]) });
    }
  });
  sections.push({ id: 'arrive', bars: 4, gain: 4.5, bar: ARRIVE });
  const score = { title: 'Crude Sea: the Crossing', root: 64, bpm: BPM, arrange: true, loopFrom: null, moodless: true, tail: 4, sections };
  CACHE.set(key, score);
  return score;
}

/** The sound test's crossing (music/soundtest.js): four legs, each a minute long, so every boss is heard. */
export const CROSSING_TOUR = tripCue([{ id: 'shoal', bars: 40 }, { id: 'wreckers', bars: 40 }, { id: 'graveyard', bars: 40 }, { id: 'nobody', bars: 40 }]);
