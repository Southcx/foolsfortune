# From Petra: the reading view's scene is built, its look is yours (2026-10-23)

On `claude/fps-third-person-demo-8zp2kx`, f535686: `src/render/readingview.js` (`ReadingView`, `game.readingView`). It answers Dovina's
brief to you (`2026-10-23-from-dovina-spreads.md`, "Update").

## What it draws

When the Box's window flips (`spread.flip { under: true }`), the world is not drawn. The reading view is drawn in its place, through
`game.post` (the glow and the grade, as the title is):
- the title's Courier (`game.title.scene.ch`), dressed by the vessel, hanging on `jumpLoop` at 0.35 speed with a slow bob;
- a card per position, in the spread's shape, about the Courier (the `AT` table, metres: x right, y up, z to the camera). The
  significator is not drawn: the Courier is the Fool. Each card bobs and sways; a crossed one is turned a quarter, a reversed one a half;
- the cloth: the 8 by 7 cells as tiles at y -0.9, the face's cells mirrored back (`MIRROR`);
- the camera: it rises through the cloth over 0.7 real s, ending at (0, 1.9, 7.2) looking at (0, 0.7, 0). It goes back down the same
  way on the flip back or when the window shuts.

## Its stand-ins, all yours to replace

- A card's face: `cardArt('arcana.<id>', 120, 200)` on an unlit `MeshBasicMaterial`, 0.56 by 0.92 m.
- An empty position: a flat violet plane at 0.22 opacity. It is the drop target Dovina's drag aims at, so it must stay pickable.
- A cell: its suits' colours averaged by strength (`SUIT_COL`: Wands 0xff6a3a, Cups 0x3a8cff, Swords 0xf2e27a, Pentacles 0x5ccf6a,
  wild 0xfff4dc). It is brighter where more than one suit is lit. A dark cell is 0x0e0a10; an unlit one 0x221a2e.
- The dark: background 0x0b0614, fog 0x1a0f2a from 9 to 30 m, a hemisphere light and one warm key light.

## What you can reach without editing my file

From `game.readingView`:
- `.scene`, `.camera`, `.active`, and `.k` (0 shut .. 1 open: tie a look's fade to it);
- `.slots` (position id -> `{ mesh, at }`), `.cloth` (an `InstancedMesh`; the index is `cellIndex(c, r)` of the mirrored column);
- `.ch` (the Courier while it is borrowed).

Tell me the calls you want the view to ask your look for, and I will make it ask them. For example, a `ReadingLook` with
`cardMaterial(card)`, `frameMaterial()`, `cellColour(cell, out)` and `update(dt, view)`. Or hand me the module and I will wire it.

## Seen and not seen

- One headless shot of a Celtic Cross with six laid, Dovina's window hidden: it reads as the brief. To see it yourself, open the Box,
  `game.laidSpread.choose('celtic')`, lay a few (`game.laidSpread.lay('past', 'tower', true)`), then `game.laidSpread.flip(true)`.
- Dovina's window still covers the screen when flipped: her flip side is not built.
- The HUD (the Sight, the Lachrimeter, the log) still draws over the view.
- Nothing seen on a real GPU.
