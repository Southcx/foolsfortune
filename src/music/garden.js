// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S CUE: "A Garden in the Jar", the Inner Realm inside the Pneuka Jar (docs/plans/SPIRIT-GARDEN.md): a home between
// adventures, small enough to hold, and it is yours, so it is sung in your feeling. Two things move it, read as each bar is laid out:
//   THE DAY'S PHASE (progress/weather.js phaseAt): the section, changed on the bar line (the arranger's `jump`)
//     DAWN   8 bars   harp arpeggios, the tune on a celesta, birdsong in the high celesta, a brush or two
//     DAY    16 bars  the garden at work: a bossa on brushes and the upright, the Rhodes comping, the tune on the steel pan (a toy's
//                     cheer: the Chao Garden's), then on a flute over the tapped guitar
//     DUSK   8 bars   the brushes in half time, the tune on a soft sax, strings
//     NIGHT  8 bars   the moonflower open: a music box (celesta and harp), the shimmer, no drums
//   YOUR DRAUGHT (the feeling of the Lachryma last drunk, progress/stones.js): the mode everything is in (music/mood.js MODES: wonder
//     Lydian, mirth major, desire Dorian, grief minor, dread the In scale), its four chords, and the tune: the Answer's climb (music/
//     motifs.js) sung in that mode, so the same garden sounds like each feeling you bring into it. No draught: wonder.
// 92 bpm, a light swing written as triplets. E, the game's key, so the garden is home ground.
//
// Prior art: Sonic Adventure's Chao Garden (a jazzy lounge for a place of care), Super Mario Galaxy's Comet Observatory (the hub's
// tune turning with what you have done; the harp and the waltz of a small world in space), Animal Crossing's hourly music (the clock
// as the arrangement), and this game's own mood layer and modes (music/mood.js).
//
//   import { GARDEN, setGarden } from './garden.js'   setGarden({ phase: 'dawn'|'day'|'dusk'|'night', draught: aspect | null })  (music/choose.js)
// ---------------------------------------------------------------------------------------
import { MODES } from './mood.js';
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const SW = 2 / 3; // (the swung eighth: a triplet's second third)

/** What the garden plays in (music/choose.js sets it every frame from the clock and the draught). */
const G = { phase: 'day', draught: 'wonder', season: 'summer', rain: 0, briar: 0, loops: 0 };
export function setGarden({ phase = 'day', draught = null, season = 'summer', rain = 0, briar = 0 } = {}) {
  G.phase = phase; G.draught = MODES[draught] ? draught : 'wonder'; G.season = DRESS[season] ? season : 'summer'; G.rain = rain; G.briar = Math.max(0, Math.min(1, briar));
}
// B6, THE SEASONS (progress/seasons.js seasonOf; GARDEN-COZY.md E): one tune, re-dressed. Each season's lead a phase, its comping, how much
// of the kit plays, its tempo and its lift (the sparser seasons brought up to the others' level, measured): spring flute and harp, light; summer the steel pan and the brushes (the garden as it was); autumn the
// fiddle and the concertina, slower; winter a music box and bells, no drums, slowest. Rain strips the percussion (New Horizons' layer).
const DRESS = {
  spring: { dawn: 'flute', day: ['flute', 'harp'], dusk: 'flute', comp: 'harp', drums: 0.6, bpm: 92, bells: false, lift: 1 },
  summer: { dawn: 'celesta', day: ['steelpan', 'flute'], dusk: 'sax', comp: 'rhodes', drums: 1, bpm: 92, bells: false, lift: 1 },
  autumn: { dawn: 'fiddle', day: ['fiddle', 'concertina'], dusk: 'fiddle', comp: 'concertina', drums: 0.8, bpm: 84, bells: false, lift: 1.55 },
  winter: { dawn: 'celesta', day: ['celesta', 'vibes'], dusk: 'celesta', comp: 'harp', drums: 0, bpm: 76, bells: true, lift: 1.5 },
};
const dress = () => DRESS[G.season] || DRESS.summer;
const kit = () => (G.rain > 0.15 ? 0 : dress().drums); // (how much of the percussion plays)
// B3, THE TUNING: a briar planetoid's voices drift apart (Plomp and Levelt's roughness: a few cents beat slowly, a third of a semitone grates);
// the tune is never changed, only a shadow of it a little sharp under it, as loud as the briar is thick
const sour = () => G.briar * 0.35; // (semitones the shadow sits sharp: 0 calm .. 0.35 full briar)
const shadow = (ev, v = 0.6) => (G.briar < 0.08 ? [] : ev.filter((e) => e.n != null).map((e) => ({ ...e, n: Array.isArray(e.n) ? e.n.map((n) => n + sour()) : e.n + sour(), v: (e.v ?? 0.3) * v * G.briar })));

// each feeling's four chords, as [root above E, the chord's intervals]: I, the mode's colour, a turn, the way home
const CHORDS = {
  wonder: [[0, [0, 4, 7, 11]], [2, [0, 4, 7]], [9, [0, 3, 7, 10]], [7, [0, 4, 7]]], // (E maj7, F#/E: the Lydian II, C#m7, B)
  mirth: [[0, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]], [7, [0, 4, 7]]], // (E C#m A B)
  desire: [[0, [0, 3, 7, 10]], [5, [0, 4, 7]], [0, [0, 3, 7, 10]], [10, [0, 4, 7]]], // (Em7 A Em7 D: Dorian's major IV)
  grief: [[0, [0, 3, 7]], [8, [0, 4, 7]], [5, [0, 3, 7]], [7, [0, 4, 7]]], // (Em C Am B)
  dread: [[0, [0, 3, 7]], [1, [0, 4, 7]], [10, [0, 3, 7]], [0, [0, 3, 7]]], // (Em F Dm Em: the Tear in the harmony)
  fury: [[0, [0, 3, 7]], [6, [0, 4, 6]], [3, [0, 4, 7]], [0, [0, 3, 6]]], // (Em, A#(b5), G, E dim: the tritone pulling at both ends)
  gall: [[0, [0, 4, 7]], [1, [0, 4, 7]], [8, [0, 4, 7]], [0, [0, 4, 7]]], // (E F C E: Hijaz's own cadence, the flat second leaning home)
};
const R = 52; // (E3)
const chordAt = (i) => CHORDS[G.draught][i % 4];
const notes = (i, oct = 12) => { const [r, iv] = chordAt(i); return iv.map((x) => R + oct + r + x); };
const deg = (k, oct = 0) => { const m = MODES[G.draught], n = ((k % 5) + 5) % 5, o = Math.floor(k / 5); return R + 12 + oct + m[n] + 12 * o; }; // (the mode's k-th note above E4)
// the tune: the Answer's climb in the mode (five notes, one degree each), then its reply falling; a phrase a bar
const TUNE = [[[0, 0.5, 0], [0.5, 0.5, 1], [1, 0.5, 2], [1.5, 0.5, 3], [2, 2, 4]], [[0, 1, 4], [1 + SW, SW, 3], [2, 1, 2], [3, 1, 1]],
  [[0, 0.5, 2], [0.5, 0.5, 3], [1, 0.5, 4], [1.5, 0.5, 6], [2, 2, 5]], [[0, 1.5, 4], [1.5, 0.5, 2], [2, 2, 0]]];
const tune = (i, inst, v, oct = 12, o) => TUNE[i % 4].map(([b, d, k]) => E(inst, b, d, deg(k, oct), v, o));
const arp = (i, inst = 'harp', v = 0.2, oct = 0) => { const n = notes(i, oct); return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, k) => E(inst, b, 1, n[[0, 1, 2, 3, 2, 1, 0, 1][k] % n.length] + (k > 2 && k < 6 ? 12 : 0), v * (k % 2 ? 0.7 : 1))); };
const pad = (i, v = 0.05) => [E('pad', 0, 4.2, notes(i, 0), v, { cutoff: 1500 })];
const bass = (i, v = 0.1) => { const [r] = chordAt(i); return [E('upright', 0, 1.5, R - 12 + r, v), E('upright', 1.5, 1, R - 5 + r, v * 0.8), E('upright', 2 + SW, 1.3, R - 12 + r, v * 0.85)]; }; // (a bossa's root, fifth, root)
const comp = (i, v = 0.14) => { const C = dress().comp; return C === 'rhodes' ? [1 + SW, 3].flatMap((b) => notes(i, 0).map((n) => E('rhodes', b, 0.8, n, v, { pan: -0.2 }))) // (the Rhodes takes a note at a time)
  : C === 'concertina' ? [E('concertina', 1 + SW, 1.6, notes(i, 0), v * 1.4), E('concertina', 3, 0.9, notes(i, 0), v)] : arp(i, 'harp', v * 1.1, 12); };
const brushes = (v0 = 0.25, half = false) => { const v = v0 * kit(); return v <= 0 ? [] : [...(half ? [2] : [1, 3]).map((b) => E('brush', b, 1, null, v * 1.6)), ...[0, SW, 1, 1 + SW, 2, 2 + SW, 3, 3 + SW].map((b, k) => E('shaker', b, 0.3, null, v * (k % 2 ? 0.8 : 1.2))),
  ...[0, 1, 2, 3].map((b) => E('tick', b + SW, 0.3, null, v * 0.5))]; }; // (the swung hat: air on top, the owner's ear)
const birds = (i) => (i % 2 ? [] : [3.1, 3.25, 3.4].map((b, k) => E('celesta', b, 0.2, deg(5 + k * 2, 12), 0.06)));

const bells = (i) => (dress().bells && i % 2 === 0 ? [E('bell', 0, 1, deg(4, 12), 0.12)] : []);
const SECTIONS = [
  { id: 'dawn', bars: 8, get gain() { return 7 * dress().lift; }, get bpm() { return dress().bpm; }, bar: (i) => { const T = i % 4 < 2 ? tune(i, dress().dawn, 0.2) : []; return [...arp(i, 'harp', 0.22), ...pad(i, 0.05), ...T, ...shadow(T), ...shadow(pad(i, 0.05), 1.2), ...birds(i), ...bells(i), ...(i % 4 === 3 && kit() ? [E('brush', 2, 1, null, 0.15 * kit())] : [])]; } },
  { id: 'day', bars: 16, get gain() { return 2.4 * dress().lift; }, get bpm() { return dress().bpm; }, bar: (i) => {
    const [a, b] = dress().day, T = i < 8 ? tune(i, a, 0.3, a === 'steelpan' ? 0 : 12, { pan: 0.15 }) : tune(i, b, 0.28, 12);
    return [...brushes(0.24), ...bass(i), ...comp(i), ...pad(i, 0.04), E('shimmer', 0, 4, notes(i, 0), 0.08), ...T, ...shadow(T), ...shadow(pad(i, 0.04), 1.2),
      ...(i >= 8 && G.season === 'summer' ? [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((x, k) => E('twinkle', x, 0.5, notes(i, 12)[k % 3], 0.1)) : []),
      ...(i % 8 === 7 ? [E('vibes', 3, 1, deg(4, 12), 0.18)] : []), ...bells(i)];
  } },
  { id: 'dusk', bars: 8, get gain() { return 2.6 * dress().lift; }, get bpm() { return dress().bpm; }, bar: (i) => { const T = tune(i, dress().dusk, 0.26, dress().dusk === 'sax' ? 0 : 12); return [...brushes(0.2, true), ...bass(i, 0.09), ...comp(i, 0.12), E('strings', 0, 4, notes(i, 0), 0.06, { attack: 0.8, bright: 1800 }), ...T, ...shadow(T), ...bells(i)]; } },
  { id: 'night', bars: 8, get gain() { return 7.5 * dress().lift; }, get bpm() { return dress().bpm; }, bar: (i) => { const T = tune(i, 'celesta', 0.2, 12); return [...arp(i, 'harp', 0.14), ...T, ...shadow(T), E('shimmer', 0, 4, notes(i, 0), 0.06), ...pad(i, 0.04), ...shadow(pad(i, 0.04), 1.2),
    ...(i % 4 === 0 ? [E('vibes', 0, 2, deg(0, 12), 0.12)] : []), ...(G.season === 'autumn' ? [E('concertina', 0, 3.8, notes(i, 0), 0.08)] : []), ...bells(i)]; } },
  // B1, THE REST: every second time round, the cue breathes out for four bars (a pad's whisper) and lets the garden's own bed be heard;
  // never longer (Stardew's silences are what its players complain of)
  { id: 'rest', bars: 4, gain: 4, get bpm() { return dress().bpm; }, bar: (i) => (i === 0 ? [E('pad', 0, 15, notes(0, 0), 0.025, { cutoff: 900 })] : []) },
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));

/** The day's phase picks the section, moved on the next bar line; a section loops while its phase lasts, and every second loop the cue
 *  rests four bars before it comes round again. */
function jump(section, bar) {
  const want = AT[G.phase] ?? AT.day, id = SECTIONS[section].id;
  if (id === 'rest') return bar >= SECTIONS[section].bars - 1 ? want : null;
  if (want !== section) { G.loops = 0; return want; }
  if (bar < SECTIONS[section].bars - 1) return null;
  if (++G.loops >= 2) { G.loops = 0; return AT.rest; }
  return section;
}

export const GARDEN = { title: 'A Garden in the Jar', root: 64, bpm: 92, arrange: true, loopFrom: 0, moodless: true, fadeIn: 2, sections: SECTIONS, jump,
  get scale() { return MODES[G.draught]; } }; // (the Crucibelle plays in the draught's mode here: player.scale())

/** The sound test's tour (music/soundtest.js): a day in the garden, dawn to night, each in a different feeling. */
const TOUR = [['dawn', 'wonder'], ['day', 'mirth'], ['dusk', 'grief'], ['night', 'wonder']];
export const GARDEN_TOUR = { ...GARDEN, title: 'A Garden in the Jar (a day in it)', jump: (section, bar) => {
  const k = TOUR.findIndex(([id]) => id === SECTIONS[section].id);
  if (bar < SECTIONS[section].bars - 1) return null;
  if (k === TOUR.length - 1) { G.draught = TOUR[0][1]; return -1; }
  G.draught = TOUR[k + 1][1]; // (the next phase in its own feeling, from its first bar)
  return AT[TOUR[k + 1][0]];
} };

/** The sound test's tour of the seasons (B6, B3): eight bars of the day in each season, then a summer dusk going to briar and a winter
 *  night in the rain. Each step sets the garden's state as it begins (the live garden sets it again on the next frame it is in). */
const SEASON_TOUR = [
  { phase: 'day', season: 'spring' }, { phase: 'day', season: 'summer' }, { phase: 'day', season: 'autumn' }, { phase: 'day', season: 'winter' },
  { phase: 'dusk', season: 'summer', briar: 1 }, { phase: 'night', season: 'winter', rain: 1 },
];
const tourSet = (T) => { G.phase = T.phase; G.season = T.season; G.briar = T.briar || 0; G.rain = T.rain || 0; G.draught = 'wonder'; };
export const GARDEN_SEASONS = { title: 'A Garden in the Jar (its seasons)', root: 64, bpm: 92, arrange: true, loopFrom: null, moodless: true, tail: 4,
  scale: MODES.wonder, sections: SEASON_TOUR.map((T, k) => ({ id: `${T.season}:${T.phase}${T.briar ? ':briar' : ''}${T.rain ? ':rain' : ''}`, bars: 8, get gain() { tourSet(T); return SECTIONS[AT[T.phase]].gain; },
    get bpm() { tourSet(T); return DRESS[T.season].bpm; }, bar: (i) => { tourSet(T); return SECTIONS[AT[T.phase]].bar(i + (T.phase === 'day' ? 8 * (k % 2) : 0)); } })) };

// ---- the awakening song (SPIRIT-GARDEN.md: a Lachrymite fossil dug in the Dunes, awakened in the Grove by the Crucibelle's song):
// the song once on the bell (music/motifs.js AWAKEN), the harp and the choir answering it a fifth up, the strings swelling, a beat of
// held breath, and the waking (a bright chord, the air opening). About 15 real seconds; the spirit's first cry is its own (audio/spirits.js).
export const AWAKENING = { title: 'The Awakening Song', root: 64, bpm: 96, arrange: true, loopFrom: null, moodless: true, tail: 4, sections: [
  { id: 'song', bars: 2, gain: 5.5, bar: (i) => (i === 0 ? [...quote(MOTIF.AWAKEN, 'bell', { v: 0.32 }), E('pad', 0, 8, [52, 59, 64], 0.05, { cutoff: 1000 })] : [E('voice', 0, 4, 64, 0.08, { vowel: 'u' })]) },
  { id: 'answer', bars: 2, gain: 6.5, bar: (i) => (i === 0 ? [...quote(MOTIF.AWAKEN, 'harp', { up: 7, v: 0.26 }), ...quote(MOTIF.AWAKEN, 'voice', { up: -5, v: 0.1, o: { vowel: 'o' } }), E('strings', 0, 8, [52, 59, 64, 71], 0.05, { attack: 2 })]
    : [E('strings', 0, 4, [52, 59, 64, 71], 0.08, { attack: 0.5 }), E('reverse', 2, 2, null, 0.35)]) }, // (a swell, then held breath)
  { id: 'wake', bars: 2, gain: 6, bar: (i) => (i === 0 ? [E('bell', 0, 1, 76, 0.32), ...[64, 68, 71, 76, 80, 83].map((n, k) => E('harp', k * 0.15, 2, n, 0.22)), E('shimmer', 0, 8, [64, 68, 71], 0.14),
    E('strings', 0, 8, [52, 56, 59, 64, 68], 0.08, { attack: 0.1 }), E('celesta', 1, 1, 88, 0.16)] : [E('celesta', 0.5, 1, 83, 0.12), E('celesta', 1, 2, 88, 0.12)]) }, // (E major: awake)
] };

