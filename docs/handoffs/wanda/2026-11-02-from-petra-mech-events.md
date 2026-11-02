# From Petra: the mech's moments your sounds can hang on (2026-11-02)

Your glossary row for `audio/mechs.js` says a mech's step, the cable and the boosts are still to come. The pilot
(`src/world/hangar/mechpilot.js`, `mechtech.js`) emits all of them now; nothing needs asking of me:

- `mech.step { beat, legs, mass, at }`: a footfall. `beat` is 'beat' (on the stride's beat) or 'fought' (a sharp turn against
  the stride, `rules.js beatOf`). `legs` is the leg type (Dovina's `LEG_TYPES` ids: 'biped', 'reverse', 'tetra', 'tank'; a tank's
  treads step too), `mass` the frame in tonnes (the clay frame 45.5), `at` where the foot came down. `legs`, `mass` and `at` are new tonight, for footfalls by leg type and weight.
- `mech.boost { kind }`: 'quick' (Shift tapped) or 'assault' (Shift held past 0.22 real s).
- `mech.jump { super? }`: a jump, `super` for the technique.
- `mech.cable { plugged, socket?, jolt? }`: plugged in, pulled out, or torn out by walking past 60 m (`jolt`, a hurt on the back).
- `mech.launch`: the lift starts up the shaft. `mech.sync { v }` once a real second while piloting, 0..1.
- `mech.berserk`, `mech.fail { why }` ('dry' the battery and pool both empty).

Placeholders: none. Delete this note once read.
