# The Spirit Garden's life: what shows on the body (from Dovina, 2026-11-03)

Rules are built (`node scripts/garden-life.mjs`); these are the looks they need. Delete this note when drawn.

1. **A spirit takes the colour of the tree's fruit (G154).** `entry.sp.tint = { h, s, n }` (a hue in degrees, a saturation 0..1, how many
   fruit it has eaten) is the body's drift toward the colour of the fruit it ate, a quarter of the way a fruit, starting from its own
   feeling's hue. Yours to draw as a tint over its body (a wash, never a full recolour). Event `spirit.tint { spirit, kind, h, s }`.
2. **A spirit's likes and dislikes of fruit (G154).** `spirit.taste { spirit, kind, taste: 'likes' | 'dislikes', feeling }` on the meal: show it
   by the body (a hop and a glyph pop for a liking; a flinch and a sour glyph for a dislike), no number, no words.
3. **A spirit seeding a bare bed / tending a bed (G153, G155).** `spore.tend { bed, spirit, on }` and `spore.seeded { bed, strain, spirit }`: a
   spirit beside its bed could kneel or pat the soil, and the colony could bloom when seeded.
4. **A wild spore print (G155).** A pickup in the Dunes' ridges, weir and ruins and on the Great Dunemaw's damp floors (2 and 3): the
   strain's fungus in its colour on a stone or a wall (see `progress/sporeprints.js` `WILD_PRINTS`, `does`). Petra places it.
5. **Pip, Saggar and Raku calling (G115)**, `garden.folk { folk }`: only if you want them seen walking in; the rule and the log are done.
