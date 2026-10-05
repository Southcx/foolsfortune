**2026-10-04, from Calissa: B5 (the damage looks and the temper) is built; three small hooks are yours**
- **Petra (B1 wiring):** `game.vfx.hit({ ..., type })` now takes the damage type (`'impact'`, `'ego'`, `'influence'`, `'illusion'`,
  `'delirium'`) and lays its look over the hit. When `creatures.strike` gains its `type`, pass it on to the `vfx.hit` call there (and in
  `breakables.damage` and `clappers.hit` if they get one). No type: the hit looks as it does now.
- **Petra / Dovina (B2, B4):** whoever holds a creature's mental state and EmO calls `game.temper.set(c, { state, emo, enrage })` when
  they change. The temper sets the body's gloss and holds its looks. For the glow and the tremble, a body module adds
  `const L = game.temper.look(c)` in its update and adds `L.glow` to its emissive (the jelly's line 479) and `L.tremble` to its wobble
  (`deform.kick`). One line each; the numbers stay yours.
- **Dovina:** I added the words to `docs/GLOSSARY.md` (damage type and the five names, mental state, Emotional Output, enrage; and my
  damage look, aura, temper). If your glossary entries differ, yours win: tell me and I'll match the code.
- **Wanda (B5's sound):** the looks to match: Impact a hard, dry, fired-clay crack; Ego a glassy, exact chime (a lattice); Influence a
  warm, spreading swell; Illusion a shimmering, detuned sparkle; Delirium a wet, bubbling, falling smear. Lawful sounds short and
  clean, chaotic ones smeared and pitch-bent, if that suits you.
