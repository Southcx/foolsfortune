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
//
//   import { moodLayer, MODES } from './mood.js'   moodLayer(aspect, strength) -> (score, section, bar) => [events] | null   MODES[aspect]
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

const PARTS = {
  wonder: (r, beats, bar, k) => (bar % 2 ? [] : [E('pad', 0, beats * 2, [r + 19, r + 24, r + 26], 0.05 * k, { cutoff: 3200 })]),
  mirth: (r, beats, bar, k) => [[0.5, 24], [1.75, 31], [2.5, 26], [3.25, 36]].filter(([b], j) => (bar + j) % 2 === 0 && b < beats).map(([b, up]) => E('celesta', b, 0.5, r + up, 0.07 * k)),
  desire: (r, beats, bar, k) => [0, 1.5, 3].filter((b) => b < beats).map((b, j) => E('bodhran', b, 1, null, (j ? 0.14 : 0.2) * k, { rim: j === 2 })),
  grief: (r, beats, bar, k) => (bar % 2 ? [] : [E('strings', 0, beats * 2, r - 12 + (bar % 4 ? 7 : 0), 0.07 * k, { attack: 0.8, bright: 1400 })]),
  dread: (r, beats, bar, k) => (bar % 2 ? [] : [E('strings', 0, beats * 2, [r - 24, r - 11], 0.05 * k, { attack: 1.5, bright: 900 })]),
};

/** The layer for a mood at a strength (0..1), or null for calm: a function the arranger calls for each bar it lays out. */
export function moodLayer(aspect, strength = 0) {
  const part = PARTS[aspect], k = Math.max(0, Math.min(1, strength));
  if (!part || k < 0.05) return null;
  return (score, sec, bar) => {
    const r = 52 + (((score.root ?? 64) - 52) % 12 + 12) % 12; // (the cue's root, E3 to D#4)
    return part(r, sec.beats || score.beats || 4, bar, k);
  };
}
