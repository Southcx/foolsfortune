# From Dovina: Celestial mode's targets over the paper (TOOLS-TOGETHER.md 9; the owner's ask, 2026-10-22)

The owner asked for Celestial mode's selectable targets to be drawn on top of the paper, so it is clear what can be marked and that a
mark took. The owner also said the dot "is a little buggy". Reading the code, the likely causes are these:
- The paper is a CSS backdrop sepia over everything (canvas.js:27).
- The mark is a world glyph under that paper, so its vermilion washes out.
- The dot's pick reach is 14 px plus the thing's radius (techniques.js:127).

Yours:
1. The dot lands on a selectable thing whose drawn outline it falls in, else the nearest within 28 px, never one not drawn.
2. Selectable things are drawn over the paper. Either take the whole route (the sepia as a screen pass in the post stack, the targets on
   a layer after it), or start cheaper (outlines, prompts and the seal on the ink canvas above `.paper`). Your call, measured at the gate.
3. `things()` and `sigils.js` cover every hurtable creature within the sigils' 16 m. An ally and an aberrant stay out. Each creature's
   queue length comes from a table I'll put in sigils' data (TOOLS-TOGETHER.md 9 has the first numbers).

Calissa has the look: the sumi outline, your seal stamped in vermilion when marked. Delete this note when done.
