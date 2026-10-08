// ---------------------------------------------------------------------------------------
// CRYSTALS, TUNED BY EAR: each formation of crystal has a KEY (a note: the chromatic root it is set in) and a SWEET SPOT on its surface:
// one of its FRETS and a way round it. The stave (the main spire) stands in five frets, foot to point, the same on every formation, and
// each sounds one of the Crucibelle's five notes in the formation's key (tools/crucibelle/songs.js SCALE: the minor pentatonic, the root
// at the foot); they are drawn on the stave in the notes' colours (vfx/crystalfrets.js). Ring it with the tuning fork for the REFERENCE
// tone (the sweet fret's own note). Each strike of the pick then sounds a NOTE:
//   - HEIGHT sets the PITCH: the fret they aim their blow at sounds its own note; above the sweet fret is sharp of the reference, below
//     is flat, so the ear says "higher" or "lower", and the colours say where the next fret is.
//   - THE WAY ROUND sets the BEATING: from where they stand, the note wavers (two tones a few hertz apart) as fast as they are far round from
//     the spot, and goes pure as they face it; so the feet say "round further" or "here".
// A strike on the right fret from the right side is the SWEET one: the formation opens and pays out many times over. DENSE formations
// (the big stony ones) take many strikes and pay a modest yield; FRAGILE ones (small and glassy) take only a few before they break but pay
// out wildly when found. Nothing is written: the notes, the beating, the frets and the particles (`crystal.strike` carries how near it
// was) say it.
//
// Prior art: Skyward Sword's dowsing (a tone that tells how near), relative-pitch training and the Zelda ocarina, a guitarist tuning by
// beats (two strings a little apart waver, and go still in tune), a guitar's frets and the rainbow glockenspiel (a fixed place for each
// note), Morrowind's and Skyrim's lockpicking by feel (a sweet spot found by trying), and Deep Rock Galactic's and Minecraft's ore.
//
//   tuneFor(rnd, size) -> { key, spot: { th, fret }, kind: 'dense' | 'fragile' }   readStrike(tune, th, u) -> { midi, fret, deg, beat, near, sweet }
//   refNote(tune) -> midi     fretAt(u) -> 0..4     FRETS (5)     SPAN (the share of a formation's height its frets span: u is 1 there)
// ---------------------------------------------------------------------------------------
import { SCALE } from '../../tools/crucibelle/songs.js';
export const FRETS = 5; // (a stave's frets, foot to point: one for each of the Crucibelle's notes)
export const SPAN = 0.9; // (the frets span this share of a formation's height; the fifth runs on to the point)
const BEAT_MAX = 8, SWEET_TH = 0.42; // (the beating far round, in Hz; how near round counts as facing it, in radians)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** A formation's key, sweet spot and nature, from the same seeded random its shape came from (one draw for the fret, as for the height before it). */
export function tuneFor(rnd, size) {
  const kind = size > 1.05 || rnd() < 0.55 ? 'dense' : 'fragile';
  return { key: 52 + Math.floor(rnd() * 12), spot: { th: rnd() * Math.PI * 2, fret: Math.floor(rnd() * FRETS) }, kind };
}

/** The fret at `u` (the height struck: 0 the foot .. 1 at SPAN of the height; above that, still the fifth). */
export const fretAt = (u) => Math.max(0, Math.min(FRETS - 1, Math.floor(u * FRETS)));
/** The note a fret sounds: the key's root an octave up, then up the pentatonic. */
const noteOf = (t, fret) => t.key + 12 + SCALE[fret];
export const refNote = (t) => noteOf(t, t.spot.fret);

/** What a strike sounds at `th` (their bearing round the formation) and `u` (the height struck, 0 foot .. 1 top). */
export function readStrike(t, th, u) {
  const fret = fretAt(u), deg = fret - t.spot.fret;
  const dth = Math.abs(wrap(th - t.spot.th));
  const beat = BEAT_MAX * (dth / Math.PI);
  const near = Math.max(0, 1 - Math.abs(deg) / 4) * (1 - dth / Math.PI);
  return { midi: noteOf(t, fret), fret, deg, beat: +beat.toFixed(2), near: +near.toFixed(2), sweet: deg === 0 && dth < SWEET_TH };
}
