// ---------------------------------------------------------------------------------------
// CRYSTALS, TUNED BY EAR: each formation of crystal has a KEY (a note: the chromatic root it is set in) and a SWEET SPOT on its surface:
// a height on it and a way round it. The surface is a stave wrapped round a column. Ring it with the tuning fork for the REFERENCE tone
// (the sweet spot's own note). Each strike of the pick then sounds a NOTE:
//   - HEIGHT sets the PITCH: where she aims her blow (high on the formation or low) is a step of the formation's scale above or below the
//     spot's note: above the spot is sharp of the reference, below is flat, so the ear says "higher" or "lower".
//   - THE WAY ROUND sets the BEATING: from where she stands, the note wavers (two tones a few hertz apart) as fast as she is far round from
//     the spot, and goes pure as she faces it; so the feet say "round further" or "here".
// A strike at the right height from the right side is the SWEET one: the formation opens and pays out many times over. DENSE formations
// (the big stony ones) take many strikes and pay a modest yield; FRAGILE ones (small and glassy) take only a few before they break but pay
// out wildly when found. Nothing is written: the notes, the beating and the particles (`crystal.strike` carries how near it was) say it.
//
// Prior art: Skyward Sword's dowsing (a tone that tells how near), relative-pitch training and the Zelda ocarina, a guitarist tuning by
// beats (two strings a little apart waver, and go still in tune), Morrowind's and Skyrim's lockpicking by feel (a sweet spot found by
// trying), and Deep Rock Galactic's and Minecraft's ore (strike to take it).
//
//   tuneFor(rnd, size) -> { key, spot: { th, u }, kind: 'dense' | 'fragile' }      readStrike(tune, th, u) -> { midi, deg, beat, near, sweet }
//   refNote(tune) -> midi
// ---------------------------------------------------------------------------------------
const SCALE = [0, 2, 4, 5, 7, 9, 11]; // (the major scale: a step of it per stave line)
const LINES = 7; // (how many steps the whole height of a formation spans)
const BEAT_MAX = 8, SWEET_TH = 0.42; // (the beating far round, in Hz; how near round counts as facing it, in radians)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** A formation's key, sweet spot and nature, from the same seeded random its shape came from. */
export function tuneFor(rnd, size) {
  const kind = size > 1.05 || rnd() < 0.55 ? 'dense' : 'fragile';
  return { key: 52 + Math.floor(rnd() * 12), spot: { th: rnd() * Math.PI * 2, u: 0.25 + rnd() * 0.5 }, kind };
}

/** The note `deg` steps of the scale from the key's root (negative: below it). */
function step(key, deg) {
  const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
  return key + 12 * o + SCALE[i];
}
export const refNote = (t) => t.key + 12;

/** What a strike sounds at `th` (her bearing round the formation) and `u` (the height struck, 0 foot .. 1 top). */
export function readStrike(t, th, u) {
  const deg = Math.max(-LINES, Math.min(LINES, Math.round((u - t.spot.u) * LINES)));
  const dth = Math.abs(wrap(th - t.spot.th));
  const beat = BEAT_MAX * (dth / Math.PI);
  const near = Math.max(0, 1 - Math.abs(deg) / 4) * (1 - dth / Math.PI);
  return { midi: step(t.key + 12, deg), deg, beat: +beat.toFixed(2), near: +near.toFixed(2), sweet: deg === 0 && dth < SWEET_TH };
}
