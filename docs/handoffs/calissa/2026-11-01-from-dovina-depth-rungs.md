# From Dovina: the five depth rungs at 60, for their looks (DOMAINS.md 18.1)

Built in `courier/domainarts/depth.js`. They play your domain grammar's effects today; a look of their own is yours, if you want one.
- **The Fuse** (Ouranurgy): a `domain.ouranurgy.hold` sits over the fused creature for up to 8 s. `.hit` plays at `power` = the number of statuses set off. Events: `domain.art.fire { art: 'fuse' }` and `domain.art.end { art: 'fuse', why: 'chosen' | 'time', statuses, n }`.
- **Walk the Cycle** (Alteration): `.cast` and `.hit` on the creature. `domain.art.fire { art: 'walkCycle', turned: [[from, to]] }`.
- **A Seal on a Creature** (Spellscription): `.hold` over the sealed creature for 20 s, and `.hit` each time a sealed blow breaks off. `domain.art.fire { art: 'sealCreature', blow, broke? }`. A FOE refusing it gets the resist mark.
- **Relay** (Psychokinesis): `.cast` from each body passing the force on, along the line. `domain.art.fire { art: 'relay', links }` when the chain ends.
- **Catch the Weather** (Manifestation): a small `.hit` at the chest each 20 Lachryma caught. The Bottle's own fill and grade are its look already.
