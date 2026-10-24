// ---------------------------------------------------------------------------------------
// THE READING (a placeholder title, Espada's to name): the cue while the Pneuka Box lies turned over and a spread is laid on its underside
// (docs/plans/SPREADS.md; game.laidSpread.under). A reader's table at night: the cards turned in candlelight, slow and hushed, in 3/4 like a
// shuffle's turning. E Phrygian dominant (Hijaz: E F G# A B C D, the flat second leaning home, the old sound of fortune-telling in the
// West's ear), over a drone; the Five (music/motifs.js) laid a note a bar on a celesta, as the cards are laid one at a time. The suit
// that leads the spread's tallies colours it: Wands a warm low horn, Cups a glass harmonica's ring, Swords a breathy flute, Pentacles a
// marimba's wood; none yet, the harp alone.
//
// Prior art: the reading scenes of tarot games (Cultist Simulator's slow table, Inscryption's cabin), the Hijaz of the fortune-teller's
// tent as Western film has scored it, Erik Satie's Gymnopedies (3/4 at a walk, a melody laid over still chords).
//
//   READING (the score)   setReading({ suit })   (music/choose.js, while game.laidSpread.under)
// ---------------------------------------------------------------------------------------

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const R = { suit: null };
/** The suit leading the spread's tallies (wands, cups, swords, pentacles) or null. */
export function setReading({ suit = null } = {}) { R.suit = suit; }

const ROOT = 52; // (E3)
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
const note = (d, oct = 1) => ROOT + 12 * (oct + Math.floor(d / 7)) + HIJAZ[((d % 7) + 7) % 7];
// the chords, one a bar, two bars each: i (E), the flat II (F), iv (Am), back home over the drone
const PROG = [[0, 2, 4], [1, 3, 5], [3, 5, 7], [0, 2, 4]];
// the Five falling in the reader's mode (E D B A G#: degrees 7 6 4 3 2), a note a bar, then the turn home
const FIVE = [7, 6, 4, 3, 2, 3, 1, 0];
const VOICE = { wands: 'brass', cups: 'vibes', swords: 'flute', pentacles: 'marimba' };

const bar = (i, open) => {
  const c = PROG[(i >> 1) % 4], ev = [E('tanpura', 0, 3, note(0, 0), 0.2), E('pad', 0, 3, [note(0, 0), note(4, 0)], 0.05, { cutoff: 700 })];
  // the shuffle's turning: the harp on the three beats, the chord climbing
  c.forEach((d, k) => ev.push(E('harp', k, 1.4, note(d, 1), k ? 0.12 : 0.16, { pan: -0.2 + k * 0.2 })));
  if (!open) {
    ev.push(E('celesta', 0, 2.8, note(FIVE[i % 8], 2), 0.2)); // (a card laid)
    const v = R.suit && VOICE[R.suit];
    if (v && i % 2 === 1) ev.push(E(v, 1, 1.8, note(FIVE[i % 8], 1), v === 'brass' ? 0.08 : 0.12)); // (the leading suit answering it)
  }
  if (i % 4 === 0) ev.push(E('bell', 0, 1, note(0, 2), 0.06)); // (the singing bowl)
  return ev;
};

export const READING = {
  title: 'The Reading', root: 64, bpm: 66, beats: 3, arrange: true, loopFrom: 1, moodless: true, fadeIn: 1.5, scale: [0, 1, 4, 7, 8],
  sections: [
    { id: 'shuffle', bars: 4, gain: 6, bar: (i) => bar(i, true) },
    { id: 'cards', bars: 16, gain: 6, bar: (i) => bar(i, false) },
  ],
};
