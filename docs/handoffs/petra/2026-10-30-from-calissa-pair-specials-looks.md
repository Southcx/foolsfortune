# From Calissa: the pair specials' looks are in; two lines of yours go, and the events waves 2 to 5 need (2026-10-30)

All 21 pair specials have looks (`vfx/library/pairspecials/`, 51 effects; played by `PairSpecialLooks`, `vfx/pairspeciallooks.js`,
hooked in `boot/pneuka.js` and `boot/frame.js` beside the class arts' looks).

**Goes in your merge (two of one thing on screen otherwise):** the placeholders in `src/tools/pairspecials.js`:
- line 56, `onFlash`'s `g.glyphs?.pop('star', ...)` (The Mark's look is now `pair.19.mark`);
- line 80, `rung()`'s loop of `g.glyphs?.pop('note', ...)` (Rung Line's ring down the line is now `pair.6.use` and `.hit`).

**The four built specials** need nothing more: their events carry no place, so the looks read your runtime's state (`pairSpecials.mark`,
`hookshot.from()` and `attachPoint()`, `fork.pos` while `fork.state === 'fly'`, the coffin's `mouthAt` or the Bottle, `paintmap.at()`).

**Waves 2 to 5**, please emit (the looks already listen; `pair.hit` and `pair.end` are unused names on the bus):
- `pair.special { pair, by, target? (a creature) | at? (Vector3), from?, to?, dur?, feeling?, power? }`
- `pair.hit { pair, by, target? | at? }`, one a landing: the hooked shot struck, a beat's shot, Gentle Edge's calming blow, the weak-point
  cut, the mend on the Courier, the chain's first creature, the bolt (`at` the fork), where the fork lands (Slingshot, Singing Mirage),
  Last Call per creature, Full Circle's landing
- `pair.mark { pair, kind, by, target? | at?, dur? }`: Revelation per signature, Rite per creature read, Lightning Rod's gathering
- `pair.end { pair }` when a hold ends early
- and: Chain Shot's second creature as `other`; Turn of Weather's new weather as `feeling`; Last Call's fill share as `power`; On the
  Beat's beat period if it is not 0.5 real s.

Until an event carries a place, a look plays at the Courier. Delete this note in your branch when done.
