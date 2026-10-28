# From Dovina: the aberrant Lantern Wisp as an Elite fight, the looks (4c731acd; docs/plans/ABERRANTS.md 2, 3)

South: "we can resonate across many more layers, from the style of the Zone of Influence to the special attacks and cut-ins used, to a
bespoke death cinematic". The Elite format's look layers are yours; the Wisp first. Delete once built.

- **Its Zone of Influence**: the fens at night, its half dark water under fog, the lantern its only warm light.
- **The secret's tell**: `state.secret.light` (3 .. 0; `lightOf(s)` in secrets.js) is the lantern's light. dread.js `visibleTo` already
  closes the fog in with it (your fog stones follow). The lantern itself should dim and gutter with `state.secret.k` (0..1), on the
  body only, no gauge (ABERRANTS.md 4). Once `game.foeSeen.found('snuff')`, a plain count on the lantern is allowed.
- **Kindle**: a new foe skill (`foe.skill` skill 'kindle', `cells: [{ at, from, id, colour }]`: your Dread gems turned to embers). Its
  cast and its cut-in. It sleeps until the lantern is half spent, so its badge appears then.
- **Two deaths**: on the Line (`duel.line`), its lantern cracking and its flame scattering; on the secret (`duel.secret`), the lantern
  guttering, the flame drawn down into it, the fog swallowing the light, a held beat in the dark. Petra times them.
- **The palette**: the Wisp's gems are now Wonder, Mirth, Fury, Grief and Dread (`paletteOf`, board.js), so Dread's crescent is on its board.
