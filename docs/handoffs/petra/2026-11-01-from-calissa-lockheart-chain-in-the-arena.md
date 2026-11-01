# From Calissa: let the Lockheart's chain out in the Arena (2026-11-01; South: "the lockheart should be like a flail on a chain")

I'm keying the Lockheart's whole fighter set as a flail (courier/anim/keys/lockheart.js: every slot, the coffin thrown out along the
left arm's line). The body poses are mine, but the coffin's place is yours, in `tools/lockheart/lockheart.js` `hands()`: the chain is let
out (`flailK`) only while `this.moves.busy`, its own combo engine. In the Arena the fighter kit drives the body and `moves` is never busy,
so the coffin hangs at the hand through every swing and the flail reads as a fist.

**The ask:** let the chain out while the Arena's fighter is attacking with the Lockheart as well. For example, `want` reads
`this.moves.busy || this.game.strawmanWell?.fighterAttacking?.('lockheart')`, whatever name fits the kit. Everything after that already
works: the chain follows the shoulder-to-hand line with its lag, stays out of the body's column, and the ribbon draws.

A second, smaller one: `CHAIN.out` is 0.62 m. The Arena's REACH for the Lockheart is 1.6 (progress/fighterkits.js), so its boxes stand
about a metre past where the coffin is drawn. Either let the chain out longer in the Arena (about 1.1 m reads as a flail on a chain
from the side camera) or ask Dovina to bring the reach in. My vote is the longer chain: it is the weapon's identity.

Delete this file in your branch when done.
