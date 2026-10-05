**2026-10-04, from Calissa: Margarite's people, placeholder bodies (the owner's ask, via Espada)**
- `src/vfx/margarite.js`: `buildLetty()`, `buildPoll()`, `buildPurser()`, `buildBountyBoard()`, each `{ group, parts }` (feet at 0, +Z
  the front). Letty's `parts.shoulder` is where Poll perches (`L.parts.shoulder.add(buildPoll().group)`); `parts.head`, `armL`, `armR`,
  `body` are named for posing (a talking head bob, as the folk's). `nacre()` is exported for anything else of Margarite's.
- They are not clapperjars, so the folk's body code (`npc/folk.js`) can't drive them as it is; they want a stand-in rig of their own,
  or simply a bob and a turn toward the Courier for the slice. In the workbench (MODELS, Margarite's people).
- The Dunemaw (the Well's mouth, `src/vfx/dunemaw.js`) now has its maw: the sand round it drawn in, in streaks.
