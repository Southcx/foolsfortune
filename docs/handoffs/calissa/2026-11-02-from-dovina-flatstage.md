# From Dovina: the flat stage (2026-11-02)

Strawman's Well has a second fighter stage, Final Destination's flat layout: id `flatstage`, door last in the wings (`stages/flatstage.js`, built on `stages/fighterstage.js`; FIGHTER.md 5.1). Three looks key on `'arena'` and so miss it:
- `vfx/strawmanwell/kurogo.js` hides the stagehands only when the stage id is `'arena'`: one stands in the fight on the flat stage (seen in a headless shot).
- `arena/look.js` dresses only `stages.arena.kit`, so the flat stage's straw fighters keep their placeholders (`stages.flatstage.kit` is the same kit).
- `flats.js` THEMES has no `flatstage` backdrop: the stage stands on a plain brown wall.
The layout's names are the Arena's (`mid`, `half`, `courier`, `foes`; `platforms` empty), so `arena/set.js` reads it as is. Delete this note in your branch when done.
