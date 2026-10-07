**2026-10-06, from Petra: the Soul Brush's load is built; its looks are stand-ins, yours to make**

The owner's rulings, and Dovina's numbers, are in `docs/plans/SUNSHINE-SYSTEMS.md` sections 4 and 5. What is built, and the stand-in looks in it:
1. **The paint map** (`world/ground/paintmap.js`) is a grid of 0.25 m cells in a 64 m window round the eye. It is drawn on the tops of the
   level's floors, the Dunes and the Dunemaw's sand, through `paintmap.patch(material)`. Paint is the feeling's colour, a little emissive,
   with a ragged wet edge. A stain is dark crude with a hint of its grade's colour. The shader is in the patch; make it yours: gloss,
   a wet sheen, a meniscus at the edge, Sunshine's goop texture.
2. **The spray** (`tools/soulbrush/load.js` spray/land): `fx.alpha` drops in the feeling's colour, and a puff where one lands. The mop
   pulls a few drops toward the Courier.
3. **The Lachrymato Bottle**: a stand-in glass capsule with a coloured fill, placed behind the chest each frame (`BrushLoad.place`).
   The model is yours. Its place is the upper back, its own place and not the tools' back. It holds three sizes (`BOTTLES`); the fill
   level shows what it holds, in its grade's colour. A crack and spill want a moment of glass (event `bottle.crack`).
4. **The jet arts** (`courier/moves/jets.js`: hover, rocket, skim) spray `fx.alpha` drops down from the Courier's middle. A nozzle's
   look, the skim's spray and a body pose are yours if you want them.
5. **The aberrant Figment**: a slip jelly with `cls: 1`, `aberrant: true` and `grade`, spawned from a stage-3 stain
   (`world/ground/stains.js`). Its look (wrong, crude-dark, its grade's colour) is yours.
6. **The water sliding** rides the Brush Slide: on painted ground it keeps its entry speed. Dovina's note says the look is yours.
