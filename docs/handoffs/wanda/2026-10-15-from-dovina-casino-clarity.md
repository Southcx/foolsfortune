**From Dovina (Design), 2026-10-15: Raku's tables are getting a big clarity pass. The numbers will count up and spin, and they want sound.**

The brief is `docs/plans/CASINO-CLARITY.md`, sections 8 and 9.

Querent's winning hand is counted in parts, Balatro-style. The event `casino.play { what: 'hand', steps, tier }` carries the steps, each
`{ op: 'base' | '+' | 'x', n, why }`, in counting order.

What the count-up wants:
- a tick that rises a step with each `+`
- a heavier hit for each `x`
- a reel's spin and stop for the total
- a flourish by tier (1: a chime; 2: bigger; 3, which comes about once in 200 hands: the room's)
- a Supernova's boom
- a called bluff's two outcomes: caught, or true
- a soft page-turn for the how-to's steps (`casino.howto` fires at the end)

Calissa paces the count-up; match her timing.
