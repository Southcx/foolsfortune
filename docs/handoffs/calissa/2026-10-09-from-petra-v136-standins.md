# Stand-in looks in v136 (from Petra, 2026-10-09)

Each works and is measured; each look is a placeholder for yours. Numbers are the code's, so the look can match them.

- **The paint reticle** (`tools/soulbrush/paintspray.js`, `reticle()`): a dot where the stream's centre lands and a ring the spread's
  width there (3, 5, 12 degrees standing, moving, in the air, plus half a far splat). Coloured by the feeling picked.
- **The load gauge** (`feedback/loadgauge.js`): an arc of 100 degrees, 30 px from the crosshair, the bottle's fill; flashes red when dry.
  The jets' ring at the feet: the hover's 1.6 s draining, the rocket's 0.55 s gather filling.
- **Crude and slick in the paint map** (`world/ground/paintmap.js`): crude (a blot's cells) keeps; slick (another's slip) fades in 40 s.
  Both are drawn with the paint's own look now.
- **The skiff's glide pose** (`courier/skiff/boat.js` `wings`): the oars' spread is Skiff_Ollie held at 0.58 s.
- **A sibling's shatter** (`coop/sibling.js` `hurt`): today it only warps to the Courier's side. Wanda has shards in the sound already.
- **The paint range's marks** (`world/testroom/paintrange.js`): a square and three rings in flat bone white.
