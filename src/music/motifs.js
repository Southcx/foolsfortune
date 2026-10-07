// ---------------------------------------------------------------------------------------
// THE LEITMOTIFS, as data: the few notes every cue is built from (docs/OST.md, section 2), each as [beat, beats, midi] from its
// first note, so a cue can quote one anywhere: moved (`at`), in another key (`up`), slower or faster (`x`), on any instrument.
// The game's own (the Five, the Answer, the Tear) and the four suits' (one each for the divisions that make the game, after
// whom the suits' themes are named), five notes apiece, the rule of five. The suits' are made to be told apart at once:
//   PETRA    pentacles, earth: the riff. Two low Es, up a minor third, back, and up a fourth that bends toward the blue note
//            (E E G E A~). The blues, an electric guitar; heavy, on the ground
//   WANDA    wands, fire: the spark. Up a fifth, the Lydian sigh (the raised fourth falling a half step to the fifth and back),
//            then a leap to the ninth (G D C# D A). 5/4 space jazz, the saxophone
//   ESPADA   swords, air, words: the draw and the cut. A quick climb through the augmented second (E F G# B) and a cut down from
//            C to B with a bend (meend); the scale of morning (Bhairav), the sitar
//   CALISSA  cups, water: the pour. A major arpeggio tumbling down in the calypso's 3+3+2 and a hop back up (B G# E C# E);
//            the steel pan
//
//   AWAKEN   the awakening song (music/garden.js AWAKENING): E A G B E, all in the Crucibelle's own pentatonic, so it can be played on
//            it; up a fourth, a little turn, home an octave higher: a thing that slept, getting up
//   CROWN    the Great Slip Jelly's urn crown (music/greatjelly.js): B C E F E, two half steps (B to C, E to F) climbing to the Tear on
//            top, the In scale's; rung on a bell, then the brass's, then four calves' at once
//   LEVIATHAN the rogue Leviathan of the crossing (docs/plans/RAIL.md): low and slow, E to the Tear's F and back, then falling to C
//            and the B under the floor, two bars; the beast you survive more than kill (Moby-Dick, Shadow of the Colossus)
//
//   import { MOTIF, quote } from './motifs.js'    quote(MOTIF.ESPADA, 'sitar', { at: 1, up: 12, x: 2, v: 0.5, o: { pan: 0.2 } })
// ---------------------------------------------------------------------------------------
export const MOTIF = {
  FIVE: [[0, 1, 76], [1, 1, 74], [2, 1, 71], [3, 1, 69], [4, 1, 67]], // E D B A G, falling (the game)
  ANSWER: [[0, 0.5, 67], [0.5, 0.5, 69], [1, 0.5, 71], [1.5, 0.5, 74], [2, 2, 76]], // G A B D E, climbing (hope)
  TEAR: [[0, 1, 65], [1, 2, 64]], // F to E (Lachryma, loss)
  PETRA: [[0, 0.5, 52], [0.5, 0.5, 52], [1, 1, 55], [2, 0.5, 52], [2.5, 1, 57, { bend: 1, bendAt: 0.45 }]],
  WANDA: [[0, 0.5, 67], [0.5, 1.5, 74], [2, 0.25, 73], [2.25, 0.75, 74], [3, 2, 81]],
  ESPADA: [[0, 0.25, 64], [0.25, 0.25, 65], [0.5, 0.25, 68], [0.75, 0.25, 71], [1, 1.5, 72, { to: 71, meend: 0.4 }]],
  CALISSA: [[0, 0.75, 83], [0.75, 0.75, 80], [1.5, 0.5, 76], [2, 0.5, 73], [2.5, 1.5, 76]],
  AWAKEN: [[0, 1, 64], [1, 1, 69], [2, 0.5, 67], [2.5, 0.5, 71], [3, 2, 76]], // E A G B E: up a fourth, a turn, to the octave (the awakening song: a fossil woken by the Crucibelle)
  CROWN: [[0, 1, 71], [1, 1, 72], [2, 1, 76], [3, 0.5, 77], [3.5, 1.5, 76]], // B C E F E: up through the half step to the Tear on top (the Great Slip Jelly's urn crown)
  LEVIATHAN: [[0, 2, 40], [2, 1, 41], [3, 1, 40], [4, 2, 36], [6, 2, 35]], // E F E C B, two slow bars down at the floor: a whale's breath with the Tear in it (the crossing's rogue Leviathan)
};

/** A motif as events for one instrument: `at` (beat), `up` (semitones), `x` (time stretch), `v`, and options for every note. */
export function quote(motif, i, { at = 0, up = 0, x = 1, v = 0.45, o = {} } = {}) {
  return motif.map(([b, d, n, oo]) => {
    const opt = { ...o, ...(oo || {}) };
    if (opt.to != null) opt.to += up;
    return { i, b: at + b * x, d: d * x, n: n + up, v, o: opt };
  });
}
