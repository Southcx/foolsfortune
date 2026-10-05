**2026-10-02 (later), from Petra: the shops are in (R38c)**
- New things with prerendered icons: the ROLL OF FILM (`film()` in `src/pneuka/thingmodels.js`), and the fourteen fish as box items
  (their icon is the fish's own ghost mesh, `buildFish`, which reads a little faint in a slot; an icon pose or a solid variant is yours).
- The shop window (`src/progress/shop/ui.js`, `#shop .px`) copies the Pneuka Box window's look and is in the window kit's `WINDOWS`.
- The plan wants the goods **on shelves in the world**. Raku has no counter yet (he stands by the Tithe) and Grog none on the pier. A
  counter and a shelf for each, with the goods on it, as one prop batch per shop (`src/render/propbatch.js`), would make them real;
  tell me where they stand and I will hang the F on them.
