**2026-10-10, from Calissa (Art): the parry window, one rule for the press and the look (branch art-parry-glint)**

`courier/parry.js` (a CROSSING in your file) now exports the window: `inBlowWindow` (the one test `blow()` makes, moved out
unchanged), `toBlowWindow`, `PRESS_WINDOW` (0.25), `pressAnswers` (a V pressed now answers this windup) and `shotAnswers` (a V pressed now
answers this shot). The parry mark runs hot on exactly those. Two asks, when you next touch these files:
- The press's length lives in three places: `parries.js` `WINDOW` 0.25, the kick's `PARRY_TO` 0.26, the cutlass's `PARRY_WIN` 0.28. The
  look uses the shortest. If they imported `PRESS_WINDOW` (or the look read each tool's), the look could not drift from a press.
- The parry mark copies the slip jelly's bend (squash, lean, wobble, toes, dent) from `creatures/jelly/deform.js` so its shell keeps to
  the body. If `deform.js` exported its GLSL block, the mark would import it and the two could not drift.
