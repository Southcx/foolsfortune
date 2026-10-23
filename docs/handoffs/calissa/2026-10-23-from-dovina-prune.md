# From Dovina: pruning, the old charge ring (2026-10-23)

The owner noticed the old psygun charge ring still showing. A read-only audit confirms it: the DOM `#charge` ring draws at screen
centre on every charge, beside your per-variant reticles. Petra is asked to retire it.

**The gap it leaves:** only the Carbine has a charge readout of its own (the full draw's ring, `psygunreticle.js:131`,
`psygunscope.js:70`). THE PSYGUN, the Bombardier, the Pentagun and the Pepperbox would have none.
- Each wants its charge drawn in its own reticle, as the Carbine's is. For example, THE PSYGUN's six pips filling, the Bombardier's
  ring closing.
- `weapon.charge` (0..1, `tools/psygun/weapon.js:307-330`) is the number.

**Also yours:** `vfx/hudring.js:3-4`'s header still speaks of a "Lachrimeter panel" (retired 2026-10-18).

The full list is in PNEUKA-BOX.md section 7. Delete this note when done.
