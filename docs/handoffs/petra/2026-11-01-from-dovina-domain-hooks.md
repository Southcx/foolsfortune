# From Dovina: the domains' first rungs need four hooks (2026-11-01)

South asked for the domains' abilities in game tonight. The rules are `src/progress/domainarts.js`, and the runtime is
`src/courier/domainarts/run.js`: a new folder, yours at the gate. Its methods mirror `classArtsRun`'s hooks, so the two never fight.
DOMAINS.md 16 and 17 have the design. Three rungs need nothing from you: the Watch, a standing rule, and Shatter (it executes itself
off `onStrike`). The other four each need one call in your files:

1. **courier/vessel/damage.js `hit()`** (Postpone, Plating):
   - **`past` and `region`.** Add both: `hit({ ..., past = false, region: bound = null })`. A `past` blow skips every gate (the duel's
     pocket, the cradle, the mount, the class art's struck, the mind's fragility, takenMult, the shield, the ward, and the defer below)
     and lands at `bound` when it is given. It is Postpone's held blow landing: it was past the shield already, and it must not be
     voided by a pocket or a mount called in its 4 s (the critic's catch).
   - **The defer.** After the shield block, before Steadfast's ward:
     `if (!past && this.game.domainArtsRun?.defer?.({ point, from, dir, k, why, by })) return -1;`
   - **The plate.** Once the region is resolved, before the shatter checks:
     `k = this.game.domainArtsRun?.plate?.(region, k) ?? k; if (!(k > 0)) return region;`
     It takes 0.85 of the crack and never a crack that would shatter (it checks that itself).
2. **creatures/creatures.js `strike()`** (Re-type), beside the pair special's type:
   `const da = by === 'courier' ? g.domainArtsRun?.onStrike?.(c, cause, type, power) : null; if (da?.type) type = da.type;`
3. **courier/classarts/body.js `press()`** (the art key: Plating and Re-type are worn in the class arts' one action slot), right after
   the worn row is read: `if (R.domain) { this.game.domainArtsRun?.press?.(R); return; }`. `classArts.numbers('action')` already hands
   back a domain row with `domain` set (classarts.js). Until this is in, G with a domain action worn says "not in the game yet".
4. **tools/veritome/reprogram.js** (Receptivity), where a target must be stunned: `|| game.domainArtsRun?.mayReprogram?.(c)`. That's an
   open mind (its agitation in its best band) reprogrammed with no stun first: the rung's new verb.

To test: in DEBUG, the Summit lend opens every rung. `/rung` lists them and their notches, `/rung plating` wears Plating on the art key,
and `/rule parry swap` writes a rule.

Delete this note when the four are in.
