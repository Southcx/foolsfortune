// ---------------------------------------------------------------------------------------
// THE DRAFTING TABLE (a placeholder title): the cue while the track editor is open at the Raceway (world/raceway/editor.js, Dovina's;
// docs/plans/TRACK-EDITOR.md), the god hand laying a line over the park. Who it is for: you, alone at a drawing board, trying a curve and
// taking it back. The Raceway's own turnaround (E D A B, music/raceway.js) slowed to a lounge and its chords grown sevenths and ninths:
// a Rhodes, an upright walking, brushes and a ride in a lazy triplet swing, the vibes thinking aloud a phrase every two bars. The
// tune is the race's, so going from the table to the track is the same song getting up to speed.
//   OPEN   two bars: the Rhodes alone on the first chord, the ride coming in
//   TABLE  sixteen bars, looped: the turnaround twice, the vibes' phrase answering itself; every fourth bar a bell where a line is set
// Prior art: Super Mario Maker's build mode (each style's play theme rearranged calm, so the maker hears the level they are making),
// Trackmania's editor (music that never hurries), the Mario Kart menu lounge, Vince Guaraldi's trio (a Rhodes and brushes at a walk).
//
//   import { DRAFTING } from './drafting.js'   (music/choose.js, while game.trackEditor.active)
// ---------------------------------------------------------------------------------------

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const SKIP = 2 / 3; // (the triplet swing's late eighth)
// the turnaround grown up: E maj9, D 6/9, A maj7, B7 sus resolving to B7 (two bars each)
const CH = [
  { root: 40, v: [56, 59, 63, 66] },
  { root: 38, v: [54, 57, 59, 64] },
  { root: 45, v: [56, 61, 64, 69] },
  { root: 47, v: [57, 59, 64, 66], to: [57, 59, 63, 66] },
];
const chord = (i) => CH[Math.floor(i / 2) % 4];
// the vibes' phrase, two bars at a time in E major's pentatonic (B C# E F# G#): [beat, beats, midi], the second half answering the first
const PHRASES = [
  [[0, 1, 71], [1 + SKIP, 0.6, 73], [2, 1.5, 76], [5, 2, 80]],
  [[0.5, 0.5, 78], [1, 1, 76], [2, 1, 73], [3, 2.5, 71]],
  [[0, 0.6, 76], [SKIP, 0.6, 78], [1 + SKIP, 1, 80], [3, 1, 78], [4.5, 2.5, 76]],
  [[1, 1, 73], [2, 1, 75], [3, 1, 76], [4, 3, 71]],
];

const rhythm = (i) => {
  const ev = [];
  for (const b of [0, 1, 1 + SKIP, 2, 3, 3 + SKIP]) ev.push(E('ride', b, 0.5, null, b % 1 ? 0.07 : 0.11));
  for (const b of [1, 3]) ev.push(E('brush', b, 1, null, 0.16));
  ev.push(E('kick', 0, 1, null, 0.22));
  if (i % 2 === 1) ev.push(E('kick', 2 + SKIP, 1, null, 0.14));
  return ev;
};
const walk = (i) => {
  const c = chord(i), next = chord(i + 1).root, second = i % 2 === 1;
  const notes = second ? [c.root + 7, c.root + 12, c.root + 9, next + 1] : [c.root, c.root + 4, c.root + 7, c.root + 5]; // (up the chord, then a step toward the next root)
  return notes.map((n, b) => E('upright', b, 0.9, n, b === 0 ? 0.34 : 0.28));
};
const comp = (i) => {
  const c = chord(i), v = i % 2 === 1 && c.to ? c.to : c.v;
  return v.flatMap((n) => [E('rhodes', 0, 1.6, n, 0.09), E('rhodes', 2 + SKIP, 1.2, n, 0.065)]); // (the band plays one note an event)
};
const vibes = (i) => {
  if (i % 2) return [];
  const P = PHRASES[(i / 2) % 4], out = [];
  for (const [b, d, n] of P) { const bar = Math.floor(b / 4); if (bar === 0) out.push(E('vibes', b, d, n, 0.16)); }
  return out;
};
const vibesTail = (i) => {
  if (i % 2 === 0) return [];
  const P = PHRASES[((i - 1) / 2) % 4], out = [];
  for (const [b, d, n] of P) if (b >= 4) out.push(E('vibes', b - 4, d, n, 0.15));
  return out;
};

export const DRAFTING = {
  title: 'The Drafting Table', root: 64, bpm: 92, arrange: true, loopFrom: 1, moodless: true, fadeIn: 1.2, scale: [0, 2, 4, 7, 9],
  sections: [
    { id: 'open', bars: 2, gain: 1.7, bar: (i) => [...comp(i), ...(i ? [E('ride', 0, 0.5, null, 0.08), E('ride', 2, 0.5, null, 0.08)] : []), E('upright', 0, 2, chord(i).root, 0.3)] },
    { id: 'table', bars: 16, gain: 1.7, bar: (i) => [...rhythm(i), ...walk(i), ...comp(i), ...vibes(i), ...vibesTail(i),
      ...(i % 4 === 3 ? [E('bell', 3, 1.5, 88, 0.05)] : [])] },
  ],
};
