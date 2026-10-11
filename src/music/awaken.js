// ---------------------------------------------------------------------------------------
// THE AWAKENING'S PHRASE (docs/plans/FEELINGS-AWAKENING.md): the first time the Courier lives a feeling (feeling.wake { feeling, how }),
// its mode is heard once over whatever plays: a phrase of about four real seconds, never a sting, under Calissa's weather flood and the
// body's answer. The mode climbed (its five notes, root to root an octave up) on the feeling's own voice, its colour note held under it
// in a pad of the root and the fifth, and the last note left ringing; in the cue's key and on its beat, the cue ducked beneath it. So a
// player who never reads a word still learns each feeling's shape by ear: the Lydian lift of wonder, the Hijaz sourness of gall.
//   WONDER  celesta over a glass pad, rising slow        MIRTH   marimba, skipping (a bounce in the rhythm)   DESIRE  sax, leaning
//   FURY    brass in stabs over taiko                    GALL    shakuhachi, bending into each note           GRIEF   cello, long bows
//   DREAD   a low voice, the Tear held at the top
// Prior art: Journey's chime as a companion is met (the music answering a moment you lived), Zelda's item-get (a motif as recognition),
// Final Fantasy's crystal themes (one shape a crystal); the modes and their colour notes are music/mood.js's.
//
//   import { awakenEvents } from './awaken.js'   awakenEvents(feeling, root) -> band events over eight beats (null for no such feeling)
// ---------------------------------------------------------------------------------------
import { MODES } from './mood.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const COLOUR = { wonder: 6, mirth: 4, desire: 9, fury: 6, gall: 1, grief: 3, dread: 1 }; // (each mode's own note against its root)
// the climb's rhythm in beats (six notes: the mode's five and the octave) and the voice
const VOICE = {
  wonder: { i: 'celesta', at: [0, 1, 2, 3, 4, 5], v: 0.4, up: 24 },
  mirth: { i: 'marimba', at: [0, 0.75, 1.5, 2, 2.75, 3.5], v: 0.5, up: 12 },
  desire: { i: 'sax', at: [0, 1, 1.5, 2.5, 3, 4], v: 0.36, up: 0, o: { bend: -0.5 } },
  fury: { i: 'brass', at: [0, 0.5, 1.5, 2, 3, 3.5], v: 0.4, up: 0, o: { stab: true } },
  gall: { i: 'shakuhachi', at: [0, 1.5, 2, 3.5, 4, 5], v: 0.42, up: 12, o: { scoop: 1.6 } },
  grief: { i: 'strings', at: [0, 1.5, 2.5, 3.5, 4.5, 5.5], v: 0.32, up: -12, o: { attack: 0.35, bright: 1600 } },
  dread: { i: 'voice', at: [0, 1.5, 3, 4, 5, 6], v: 0.16, up: -12, o: { vowel: 'o' } },
};

/** The phrase as band events (beats from its first, eight in all) in a key whose root is `root` (a MIDI note, E3..D#4). */
export function awakenEvents(feeling, root = 64) {
  const mode = MODES[feeling], V = VOICE[feeling]; if (!mode || !V) return null;
  const r = 52 + (((root - 52) % 12) + 12) % 12, notes = [...mode, 12].map((x) => r + 12 + V.up + x);
  const out = notes.map((n, k) => { const last = k === notes.length - 1, len = last ? 8 - V.at[k] : Math.max(0.4, (V.at[k + 1] - V.at[k]) * 0.95);
    return E(V.i, V.at[k], len, n, V.v * (last ? 1.1 : 0.85 + 0.03 * k), V.o); });
  out.push(E('pad', 0, 8, [r, r + 7, r + 12 + COLOUR[feeling]], 0.07, { cutoff: feeling === 'fury' || feeling === 'dread' ? 900 : 1800 })); // (the root, the fifth, the colour note held under)
  if (feeling === 'wonder') out.push(E('pad', 2, 6, [r + 31, r + 36], 0.04, { cutoff: 4000 })); // (the glass over it)
  if (feeling === 'fury') [0, 1.5, 3].forEach((b) => out.push(E('taiko', b, 1, null, 0.5, { size: 1.2 })));
  if (feeling === 'mirth') out.push(E('bell', 3.5, 2, r + 36, 0.15));
  if (feeling === 'dread') out.push(E('strings', 0, 8, r - 12, 0.08, { attack: 2, bright: 700 }));
  return out;
}
