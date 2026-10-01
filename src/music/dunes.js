// ---------------------------------------------------------------------------------------
// "MIRAGE OF THE STILL WATER": the Dunes' theme. A slow, swung, spacey jazz tune in D# minor, its melody kept to the D# minor
// pentatonic blues scale (D#, F#, G#, A, A#, C#: the A is the blue note), over the harmony a JRPG desert town would have if it had
// a lounge: minor ninths, a lydian major seventh on the sixth degree (B maj7#11), a thirteenth on the seventh (C#13), an altered
// dominant to turn round on (A#7#9), and in the bridge the Neapolitan (E maj7#11), the chord that sounds like heat haze.
//
// FORM (84 bpm, swung eighths, 4/4): INTRO 4 | A 8 | A' 8 | B (the bridge) 8 | A'' 8 | TAG 4, then back to A. About a minute and
// three quarters a time round. The vibraphone has the A sections, a ney (the reed flute of the desert) the bridge and the tag; the
// Rhodes comps, the upright walks in the bridge and keeps a half-time two-feel elsewhere, brushes and a ride keep time, a darbuka
// murmurs under it and a finger cymbal marks each new section; a pad sits high and far away for the sky.
//
// Prior art: Yoko Kanno's space jazz for Cowboy Bebop (vibes and Rhodes over brushes, long reverb), the desert towns of JRPGs
// (Final Fantasy's and Dragon Quest's: a modal melody, a hand drum, a reed), Bill Evans' rootless voicings for the Rhodes, and the
// blues scale's flatted fifth as the colour note.
//
// Data only: the player (music/player.js) reads it. Notes are MIDI numbers; times are in beats within the bar (x.5 is swung).
// ---------------------------------------------------------------------------------------

// chords: the Rhodes voicing (rootless, mid register), the pad's upper notes, and the bass root and fifth
const CH = {
  'D#m9': { v: [54, 58, 61, 65], pad: [70, 73, 77], r: 39, f: 46 },
  'G#m9': { v: [59, 63, 66, 70], pad: [70, 75, 78], r: 44, f: 51 },
  'Bmaj7#11': { v: [58, 63, 65, 66], pad: [70, 75, 77], r: 35, f: 42 },
  'C#13': { v: [59, 63, 65, 70], pad: [70, 73, 77], r: 37, f: 44 },
  'A#7#9': { v: [62, 66, 68, 73], pad: [68, 73, 74], r: 34, f: 41 },
  'Bmaj9': { v: [63, 66, 70, 73], pad: [73, 75, 78], r: 35, f: 42 },
  'G#m11': { v: [59, 61, 63, 66], pad: [70, 73, 75], r: 44, f: 51 },
  'Emaj7#11': { v: [56, 58, 63, 66], pad: [68, 70, 75], r: 40, f: 47 },
  'Bmaj7': { v: [58, 63, 66, 70], pad: [70, 75, 78], r: 35, f: 42 },
};

// melodies: per bar, [beat, length in beats, midi]
const MEL_A = [
  [[1, 0.5, 70], [1.5, 0.5, 73], [2, 2, 75]],
  [[0, 0.5, 78], [0.5, 0.5, 75], [1, 1, 73], [2, 0.5, 70], [2.5, 1.5, 68]],
  [[0, 1.5, 66], [1.5, 0.5, 68], [2, 1, 70], [3, 0.5, 69], [3.5, 0.5, 68]],
  [[0, 3, 66], [3, 0.5, 63], [3.5, 0.5, 66]],
  [[0, 1, 70], [1, 0.5, 73], [1.5, 0.5, 75], [2, 1, 78], [3, 1, 75]],
  [[0, 0.5, 73], [0.5, 0.5, 75], [1, 0.5, 78], [1.5, 0.5, 80], [2, 2, 82]],
  [[0, 0.5, 81], [0.5, 0.5, 80], [1, 0.5, 78], [1.5, 0.5, 75], [2, 1, 73], [3, 1, 75]],
  [[0, 0.5, 70], [0.5, 0.5, 69], [1, 0.5, 68], [1.5, 0.5, 66], [2, 1.5, 63]],
];
const MEL_A2_END = [
  [[0, 1, 75], [1, 1, 73], [2, 1, 70], [3, 1, 68]],
  [[0, 3, 63]],
];
const MEL_B = [
  [[0, 2, 73], [2, 1, 75], [3, 1, 78]],
  [[0, 4, 80]],
  [[0, 1, 78], [1, 1, 75], [2, 1, 73], [3, 1, 70]],
  [[0, 3, 73], [3, 1, 68]],
  [[0, 2, 70], [2, 1, 68], [3, 1, 66]],
  [[0, 1, 70], [1, 0.5, 73], [1.5, 0.5, 75], [2, 2, 78]],
  [[0, 1, 82], [1, 1, 80], [2, 1, 78], [3, 1, 75]],
  [[0, 0.5, 73], [0.5, 0.5, 69], [1, 1, 70]],
];
const MEL_TAG = [
  [[2, 2, 82]],
  [[0, 2, 80], [2, 2, 78]],
  [[0, 1, 75], [1, 3, 73]],
  [],
];

// the Rhodes' comping rhythms (beats on which the chord is struck, and for how long), varied bar to bar
const COMP = [
  [[0, 1.5], [2.5, 1]],
  [[1.5, 1], [3, 0.5]],
  [[0, 0.5], [1.5, 2]],
  [[0.5, 1], [2, 1.5]],
];

const A_CHORDS = ['D#m9', 'D#m9', 'G#m9', 'G#m9', 'Bmaj7#11', 'C#13', 'D#m9', 'A#7#9'];
const A2_CHORDS = ['D#m9', 'D#m9', 'G#m9', 'G#m9', 'Bmaj7#11', 'C#13', 'G#m9', 'D#m9'];
const B_CHORDS = ['Bmaj9', 'Bmaj9', 'G#m11', 'G#m11', 'Emaj7#11', 'C#13', 'Bmaj7', 'A#7#9'];

export const DUNES = {
  title: 'Mirage of the Still Water',
  bpm: 84, swing: 0.64, key: 'D# minor pentatonic blues', chords: CH, comp: COMP,
  // each section: its bars' chords, the melody and who plays it, the bass's feel, and which of the band is in
  sections: [
    { id: 'intro', chords: ['D#m9', 'D#m9', 'Bmaj7#11', 'A#7#9'], mel: null, bass: 'pedal', band: { pad: 1, rhodes: 0.7, ride: 0.4, zill: 1 } },
    { id: 'A', chords: A_CHORDS, mel: MEL_A, lead: 'vibes', bass: 'two', band: { pad: 0.6, rhodes: 1, ride: 1, brush: 1, darbuka: 0.6, zill: 1 } },
    { id: "A'", chords: A2_CHORDS, mel: [...MEL_A.slice(0, 6), ...MEL_A2_END], lead: 'vibes', bass: 'two', band: { pad: 0.6, rhodes: 1, ride: 1, brush: 1, darbuka: 0.8 } },
    { id: 'B', chords: B_CHORDS, mel: MEL_B, lead: 'ney', bass: 'walk', band: { pad: 1, rhodes: 0.8, ride: 1, brush: 1, darbuka: 1, zill: 1 } },
    { id: "A''", chords: A2_CHORDS, mel: [...MEL_A.slice(0, 6), ...MEL_A2_END], lead: 'vibes', bass: 'two', band: { pad: 0.8, rhodes: 1, ride: 1, brush: 1, darbuka: 0.6 } },
    { id: 'tag', chords: ['D#m9', 'Bmaj7#11', 'D#m9', 'Bmaj7#11'], mel: MEL_TAG, lead: 'ney', bass: 'pedal', band: { pad: 1, rhodes: 0.7, ride: 0.5, brush: 0.6, darbuka: 0.5, zill: 1 } },
  ],
  loopFrom: 1, // (after the tag, back to A: the intro plays once)
};
