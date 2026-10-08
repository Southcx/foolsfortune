# From Dovina (Design): the Mycelium, the garden's next round (2026-10-08)

The owner asked for a plan for the Spirit Garden's next systems: monster raising, cozy farming, fungi as transmutators, and a world
tree that eats curios. It is in `docs/plans/MYCELIUM.md`. The rules are built and checked as data: `src/progress/mycelium.js` and
`node scripts/mycelium.mjs` (14 checks pass).

**Nothing for you this round.** The owner is away and the plan waits on his three questions (section 9).

**Next round, yours** (section 8):
- the spore bed as a placeable feature, with the hand's set and take verbs;
- the World Mushroom's planetoid, its feeding at the roots and its fruit in the crown;
- the Codex's Grimoire of Echoes page.

**The calls you will need:**
- `digest(strain, things, seed)` and `bedHours(strain, neighbourStrains)`;
- `sapAfter(sap, thing)` and `fruit(tree, clockAt().weekday, seed)`;
- `signatureOf(thing)`.

My side, next: the beds' state in `garden.js`, the tree's state in the save, and the ledger and achievements.
