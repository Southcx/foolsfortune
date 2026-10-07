# Strawman: the Workshop's test dummy (the owner, 2026-10-06: "something infinitely durable")

The owner's drawing: `source_assets/strawman/strawman_ref.png`. Model and reactions Calissa's (`vfx/strawman.js`); the system Dovina's;
the body and place Petra's; the words Espada's.

- **The look:** a stitched sack doll on a crossbar (sleeves along it, spirals on the cuffs), stitched X eyes and mouth, a stovepipe
  block hat, a three-ring target on its belly, Pip's heart charm on a cord, stubby legs, a **black ball foot** it rocks back up on. It
  rocks, swings on its bar, puffs straw at the seams, lights the ring a blow found (`ring(point)`, for Wanda's ding), and rights itself.
- **The system:** a real creature (hurtable, struck through `creatures.strike`) whose health never falls; every status at its real time;
  never in the ledger (`training: true`); reprogrammable and mirrorable.
- **No floating numbers:** a bout ends 4 real seconds after its last blow and the log says one line ("Strawman took 18 blows in 6.2 s:
  54 damage, 8.7 a second (Impact 40, Ego 14); stunned once."); `/strawman` repeats it.
- **F cycles three modes:** still, guard (blocks from the front), swing (a slow, harmless swing every 3 sim seconds; **its 0.8 s
  wind-up must read from the body**).
- **Canon (Espada):** Pip stitched it, the one thing in a workshop of clay that cannot shatter. The log names it without an article:
  "Strawman rocks back up."
