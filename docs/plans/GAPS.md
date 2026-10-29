# GAPS: the open design gaps, closed with the systems we have (Dovina, 2026-10-29)

**Asked:** South, 2026-10-29: "what we can do to address all of our open design gaps. We should have more than enough fundamental
systems to work with."

**The thesis.** South is right. Every gap below closes by connecting systems that already run; none needs a new system. The sweep
read every plan (`docs/plans/`), DESIGN.md, the glossary and the handoffs, and checked the plans against `src/`. Several plan headers
were stale:
- built already: the bracelet, the cloud save, the class read, the track editor, the garden's letters and farewell, the reckoning;
- fixed by Calissa: angling's release.

Status: **(a)** waits on South, **(b)** decided, not built, **(c)** not designed.

## 1. Closed this round

| gap | what closed it | where |
| --- | --- | --- |
| Fishing paid no Possession for a kept fish | every landing pays; a release half again | `domains.js`, ANGLING.md 5 |
| Whole modes paid no domain (a fight on foot, the Raceway, the sea, the garden, paint) | 30 sources on existing events | DOMAIN-SOURCES.md |
| The Assay had no code (APTITUDE.md 9, step 1) | six passive readings from events already on the bus: parry timing (ms), pitch by ear (the beating), timing (ms of spread round the notes, Wanda's `asyncSd`), colour (% of a tile), aim (%), reading a pull (%); `/assay` says them | `progress/aptitude.js` |
| A secret's material drop "parked" against "drops are on" | recorded as built (drops.js rolls the richer table) | DUEL-DESIGN-SPACE.md |
| Two trap placeholders mirrored | fixed, with a casebook rule | `world/raceway/traps.js` |

## 2. The folds (ranked by how much of the long loop rests on them)

1. **What a class gives: 76 arts (b, its mapping a).**
   - The fold: **the two arts of a class are two arts that already exist.** That pool is the 42 Movement and God Arts, the 15
     knacks, the arts' variants and the 21 pair specials: more than 76.
   - A class opens each of its two by a third way: the art's own achievement, done while you read as that class (CLASSES.md 6.3, ruled).
   - It accents them while worn: a modifier on the art's numbers, its source the class on the board.
   - The cost is one table (`CLASS_ARTS`, 38 rows of two ids) and one accent number per kind of art. No art is built twice.
   - Prior art: Final Fantasy Tactics, where an ability is learned in a job and kept.
2. **The 21 pair specials (b).**
   - The fold: **a pair's special is its sub's lent verb fed through its main's own verb**, so one press does both. For example, the
     psygun and the Veritome: the Flash marks, and every chamber homes on the mark.
   - Each special is a combination of two verbs the code already has. Petra builds one wave of four at a time; the first four are
     named (TOOLS-TOGETHER.md 8).
   - Opening: an achievement counted with the pair worn. The ledger needs `pair.<n>.<act>` (a down, a lend landed). Dovina writes
     those keys in tracking next round.
3. **The Assay's next steps (b).**
   - The readings are built. Still to do:
     - the bot check (APTITUDE.md 8), Dovina's;
     - the window, Calissa's (the data is `game.aptitude.all()`);
     - the Touchstone room, Petra's.
   - Three more readings wait only on a field in an event:
     - inhibition: the rail's plain or outlined shot, on `rail.hit`;
     - risk: the Lockheart's wheel, cashed or pushed;
     - reading others: Nebula Bluff's tells called;
 4. **Why come back once a place is done (a).**
   - The sea pays 0.1 to 0.2x once charted.
   - The fold: the game day already turns over the herds (migrations), the goals and the first today. Add **the lairs restocked each
     game day**, the same for everyone as the migrations are. The sea beasts, their fights and their pay are all built.
   - Dovina's pick over a bounty board, which South parked.
   - The areas already have their checklists on the map. Their half and whole achievements are Dovina's, next.
5. **Pace, measured (c).**
   - The fold: the ledger already writes the play time of every first (`stats.first`). Time to the first art, the first fish, the
     first curio and the first gold is a read of it.
   - A script reads a playtest's ledger (Dovina), and the field report carries it from a phone (Petra's).
   - No new event is needed.
6. **The weather's readers (c, cut for lack of one).**
   - The fold, one reader each from modules that exist:
     - the fish bite more in their own feeling's weather (`angling` reads `weather.here`);
     - signatures reach further at night (`signatures.js` reads `phaseAt`);
     - a creature's mental state drifts with the weather's feeling (`courierMind` has the rule, a creature's mind has the slot).
   - Owners: Petra and Calissa, asked once South says go.
7. **Numbers with no reason yet (c).**
   - These are: the prismatic 12% at epic pity, the near-miss rates, the chest ranges, the coffin fills, the standing thresholds.
   - The fold: `scripts/economy.mjs` already prices a source against the aim. Each number gets its line there and a reason in
     ECONOMY.md (Dovina, next).
8. **The garden's last items (b).**
   - Incense and the Booster Stone do nothing yet.
   - The fold: Incense becomes a modifier on the spirits' visit rate (`spiritlife.js`). The Booster Stone becomes a modifier on a
     planetoid's harmony rest point (`harmony.js`).
   - Spirit notices are a log rule on the routine's events.
   - The shareable layout code reuses the track editor's share code (`FF2-...`).
   - All Dovina's, next.

## 3. Waiting on South (batched; the digest has them)

- The STORY save: when it opens, and its spine (DESIGN.md 8.4).
- Querent's and Entropy Tactics' open questions (CASINO.md 3.8, ENTROPY-TACTICS.md 5).
- Parked by South until the bestiary's overhaul: the Veritome variants, and minds reading grain.

## 4. Not Dovina's (handed over)

| who | what |
| --- | --- |
| Petra | the pair specials, a wave of four at a time; the Touchstone room |
| Calissa | the Assay window from `game.aptitude.all()` (??? to five readings, the number to twenty, then the curve) |
| Espada | the Assay's words (`/assay`'s lines are placeholders) |
