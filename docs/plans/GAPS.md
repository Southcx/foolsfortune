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

1. **What a class gives: 76 arts. Ruled and its rules built** (South, 2026-10-29: "We need new arts for the classes").
   - 76 new arts, an action and a reaction a class, opened by playing as it, kept in every class, accented in its own:
     `progress/classarts.js`, CLASS-ARTS.md. Built in play a wave at a time (the Fool and the four Knights first), Petra's runtime.
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
4. **Why come back once a place is done. Ruled** (South, 2026-10-29: "go with your intuition on the open sea").
   - The respawning hunt, already built: the lairs restock each game day and the dock posts one with a bounty. Measured at 0.40x,
     0.72x and 1.30x the aim by skill (OPEN-SEA.md 9.1). No bounty board.
   - The areas already have their checklists on the map. Their half and whole achievements are Dovina's, next.
5. **Pace, measured (c).**
   - The fold: the ledger already writes the play time of every first (`stats.first`). Time to the first art, the first fish, the
     first curio and the first gold is a read of it.
   - A script reads a playtest's ledger (Dovina), and the field report carries it from a phone (Petra's).
   - No new event is needed.
6. **The weather's readers. Ruled back** (South, 2026-10-29: "bring back the weather effects").
   - The rules are in `progress/weather.js` (`moodRest`, `biteMult`, `senseMult`; WEATHER.md). Each is a one-line read in its
     owner's module: creatures' settle, a fish's interest in a lure, a signature's range (asked of Petra).
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

- The STORY save: tabled for a long while (South, 2026-10-29), while each system is worked to its ceiling in DEBUG.
- Querent's and Entropy Tactics' open questions (CASINO.md 3.8, ENTROPY-TACTICS.md 5).
- Parked by South until the bestiary's overhaul: the Veritome variants, and minds reading grain.

## 4. Not Dovina's (handed over)

| who | what |
| --- | --- |
| Petra | the class arts in play, a wave at a time, and the input action `art`; the weather's three reads; the pair specials, a wave of four at a time; the Touchstone room |
| Calissa | the Assay window from `game.aptitude.all()` (??? to five readings, the number to twenty, then the curve) |
| Espada | the Assay's words (`/assay`'s lines are placeholders) |
