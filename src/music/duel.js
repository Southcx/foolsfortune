// ---------------------------------------------------------------------------------------
// THE PUZZLE DUEL'S CUE (a placeholder title, Espada's to name; docs/plans/PUZZLE-DUELS.md): the music while a puzzle duel is open
// (game.duel.active), a versus puzzle's score. G major at 132, a bar 1.8 real seconds. G because the board's gems are its notes: the
// duel's sounds (audio/puzzleduel.js) pitch each feeling as a step of the major pentatonic over the cue's root, and G major pentatonic
// is the house's two motifs' own (music/motifs.js: the FIVE, E D B A G, falling; the ANSWER, G A B D E, climbing). So the two sides are
// the two motifs: on the foe's turn the Five falls on a dark voice, on yours the Answer climbs; every clear lands inside the chord.
//   OPEN      2 bars: the tsuitate standing up, a riser, the pizzicato counting in
//   EVEN      8 bars, looped: the Line near the middle. A bouncy four on the floor, the pizzicato's eighths, the motif of whose turn it
//             is on the marimba (yours) or low dark strings (the foe's), I vi IV V
//   AHEAD     8 bars, looped: the Line pushed well onto the foe's half. Brighter: the twinkle's arps, the open hat, the Answer on the
//             vibes an octave up, the supersaw under it
//   PINCH     8 bars, looped: your half nearly gone, or a load waiting to land on you. The relative minor (E minor: the same five notes,
//             so the clears still fit), a heartbeat in the sub, the ticks doubled, low strings in tremolo, the Five falling under it all
//   PRACTICE  8 bars, looped: Strawman's practice duel (game.duel.practice, South 2026-10-27): no drums, the marimba and the pad, the
//             Answer at a walk. It never leaves this section: no pinch, no peak; the sparring circle, not a fight
// THE LANTERN WISP (its aberrant's Elite duel, ABERRANTS.md): its own colour over each fighting section: the fen's flute leading
// astray and its lantern's flicker, dimming as its light goes (`fen`). The aberrant slip jelly's: Gall's growl and a harmonica's sour
// bend, heavier as its slime piles (`gall`).
// THE HEAT: each step of a chain of yours (duel.chain, its step) raises the heat; it falls a step a bar. At 3 the hats and the 808 come in,
// at 5 a crash on the bar and the supersaw: a cascade heard as the music lifting (Lumines', Tetris Effect's).
// A section changes on its phrase's last bar (every 4), but into the pinch at once, on the next bar line.
//
// Prior art: Puyo Puyo's versus themes (the pinch theme when your side fills, Puyo Puyo Tetris's), Tetris 99's and Tetris Effect's
// layers rising with the play, Lumines (the music the board's clock), Into the Breach (the foe's turn its own quiet), iMUSE's resequencing
// on the bar line (as music/greatjelly.js).
//
//   DUEL (the score)   hearDuel(game)   (music/choose.js, while game.duel.active)
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const D = { line: 0.5, mine: true, pinch: false, practice: false, heat: 0, heard: null, wisp: false, lamp: 1, jelly: false, sag: 0 };

/** The duel as the music last heard it: its Line's share of the board that is yours, whose turn, the pinch, practice; and the chain's
 *  heat, from duel.chain on the bus (subscribed once a game). */
export function hearDuel(game) {
  if (D.heard !== game && game.events?.on) { D.heard = game; game.events.on('duel.chain', (e) => { if (e.by === 'courier') D.heat = Math.max(D.heat, e.step | 0); }); }
  const G = game.duel, s = G?.state, b = s?.board;
  D.practice = !!G?.practice;
  const secret = s?.rs?.secret; // (the aberrant's own colour, by its ruleset's secret: rulesets.js)
  D.wisp = !D.practice && secret === 'snuff'; D.lamp = D.wisp ? 1 - (s?.secret?.k ?? 0) : 1; // (the aberrant Lantern Wisp: its fen colour, its lantern's light)
  D.jelly = !D.practice && secret === 'dissolve'; D.sag = D.jelly ? s?.secret?.k ?? 0 : 0; // (the aberrant slip jelly: Gall's colour, heavier as its slime piles)
  if (!b) return;
  D.line = b.line / Math.max(1, b.w);
  D.mine = s.toMove === 0;
  const waiting = s.sides?.[0]?.pending || 0, per = s.perColumn || 3;
  D.pinch = D.line <= 0.25 || waiting >= per * 2;
}

const ROOT = { G: 43, Em: 40, C: 36, D: 38, Am: 45, Bm: 47 };
const TRI = { G: [67, 71, 74], Em: [64, 67, 71], C: [64, 67, 72], D: [62, 66, 69], Am: [64, 69, 72], Bm: [62, 66, 71] };
const EVEN_CH = ['G', 'Em', 'C', 'D'], AHEAD_CH = ['G', 'D', 'Em', 'C'], PINCH_CH = ['Em', 'C', 'D', 'Em'], CALM_CH = ['G', 'C', 'Em', 'D'];

const four = (v = 1) => [0, 1, 2, 3].map((b) => E('kick', b, 1, null, 0.7 * v)).concat([1, 3].map((b) => E('snap', b, 1, null, 0.4 * v)));
const pizz = (c, v = 0.2) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E('pizz', b, 0.5, TRI[c][[0, 1, 2, 1][k % 4]] - 12, v * (k % 2 ? 0.7 : 1)));
const bass = (c, v = 0.35) => [E('upright', 0, 1, ROOT[c], v), E('upright', 1.5, 0.5, ROOT[c] + 7, v * 0.7), E('upright', 2, 1, ROOT[c], v * 0.85), E('upright', 3.5, 0.5, ROOT[c] + 12, v * 0.6)];
const pad = (c, v = 0.05) => [E('pad', 0, 4.2, TRI[c].map((n) => n - 12), v, { cutoff: 1500 })];
const hats = (v = 0.18) => [...Array(8)].map((_, n) => E('hat', n * 0.5, 0.25, null, v * (n % 2 ? 1 : 0.6)));
const ticks = (v = 0.16) => [...Array(16)].map((_, n) => E('tick', n * 0.25, 0.25, null, v * (n % 4 === 0 ? 1.2 : 0.7)));
const eight = (c, v = 0.4) => [E('eight', 0, 1.5, ROOT[c], v), E('eight', 2.5, 1, ROOT[c], v * 0.7)];
const twinkle = (c, v = 0.12) => [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((b, n) => E('twinkle', b, 0.4, TRI[c][n % 3] + (n % 6 >= 3 ? 12 : 0), v * (n % 4 ? 0.7 : 1)));
/** Whose turn, as a motif: yours the Answer climbing (G A B D E), the foe's the Five falling (E D B A G), every other bar. */
const turnTune = (i, inst, up = 0, v = 0.3) => (i % 2 ? [] : D.mine ? quote(MOTIF.ANSWER, inst, { up, v }) : quote(MOTIF.FIVE, 'strings', { up: up - 12, v: v * 0.4, o: { attack: 0.05, bright: 900 } }));
/** The chain's heat as layers over a fighting section: at 3 the hats and the 808, at 5 a crash and the supersaw. */
const heat = (i, c) => [...(D.heat >= 3 ? [...hats(0.16), ...eight(c, 0.35)] : []), ...(D.heat >= 5 ? [E('supersaw', 0, 4, TRI[c], 0.06, { cutoff: 2600 }), ...(i % 2 === 0 ? [E('crash', 0, 1, null, 0.35)] : [])] : [])];
/** THE LANTERN WISP'S COLOUR (ABERRANTS.md 3: the fens at night): a shakuhachi wandering off the beat every fourth bar, a phrase that
 *  leads you astray (it climbs, then turns aside onto the seventh), and its lantern as a celesta's flicker high over the chord: four a
 *  bar while it burns full, fewer and skipping as its light goes (D.lamp, from its secret's k). Only the lantern's own light, never a
 *  cue that names the secret. */
const fen = (i, c) => {
  if (!D.wisp) return [];
  const ev = [];
  if (i % 4 === 1) ev.push(E('shakuhachi', 0.5, 1.2, 74, 0.22, { scoop: 2 }), E('shakuhachi', 1.75, 0.75, 79, 0.2), E('shakuhachi', 2.5, 1.4, 78, 0.2, { bend: -1 }));
  const lit = Math.round(D.lamp * 4);
  [0.25, 1.25, 2.25, 3.25].forEach((b, k) => { if (k < lit && (D.lamp > 0.5 || (i + k) % 3)) ev.push(E('celesta', b + (D.lamp < 0.5 ? 0.12 * (k % 2) : 0), 0.5, TRI[c][k % 3] + 12, 0.07 + 0.05 * D.lamp)); });
  return ev;
};
/** THE SLIP JELLY'S COLOUR (ABERRANTS.md 5: Gall, the curdled feeling): a wobbling growl under the bass on the off-beats, slower as its
 *  slime piles (D.sag), and every fourth bar a harmonica's sour blue bend, the jelly's sulk; bubbles of the marimba popping high. */
const gall = (i, c) => {
  if (!D.jelly) return [];
  const ev = [0.5, 1.5, 2.5, 3.5].map((b) => E('growl', b, 0.4, ROOT[c], 0.14, { rate: 6 - 3 * D.sag }));
  if (i % 4 === 2) ev.push(E('harmonica', 0.5, 1.5, TRI[c][1] + 3, 0.18, { bend: -1, blue: true }), E('harmonica', 2.25, 1.2, TRI[c][0], 0.15, { bend: 1 }));
  [0.75, 2.75].forEach((b, k) => ev.push(E('marimba', b, 0.25, TRI[c][(i + k) % 3] + 24, 0.06)));
  return ev;
};
const cool = () => { D.heat = Math.max(0, D.heat - 1); }; // (a step a bar)

const SECTIONS = [
  { id: 'open', bars: 2, gain: 7, bar: (i) => (i === 0 ? [E('riser', 0, 8, null, 0.2), ...pad('G', 0.05), E('bell', 0, 1, 79, 0.12)]
    : [...pizz('D', 0.18), E('pizz', 3.5, 0.5, 62, 0.25), E('reverse', 2, 2, null, 0.25)]) },
  { id: 'even', bars: 8, gain: 3, bar: (i) => { const c = EVEN_CH[i % 4], ev = [...four(), ...pizz(c), ...bass(c), ...pad(c), ...turnTune(i, 'marimba', 0, 0.3), ...heat(i, c), ...fen(i, c), ...gall(i, c)]; cool();
    if (!D.mine) return ev.filter((e) => e.i !== 'snap'); // (the foe's turn: the backbeat holds its breath)
    return ev; } },
  { id: 'ahead', bars: 8, gain: 3.5, bar: (i) => { const c = AHEAD_CH[i % 4], ev = [...four(1.05), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('ohat', b, 0.5, null, 0.16)), ...twinkle(c), ...bass(c, 0.32),
    ...pad(c, 0.04), E('supersaw', 0, 4, TRI[c], 0.03, { cutoff: 1800 }), ...turnTune(i, 'vibes', 12, 0.26), ...heat(i, c), ...fen(i, c), ...gall(i, c), ...(i % 4 === 0 ? [E('crash', 0, 1, null, 0.3)] : [])]; cool(); return ev; } },
  { id: 'pinch', bars: 8, gain: 6, scale: [0, 2, 4, 7, 9], bar: (i) => { const c = PINCH_CH[i % 4];
    const ev = [...[0, 2].flatMap((b) => [E('kick', b, 1, null, 0.6), E('kick', b + 0.28, 1, null, 0.4)]), ...ticks(), E('sub', 0, 4, ROOT[c], 0.012),
      ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => E('strings', b, 0.5, ROOT[c] + 12, 0.1, { spic: true, bright: 1300 })), ...pad(c, 0.06),
      ...(i % 2 ? [] : quote(MOTIF.FIVE, 'marimba', { up: -12, v: 0.26 })), ...heat(i, c), ...fen(i, c), ...gall(i, c), ...(i === 7 ? [E('riser', 0, 4, null, 0.2)] : [])]; cool(); return ev; } },
  { id: 'practice', bars: 8, gain: 3.4, bar: (i) => { const c = CALM_CH[i % 4]; D.heat = 0;
    return [...pad(c, 0.06), ...[0, 1, 2, 3].map((b, k) => E('marimba', b, 1, TRI[c][k % 3], 0.16)), E('upright', 0, 2, ROOT[c], 0.28), E('upright', 2, 2, ROOT[c] + 7, 0.2),
      ...(i % 4 === 0 ? quote(MOTIF.ANSWER, 'celesta', { up: 12, x: 2, v: 0.14 }) : [])]; } },
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));

/** Where the duel's music goes after this bar: practice stays put; the pinch comes at once; the rest change on a phrase's end. */
function jump(section, bar) {
  const id = SECTIONS[section].id, want = D.practice ? 'practice' : D.pinch ? 'pinch' : D.line >= 0.65 ? 'ahead' : 'even';
  if (id === 'open') return bar >= 1 ? AT[want] : null;
  if (want === id) return bar >= SECTIONS[section].bars - 1 ? section : null;
  if (want === 'pinch' || id === 'practice' || want === 'practice') return AT[want]; // (danger, or a practice duel, is heard on the next bar line)
  return bar % 4 === 3 ? AT[want] : null; // (the rest wait for the phrase's end)
}

export const DUEL = { title: 'The Duel', root: 67, bpm: 132, arrange: true, loopFrom: 0, moodless: true, fadeIn: 0.6, tail: 2, scale: [0, 2, 4, 7, 9], sections: SECTIONS, jump };

// the sound test's tour (music/soundtest.js): each section once, the turns trading and a chain climbing through them
const TOUR = ['open', 'even', 'ahead', 'pinch', 'practice'];
export const DUEL_TOUR = { ...DUEL, title: 'The Duel (each section, in short)', jump: (section, bar) => {
  const id = SECTIONS[section].id; D.mine = bar % 4 < 2; D.practice = false; if (id === 'ahead' && bar === 2) D.heat = 6;
  if (bar < (id === 'open' ? 1 : 3)) return null;
  const k = TOUR.indexOf(id);
  return k === TOUR.length - 1 ? -1 : AT[TOUR[k + 1]];
} };
