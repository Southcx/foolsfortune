// ---------------------------------------------------------------------------------------
// HARMONY AND THE WHAMMY (plain names; South, 2026-11-22: "go ahead with the build and find a home for implementing the whammy as
// well"): the Crucibelle's RMB, held.
//   - HARMONY: a note (1 to 5, 6 to 0) played with RMB held sounds as a CHORD, its degree stacked with the scale's two above it (the
//     pentatonic's every stack consonant, so no chord is wrong): degree d with d+2 and d+4, wrapping an octave up. It costs a little
//     Lachryma (HARMONY.cost; dry, the plain note sounds and the log says so). It counts as its root for the songs (songs.js: the motif
//     is the degrees played). Out of the recital the bell rings the chord all round them as a HARMONY RING, a soft stagger and shove;
//     in the recital a chord on the beat throws THREE licks' bolts fanned out of the amp, one a voice, each a share of a lick's blow
//     (tools/crucibelle/recitalplay.js).
//   - THE WHAMMY: RMB held while the feedback howls (recital, LMB held past a strum): the bar pushed down, the held wail bent flat and
//     wobbling, and the beam swept side to side across the front in time with the bar (twice a bar), wider and dizzier (its stun
//     doubled), its blow a little less; let go, the beam straightens along the aim.
// RMB was the octave up until now; the upper register is keys 6 to 0.
// Prior art: the guitar's whammy bar (Bigsby, 1952; Hendrix's dive bombs), Guitar Hero's whammy on a sustain (star power fed by it),
// the pianist's triad under one hand, Brütal Legend's double-team solos thrown wide.
//
//   chordOf(d, reg) -> [{ d, up }] x3     HARMONY   WHAMMY
// ---------------------------------------------------------------------------------------

/** Harmony's numbers. cost: Lachryma a chord; ring: the out-of-recital harmony ring (metres, a stagger's seconds, a shove); fan: the
 *  recital's three bolts' spread (radians either side), share: each bolt's part of a lick's blow, voice: the upper two voices' loudness against the root. */
export const HARMONY = { cost: 2, ring: { range: 5.5, stagger: 0.16, push: 1.6 }, fan: 0.38, share: 0.6, voice: 0.6 };
/** The whammy's numbers. sweep: the beam's swing either side (radians), per: swings a bar, width and stun: multipliers at full press,
 *  power: the blow's, bend: the wail flattened (semitones), ease: how fast the bar goes down and comes back (1/s). */
export const WHAMMY = { sweep: 0.6, per: 2, width: 1.7, stun: 2, power: 0.8, bend: -2, ease: 9 };

/** The chord a degree heads: d, d+2 and d+4 of the five, each wrapped an octave up past the fifth degree (`up` in octaves). */
export function chordOf(d, reg = 0) {
  return [0, 2, 4].map((k) => { const i = d - 1 + k; return { d: (i % 5) + 1, up: reg + Math.floor(i / 5) }; });
}
