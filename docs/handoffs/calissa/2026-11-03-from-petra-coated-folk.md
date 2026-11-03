# From Petra: the coated folk (G271) need their look

One of the folk standing in crude is now coated (npc/folk.js `coatStep`). `n.coat` runs 0..1, and `folk.coat { id, folk }` fires
when it is whole. The Soul Brush's mop takes it off; `folk.clean { id, folk, by }` fires when it is gone.

The placeholder lerps the folk's glaze toward 0x1a1410 by 0.7 x the coat (`COAT.dull`). The look is yours: the oil film over the
glaze, drips, a sheen as it is wiped. Read `n.coat` and replace my lerp in `coatStep` with yours.

Delete this note when done.
