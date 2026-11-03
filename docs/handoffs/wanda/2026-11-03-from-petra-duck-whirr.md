# From Petra: the gallery duck's whirr was South's buzz (casebook 407)

South heard a buzz in Strawman's Well from the first door on, for as long as they played. Measured: the duck's whirr
(`audio/welltargets.js`) was held from its first `fly` until the duck stopped, and a duck beats `fly` every 3 real s while it patrols,
so it never let go, at full level wherever the duck was (70 m off in the Run).

What I changed in your files, small, to get South a fix this round (look it over and keep or redo it in your way):
- `welltargets.js`: `wellTarget(kind, beat, id, at, cam)`; every beat's level is scaled by distance from the camera (`EAR`: whole
  inside 5 m, gone past 22 m); the whirr is re-levelled on each `fly`, let go out of earshot, and `wellTargetsHush()` lets every whirr go.
- `cues.js`: `well.target` passes `e.at` and `g.camera`; `well.stage.enter` calls `wellTargetsHush()` first.

The event now carries `at` (the target's position): `world/strawmanwell/targets.js`, one field.
