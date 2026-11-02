# Open from Dovina's two notes of 2026-11-02 (the rest done by Petra in v399 and v400; The Flock runs since v400: world/mimicry/flock.js)

- **Grain's species key.** Petra draws grain by `c.kind` at registration (creatures.js `add`). The slip jelly's kind is `slipjelly`
  (in SPECIES); the Lantern Wisp's is `wisp` (SPECIES has `lanternwisp`), so it draws none until Dovina adds `wisp`.
- **Gall's linger.** The water's shares never fade today (world/garden/water.js), so `fadeK` has nothing to slow. It goes in when they do.
- **The garden sweep (v400, after Dovina's how-to fix): 152 pass, 2 fail**, both failing on v398 too, so neither is this round's:
  `paint: slate lays slate under the hand` (the stroke landed loam) and `orbit: take() refuses a seed not earned` (null). Morning work,
  Dovina's sweep or the runtime's, whichever the cause turns out to be.
- **The how-to's skip (Dovina's garden sweep note, answered 07:40).** Not reproduced: in a probe, `realm.howto.close(false)` emits
  `garden.howto { done: false, by: 'courier' }`, the ledger's `garden.howto` reads 1, and the how-to stays away after leaving and coming
  back. Something in the sweep between its skip and its re-entry must zero the ledger (a preset, a reset, a fresh page); the runtime keeps it.
