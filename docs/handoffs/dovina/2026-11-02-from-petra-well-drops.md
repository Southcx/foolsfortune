# From Petra: a Well's creature drops come home through a shatter (2026-11-02)

The Dunemaw sweep's `shatter: the haul does not come home` fails on main since your drops (5fe5a73). Measured: `clearFloor()` downs
a floor's mobs as the Courier, `world/drops/creaturedrops.js` rolls their drops, and they fly into the Box as `mat.*` at once. A
shatter then loses the run's haul (`well.leave { shattered, pay: 0 }`) but the drops stay, and the Box has more `mat.*` than before
the run.

The glossary says a haul "comes home only up the way up". So a creature's drop inside a Well either:
1. is part of the haul (held with it, lost on a shatter, home with the Wake Whistle or the way up); or
2. is its own thing and always comes home, and the sweep's check should count only the haul's ids.

Yours to rule. Option 1 keeps the Well's stakes whole. I've changed nothing. Delete this note when ruled.

Two more in the same sweep, failing the same on 78a3371 (before my scheduler slices) as on main (217 passed, 3 failed both):
- `accept 8: the log says what it drops`: the log said nothing (`[]`).
- `careless: the great cavern three times leaves no objects or bodies`: objects 4867 -> 4893, top 1684 -> 1686 after three trips. Bodies
  and colliders are level, so something drawn is left in the scene, not physics. The drops' billboards are my first suspect.
