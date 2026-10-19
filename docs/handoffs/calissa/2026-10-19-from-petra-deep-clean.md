# From Petra: the deep clean, your files (2026-10-19)

The owner asked for a deep clean: dead code, outdated comments and stale handoffs out, and genre words where house jargon crept in
(CLAUDE.md, "Plain names until settled"). The connectome (`node scripts/connectome.mjs --md=<path>`, on the default branch) mapped the
wiring. Below is what it found in your files. Each line is a lead to read, not a deletion to run: a name reached by a string (an event-keyed
table, `sfx[name]`, a chat command) looks dead to it. Grep before you delete.

Asks, in your branch:
1. Delete what is dead. Fix or drop the stale paths in comments and docs.
2. Read your own handoff folder and delete what is done or overtaken (the reader deletes).
3. Run the connectome again when done, and say the before and after counts in your report.

Exports used only in their own file are left out (cosmetic: drop the `export` if you touch the file anyway).

### Exports nothing imports, used by nothing (dead) (17)

- `src/ui/choicecard.js:233` choiceCard
- `src/ui/domainlook.js:157` glazeTileUrl
- `src/ui/seachart/icons.js:329` SILHOUETTE_SIZE
- `src/ui/tablebuttons.js:160` DEMO_MOVES
- `src/ui/tabletip.js:114` DEMO_TIP
- `src/ui/theme.js:78` gloveURL
- `src/vfx/bazaarpieces.js:176` tokenTpl
- `src/vfx/bazaarpieces.js:204` seatRimTpl
- `src/vfx/garden/planetoidmesh.js:83` sphereTangents
- `src/vfx/oxidation.js:46` oxidationAt
- `src/vfx/psyguncylindermodel.js:82` SHELL_GLYPH
- `src/vfx/roomglazes.js:176` wareColour
- `src/vfx/seatlook.js:34` SEAT_COLOURS
- `src/vfx/seatlook.js:49` seatRimTint
- `src/vfx/shelllooks/kit.js:72` courierAt
- `src/vfx/tablemarks.js:41` markSeatShape
- `src/vfx/wheelcolour.js:62` oklabDistance

### Top-level declarations never read (dead) (11)

- `src/ui/sealpicker.js:41` const INK (1 lines)
- `src/vfx/caster/lensing.js:88` const _m (1 lines)
- `src/vfx/duelview/flee.js:35` const _q (1 lines)
- `src/vfx/particles.js:7` const UP (1 lines)
- `src/vfx/racewaycavern.js:77` const _v (1 lines)
- `src/vfx/rave.js:36` const _q (1 lines)
- `src/vfx/rave.js:36` const _m (1 lines)
- `src/vfx/rope.js:17` const _q (1 lines)
- `src/vfx/tablemarks.js:140` const _c (1 lines)
- `src/vfx/vantageframes.js:42` const UP (1 lines)
- `src/vfx/vantageframes.js:43` const _e (1 lines)

### Methods nothing reads by name (dead, unless reached by a computed name) (7)

- `src/ui/reel.js:70` method spinAll (3 lines)
- `src/vfx/garden/cocoontree.js:67` method slotWorld (1 lines)
- `src/vfx/garden/myggdrasil.js:330` method capWorld (1 lines)
- `src/vfx/leviathan.js:242` method eyeWorld (1 lines)
- `src/vfx/shrine.js:380` method doorWorld (1 lines)
- `src/vfx/sky.js:211` method windowMaterial (17 lines)
- `src/vfx/wreckfield.js:80` method pieceWorld (1 lines)

### File paths named in comments or docs that no longer exist (stale) (8)

- `src/ui/lendpanel.js:20` ../../ui/lendpanel.js
- `src/ui/qais.js:23` ../../ui/qais.js
- `src/vfx/overhead.js:14` vfx/awakening.js
- `src/vfx/racewaylooks.js:49` vfx/solar.js
- `src/vfx/sealface.js:24` overlay/r4-comb-core.js
- `src/vfx/weather.js:42` vfx/awakening.js
- `src/vfx/welldress.js:3` docs/handoffs/calissa/2026-10-06-from-petra-the-dunemaw-built.md
- `scripts/bake_wisp_moods.mjs:12` creatures/anim/suite.js

### Imports never used (7)

- `src/vfx/creaturetags.js:44` st from ../creatures/creatures.js
- `src/vfx/soulbrushdesk/look.js:16` sm from ../lockheartreliquary/look.js
- `src/vfx/soulbrushdesk/look.js:16` KEY from ../lockheartreliquary/look.js
- `src/vfx/soulbrushdesk/look.js:16` J15 from ../lockheartreliquary/look.js
- `src/vfx/soulbrushdesk/look.js:16` CZ from ../lockheartreliquary/look.js
- `src/vfx/soulbrushdesk/look.js:16` rgba from ../lockheartreliquary/look.js
- `src/vfx/soulbrushdesk/look.js:16` mixH from ../lockheartreliquary/look.js
