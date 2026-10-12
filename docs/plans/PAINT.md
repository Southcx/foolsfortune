# One paint surface (Petra, 2026-10-12)

The owner, 2026-10-12: the Lachryma paint systems should work as one, to Super Mario Sunshine's and Splatoon's polish; the crude blots and
the Soul Brush's paint do not merge or smear as you run or slide through them; "slip" is still a mechanic in places; the slip dive is
**the Paint Dive**. The owner's call: build it future-proof (every surface can be painted), fill it in stages; "slip" stays in creature and
move names (slip jelly, the slip schiller, slip geysers), never as a mechanic.

Prior art: Super Mario Sunshine's pollution layers (doldecomp/sms `PollutionLayer`: a bitmap per surface, stamped by the spray, asked by
the collision, kept on the CPU), Splatoon's ink (a texture over the level's second UV set; the swim reads it; feet and rollers write it).

## 1. What was there (measured, 2026-10-12)

Four stores that partly knew of each other: the paint map (`world/ground/paintmap.js`: paint, blots, slick cells; floors only, a 64 m
window), the slip field (`courier/moves/slip.js` `SlipField`: rectangles and discs; the only thing the dive read), the slicks
(`vfx/slicks.js`: a draped mesh each, drawn over the paint map), the trail map (`world/ground/trailmap.js`: prints and furrows in sand).
So a slick and paint overlapped as two layers, the dive asked a store you could not see, and moving through paint never moved it.

## 2. The design

- **One store, the paint map**, as **charts in an atlas**: a chart is a surface's own rectangle of cells (a floor window as now; a
  `level.box` face, laid out at boot, one rectangle a face; an imported mesh only once it carries a second UV set). Each cell: an amount,
  a kind (a feeling's paint, or a field's crude), an age. A slick is crude cells with an age; a blot is crude cells that keep.
- **Everything asks and writes it.** The brush's paint and mop, the jets, crude spills, a fight's slicks, the dive, a creature standing in
  it. A stamp is a sphere: every chart it touches takes its share (a wall and the floor below it in one splat).
- **Movement writes** (phase 2): feet pick up what they stand in and print it on for a few steps, fading; a slide or the Paint Dive
  carries paint along its velocity (lifted behind, laid ahead), so a Brush Slide smears a streak. Paint into paint mixes in the cell
  (two feelings: their agate; opposites cancel); paint into crude takes crude's oil film over it.
- **One look** (phase 3, Calissa's): one shader reads the cells: thickness to height and normal (the gloss bulge), edges from a smoothed
  field (never the cell grid), each feeling's motif, crude's oil film, the oxidation ramp on age, wet gloss drying matte.
- **The kept copy is the CPU's**, as Sunshine's: the game asks it with no read-back; the GPU gets the changed rectangle once a frame.

## 3. Budget (the owner's, 2026-10-12)

Draw calls +0 (the same meshes, one more texture read); programs +0 to 1; GPU memory +16 to 64 MB (the atlas); **JS heap budget 395 ->
415 MB** for the kept copy; CPU about 0.1 to 0.3 ms a frame for stamps and the upload. Estimates, to be measured when built.

## 4. Phases (done 2026-10-12, v159: the dive reads the map; the slip field retired into coats (`coat`, `coatRect`, `wet`); the slick
meshes retired, their cells drawn by the map with the oxidation ramp; feet print and slides and the Paint Dive smear: `world/ground/painttrack.js`.
v160: every level.box side face a chart in one 1024² atlas (world/ground/paintwalls.js: 1,788 faces, 102,869 m², those over 50 m² at
0.5 m cells, packed tallest first into 858 rows); the brush's drops stick to walls and Clean washes them; coats on walls are cells.
Still to do: the look (Calissa's); imported meshes; cell mixing as agates. One at a time; check and build each, a crash glance at the end: the owner's test lean)

1. **One store.** The Paint Dive reads the paint map (wet enough is deep enough); the slip field retired (its fixed lanes become painted
   cells); the slick meshes retired (slick cells drawn by the map). Charts as the store's shape, floors first. Petra.
2. **Box walls and movement.** `level.box` faces as charts; feet, slides and the dive write. Petra; the numbers (what a step carries, how
   wet a dive needs) Dovina's.
3. **The look.** One shader over every chart. Calissa.
4. **Imported meshes**, only where a room needs it: a second UV set from the exporter. Calissa, then Petra.

Words: **the Paint Dive** (the owner's); "slip" retired as a mechanic (GLOSSARY section 12); new player words, if any, Espada's.
