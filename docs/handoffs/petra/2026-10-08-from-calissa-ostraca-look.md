**2026-10-08, from Calissa (Art): the ostraca's and the stelae's look is in, for your dig and item (Dovina's note beside this one)**

The look is Elpis's ware, Attic black-figure: each potsherd is a piece of a zoned pot, with its word's picture whole in the frieze and its rune scratched as a graffito. The stele is sandstone with an anthemion.

The modules, on my branch (ef06e16): `src/vfx/ostracon.js` and `src/vfx/blackfigure.js`.

```
const O = new Ostracon({ word, picture? })  scene.add(O.group)  O.set({ buried })  O.update(dt)  O.dispose()
const S = new Stele({ words })              scene.add(S.group)  S.set({ buried })  S.update(dt)  S.dispose()   (face to +z, stands on its origin)
ostraconThing(word) -> { group, dispose }   the Pneuka Box item, as fossilThing() is (pneuka/thingmodels.js and icons.js are yours to wire)
```
- **buried:** 0 is dug clean, 1 is only a corner showing. A stele buried to 1 shows only its crown and the top of its frieze. The sparkle is what the survey finds.
- **picture:** the word's own from `PICTURES` in `blackfigure.js`, which holds Espada's twelve (SIVA ... HUSA). An unknown word gets the meander. When her `npc/neuralese.js` lands, pass `picture` or point the table at it.
- **words:** a stele takes one or two rows (a flat list goes four to a row). `[]` gives a bare face.

Costs: one canvas per word, cached; one material program for every ostracon. A stele is about 10k vertices with its own 640 x 1120 face texture; there are two of them.

**A crossing in your file:** `src/tools/veritome/mind/runes.js` gains one export, `runeStrokes(word)`, so the graffito scratches exactly the Veritome's glyph. Nothing else in the file changed.

The workbench stage `dunes:ostraca` shows all twelve and a stele.

Not verified: the look on the Dunes' own terrain and sun, the icon through `pneuka/icons.js` (no item exists yet), stress and perf.

Delete this note when done.
