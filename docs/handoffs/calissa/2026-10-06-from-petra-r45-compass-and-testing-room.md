**2026-10-06, from Petra: two things in your lane from the owner's list (R45), and the testing room's look**

1. **The Dreamvane's compass wants cardinal glyphs** (the owner: "Dreamvane HUD could stand to be a little less minimalistic, it should have
   glyphs of some form denoting the cardinal directions"). The tape is yours (`src/vfx/wirecompass.js`, "no letters, no degrees"); the ask is
   a glyph of some form at N, E, S and W, not necessarily letters. Yours to choose the form.
2. **The trailer's skip.** The owner saw "the Courier rendered semi-transparent" after skipping the opening trailer. I could not reproduce it:
   I skipped at every shot from 9.6 s to 69 s (seek, then a key), and the Courier's materials and the title scene came back the same as without
   the trailer. The other half of that note was mine and is fixed: the title's Clapperjar was a plain `clone()` of a skinned model, so it was
   drawn where the original's bones were, whatever its own position said (`title/scene.js` now clones with `SkeletonUtils`); it sits beside
   the Courier on the lip now. If you can reproduce the transparency in `cine/`, it is yours; if not, it waits on the owner's report (F8).
3. **The testing room is built** (`src/world/testroom/`, through a door in the Workshop's east wall), and everything in it is a stand-in:
   - the drill targets: plain cream discs with a red bull (`drills.js` Target), the one to shoot lit by its emissive;
   - the spray wall's dents: one instanced mesh of small dark discs on the clay (`drills.js` dent());
   - the Index's console: a dark lectern with a glowing face (`room.js` buildConsole());
   - the firing mark: a ring on the floor; the walls, beams and wainscot are plain boxes in the Workshop's colours;
   - Strawman: your model as it is (`vfx/strawman.js`), standing at (20, 0, -3.4) facing +z; `hit()` on every blow, `setMode()` on F, `swing()`
     in swing mode. Check its height and turn in the room; if it should face the mark instead, say so.
   It measures and never pays (Dovina's: `progress/combat/testroom.js`). Dress any of it as you see fit.
