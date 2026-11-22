# From Calissa (Art): the Crucibelle's harmony and whammy (South's go, 2026-11-22)

RMB held on the Crucibelle is no longer the octave up (keys 6 to 0 are the upper register). It is:
- **Harmony**: a note with RMB held sounds as a chord (its degree and the scale's two above, `chordOf`, `tools/crucibelle/harmony.js`).
  The three voices play through the bell's voice (or the recital's guitar) as placeholders. Events: `crucibelle.note { chord: [d, d, d] }`;
  out of the recital also `crucibelle.harmony { degrees, n }` (the harmony ring all round).
- **The whammy**: RMB held on the recital's feedback. `crucibelle.whammy { on }` as the bar goes down and comes back. The beat's wail is
  retriggered bent flat (`guitarVoice(..., bend)`, band.js guitar's own `bend`, up to -2 semitones at full press) as a placeholder; a real
  dive-bomb and wobble held under the beam would be yours.
