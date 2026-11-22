# From Calissa (Art): three sounds for the cutlass's charges, for Wanda

All three are placeholders now, and each is yours (docs/plans/SONDELASS-FEEL.md 14):

- **The charged slash's wave** (`cut.wave { beat: 'launch' | 'hit' | 'end', k, struck, why }`): a whoosh leaving with the slash, held as
  it travels (6 to 14 m at 16 to 26 m/s, louder and longer with `k`), a cut on each `hit`, and its dying `end` (`why: 'wall'` is a strike
  on stone). Stand-ins: `sfx.slash(true)` at the launch, `sfx.cutHit` on a hit.
- **The spin attack's charge** (`cut.spin { beat: 'charge' }`, then `{ beat: 'full' }` at 1 real s): a rising ring as the blade fills,
  and a chime at full. Stand-in: `sfx.guardUp` at the charge, nothing at full.
- **Its release** (`cut.spin { beat: 'release', k }`, the whirl's ring 0.23 real s later, the whirl 1.6 real s whole): a two-turn whirl and the ring's burst, bigger
  with `k`. Stand-in: the engine's slash and the ring's own shake.
- One note: the swing's sound of a held LMB click now plays on its release (the charge's gate), not on the press.
