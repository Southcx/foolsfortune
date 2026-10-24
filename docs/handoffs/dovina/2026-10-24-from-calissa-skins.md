# From Calissa (Art), 2026-10-24: more skin tones at the kiln. How the special ones are got is yours

The owner: "the Courier could use more skin options in the kiln". There are 35 new skin tones (and PORCELAIN reworked to blue-white), all
kiln rows in `courier/vessel/glazes.js` (kind `skin`, each with a `look`: its pattern, drawn by `src/vfx/skinpatterns.js` in the
vessel's one finish program). The sheet is `docs/plans/art/courier-skins.jpg`.

- **13 natural tones** (IVORY, SHELL, PEACH, FRECKLED, SAND, OLIVE, HONEY, AMBER, CHESTNUT, UMBER, MAHOGANY, SABLE, EBONY): `got: { start: true }`.
  A self-insert's own skin is never a prize, so I'd keep them open to all. Overrule me if you disagree, but say why.
- **22 clay and strange bodies**: `got: { debug: true }`, shown in the DEBUG save's kiln only until you rule each. When you do, change
  its `got` from `debug`. Espada writes the blurbs (all placeholders now).

## Proposed opens (one line each; the achievements are your call, and the ids below are guesses at the kind of thing, not real ids)
| id | look | proposed open |
| --- | --- | --- |
| `bisquebody` | chalky unglazed white, pale specks | start (the vessel as it waits for its glaze) |
| `terracottabody` | red earthenware, pale grog | start (what the Prince fired you in) |
| `stoneware` | buff, iron speckle bleeding | shop (Saggar's kiln), an everyday price |
| `rakubody` | crackled white, smoke in the cracks, copper flash | ach: a firing count at the kiln (fire N looks) |
| `sigillata` | burnished red, a dark fire flash | ach: polish something (the Soul Brush's mop cleaning N cells) |
| `celadonbody` | jade glass, crazed | ach: the CELADON glaze's own, one tier up |
| `agateware` / `bluemarble` | two clays swirled | shop / ach for the second (both clays: Soul Alchemy presses of two hues) |
| `nacre` | mother-of-pearl | ach: angling (a pearl's worth of fish, or a tier 4 catch) |
| `verdigris` | bronze crusted green | ach: time on the Emocean (the sea's rain on metal) |
| `woodgrain` / `birch` | polished wood, pale wood | ach: the Spirit Garden (Myggdrasil fed, or a planetoid's harmony held) |
| `inkwash` | sumi washes, ink in the hollows | ach: Celestial mode (sigils drawn) |
| `starfield` / `nebula` | a night sky inside the skin, parallaxed | ach: the sky read with the Dreamvane N times at night / a vantage at night |
| `stainedglass` | leaded jewel panes, lit inside | ach: the seven feelings all awakened |
| `sliptrail` | raised cream lines on dark clay | shop |
| `lachrymalit` | dark, the film's schiller flashing under it | ach: a high tier of overflow condensed (the palm die grown) |
| `goldleaf` | leaf gold flaking over red clay | ach: cubes spent at Raku's Bazaar |
| `kintsugibody` | the cracks already gold | ach: made whole N times (shatter and re-form), so the body remembers |
| `molten` | black crust, cracks still glowing | ach: the Great Dunemaw's FOE, beaten |
| `moss` | lichen rings and moss on stone | ach: idle at a Shrine or in the Spirit Garden for a long while (moss grows on what keeps still) |

Nothing here changes a rule, a price or the pool. The looks are cosmetic only.
