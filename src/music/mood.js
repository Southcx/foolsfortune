// ---------------------------------------------------------------------------------------
// THE MOOD LAYER: the weather heard in the music (docs/plans/WEATHER.md). The hour sets the density (the night thins every cue: the
// arranger's `thin`), the mood sets the colour: a few quiet events laid over each bar of whatever the place is playing, by the weather's
// strength, made only of the cue's own root, second and fifth so they can never contradict its harmony (major or minor, any key):
//   WONDER   a glass pad (fifth, octave, ninth) held across two bars, high and soft
//   MIRTH    a celesta's sparkle, a few notes a bar, up high
//   DESIRE   a frame drum's pulse (three against the bar), low and dry
//   GRIEF    a cello line, the root and the fifth, long bows
//   DREAD    a drone low under everything, the root and the Tear above it (F on E: the flat second, held)
// And the MODES: the five pentatonics of the five moods, the scale the Crucibelle plays (game.music.scale(), music/player.js) when no cue is
// playing to set it: major for mirth, a Lydian pentatonic for wonder, Dorian for desire, minor for grief, the In scale for dread.
//
// Prior art: vertical layering in adaptive scores (the stems of Red Dead Redemption and Breath of the Wild's field music thickening
// and thinning), the modes' order of brightness (Lydian the brightest, Phrygian the darkest), and the Japanese In scale (miyako-bushi)
// for dread, as in the Deep (music/dive.js).
// An AGATE sky (two moods at once, the second weaker: progress/weather.js) lays both layers by their strengths, and its scale is the
// stronger mood's with one note borrowed from the other (its signature: the raised fourth of wonder, the major third of mirth, the major
// sixth of desire, the flat seventh of grief, the flat second of dread), put in place of the nearest note that is not the root, the fifth
// or the stronger mood's own signature. Opposites at once cancel (the sky is TORN): no mode at all, the root and the fifth.
//
//   import { moodLayer, moodScale, MODES } from './mood.js'   moodLayer(aspect, strength, second?, secondStrength?) -> (score, section, bar) => [events] | null
//   moodScale(aspect, second?, cancelled?) -> five semitones   MODES[aspect]
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

export const MODES = {
  wonder: [0, 4, 6, 7, 11], // (Lydian pentatonic: the raised fourth)
  mirth: [0, 2, 4, 7, 9], // (major pentatonic)
  desire: [0, 2, 3, 7, 9], // (Dorian: the minor third with the major sixth)
  grief: [0, 3, 5, 7, 10], // (minor pentatonic: the Crucibelle's own)
  dread: [0, 1, 5, 7, 8], // (In: the flat second, the Tear)
};
export const DEFAULT_SCALE = MODES.grief;
const SIGN = { wonder: 6, mirth: 4, desire: 9, grief: 10, dread: 1 }; // (each mode's signature note)
const TORN = [0, 7, 12, 19, 24]; // (a torn sky: only the root and the fifth, nothing to pull either way)

/** The scale of a sky: its mood's mode, an agate's borrowed note in it, or the torn sky's root and fifth. */
export function moodScale(aspect, second = null, cancelled = null) {
  if (cancelled) return TORN;
  const base = MODES[aspect] || DEFAULT_SCALE, note = SIGN[second];
  if (!MODES[second] || second === aspect || base.includes(note)) return base;
  const keep = new Set([0, 7, SIGN[aspect]]);
  let at = -1, best = 99;
  base.forEach((n, i) => { if (!keep.has(n) && Math.abs(n - note) < best) { best = Math.abs(n - note); at = i; } });
  return at < 0 ? base : base.map((n, i) => (i === at ? note : n)).sort((a, b) => a - b);
}

const PARTS = {
  wonder: (r, beats, bar, k) => (bar % 2 ? [] : [E('pad', 0, beats * 2, [r + 19, r + 24, r + 26], 0.05 * k, { cutoff: 3200 })]),
  mirth: (r, beats, bar, k) => [[0.5, 24], [1.75, 31], [2.5, 26], [3.25, 36]].filter(([b], j) => (bar + j) % 2 === 0 && b < beats).map(([b, up]) => E('celesta', b, 0.5, r + up, 0.07 * k)),
  desire: (r, beats, bar, k) => [0, 1.5, 3].filter((b) => b < beats).map((b, j) => E('bodhran', b, 1, null, (j ? 0.14 : 0.2) * k, { rim: j === 2 })),
  grief: (r, beats, bar, k) => (bar % 2 ? [] : [E('strings', 0, beats * 2, r - 12 + (bar % 4 ? 7 : 0), 0.07 * k, { attack: 0.8, bright: 1400 })]),
  dread: (r, beats, bar, k) => (bar % 2 ? [] : [E('strings', 0, beats * 2, [r - 24, r - 11], 0.05 * k, { attack: 1.5, bright: 900 })]),
};

/** The layer for a mood at a strength (0..1), or null for calm: a function the arranger calls for each bar it lays out. */
export function moodLayer(aspect, strength = 0, second = null, secondStrength = 0) {
  const clamp = (x) => Math.max(0, Math.min(1, x || 0)), k = clamp(strength), k2 = second !== aspect ? clamp(secondStrength) : 0;
  const parts = [[PARTS[aspect], k], [PARTS[second], k2]].filter(([p, s]) => p && s >= 0.05); // (one mood, or an agate's two: never three)
  if (!parts.length) return null;
  return (score, sec, bar) => {
    const r = 52 + (((score.root ?? 64) - 52) % 12 + 12) % 12; // (the cue's root, E3 to D#4)
    return parts.flatMap(([p, s]) => p(r, sec.beats || score.beats || 4, bar, s));
  };
}
